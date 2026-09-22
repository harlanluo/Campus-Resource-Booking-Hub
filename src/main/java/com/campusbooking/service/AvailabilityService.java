package com.campusbooking.service;

import com.campusbooking.dto.AvailabilityResponseDTO;
import com.campusbooking.dto.AvailabilityResponseDTO.SlotDTO;
import com.campusbooking.dto.AvailabilityResponseDTO.SlotStatus;
import com.campusbooking.dto.AvailabilitySearchResponseDTO;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Kit;
import com.campusbooking.model.Resource;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;

/** Builds privacy-safe bookability schedules using the existing conflict query. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AvailabilityService {

    public static final LocalTime OPENING_TIME = LocalTime.of(8, 0);
    public static final LocalTime CLOSING_TIME = LocalTime.of(20, 0);
    public static final int INTERVAL_MINUTES = 30;
    private static final long MAX_WINDOW_DAYS = 14;

    private final ResourceRepository resourceRepository;
    private final KitRepository kitRepository;
    private final BookingRepository bookingRepository;
    private final WaitlistService waitlistService;

    @Transactional
    public AvailabilityResponseDTO getResourceAvailability(
            Long resourceId, LocalDateTime start, LocalDateTime end) {
        validateWindow(start, end);
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Resource not found with id: " + resourceId));

        waitlistService.processExpiredOffersForResource(resourceId, LocalDateTime.now());

        List<Booking> conflicts = bookingRepository.findOverlappingBookings(resourceId, start, end);
        List<SlotDTO> slots = buildSlots(start, end, List.of(resource), Map.of(resourceId, conflicts));

        return AvailabilityResponseDTO.builder()
                .targetType("RESOURCE")
                .targetId(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .description(resource.getDescription())
                .operationalStatus(resource.getStatus().name())
                .resourceCount(1)
                .windowStart(start)
                .windowEnd(end)
                .openingTime(OPENING_TIME)
                .closingTime(CLOSING_TIME)
                .intervalMinutes(INTERVAL_MINUTES)
                .slots(slots)
                .build();
    }

    @Transactional
    public AvailabilityResponseDTO getKitAvailability(
            Long kitId, LocalDateTime start, LocalDateTime end) {
        validateWindow(start, end);
        Kit kit = kitRepository.findByIdWithResources(kitId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Kit not found with id: " + kitId));

        List<Resource> resources = kit.getResources() == null
                ? List.of()
                : kit.getResources().stream()
                        .sorted(Comparator.comparing(Resource::getId))
                        .toList();
        if (resources.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Kit '" + kit.getName() + "' contains no bundled resources.");
        }

        Map<Long, List<Booking>> conflictsByResource = new HashMap<>();
        for (Resource resource : resources) {
            waitlistService.processExpiredOffersForResource(resource.getId(), LocalDateTime.now());
            conflictsByResource.put(
                    resource.getId(),
                    bookingRepository.findOverlappingBookings(resource.getId(), start, end));
        }

        boolean operational = resources.stream()
                .allMatch(resource -> resource.getStatus() == Resource.Status.AVAILABLE);

        return AvailabilityResponseDTO.builder()
                .targetType("KIT")
                .targetId(kit.getId())
                .name(kit.getName())
                .type("PROJECT_KIT")
                .description(kit.getDescription())
                .operationalStatus(operational ? "AVAILABLE" : "UNAVAILABLE")
                .resourceCount(resources.size())
                .windowStart(start)
                .windowEnd(end)
                .openingTime(OPENING_TIME)
                .closingTime(CLOSING_TIME)
                .intervalMinutes(INTERVAL_MINUTES)
                .slots(buildSlots(start, end, resources, conflictsByResource))
                .build();
    }

    /** Searches operationally available resources and Kits for one exact future interval. */
    @Transactional
    public AvailabilitySearchResponseDTO searchAvailable(
            LocalDateTime start,
            LocalDateTime end,
            String requestedType,
            Integer minCapacity,
            String keyword) {
        validateWindow(start, end);
        LocalDateTime now = LocalDateTime.now();
        if (!start.isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "start must be in the future.");
        }
        if (minCapacity != null && minCapacity < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minCapacity must be positive.");
        }

        String type = requestedType == null || requestedType.isBlank()
                ? "ANY" : requestedType.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("ANY", "ROOM", "LAB", "EQUIPMENT", "KIT").contains(type)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "type must be ANY, ROOM, LAB, EQUIPMENT, or KIT.");
        }
        String query = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

        List<Resource> matchingResources = "KIT".equals(type)
                ? List.of()
                : resourceRepository.findAll().stream()
                        .filter(resource -> matchesType(resource, type))
                        .filter(resource -> matchesCapacity(resource, type, minCapacity))
                        .filter(resource -> matchesKeyword(query, resource.getName(), resource.getType(),
                                resource.getDescription(), resource.getLocation()))
                        .toList();
        List<Kit> matchingKits = "ROOM".equals(type) || "LAB".equals(type) || "EQUIPMENT".equals(type)
                ? List.of()
                : kitRepository.findAllWithResources().stream()
                        .filter(kit -> matchesKeyword(query, kit.getName(), kit.getDescription()))
                        .toList();

        List<Resource> kitResources = matchingKits.stream()
                .flatMap(kit -> kit.getResources() == null ? java.util.stream.Stream.empty()
                        : kit.getResources().stream())
                .distinct()
                .toList();
        Set<Long> checkedIds = new HashSet<>();
        matchingResources.stream().map(Resource::getId).filter(id -> id != null).forEach(checkedIds::add);
        kitResources.stream().map(Resource::getId).filter(id -> id != null).forEach(checkedIds::add);
        List<Long> checkedResourceIds = checkedIds.stream().sorted().toList();

        Map<Long, List<Booking>> conflictsByResource = new HashMap<>();
        if (!checkedResourceIds.isEmpty()) {
            waitlistService.processExpiredOffersForResources(checkedResourceIds, now);
            bookingRepository.findOverlappingBookingsForResources(checkedResourceIds, start, end)
                    .forEach(booking -> conflictsByResource
                            .computeIfAbsent(booking.getResource().getId(), ignored -> new ArrayList<>())
                            .add(booking));
        }
        Set<Long> heldResourceIds = waitlistService.getResourceIdsWithActiveOfferConflicts(
                checkedResourceIds, start, end, now);
        Predicate<Long> held = heldResourceIds::contains;

        List<AvailabilitySearchResponseDTO.ResultDTO> results = new ArrayList<>();
        for (Resource resource : matchingResources) {
            if (determineStatus(start, end, now, List.of(resource), conflictsByResource, held)
                    == SlotStatus.AVAILABLE) {
                results.add(AvailabilitySearchResponseDTO.ResultDTO.builder()
                        .targetType("RESOURCE")
                        .id(resource.getId())
                        .name(resource.getName())
                        .type(resource.getType())
                        .description(resource.getDescription())
                        .location(resource.getLocation())
                        .capacity(resource.getCapacity())
                        .readiness("AVAILABLE")
                        .build());
            }
        }
        for (Kit kit : matchingKits) {
            List<Resource> resources = kit.getResources() == null ? List.of()
                    : kit.getResources().stream().sorted(Comparator.comparing(Resource::getId)).toList();
            if (!resources.isEmpty()
                    && determineStatus(start, end, now, resources, conflictsByResource, held)
                            == SlotStatus.AVAILABLE) {
                results.add(AvailabilitySearchResponseDTO.ResultDTO.builder()
                        .targetType("KIT")
                        .id(kit.getId())
                        .name(kit.getName())
                        .type("PROJECT_KIT")
                        .description(kit.getDescription())
                        .includedResourceCount(resources.size())
                        .readiness("READY")
                        .build());
            }
        }
        results.sort(Comparator.comparing(
                AvailabilitySearchResponseDTO.ResultDTO::getName, String.CASE_INSENSITIVE_ORDER));

        return AvailabilitySearchResponseDTO.builder()
                .startTime(start)
                .endTime(end)
                .results(results)
                .build();
    }

    private List<SlotDTO> buildSlots(
            LocalDateTime start,
            LocalDateTime end,
            List<Resource> resources,
            Map<Long, List<Booking>> conflictsByResource) {
        List<SlotDTO> slots = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDate day = start.toLocalDate();
        LocalDate lastDay = end.minusNanos(1).toLocalDate();

        while (!day.isAfter(lastDay)) {
            LocalDateTime cursor = day.atTime(OPENING_TIME);
            LocalDateTime dayEnd = day.atTime(CLOSING_TIME);
            while (cursor.isBefore(dayEnd)) {
                LocalDateTime slotEnd = cursor.plusMinutes(INTERVAL_MINUTES);
                if (!cursor.isBefore(start) && !slotEnd.isAfter(end)) {
                    SlotStatus status = determineStatus(
                            cursor, slotEnd, now, resources, conflictsByResource);
                    slots.add(SlotDTO.builder()
                            .startTime(cursor)
                            .endTime(slotEnd)
                            .status(status)
                            .label(labelFor(status))
                            .build());
                }
                cursor = slotEnd;
            }
            day = day.plusDays(1);
        }
        return slots;
    }

    private SlotStatus determineStatus(
            LocalDateTime slotStart,
            LocalDateTime slotEnd,
            LocalDateTime now,
            List<Resource> resources,
            Map<Long, List<Booking>> conflictsByResource) {
        return determineStatus(slotStart, slotEnd, now, resources, conflictsByResource,
                resourceId -> waitlistService.hasActiveOfferConflict(
                        resourceId, slotStart, slotEnd, now));
    }

    private SlotStatus determineStatus(
            LocalDateTime slotStart,
            LocalDateTime slotEnd,
            LocalDateTime now,
            List<Resource> resources,
            Map<Long, List<Booking>> conflictsByResource,
            Predicate<Long> heldOfferConflict) {
        if (!slotStart.isAfter(now)) {
            return SlotStatus.PAST;
        }
        if (resources.stream().anyMatch(resource -> resource.getStatus() == Resource.Status.MAINTENANCE)) {
            return SlotStatus.MAINTENANCE;
        }
        if (resources.stream().anyMatch(resource -> resource.getStatus() != Resource.Status.AVAILABLE)) {
            return SlotStatus.UNAVAILABLE;
        }

        boolean pending = false;
        for (Resource resource : resources) {
            for (Booking booking : conflictsByResource.getOrDefault(resource.getId(), List.of())) {
                if (booking.getStartTime().isBefore(slotEnd)
                        && booking.getEndTime().isAfter(slotStart)) {
                    if (booking.getStatus() == Booking.Status.PENDING) {
                        pending = true;
                    } else if (booking.getStatus() == Booking.Status.CONFIRMED
                            || booking.getStatus() == Booking.Status.APPROVED) {
                        return SlotStatus.BOOKED;
                    }
                }
            }
            if (heldOfferConflict.test(resource.getId())) {
                return SlotStatus.HELD;
            }
        }
        return pending ? SlotStatus.PENDING : SlotStatus.AVAILABLE;
    }

    private boolean matchesType(Resource resource, String requestedType) {
        return switch (requestedType) {
            case "ROOM", "LAB" -> requestedType.equalsIgnoreCase(resource.getType());
            case "EQUIPMENT" -> !"ROOM".equalsIgnoreCase(resource.getType())
                    && !"LAB".equalsIgnoreCase(resource.getType());
            default -> true;
        };
    }

    private boolean matchesCapacity(Resource resource, String requestedType, Integer minCapacity) {
        if (minCapacity == null || !("ANY".equals(requestedType)
                || "ROOM".equals(requestedType) || "LAB".equals(requestedType))) {
            return true;
        }
        if (!"ROOM".equalsIgnoreCase(resource.getType()) && !"LAB".equalsIgnoreCase(resource.getType())) {
            return true;
        }
        return resource.getCapacity() != null && resource.getCapacity() >= minCapacity;
    }

    private boolean matchesKeyword(String query, String... values) {
        if (query.isEmpty()) return true;
        for (String value : values) {
            if (value != null && value.toLowerCase(Locale.ROOT).contains(query)) return true;
        }
        return false;
    }

    private String labelFor(SlotStatus status) {
        return switch (status) {
            case AVAILABLE -> "Available";
            case BOOKED -> "Booked";
            case PENDING -> "Pending";
            case HELD -> "Temporarily held";
            case MAINTENANCE -> "Maintenance";
            case UNAVAILABLE -> "Unavailable";
            case PAST -> "Past";
        };
    }

    private void validateWindow(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "end must be after start.");
        }
        if (Duration.between(start, end).toDays() > MAX_WINDOW_DAYS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Availability window cannot exceed 14 days.");
        }
    }
}
