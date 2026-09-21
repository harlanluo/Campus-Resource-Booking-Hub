package com.campusbooking.service;

import com.campusbooking.dto.BookingResponseDTO;
import com.campusbooking.dto.WaitlistRequestDTO;
import com.campusbooking.dto.WaitlistResponseDTO;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.model.Waitlist;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import com.campusbooking.repository.WaitlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

@ExtendWith(MockitoExtension.class)
class WaitlistServiceTest {

    @Mock private WaitlistRepository waitlistRepository;
    @Mock private UserRepository userRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private BookingRepository bookingRepository;
    @InjectMocks private WaitlistService service;

    private User student;
    private Resource resource;
    private LocalDateTime start;
    private LocalDateTime end;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "offerDurationMinutes", 15L);
        student = User.builder().id(1L).username("alice_student")
                .role(User.Role.STUDENT).build();
        resource = Resource.builder().id(2L).name("Room A101").type("ROOM")
                .status(Resource.Status.AVAILABLE).build();
        start = LocalDateTime.now().plusDays(2).withNano(0);
        end = start.plusHours(2);
    }

    @Test
    void joinStoresAuthenticatedStudentAndExactInterval() {
        WaitlistRequestDTO request = request();
        stubJoinLookup();
        given(bookingRepository.findOverlappingBookings(resource.getId(), start, end))
                .willReturn(List.of(conflictingBooking()));
        given(waitlistRepository.save(any(Waitlist.class))).willAnswer(invocation -> {
            Waitlist entry = invocation.getArgument(0);
            entry.setId(10L);
            entry.setRequestTime(LocalDateTime.now());
            return entry;
        });
        given(waitlistRepository.queuePosition(anyLong(), any(), any(), any(), anyLong()))
                .willReturn(1L);

        WaitlistResponseDTO response = service.joinWaitlist(student.getUsername(), request);

        ArgumentCaptor<Waitlist> captor = ArgumentCaptor.forClass(Waitlist.class);
        then(waitlistRepository).should().save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(student);
        assertThat(captor.getValue().getRequestedStart()).isEqualTo(start);
        assertThat(captor.getValue().getRequestedEnd()).isEqualTo(end);
        assertThat(response.getQueuePosition()).isEqualTo(1);
        assertThat(response.getDisplayStatus()).isEqualTo("Waiting for this time");
    }

    @Test
    void invalidPastMaintenanceAvailableAndDuplicateRequestsAreRejected() {
        given(userRepository.findByUsername(student.getUsername())).willReturn(Optional.of(student));
        WaitlistRequestDTO invalid = request();
        invalid.setEndTime(start.minusMinutes(1));
        assertThatThrownBy(() -> service.joinWaitlist(student.getUsername(), invalid))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("400");

        WaitlistRequestDTO past = request();
        past.setStartTime(LocalDateTime.now().minusMinutes(1));
        past.setEndTime(LocalDateTime.now().plusMinutes(30));
        assertThatThrownBy(() -> service.joinWaitlist(student.getUsername(), past))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("400");

        stubJoinLookup();
        resource.setStatus(Resource.Status.MAINTENANCE);
        assertThatThrownBy(() -> service.joinWaitlist(student.getUsername(), request()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("409");

        resource.setStatus(Resource.Status.AVAILABLE);
        given(bookingRepository.findOverlappingBookings(resource.getId(), start, end))
                .willReturn(List.of());
        assertThatThrownBy(() -> service.joinWaitlist(student.getUsername(), request()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("available");

        given(waitlistRepository.existsActiveExactRequest(student.getId(), resource.getId(), start, end))
                .willReturn(true);
        assertThatThrownBy(() -> service.joinWaitlist(student.getUsername(), request()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("already");
    }

    @Test
    void releaseOffersFirstEligibleOverlappingEntryWithoutCreatingBooking() {
        LocalDateTime releasedStart = start.minusMinutes(30);
        LocalDateTime releasedEnd = end.plusMinutes(30);
        Waitlist first = waiting(11L, student, start, end, LocalDateTime.now().minusMinutes(2));
        Waitlist second = waiting(12L, otherStudent(), start.plusMinutes(30), end, LocalDateTime.now().minusMinutes(1));
        given(resourceRepository.findByIdForUpdate(resource.getId())).willReturn(Optional.of(resource));
        given(waitlistRepository.findWaitingAffectedByReleaseForUpdate(
                resource.getId(), releasedStart, releasedEnd))
                .willReturn(List.of(first, second));
        given(bookingRepository.findOverlappingBookings(
                resource.getId(), first.getRequestedStart(), first.getRequestedEnd()))
                .willReturn(List.of());
        given(waitlistRepository.findActiveOffersOverlapping(
                eq(resource.getId()), eq(first.getRequestedStart()), eq(first.getRequestedEnd()), any()))
                .willReturn(List.of());
        given(bookingRepository.findOverlappingBookings(
                resource.getId(), second.getRequestedStart(), second.getRequestedEnd()))
                .willReturn(List.of());
        given(waitlistRepository.findActiveOffersOverlapping(
                eq(resource.getId()), eq(second.getRequestedStart()), eq(second.getRequestedEnd()), any()))
                .willReturn(List.of(first));

        service.offerReleasedSlot(resource, releasedStart, releasedEnd);

        assertThat(first.getStatus()).isEqualTo(Waitlist.Status.OFFERED);
        assertThat(first.getOfferExpiresAt()).isAfter(first.getOfferedAt()).isBeforeOrEqualTo(first.getOfferedAt().plusMinutes(15));
        assertThat(second.getStatus()).isEqualTo(Waitlist.Status.WAITING);
        then(bookingRepository).should().findOverlappingBookings(
                resource.getId(), first.getRequestedStart(), first.getRequestedEnd());
        then(bookingRepository).should().findOverlappingBookings(
                resource.getId(), second.getRequestedStart(), second.getRequestedEnd());
    }

    @Test
    void recipientAcceptsOnceAndCreatesPendingBooking() {
        Waitlist offer = offered(20L, student, start, end, LocalDateTime.now().plusMinutes(10));
        stubOwnedOffer(offer);
        given(bookingRepository.findOverlappingBookings(resource.getId(), start, end)).willReturn(List.of());
        given(bookingRepository.save(any(Booking.class))).willAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId(50L);
            return booking;
        });

        BookingResponseDTO response = service.acceptOffer(student.getUsername(), offer.getId());

        assertThat(response.getStatus()).isEqualTo(Booking.Status.PENDING);
        assertThat(offer.getStatus()).isEqualTo(Waitlist.Status.ACCEPTED);
        assertThat(response.getStartTime()).isEqualTo(start);
        assertThat(response.getEndTime()).isEqualTo(end);
    }

    @Test
    void differentStudentCannotReadAcceptDeclineOrLeaveEntry() {
        User intruder = otherStudent();
        given(userRepository.findByUsername(intruder.getUsername())).willReturn(Optional.of(intruder));
        Waitlist offer = offered(21L, student, start, end, LocalDateTime.now().plusMinutes(10));
        given(waitlistRepository.findById(offer.getId())).willReturn(Optional.of(offer));
        given(resourceRepository.findByIdForUpdate(resource.getId())).willReturn(Optional.of(resource));
        given(waitlistRepository.findByIdForUpdate(offer.getId())).willReturn(Optional.of(offer));

        assertThatThrownBy(() -> service.getOwnEntry(intruder.getUsername(), offer.getId()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("403");
        assertThatThrownBy(() -> service.acceptOffer(intruder.getUsername(), offer.getId()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("403");
        assertThatThrownBy(() -> service.declineOffer(intruder.getUsername(), offer.getId()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("403");
        assertThatThrownBy(() -> service.leaveWaitlist(intruder.getUsername(), offer.getId()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("403");
    }

    @Test
    void declineAndExpiryReevaluateOverlappingRequestedIntervals() {
        Waitlist offer = offered(30L, student, start, end, LocalDateTime.now().plusMinutes(10));
        Waitlist next = waiting(31L, otherStudent(), start.plusMinutes(15), end.minusMinutes(15), LocalDateTime.now());
        stubOwnedOffer(offer);
        given(waitlistRepository.findWaitingAffectedByReleaseForUpdate(resource.getId(), start, end))
                .willReturn(List.of(next));
        given(bookingRepository.findOverlappingBookings(
                resource.getId(), next.getRequestedStart(), next.getRequestedEnd())).willReturn(List.of());
        given(waitlistRepository.findActiveOffersOverlapping(
                eq(resource.getId()), eq(next.getRequestedStart()), eq(next.getRequestedEnd()), any()))
                .willReturn(List.of());

        service.declineOffer(student.getUsername(), offer.getId());
        assertThat(offer.getStatus()).isEqualTo(Waitlist.Status.DECLINED);
        assertThat(next.getStatus()).isEqualTo(Waitlist.Status.OFFERED);

        Waitlist expired = offered(32L, student, start.plusHours(3), end.plusHours(3),
                LocalDateTime.now().minusSeconds(1));
        stubOwnedOffer(expired);
        given(waitlistRepository.findWaitingAffectedByReleaseForUpdate(
                resource.getId(), expired.getRequestedStart(), expired.getRequestedEnd())).willReturn(List.of());

        assertThatThrownBy(() -> service.acceptOffer(student.getUsername(), expired.getId()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("expired");
        assertThat(expired.getStatus()).isEqualTo(Waitlist.Status.EXPIRED);
    }

    @Test
    void leavingClosesWaitingEntry() {
        Waitlist entry = waiting(40L, student, start, end, LocalDateTime.now());
        given(userRepository.findByUsername(student.getUsername())).willReturn(Optional.of(student));
        given(waitlistRepository.findById(entry.getId())).willReturn(Optional.of(entry));
        given(resourceRepository.findByIdForUpdate(resource.getId())).willReturn(Optional.of(resource));
        given(waitlistRepository.findByIdForUpdate(entry.getId())).willReturn(Optional.of(entry));
        given(waitlistRepository.save(entry)).willReturn(entry);

        service.leaveWaitlist(student.getUsername(), entry.getId());

        assertThat(entry.getStatus()).isEqualTo(Waitlist.Status.LEFT);
        assertThat(entry.getClosedAt()).isNotNull();
    }

    private void stubJoinLookup() {
        given(userRepository.findByUsername(student.getUsername())).willReturn(Optional.of(student));
        given(resourceRepository.findByIdForUpdate(resource.getId())).willReturn(Optional.of(resource));
    }

    private void stubOwnedOffer(Waitlist offer) {
        given(userRepository.findByUsername(student.getUsername())).willReturn(Optional.of(student));
        given(waitlistRepository.findById(offer.getId())).willReturn(Optional.of(offer));
        given(resourceRepository.findByIdForUpdate(resource.getId())).willReturn(Optional.of(resource));
        given(waitlistRepository.findByIdForUpdate(offer.getId())).willReturn(Optional.of(offer));
    }

    private WaitlistRequestDTO request() {
        WaitlistRequestDTO request = new WaitlistRequestDTO();
        request.setResourceId(resource.getId());
        request.setStartTime(start);
        request.setEndTime(end);
        return request;
    }

    private Booking conflictingBooking() {
        return Booking.builder().id(1L).user(otherStudent()).resource(resource)
                .startTime(start).endTime(end).status(Booking.Status.APPROVED).build();
    }

    private User otherStudent() {
        return User.builder().id(2L).username("other_student").role(User.Role.STUDENT).build();
    }

    private Waitlist waiting(
            Long id, User user, LocalDateTime slotStart, LocalDateTime slotEnd, LocalDateTime joined) {
        return Waitlist.builder().id(id).user(user).resource(resource)
                .requestedStart(slotStart).requestedEnd(slotEnd).requestTime(joined)
                .status(Waitlist.Status.WAITING).build();
    }

    private Waitlist offered(
            Long id, User user, LocalDateTime slotStart, LocalDateTime slotEnd, LocalDateTime expires) {
        return Waitlist.builder().id(id).user(user).resource(resource)
                .requestedStart(slotStart).requestedEnd(slotEnd).requestTime(LocalDateTime.now().minusMinutes(2))
                .offeredAt(LocalDateTime.now().minusMinutes(1)).offerExpiresAt(expires)
                .status(Waitlist.Status.OFFERED).build();
    }
}
