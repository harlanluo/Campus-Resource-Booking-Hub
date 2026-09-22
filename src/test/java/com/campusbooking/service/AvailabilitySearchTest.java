package com.campusbooking.service;

import com.campusbooking.dto.AvailabilitySearchResponseDTO;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Kit;
import com.campusbooking.model.Resource;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.ResourceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.assertj.core.api.ThrowableAssert;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvailabilitySearchTest {

    @Mock private ResourceRepository resourceRepository;
    @Mock private KitRepository kitRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private WaitlistService waitlistService;

    private AvailabilityService service;
    private LocalDateTime start;
    private LocalDateTime end;
    private Resource room;
    private Resource lab;
    private Resource camera;

    @BeforeEach
    void setUp() {
        service = new AvailabilityService(resourceRepository, kitRepository, bookingRepository, waitlistService);
        start = LocalDate.now().plusDays(2).atTime(9, 0);
        end = start.plusHours(2);
        room = resource(1L, "Study Room A", "ROOM", 6, Resource.Status.AVAILABLE);
        lab = resource(2L, "Computer Lab 101", "LAB", 30, Resource.Status.AVAILABLE);
        camera = resource(3L, "DSLR 4K Camera", "EQUIPMENT", null, Resource.Status.AVAILABLE);
        lenient().when(bookingRepository.findOverlappingBookingsForResources(anyList(), any(), any()))
                .thenReturn(List.of());
        lenient().when(waitlistService.getResourceIdsWithActiveOfferConflicts(anyCollection(), any(), any(), any()))
                .thenReturn(Set.of());
    }

    @Test
    void validIntervalReturnsAvailableRoomAndReadyKitWithSafeFields() {
        Kit kit = kit(42L, "Media Production Kit", Set.of(camera));
        when(resourceRepository.findAll()).thenReturn(List.of(room, lab, camera));
        when(kitRepository.findAllWithResources()).thenReturn(List.of(kit));

        AvailabilitySearchResponseDTO response = service.searchAvailable(start, end, "ANY", null, null);

        assertThat(response.getStartTime()).isEqualTo(start);
        assertThat(response.getEndTime()).isEqualTo(end);
        assertThat(response.getResults()).extracting(AvailabilitySearchResponseDTO.ResultDTO::getName)
                .contains("Study Room A", "Computer Lab 101", "DSLR 4K Camera", "Media Production Kit");
        AvailabilitySearchResponseDTO.ResultDTO kitResult = response.getResults().stream()
                .filter(result -> result.getTargetType().equals("KIT")).findFirst().orElseThrow();
        assertThat(kitResult.getIncludedResourceCount()).isEqualTo(1);
        assertThat(kitResult.getReadiness()).isEqualTo("READY");
        assertThat(kitResult.getClass().getDeclaredFields())
                .extracting(java.lang.reflect.Field::getName)
                .doesNotContain("username", "userId", "email", "groupMembers", "bookingOwner");
    }

    @Test
    void roomCapacityFilterExcludesSmallAndNullCapacityButDoesNotFilterKits() {
        Resource smallRoom = resource(4L, "Small Room", "ROOM", 2, Resource.Status.AVAILABLE);
        Resource unknownRoom = resource(5L, "Unknown Room", "ROOM", null, Resource.Status.AVAILABLE);
        Kit kit = kit(42L, "Camera Kit", Set.of(camera));
        when(resourceRepository.findAll()).thenReturn(List.of(room, smallRoom, unknownRoom, camera));
        when(kitRepository.findAllWithResources()).thenReturn(List.of(kit));

        AvailabilitySearchResponseDTO response = service.searchAvailable(start, end, "ANY", 4, null);

        assertThat(response.getResults()).extracting(AvailabilitySearchResponseDTO.ResultDTO::getName)
                .contains("Study Room A", "DSLR 4K Camera", "Camera Kit")
                .doesNotContain("Small Room", "Unknown Room");
    }

    @Test
    void roomLabAndEquipmentCategoriesReturnOnlyTheirMatchingResourceTypes() {
        when(resourceRepository.findAll()).thenReturn(List.of(room, lab, camera));

        assertThat(service.searchAvailable(start, end, "ROOM", null, null).getResults())
                .extracting(AvailabilitySearchResponseDTO.ResultDTO::getType).containsOnly("ROOM");
        assertThat(service.searchAvailable(start, end, "LAB", null, null).getResults())
                .extracting(AvailabilitySearchResponseDTO.ResultDTO::getType).containsOnly("LAB");
        AvailabilitySearchResponseDTO equipment = service.searchAvailable(start, end, "EQUIPMENT", 20, null);
        assertThat(equipment.getResults()).extracting(AvailabilitySearchResponseDTO.ResultDTO::getName)
                .containsOnly("DSLR 4K Camera");
        assertThat(equipment.getResults().get(0).getCapacity()).isNull();
    }

    @ParameterizedTest
    @EnumSource(value = Booking.Status.class, names = {"PENDING", "APPROVED", "CONFIRMED"})
    void activeBookingStatusesBlockAvailability(Booking.Status status) {
        when(resourceRepository.findAll()).thenReturn(List.of(room));
        Booking booking = booking(room, status);
        when(bookingRepository.findOverlappingBookingsForResources(anyList(), eq(start), eq(end)))
                .thenReturn(List.of(booking));

        assertThat(service.searchAvailable(start, end, "ROOM", null, null).getResults()).isEmpty();
    }

    @ParameterizedTest
    @EnumSource(value = Booking.Status.class, names = {"CANCELLED", "REJECTED", "COMPLETED"})
    void closedBookingStatusesDoNotBlockAvailability(Booking.Status status) {
        when(resourceRepository.findAll()).thenReturn(List.of(room));
        Booking booking = booking(room, status);
        when(bookingRepository.findOverlappingBookingsForResources(anyList(), eq(start), eq(end)))
                .thenReturn(List.of(booking));

        assertThat(service.searchAvailable(start, end, "ROOM", null, null).getResults())
                .extracting(AvailabilitySearchResponseDTO.ResultDTO::getName).containsOnly("Study Room A");
    }

    @Test
    void maintenanceAndActiveWaitlistOfferAreExcluded() {
        Resource maintained = resource(9L, "Maintained Room", "ROOM", 8, Resource.Status.MAINTENANCE);
        when(resourceRepository.findAll()).thenReturn(List.of(room, maintained));
        when(waitlistService.getResourceIdsWithActiveOfferConflicts(anyCollection(), eq(start), eq(end), any()))
                .thenReturn(Set.of(room.getId()));

        assertThat(service.searchAvailable(start, end, "ROOM", null, null).getResults()).isEmpty();
    }

    @Test
    void kitIsExcludedWhenOneChildIsUnavailableOrConflicting() {
        Resource secondChild = resource(10L, "Tripod", "EQUIPMENT", null, Resource.Status.AVAILABLE);
        Kit kit = kit(42L, "Media Production Kit", new LinkedHashSet<>(List.of(camera, secondChild)));
        when(kitRepository.findAllWithResources()).thenReturn(List.of(kit));
        when(waitlistService.getResourceIdsWithActiveOfferConflicts(anyCollection(), any(), any(), any()))
                .thenReturn(Set.of(secondChild.getId()));

        AvailabilitySearchResponseDTO held = service.searchAvailable(start, end, "KIT", null, null);
        assertThat(held.getResults()).isEmpty();

        when(waitlistService.getResourceIdsWithActiveOfferConflicts(anyCollection(), any(), any(), any()))
                .thenReturn(Set.of());
        when(bookingRepository.findOverlappingBookingsForResources(anyList(), eq(start), eq(end)))
                .thenReturn(List.of(booking(secondChild, Booking.Status.PENDING)));
        assertThat(service.searchAvailable(start, end, "KIT", null, null).getResults()).isEmpty();

        Resource maintainedChild = resource(10L, "Tripod", "EQUIPMENT", null, Resource.Status.MAINTENANCE);
        when(kitRepository.findAllWithResources()).thenReturn(List.of(
                kit(42L, "Media Production Kit", new LinkedHashSet<>(List.of(camera, maintainedChild)))));
        lenient().when(waitlistService.getResourceIdsWithActiveOfferConflicts(anyCollection(), any(), any(), any()))
                .thenReturn(Set.of());
        assertThat(service.searchAvailable(start, end, "KIT", null, null).getResults()).isEmpty();
    }

    @Test
    void invalidIntervalsPastTimesCategoryAndCapacityAreRejected() {
        assertBadRequest(() -> service.searchAvailable(null, end, "ANY", null, null));
        assertBadRequest(() -> service.searchAvailable(start, start, "ANY", null, null));
        assertBadRequest(() -> service.searchAvailable(start, start.minusMinutes(1), "ANY", null, null));
        assertBadRequest(() -> service.searchAvailable(LocalDateTime.now().minusHours(1),
                LocalDateTime.now().plusHours(1), "ANY", null, null));
        assertBadRequest(() -> service.searchAvailable(start, end, "BUILDING", null, null));
        assertBadRequest(() -> service.searchAvailable(start, end, "ANY", 0, null));
    }

    private void assertBadRequest(ThrowableAssert.ThrowingCallable request) {
        assertThatThrownBy(request).isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode").isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private Resource resource(Long id, String name, String type, Integer capacity, Resource.Status status) {
        return Resource.builder().id(id).name(name).type(type).capacity(capacity)
                .description(name + " description").location(type.equals("ROOM") ? "Library" : "Equipment Desk")
                .status(status).build();
    }

    private Kit kit(Long id, String name, Set<Resource> resources) {
        return Kit.builder().id(id).name(name).description("Student project purpose")
                .resources(resources).build();
    }

    private Booking booking(Resource target, Booking.Status status) {
        return Booking.builder().resource(target).status(status).startTime(start).endTime(end).build();
    }
}
