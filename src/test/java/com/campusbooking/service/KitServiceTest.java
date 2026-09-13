package com.campusbooking.service;

import com.campusbooking.dto.BookingResponseDTO;
import com.campusbooking.dto.KitBookingRequestDTO;
import com.campusbooking.dto.KitResponseDTO;
import com.campusbooking.exception.BookingConflictException;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Kit;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for {@link KitService}.
 *
 * <p>Verifies atomic multi-item bundle booking, time-slot conflict rollback,
 * maintenance checks, and collaborative group member propagation.</p>
 */
@ExtendWith(MockitoExtension.class)
class KitServiceTest {

    @Mock
    private KitRepository kitRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private KitService kitService;

    private User testUser;
    private Resource item1Camera;
    private Resource item2Tripod;
    private Resource item3Mic;
    private Kit testKit;
    private LocalDateTime futureStart;
    private LocalDateTime futureEnd;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("alice_student")
                .email("alice@campus.edu")
                .role(User.Role.STUDENT)
                .build();

        item1Camera = Resource.builder()
                .id(10L)
                .name("DSLR 4K Camera")
                .type("EQUIPMENT")
                .status(Resource.Status.AVAILABLE)
                .build();

        item2Tripod = Resource.builder()
                .id(11L)
                .name("Heavy-Duty Tripod")
                .type("EQUIPMENT")
                .status(Resource.Status.AVAILABLE)
                .build();

        item3Mic = Resource.builder()
                .id(12L)
                .name("Shotgun Mic Kit")
                .type("EQUIPMENT")
                .status(Resource.Status.AVAILABLE)
                .build();

        testKit = Kit.builder()
                .id(1L)
                .name("Media Production Kit")
                .description("Complete video bundle")
                .resources(new HashSet<>(Set.of(item1Camera, item2Tripod, item3Mic)))
                .build();

        futureStart = LocalDateTime.now().plusDays(1);
        futureEnd = futureStart.plusHours(3);
    }

    private KitBookingRequestDTO buildKitRequest() {
        KitBookingRequestDTO req = new KitBookingRequestDTO();
        req.setUserId(testUser.getId());
        req.setStartTime(futureStart);
        req.setEndTime(futureEnd);
        return req;
    }

    // =========================================================================
    // Queries: getAllKits, getKitById
    // =========================================================================

    @Nested
    @DisplayName("Kit Queries")
    class KitQueries {

        @Test
        @DisplayName("getAllKits returns mapped DTOs with bundled items")
        void getAllKits_returnsAllKits() {
            given(kitRepository.findAllWithResources()).willReturn(List.of(testKit));

            List<KitResponseDTO> results = kitService.getAllKits();

            assertThat(results).hasSize(1);
            KitResponseDTO kitDTO = results.get(0);
            assertThat(kitDTO.getId()).isEqualTo(1L);
            assertThat(kitDTO.getName()).isEqualTo("Media Production Kit");
            assertThat(kitDTO.getItemCount()).isEqualTo(3);
            assertThat(kitDTO.getItems()).extracting(KitResponseDTO.KitItemDTO::getName)
                    .containsExactlyInAnyOrder("DSLR 4K Camera", "Heavy-Duty Tripod", "Shotgun Mic Kit");
        }

        @Test
        @DisplayName("getKitById returns kit when found")
        void getKitById_whenFound_returnsDTO() {
            given(kitRepository.findByIdWithResources(1L)).willReturn(Optional.of(testKit));

            KitResponseDTO result = kitService.getKitById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getItemCount()).isEqualTo(3);
        }

        @Test
        @DisplayName("getKitById throws 404 when kit does not exist")
        void getKitById_whenNotFound_throws404() {
            given(kitRepository.findByIdWithResources(999L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> kitService.getKitById(999L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");
        }
    }

    // =========================================================================
    // bookKit — Success path
    // =========================================================================

    @Nested
    @DisplayName("bookKit — Success path")
    class BookKitSuccess {

        @Test
        @DisplayName("Creates reservations for all kit items when all resources are free")
        void whenAllResourcesAvailable_thenCreatesBookingsAtomically() {
            KitBookingRequestDTO request = buildKitRequest();

            given(userRepository.findById(testUser.getId())).willReturn(Optional.of(testUser));
            given(kitRepository.findByIdWithResources(testKit.getId())).willReturn(Optional.of(testKit));
            given(bookingRepository.findOverlappingBookings(anyLong(), any(), any()))
                    .willReturn(Collections.emptyList()); // all 3 items free

            given(bookingRepository.saveAll(anyList())).willAnswer(inv -> {
                List<Booking> bookings = inv.getArgument(0);
                long idCounter = 200L;
                List<Booking> savedList = new ArrayList<>();
                for (Booking b : bookings) {
                    savedList.add(Booking.builder()
                            .id(idCounter++)
                            .user(b.getUser())
                            .resource(b.getResource())
                            .startTime(b.getStartTime())
                            .endTime(b.getEndTime())
                            .status(b.getStatus())
                            .groupMembers(b.getGroupMembers())
                            .build());
                }
                return savedList;
            });

            List<BookingResponseDTO> responses = kitService.bookKit(testKit.getId(), request);

            assertThat(responses).hasSize(3);
            assertThat(responses).extracting(BookingResponseDTO::getResourceName)
                    .containsExactlyInAnyOrder("DSLR 4K Camera", "Heavy-Duty Tripod", "Shotgun Mic Kit");
            assertThat(responses).allMatch(r -> r.getStatus() == Booking.Status.PENDING);
            assertThat(responses).allMatch(r -> r.getUserId().equals(testUser.getId()));

            then(bookingRepository).should(times(1)).saveAll(anyList());
        }

        @Test
        @DisplayName("Propagates invited collaborative group members to all kit reservations")
        void whenGroupMembersProvided_attachesMembersToAllKitBookings() {
            User peer1 = User.builder().id(2L).username("bob_peer").build();
            User peer2 = User.builder().id(3L).username("charlie_peer").build();

            KitBookingRequestDTO request = buildKitRequest();
            request.setMemberUserIds(List.of(2L, 3L));

            given(userRepository.findById(testUser.getId())).willReturn(Optional.of(testUser));
            given(kitRepository.findByIdWithResources(testKit.getId())).willReturn(Optional.of(testKit));
            given(bookingRepository.findOverlappingBookings(anyLong(), any(), any())).willReturn(Collections.emptyList());
            given(userRepository.findById(2L)).willReturn(Optional.of(peer1));
            given(userRepository.findById(3L)).willReturn(Optional.of(peer2));

            given(bookingRepository.saveAll(anyList())).willAnswer(inv -> {
                List<Booking> list = inv.getArgument(0);
                return list; // echo
            });

            List<BookingResponseDTO> responses = kitService.bookKit(testKit.getId(), request);

            assertThat(responses).hasSize(3);
            for (BookingResponseDTO res : responses) {
                assertThat(res.isGroupBooking()).isTrue();
                assertThat(res.getGroupMemberNames()).containsExactlyInAnyOrder("bob_peer", "charlie_peer");
            }
        }
    }

    // =========================================================================
    // bookKit — Atomic Conflict & Failure Paths
    // =========================================================================

    @Nested
    @DisplayName("bookKit — Atomic Conflict Prevention")
    class BookKitConflict {

        @Test
        @DisplayName("Fails atomically with 409 Conflict if even one sub-item has a time conflict")
        void whenOneSubItemHasTimeConflict_failsAtomically() {
            KitBookingRequestDTO request = buildKitRequest();

            given(userRepository.findById(testUser.getId())).willReturn(Optional.of(testUser));
            given(kitRepository.findByIdWithResources(testKit.getId())).willReturn(Optional.of(testKit));

            // item1 and item2 free, item3 (mic) has conflict
            given(bookingRepository.findOverlappingBookings(eq(item1Camera.getId()), any(), any()))
                    .willReturn(Collections.emptyList());
            given(bookingRepository.findOverlappingBookings(eq(item2Tripod.getId()), any(), any()))
                    .willReturn(Collections.emptyList());
            given(bookingRepository.findOverlappingBookings(eq(item3Mic.getId()), any(), any()))
                    .willReturn(List.of(Booking.builder().id(999L).build()));

            assertThatThrownBy(() -> kitService.bookKit(testKit.getId(), request))
                    .isInstanceOf(BookingConflictException.class)
                    .hasMessageContaining("Shotgun Mic Kit")
                    .hasMessageContaining("already booked");

            // Verify no bookings were saved
            then(bookingRepository).should(never()).saveAll(anyList());
            then(bookingRepository).should(never()).save(any(Booking.class));
        }

        @Test
        @DisplayName("Fails atomically with 409 Conflict if any bundled resource is in MAINTENANCE")
        void whenOneSubItemInMaintenance_failsAtomically() {
            // Put tripod in maintenance
            item2Tripod.setStatus(Resource.Status.MAINTENANCE);

            KitBookingRequestDTO request = buildKitRequest();

            given(userRepository.findById(testUser.getId())).willReturn(Optional.of(testUser));
            given(kitRepository.findByIdWithResources(testKit.getId())).willReturn(Optional.of(testKit));

            assertThatThrownBy(() -> kitService.bookKit(testKit.getId(), request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("409")
                    .hasMessageContaining("Heavy-Duty Tripod")
                    .hasMessageContaining("MAINTENANCE");

            then(bookingRepository).should(never()).saveAll(anyList());
        }

        @Test
        @DisplayName("Throws 400 when start time is in the past")
        void whenStartTimeInPast_throws400() {
            KitBookingRequestDTO request = buildKitRequest();
            request.setStartTime(LocalDateTime.now().minusHours(1));

            given(userRepository.findById(testUser.getId())).willReturn(Optional.of(testUser));
            given(kitRepository.findByIdWithResources(testKit.getId())).willReturn(Optional.of(testKit));

            assertThatThrownBy(() -> kitService.bookKit(testKit.getId(), request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("400")
                    .hasMessageContaining("future");
        }

        @Test
        @DisplayName("Throws 400 when end time is before start time")
        void whenEndTimeBeforeStartTime_throws400() {
            KitBookingRequestDTO request = buildKitRequest();
            request.setEndTime(futureStart.minusHours(1));

            given(userRepository.findById(testUser.getId())).willReturn(Optional.of(testUser));
            given(kitRepository.findByIdWithResources(testKit.getId())).willReturn(Optional.of(testKit));

            assertThatThrownBy(() -> kitService.bookKit(testKit.getId(), request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("400")
                    .hasMessageContaining("endTime must be strictly after startTime");
        }

        @Test
        @DisplayName("Throws 404 when user is not found")
        void whenUserNotFound_throws404() {
            KitBookingRequestDTO request = buildKitRequest();
            given(userRepository.findById(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> kitService.bookKit(testKit.getId(), request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");
        }

        @Test
        @DisplayName("Throws 404 when kit is not found")
        void whenKitNotFound_throws404() {
            KitBookingRequestDTO request = buildKitRequest();
            given(userRepository.findById(testUser.getId())).willReturn(Optional.of(testUser));
            given(kitRepository.findByIdWithResources(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> kitService.bookKit(999L, request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");
        }
    }
}
