package com.campusbooking.service;

import com.campusbooking.dto.KitBookingRequestDTO;
import com.campusbooking.dto.KitBookingResponseDTO;
import com.campusbooking.exception.BookingConflictException;
import com.campusbooking.model.*;
import com.campusbooking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class KitBookingServiceTest {

    @Mock private KitBookingRepository kitBookingRepository;
    @Mock private KitRepository kitRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @Mock private WaitlistService waitlistService;
    @InjectMocks private KitBookingService service;

    private User owner;
    private User member;
    private Resource camera;
    private Resource mic;
    private Kit kit;
    private LocalDateTime start;
    private LocalDateTime end;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).username("owner").build();
        member = User.builder().id(2L).username("member").build();
        camera = resource(10L, "Camera");
        mic = resource(11L, "Microphone");
        kit = Kit.builder().id(5L).name("Media Kit").description("Bundle")
                .resources(new HashSet<>(Set.of(camera, mic))).build();
        start = LocalDateTime.now().plusDays(2).withNano(0);
        end = start.plusHours(2);
    }

    @Test
    @DisplayName("Creation persists one referenced parent and linked child holds with parent-only membership")
    void create_persistsOneAggregate() {
        KitBookingRequestDTO request = request();
        request.setMemberUserIds(List.of(member.getId()));
        given(userRepository.findById(owner.getId())).willReturn(Optional.of(owner));
        given(userRepository.findById(member.getId())).willReturn(Optional.of(member));
        given(kitRepository.findByIdWithResources(kit.getId())).willReturn(Optional.of(kit));
        given(resourceRepository.findAllByIdForUpdate(List.of(10L, 11L)))
                .willReturn(List.of(camera, mic));
        given(bookingRepository.findOverlappingBookings(anyLong(), any(), any()))
                .willReturn(List.of());
        given(kitBookingRepository.saveAndFlush(any())).willAnswer(invocation -> {
            KitBooking parent = invocation.getArgument(0);
            parent.setId(42L);
            parent.setCreatedAt(LocalDateTime.of(2026, 9, 21, 10, 0));
            parent.setUpdatedAt(parent.getCreatedAt());
            return parent;
        });
        given(bookingRepository.saveAll(anyList())).willAnswer(invocation -> invocation.getArgument(0));

        KitBookingResponseDTO result = service.create(kit.getId(), request);

        assertThat(result.getBookingReference()).isEqualTo("KIT-2026-000042");
        assertThat(result.getResourceCount()).isEqualTo(2);
        assertThat(result.getGroupMemberNames()).containsExactly("member");
        ArgumentCaptor<List<Booking>> children = ArgumentCaptor.forClass(List.class);
        then(bookingRepository).should().saveAll(children.capture());
        assertThat(children.getValue()).allSatisfy(child -> {
            assertThat(child.getKitBooking().getId()).isEqualTo(42L);
            assertThat(child.getStatus()).isEqualTo(Booking.Status.PENDING);
            assertThat(child.getGroupMembers()).isEmpty();
        });
    }

    @Test
    @DisplayName("A child resource conflict prevents both parent and child persistence")
    void create_conflictPersistsNothing() {
        given(userRepository.findById(owner.getId())).willReturn(Optional.of(owner));
        given(kitRepository.findByIdWithResources(kit.getId())).willReturn(Optional.of(kit));
        given(resourceRepository.findAllByIdForUpdate(List.of(10L, 11L)))
                .willReturn(List.of(camera, mic));
        given(bookingRepository.findOverlappingBookings(eq(10L), any(), any())).willReturn(List.of());
        given(bookingRepository.findOverlappingBookings(eq(11L), any(), any()))
                .willReturn(List.of(Booking.builder().id(99L).build()));

        assertThatThrownBy(() -> service.create(kit.getId(), request()))
                .isInstanceOf(BookingConflictException.class);
        then(kitBookingRepository).should(never()).saveAndFlush(any());
        then(bookingRepository).should(never()).saveAll(anyList());
    }

    @Test
    @DisplayName("One approval updates parent and every child")
    void approve_updatesAggregate() {
        KitBooking parent = parent(KitBooking.Status.PENDING);
        List<Booking> children = children(parent, Booking.Status.PENDING);
        given(kitBookingRepository.findByIdForUpdate(42L)).willReturn(Optional.of(parent));
        given(bookingRepository.findByKitBookingIdOrderByResourceId(42L)).willReturn(children);

        KitBookingResponseDTO result = service.approve(42L);

        assertThat(result.getStatus()).isEqualTo(KitBooking.Status.APPROVED);
        assertThat(parent.getStatus()).isEqualTo(KitBooking.Status.APPROVED);
        assertThat(children).allMatch(child -> child.getStatus() == Booking.Status.APPROVED);
    }

    @Test
    @DisplayName("Repeat approval fails without changing children")
    void approve_repeatedFails() {
        KitBooking parent = parent(KitBooking.Status.APPROVED);
        given(kitBookingRepository.findByIdForUpdate(42L)).willReturn(Optional.of(parent));

        assertThatThrownBy(() -> service.approve(42L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
        then(bookingRepository).should(never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Rejection closes all children then releases each resource")
    void reject_releasesAllChildren() {
        KitBooking parent = parent(KitBooking.Status.PENDING);
        List<Booking> children = children(parent, Booking.Status.PENDING);
        given(kitBookingRepository.findByIdForUpdate(42L)).willReturn(Optional.of(parent));
        given(bookingRepository.findByKitBookingIdOrderByResourceId(42L)).willReturn(children);
        given(resourceRepository.findAllByIdForUpdate(List.of(10L, 11L)))
                .willReturn(List.of(camera, mic));

        service.reject(42L);

        assertThat(parent.getStatus()).isEqualTo(KitBooking.Status.REJECTED);
        assertThat(children).allMatch(child -> child.getStatus() == Booking.Status.REJECTED);
        then(waitlistService).should().offerReleasedSlot(camera, start, end);
        then(waitlistService).should().offerReleasedSlot(mic, start, end);
    }

    @Test
    @DisplayName("Cancellation closes all approved children atomically")
    void cancel_closesAggregate() {
        KitBooking parent = parent(KitBooking.Status.APPROVED);
        List<Booking> children = children(parent, Booking.Status.APPROVED);
        given(kitBookingRepository.findByIdForUpdate(42L)).willReturn(Optional.of(parent));
        given(bookingRepository.findByKitBookingIdOrderByResourceId(42L)).willReturn(children);
        given(resourceRepository.findAllByIdForUpdate(List.of(10L, 11L)))
                .willReturn(List.of(camera, mic));

        service.cancel(42L);

        assertThat(parent.getStatus()).isEqualTo(KitBooking.Status.CANCELLED);
        assertThat(children).allMatch(child -> child.getStatus() == Booking.Status.CANCELLED);
        then(waitlistService).should(times(2)).offerReleasedSlot(any(), eq(start), eq(end));
    }

    @Test
    @DisplayName("Started reservation cannot be cancelled")
    void cancel_startedFails() {
        KitBooking parent = parent(KitBooking.Status.APPROVED);
        parent.setStartTime(LocalDateTime.now().minusMinutes(10));
        parent.setEndTime(LocalDateTime.now().plusHours(1));
        given(kitBookingRepository.findByIdForUpdate(42L)).willReturn(Optional.of(parent));

        assertThatThrownBy(() -> service.cancel(42L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409")
                .hasMessageContaining("started");
    }

    @Test
    @DisplayName("Child status drift aborts the parent lifecycle action")
    void cancel_childMismatchFails() {
        KitBooking parent = parent(KitBooking.Status.PENDING);
        List<Booking> children = children(parent, Booking.Status.PENDING);
        children.get(1).setStatus(Booking.Status.APPROVED);
        given(kitBookingRepository.findByIdForUpdate(42L)).willReturn(Optional.of(parent));
        given(bookingRepository.findByKitBookingIdOrderByResourceId(42L)).willReturn(children);

        assertThatThrownBy(() -> service.cancel(42L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("out of sync");
        then(resourceRepository).should(never()).findAllByIdForUpdate(anyList());
    }

    private Resource resource(Long id, String name) {
        return Resource.builder().id(id).name(name).type("EQUIPMENT")
                .status(Resource.Status.AVAILABLE).build();
    }

    private KitBookingRequestDTO request() {
        KitBookingRequestDTO request = new KitBookingRequestDTO();
        request.setUserId(owner.getId());
        request.setStartTime(start);
        request.setEndTime(end);
        return request;
    }

    private KitBooking parent(KitBooking.Status status) {
        return KitBooking.builder().id(42L).bookingReference("KIT-2026-000042")
                .kit(kit).user(owner).startTime(start).endTime(end).status(status)
                .resourceCount(2)
                .groupMembers(Set.of(member)).build();
    }

    private List<Booking> children(KitBooking parent, Booking.Status status) {
        return List.of(
                Booking.builder().id(100L).kitBooking(parent).user(owner).resource(camera)
                        .startTime(start).endTime(end).status(status).build(),
                Booking.builder().id(101L).kitBooking(parent).user(owner).resource(mic)
                        .startTime(start).endTime(end).status(status).build());
    }
}
