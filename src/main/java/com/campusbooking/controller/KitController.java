package com.campusbooking.controller;

import com.campusbooking.dto.AvailabilityResponseDTO;
import com.campusbooking.dto.KitBookingRequestDTO;
import com.campusbooking.dto.KitBookingResponseDTO;
import com.campusbooking.dto.KitCreateRequestDTO;
import com.campusbooking.dto.KitResponseDTO;
import com.campusbooking.service.AvailabilityService;
import com.campusbooking.service.KitBookingService;
import com.campusbooking.service.KitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST controller for Pre-Configured Resource Bundles / Project Kits.
 *
 * <pre>
 * GET  /api/kits              – Retrieve all available project kits
 * GET  /api/kits/{id}         – Retrieve a single kit with its bundled items
 * POST /api/kits              – Admin creation of a Kit definition
 * DELETE /api/kits/{id}       – Admin deletion of an unreferenced Kit
 * POST /api/kits/{kitId}/book – One-click atomic reservation for an entire kit
 * </pre>
 */
@RestController
@RequestMapping("/api/kits")
@RequiredArgsConstructor
public class KitController {

    private final KitService kitService;
    private final KitBookingService kitBookingService;
    private final AvailabilityService availabilityService;

    /** Creates one Project Kit with its selected resources atomically. */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KitResponseDTO> create(@Valid @RequestBody KitCreateRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kitService.create(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        kitService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retrieves all project kits configured in the system.
     *
     * @return {@code 200 OK} with a list of {@link KitResponseDTO}
     */
    @GetMapping
    public ResponseEntity<List<KitResponseDTO>> getAllKits() {
        List<KitResponseDTO> kits = kitService.getAllKits();
        return ResponseEntity.ok(kits);
    }

    /**
     * Retrieves details and bundled items for a specific kit.
     *
     * @param id the ID of the kit
     * @return {@code 200 OK} with {@link KitResponseDTO}
     */
    @GetMapping("/{id}")
    public ResponseEntity<KitResponseDTO> getKitById(@PathVariable Long id) {
        KitResponseDTO kit = kitService.getKitById(id);
        return ResponseEntity.ok(kit);
    }

    /** Returns the intersection of availability for every resource in the kit. */
    @GetMapping("/{id}/availability")
    public ResponseEntity<AvailabilityResponseDTO> getAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(availabilityService.getKitAvailability(id, start, end));
    }

    /**
     * Atomically reserves all resources bundled inside the specified kit.
     *
     * <ul>
     *   <li>{@code 201 Created}     – all items reserved; returns one {@link KitBookingResponseDTO}</li>
     *   <li>{@code 400 Bad Request} – invalid time window (past start, end ≤ start)</li>
     *   <li>{@code 404 Not Found}   – kit or user does not exist</li>
     *   <li>{@code 409 Conflict}    – any single bundled item is in maintenance or already booked</li>
     * </ul>
     *
     * @param kitId   the ID of the kit to reserve
     * @param request the kit booking request body
     * @return {@code 201 Created} with the parent Kit reservation
     */
    @PostMapping("/{kitId}/book")
    @PreAuthorize("hasRole('ADMIN') or @apiAuthorization.isSelf(#request.userId, authentication)")
    public ResponseEntity<KitBookingResponseDTO> bookKit(
            @PathVariable Long kitId,
            @Valid @RequestBody KitBookingRequestDTO request) {

        KitBookingResponseDTO booking = kitBookingService.create(kitId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }
}
