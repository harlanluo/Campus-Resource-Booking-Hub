package com.campusbooking.service;

import com.campusbooking.dto.AvailabilityResponseDTO;
import com.campusbooking.dto.AvailabilityResponseDTO.SlotDTO;
import com.campusbooking.dto.AvailabilityResponseDTO.SlotStatus;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Kit;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.ResourceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock private ResourceRepository resourceRepository;
    @Mock private KitRepository kitRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private WaitlistService waitlistService;

    private AvailabilityService service;
    private LocalDate day;
    private LocalDateTime windowStart;
    private LocalDateTime windowEnd;
    private Resource resource;

    @BeforeEach
    void setUp() {
        service = new AvailabilityService(
                resourceRepository, kitRepository, bookingRepository, waitlistService);
        day = LocalDate.now().plusDays(20);
        windowStart = day.atStartOfDay();
        windowEnd = day.plusDays(1).atStartOfDay();
        resource = resource(1L, "Study Room A", Resource.Status.AVAILABLE);
    }

    @Test
    void freePeriodsRemainAvailable() {
        stubResource(resource, List.of());

        AvailabilityResponseDTO response =
                service.getResourceAvailability(resource.getId(), windowStart, windowEnd);

        assertThat(slotAt(response, 9, 0).getStatus()).isEqualTo(SlotStatus.AVAILABLE);
        assertThat(response.getSlots()).hasSize(24);
    }

    @Test
    void approvedAndConfirmedBookingsAreShownAsBooked() {
        List<Booking> bookings = List.of(
                booking(resource, Booking.Status.APPROVED, 9, 10),
                booking(resource, Booking.Status.CONFIRMED, 11, 12));
        stubResource(resource, bookings);

        AvailabilityResponseDTO response =
                service.getResourceAvailability(resource.getId(), windowStart, windowEnd);

        assertThat(slotAt(response, 9, 0).getStatus()).isEqualTo(SlotStatus.BOOKED);
        assertThat(slotAt(response, 11, 30).getStatus()).isEqualTo(SlotStatus.BOOKED);
    }

    @Test
    void pendingBookingsUsePendingBlockedState() {
        stubResource(resource, List.of(booking(resource, Booking.Status.PENDING, 13, 14)));

        AvailabilityResponseDTO response =
                service.getResourceAvailability(resource.getId(), windowStart, windowEnd);

        assertThat(slotAt(response, 13, 30).getStatus()).isEqualTo(SlotStatus.PENDING);
    }

    @Test
    void activeOfferUsesPrivacySafeTemporaryHoldState() {
        stubResource(resource, List.of());
        when(waitlistService.hasActiveOfferConflict(
                org.mockito.ArgumentMatchers.eq(resource.getId()),
                org.mockito.ArgumentMatchers.any(LocalDateTime.class),
                org.mockito.ArgumentMatchers.any(LocalDateTime.class),
                org.mockito.ArgumentMatchers.any(LocalDateTime.class)))
                .thenAnswer(invocation -> ((LocalDateTime) invocation.getArgument(1)).getHour() == 15);

        AvailabilityResponseDTO response =
                service.getResourceAvailability(resource.getId(), windowStart, windowEnd);

        assertThat(slotAt(response, 15, 0).getStatus()).isEqualTo(SlotStatus.HELD);
        assertThat(slotAt(response, 15, 0).getLabel()).isEqualTo("Temporarily held");
    }

    @Test
    void historicalNonBlockingStatusesDoNotBlockSlots() {
        stubResource(resource, List.of(
                booking(resource, Booking.Status.CANCELLED, 9, 10),
                booking(resource, Booking.Status.REJECTED, 10, 11),
                booking(resource, Booking.Status.COMPLETED, 11, 12)));

        AvailabilityResponseDTO response =
                service.getResourceAvailability(resource.getId(), windowStart, windowEnd);

        assertThat(slotAt(response, 9, 0).getStatus()).isEqualTo(SlotStatus.AVAILABLE);
        assertThat(slotAt(response, 10, 0).getStatus()).isEqualTo(SlotStatus.AVAILABLE);
        assertThat(slotAt(response, 11, 0).getStatus()).isEqualTo(SlotStatus.AVAILABLE);
    }

    @Test
    void maintenanceResourceMarksEveryDisplayedSlotAsMaintenance() {
        resource.setStatus(Resource.Status.MAINTENANCE);
        stubResource(resource, List.of());

        AvailabilityResponseDTO response =
                service.getResourceAvailability(resource.getId(), windowStart, windowEnd);

        assertThat(response.getSlots()).allMatch(slot -> slot.getStatus() == SlotStatus.MAINTENANCE);
    }

    @Test
    void invalidResourceReturnsNotFound() {
        when(resourceRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getResourceAvailability(404L, windowStart, windowEnd))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void responseDoesNotExposeBookingOwnerOrPrivateStudentData() throws Exception {
        User privateOwner = User.builder()
                .id(77L)
                .username("private_student")
                .email("private@campus.edu")
                .build();
        Booking privateBooking = booking(resource, Booking.Status.APPROVED, 9, 10);
        privateBooking.setUser(privateOwner);
        stubResource(resource, List.of(privateBooking));

        AvailabilityResponseDTO response =
                service.getResourceAvailability(resource.getId(), windowStart, windowEnd);
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        String json = mapper.writeValueAsString(response);

        assertThat(json)
                .doesNotContain("private_student")
                .doesNotContain("private@campus.edu")
                .doesNotContain("userId")
                .doesNotContain("groupMembers");
    }

    @Test
    void kitSlotIsAvailableOnlyWhenEveryResourceIsFree() {
        Resource camera = resource(4L, "Camera", Resource.Status.AVAILABLE);
        Resource tripod = resource(5L, "Tripod", Resource.Status.AVAILABLE);
        Kit kit = kit(camera, tripod);
        when(kitRepository.findByIdWithResources(1L)).thenReturn(Optional.of(kit));
        when(bookingRepository.findOverlappingBookings(4L, windowStart, windowEnd))
                .thenReturn(List.of());
        when(bookingRepository.findOverlappingBookings(5L, windowStart, windowEnd))
                .thenReturn(List.of(booking(tripod, Booking.Status.APPROVED, 10, 11)));

        AvailabilityResponseDTO response =
                service.getKitAvailability(1L, windowStart, windowEnd);

        assertThat(slotAt(response, 9, 0).getStatus()).isEqualTo(SlotStatus.AVAILABLE);
        assertThat(slotAt(response, 10, 0).getStatus()).isEqualTo(SlotStatus.BOOKED);
    }

    @Test
    void oneMaintainedResourceMakesKitUnavailable() {
        Resource camera = resource(4L, "Camera", Resource.Status.AVAILABLE);
        Resource tripod = resource(5L, "Tripod", Resource.Status.MAINTENANCE);
        Kit kit = kit(camera, tripod);
        when(kitRepository.findByIdWithResources(1L)).thenReturn(Optional.of(kit));
        when(bookingRepository.findOverlappingBookings(4L, windowStart, windowEnd))
                .thenReturn(List.of());
        when(bookingRepository.findOverlappingBookings(5L, windowStart, windowEnd))
                .thenReturn(List.of());

        AvailabilityResponseDTO response =
                service.getKitAvailability(1L, windowStart, windowEnd);

        assertThat(response.getOperationalStatus()).isEqualTo("UNAVAILABLE");
        assertThat(response.getSlots()).allMatch(slot -> slot.getStatus() == SlotStatus.MAINTENANCE);
    }

    private void stubResource(Resource target, List<Booking> bookings) {
        when(resourceRepository.findById(target.getId())).thenReturn(Optional.of(target));
        when(bookingRepository.findOverlappingBookings(target.getId(), windowStart, windowEnd))
                .thenReturn(bookings);
    }

    private Resource resource(Long id, String name, Resource.Status status) {
        return Resource.builder()
                .id(id)
                .name(name)
                .type("EQUIPMENT")
                .description("Demo resource")
                .status(status)
                .build();
    }

    private Booking booking(Resource target, Booking.Status status, int startHour, int endHour) {
        return Booking.builder()
                .resource(target)
                .startTime(day.atTime(startHour, 0))
                .endTime(day.atTime(endHour, 0))
                .status(status)
                .build();
    }

    private Kit kit(Resource... resources) {
        return Kit.builder()
                .id(1L)
                .name("Media Kit")
                .description("Demo kit")
                .resources(new LinkedHashSet<>(Set.of(resources)))
                .build();
    }

    private SlotDTO slotAt(AvailabilityResponseDTO response, int hour, int minute) {
        LocalDateTime target = day.atTime(hour, minute);
        return response.getSlots().stream()
                .filter(slot -> slot.getStartTime().equals(target))
                .findFirst()
                .orElseThrow();
    }
}
