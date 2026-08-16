package com.campusbooking.service;

import com.campusbooking.dto.BookingRequestDTO;
import com.campusbooking.dto.BookingResponseDTO;
import com.campusbooking.exception.BookingConflictException;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import com.campusbooking.repository.WaitlistRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for {@link BookingService}.
 *
 * <p>All repository dependencies are mocked with Mockito so no Spring context
 * or database is required.  Each test group is nested under a descriptive
 * {@link Nested} class for readability.</p>
 */
@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    // ── Mocks ─────────────────────────────────────────────────────────────────

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WaitlistRepository waitlistRepository;

    @InjectMocks
    private BookingService bookingService;

    // ── Shared test fixtures ──────────────────────────────────────────────────

    private User      testUser;
    private Resource  testResource;
    private LocalDateTime futureStart;
    private LocalDateTime futureEnd;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("alice_student")
                .email("alice@campus.edu")
                .password("secret")
                .role(User.Role.STUDENT)
                .build();

        testResource = Resource.builder()
                .id(2L)
                .name("Room A101")
                .type("ROOM")
                .description("Seminar room")
                .status(Resource.Status.AVAILABLE)
                .build();

        // A safe future window: +1 day → +3 hours
        futureStart = LocalDateTime.now().plusDays(1);
        futureEnd   = futureStart.plusHours(2);
    }

    /** Builds a {@link BookingRequestDTO} from the shared fixtures. */
    private BookingRequestDTO buildRequest() {
        BookingRequestDTO req = new BookingRequestDTO();
        req.setUserId(testUser.getId());
        req.setResourceId(testResource.getId());
        req.setStartTime(futureStart);
        req.setEndTime(futureEnd);
        return req;
    }

    // =========================================================================
    // createBooking — happy path
    // =========================================================================

    @Nested
    @DisplayName("createBooking — success")
    class CreateBookingSuccess {

        @Test
        @DisplayName("Returns a BookingResponseDTO when there is no time-slot conflict")
        void whenNoConflict_thenBookingIsSavedAndReturned() {
            // Arrange
            BookingRequestDTO request = buildRequest();

            given(userRepository.findById(testUser.getId()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(testResource.getId()))
                    .willReturn(Optional.of(testResource));
            given(bookingRepository.findOverlappingBookings(
                    eq(testResource.getId()), any(), any()))
                    .willReturn(Collections.emptyList()); // no conflicts

            Booking savedBooking = Booking.builder()
                    .id(10L)
                    .user(testUser)
                    .resource(testResource)
                    .startTime(futureStart)
                    .endTime(futureEnd)
                    .status(Booking.Status.PENDING)
                    .build();

            given(bookingRepository.save(any(Booking.class)))
                    .willReturn(savedBooking);

            // Act
            BookingResponseDTO response = bookingService.createBooking(request);

            // Assert – response is populated correctly
            assertThat(response).isNotNull();
            assertThat(response.getBookingId()).isEqualTo(10L);
            assertThat(response.getUserId()).isEqualTo(testUser.getId());
            assertThat(response.getUsername()).isEqualTo(testUser.getUsername());
            assertThat(response.getResourceId()).isEqualTo(testResource.getId());
            assertThat(response.getResourceName()).isEqualTo(testResource.getName());
            assertThat(response.getStartTime()).isEqualTo(futureStart);
            assertThat(response.getEndTime()).isEqualTo(futureEnd);
            assertThat(response.getStatus()).isEqualTo(Booking.Status.PENDING);

            // Assert – booking was persisted exactly once
            then(bookingRepository).should(times(1)).save(any(Booking.class));
        }

        @Test
        @DisplayName("Saved booking always has status PENDING")
        void createdBooking_hasStatusPending() {
            BookingRequestDTO request = buildRequest();

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(anyLong()))
                    .willReturn(Optional.of(testResource));
            given(bookingRepository.findOverlappingBookings(anyLong(), any(), any()))
                    .willReturn(Collections.emptyList());

            // Capture the booking passed to save and echo it back with an id
            given(bookingRepository.save(any(Booking.class)))
                    .willAnswer(invocation -> {
                        Booking b = invocation.getArgument(0);
                        return Booking.builder()
                                .id(99L)
                                .user(b.getUser())
                                .resource(b.getResource())
                                .startTime(b.getStartTime())
                                .endTime(b.getEndTime())
                                .status(b.getStatus())
                                .build();
                    });

            BookingResponseDTO response = bookingService.createBooking(request);

            assertThat(response.getStatus()).isEqualTo(Booking.Status.PENDING);
        }
    }

    // =========================================================================
    // createBooking — conflict
    // =========================================================================

    @Nested
    @DisplayName("createBooking — time-slot conflict")
    class CreateBookingConflict {

        @Test
        @DisplayName("Throws BookingConflictException when an overlapping booking exists")
        void whenOverlapExists_thenThrowsBookingConflictException() {
            // Arrange
            BookingRequestDTO request = buildRequest();

            given(userRepository.findById(testUser.getId()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(testResource.getId()))
                    .willReturn(Optional.of(testResource));

            // Simulate an existing booking that overlaps the requested window
            Booking existingConflict = Booking.builder()
                    .id(5L)
                    .user(testUser)
                    .resource(testResource)
                    .startTime(futureStart.minusMinutes(30))
                    .endTime(futureEnd.plusMinutes(30))
                    .status(Booking.Status.CONFIRMED)
                    .build();

            given(bookingRepository.findOverlappingBookings(
                    eq(testResource.getId()), any(), any()))
                    .willReturn(List.of(existingConflict));

            // Act & Assert
            assertThatThrownBy(() -> bookingService.createBooking(request))
                    .isInstanceOf(BookingConflictException.class)
                    .hasMessage("Resource is already booked during this time slot");

            // Booking must NOT have been persisted
            then(bookingRepository).should(never()).save(any(Booking.class));
        }

        @Test
        @DisplayName("Throws BookingConflictException even for a PENDING conflict")
        void whenPendingOverlapExists_thenThrowsBookingConflictException() {
            BookingRequestDTO request = buildRequest();

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(anyLong()))
                    .willReturn(Optional.of(testResource));

            Booking pendingConflict = Booking.builder()
                    .id(6L)
                    .user(testUser)
                    .resource(testResource)
                    .startTime(futureStart)
                    .endTime(futureEnd)
                    .status(Booking.Status.PENDING)
                    .build();

            given(bookingRepository.findOverlappingBookings(anyLong(), any(), any()))
                    .willReturn(List.of(pendingConflict));

            assertThatThrownBy(() -> bookingService.createBooking(request))
                    .isInstanceOf(BookingConflictException.class);

            then(bookingRepository).should(never()).save(any(Booking.class));
        }
    }

    // =========================================================================
    // createBooking — validation failures
    // =========================================================================

    @Nested
    @DisplayName("createBooking — validation guards")
    class CreateBookingValidation {

        @Test
        @DisplayName("Throws 404 when user does not exist")
        void whenUserNotFound_thenThrows404() {
            BookingRequestDTO request = buildRequest();

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.empty());

            assertThatThrownBy(() -> bookingService.createBooking(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");
        }

        @Test
        @DisplayName("Throws 404 when resource does not exist")
        void whenResourceNotFound_thenThrows404() {
            BookingRequestDTO request = buildRequest();

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(anyLong()))
                    .willReturn(Optional.empty());

            assertThatThrownBy(() -> bookingService.createBooking(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");
        }

        @Test
        @DisplayName("Throws 409 when resource status is not AVAILABLE")
        void whenResourceUnavailable_thenThrows409() {
            BookingRequestDTO request = buildRequest();

            Resource maintenance = Resource.builder()
                    .id(2L).name("Lab B").type("LAB")
                    .status(Resource.Status.MAINTENANCE)
                    .build();

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(anyLong()))
                    .willReturn(Optional.of(maintenance));

            assertThatThrownBy(() -> bookingService.createBooking(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("409");
        }

        @Test
        @DisplayName("Throws 400 when startTime is in the past")
        void whenStartTimeInPast_thenThrows400() {
            BookingRequestDTO request = buildRequest();
            request.setStartTime(LocalDateTime.now().minusHours(1));
            request.setEndTime(LocalDateTime.now().plusHours(1));

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(anyLong()))
                    .willReturn(Optional.of(testResource));

            assertThatThrownBy(() -> bookingService.createBooking(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("400");
        }

        @Test
        @DisplayName("Throws 400 when endTime is not after startTime")
        void whenEndTimeBeforeStartTime_thenThrows400() {
            BookingRequestDTO request = buildRequest();
            request.setEndTime(futureStart.minusMinutes(30));  // end before start

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(anyLong()))
                    .willReturn(Optional.of(testResource));

            assertThatThrownBy(() -> bookingService.createBooking(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("400");
        }
    }

    // =========================================================================
    // getUserBookings
    // =========================================================================

    @Nested
    @DisplayName("getUserBookings")
    class GetUserBookings {

        @Test
        @DisplayName("Returns mapped DTOs for a user with bookings")
        void whenUserExists_thenReturnsBookings() {
            Booking b = Booking.builder()
                    .id(20L).user(testUser).resource(testResource)
                    .startTime(futureStart).endTime(futureEnd)
                    .status(Booking.Status.CONFIRMED)
                    .build();

            given(userRepository.existsById(testUser.getId())).willReturn(true);
            given(bookingRepository.findByUserId(testUser.getId())).willReturn(List.of(b));

            List<BookingResponseDTO> result = bookingService.getUserBookings(testUser.getId());

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getBookingId()).isEqualTo(20L);
        }

        @Test
        @DisplayName("Throws 404 when user does not exist")
        void whenUserNotFound_thenThrows404() {
            given(userRepository.existsById(anyLong())).willReturn(false);

            assertThatThrownBy(() -> bookingService.getUserBookings(999L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");
        }
    }

    // =========================================================================
    // cancelBooking
    // =========================================================================

    @Nested
    @DisplayName("cancelBooking")
    class CancelBooking {

        @Test
        @DisplayName("Sets status to CANCELLED and returns updated DTO")
        void whenBookingIsPending_thenCancelSucceeds() {
            Booking pending = Booking.builder()
                    .id(30L).user(testUser).resource(testResource)
                    .startTime(futureStart).endTime(futureEnd)
                    .status(Booking.Status.PENDING)
                    .build();

            given(bookingRepository.findById(30L)).willReturn(Optional.of(pending));
            given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));
            // Waitlist: no waiting entries for this resource
            given(waitlistRepository.findByResourceIdAndStatusOrderByRequestTimeAsc(
                    anyLong(), any())).willReturn(Collections.emptyList());

            BookingResponseDTO result = bookingService.cancelBooking(30L);

            assertThat(result.getStatus()).isEqualTo(Booking.Status.CANCELLED);
        }

        @Test
        @DisplayName("Promotes earliest WAITING waitlist entry when a booking is cancelled")
        void whenCancelled_andWaitlistExists_thenFirstEntryIsPromoted() {
            // Arrange – the booking being cancelled
            Booking pending = Booking.builder()
                    .id(33L).user(testUser).resource(testResource)
                    .startTime(futureStart).endTime(futureEnd)
                    .status(Booking.Status.PENDING)
                    .build();

            given(bookingRepository.findById(33L)).willReturn(Optional.of(pending));
            given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));

            // Arrange – one WAITING waitlist entry exists
            com.campusbooking.model.Waitlist waitlistEntry =
                    com.campusbooking.model.Waitlist.builder()
                            .id(1L)
                            .user(testUser)
                            .resource(testResource)
                            .requestTime(java.time.LocalDateTime.now().minusHours(1))
                            .status(com.campusbooking.model.Waitlist.Status.WAITING)
                            .build();

            given(waitlistRepository.findByResourceIdAndStatusOrderByRequestTimeAsc(
                    eq(testResource.getId()),
                    eq(com.campusbooking.model.Waitlist.Status.WAITING)))
                    .willReturn(List.of(waitlistEntry));
            given(waitlistRepository.save(any(com.campusbooking.model.Waitlist.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            // Act
            bookingService.cancelBooking(33L);

            // Assert – waitlist entry was promoted
            then(waitlistRepository).should(times(1))
                    .save(argThat(w ->
                            w.getStatus() == com.campusbooking.model.Waitlist.Status.PROMOTED));
        }

        @Test
        @DisplayName("Throws 404 when booking does not exist")
        void whenBookingNotFound_thenThrows404() {
            given(bookingRepository.findById(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> bookingService.cancelBooking(999L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");
        }

        @Test
        @DisplayName("Throws 400 when booking is already cancelled")
        void whenAlreadyCancelled_thenThrows400() {
            Booking cancelled = Booking.builder()
                    .id(31L).user(testUser).resource(testResource)
                    .startTime(futureStart).endTime(futureEnd)
                    .status(Booking.Status.CANCELLED)
                    .build();

            given(bookingRepository.findById(31L)).willReturn(Optional.of(cancelled));

            assertThatThrownBy(() -> bookingService.cancelBooking(31L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("400");
        }

        @Test
        @DisplayName("Throws 400 when booking is already completed")
        void whenCompleted_thenThrows400() {
            Booking completed = Booking.builder()
                    .id(32L).user(testUser).resource(testResource)
                    .startTime(futureStart).endTime(futureEnd)
                    .status(Booking.Status.COMPLETED)
                    .build();

            given(bookingRepository.findById(32L)).willReturn(Optional.of(completed));

            assertThatThrownBy(() -> bookingService.cancelBooking(32L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("400");
        }
    }

    // =========================================================================
    // Admin: approveBooking / rejectBooking
    // =========================================================================

    @Nested
    @DisplayName("Admin — approveBooking / rejectBooking")
    class AdminApproveReject {

        @Test
        @DisplayName("approveBooking sets status to APPROVED and returns updated DTO")
        void approveBooking_setsStatusApproved() {
            Booking pending = Booking.builder()
                    .id(40L).user(testUser).resource(testResource)
                    .startTime(futureStart).endTime(futureEnd)
                    .status(Booking.Status.PENDING)
                    .build();

            given(bookingRepository.findById(40L)).willReturn(Optional.of(pending));
            given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));

            BookingResponseDTO result = bookingService.approveBooking(40L);

            assertThat(result.getStatus()).isEqualTo(Booking.Status.APPROVED);
            then(bookingRepository).should(times(1)).save(any(Booking.class));
        }

        @Test
        @DisplayName("rejectBooking sets status to REJECTED and returns updated DTO")
        void rejectBooking_setsStatusRejected() {
            Booking pending = Booking.builder()
                    .id(41L).user(testUser).resource(testResource)
                    .startTime(futureStart).endTime(futureEnd)
                    .status(Booking.Status.PENDING)
                    .build();

            given(bookingRepository.findById(41L)).willReturn(Optional.of(pending));
            given(bookingRepository.save(any(Booking.class))).willAnswer(inv -> inv.getArgument(0));

            BookingResponseDTO result = bookingService.rejectBooking(41L);

            assertThat(result.getStatus()).isEqualTo(Booking.Status.REJECTED);
            then(bookingRepository).should(times(1)).save(any(Booking.class));
        }

        @Test
        @DisplayName("approveBooking throws 404 when booking does not exist")
        void approveBooking_whenNotFound_thenThrows404() {
            given(bookingRepository.findById(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> bookingService.approveBooking(999L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");
        }

        @Test
        @DisplayName("rejectBooking throws 404 when booking does not exist")
        void rejectBooking_whenNotFound_thenThrows404() {
            given(bookingRepository.findById(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> bookingService.rejectBooking(999L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");
        }

        @Test
        @DisplayName("approveBooking throws 400 when booking is already cancelled")
        void approveBooking_whenCancelled_thenThrows400() {
            Booking cancelled = Booking.builder()
                    .id(42L).user(testUser).resource(testResource)
                    .startTime(futureStart).endTime(futureEnd)
                    .status(Booking.Status.CANCELLED)
                    .build();

            given(bookingRepository.findById(42L)).willReturn(Optional.of(cancelled));

            assertThatThrownBy(() -> bookingService.approveBooking(42L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("400");
        }

        @Test
        @DisplayName("rejectBooking throws 400 when booking is already completed")
        void rejectBooking_whenCompleted_thenThrows400() {
            Booking completed = Booking.builder()
                    .id(43L).user(testUser).resource(testResource)
                    .startTime(futureStart).endTime(futureEnd)
                    .status(Booking.Status.COMPLETED)
                    .build();

            given(bookingRepository.findById(43L)).willReturn(Optional.of(completed));

            assertThatThrownBy(() -> bookingService.rejectBooking(43L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("400");
        }
    }
}
