package com.campusbooking.controller;

import com.campusbooking.model.Resource;
import com.campusbooking.dto.AvailabilityResponseDTO;
import com.campusbooking.service.AvailabilityService;
import com.campusbooking.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST controller exposing read and admin-write endpoints for campus {@link Resource} data.
 *
 * <pre>
 * GET    /api/resources              – All resources (regardless of status)
 * GET    /api/resources/available    – Only AVAILABLE resources
 * POST   /api/resources              – Admin: add a new resource
 * PUT    /api/resources/{id}         – Admin: update an existing resource
 * DELETE /api/resources/{id}         – Admin: delete a resource
 * PATCH  /api/resources/{id}/status  – Admin: quick status toggle
 * </pre>
 */
@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;
    private final AvailabilityService availabilityService;

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Returns a list of all campus resources.
     *
     * <p>HTTP 200 OK with an empty array if no resources exist.</p>
     *
     * @return {@code 200 OK} – list of all {@link Resource} objects
     */
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        List<Resource> resources = resourceService.getAllResources();
        return ResponseEntity.ok(resources);
    }

    /**
     * Returns only resources that have status {@code AVAILABLE}.
     *
     * <p>HTTP 200 OK with an empty array if none are currently available.</p>
     *
     * @return {@code 200 OK} – list of available {@link Resource} objects
     */
    @GetMapping("/available")
    public ResponseEntity<List<Resource>> getAvailableResources() {
        List<Resource> available = resourceService.getAvailableResources();
        return ResponseEntity.ok(available);
    }

    /** Returns a privacy-safe slot schedule that follows the booking conflict rules. */
    @GetMapping("/{id}/availability")
    public ResponseEntity<AvailabilityResponseDTO> getAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(availabilityService.getResourceAvailability(id, start, end));
    }

    // ── Admin: Create ─────────────────────────────────────────────────────────

    /**
     * Admin endpoint: adds a new campus resource (room, lab, equipment, etc.).
     *
     * <ul>
     *   <li>{@code 201 Created}     – resource saved; returns the persisted entity</li>
     *   <li>{@code 400 Bad Request} – missing required fields or constraint violation</li>
     * </ul>
     *
     * <p>Example request body:
     * <pre>{@code
     * {
     *   "name": "Room B202",
     *   "type": "ROOM",
     *   "description": "Lecture hall for 60 students",
     *   "status": "AVAILABLE"
     * }
     * }</pre>
     * </p>
     *
     * @param resource the resource payload to persist
     * @return {@code 201 Created} with the saved resource (including generated id)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> createResource(@Valid @RequestBody Resource resource) {
        Resource saved = resourceService.createResource(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ── Admin: Update ─────────────────────────────────────────────────────────

    /**
     * Admin endpoint: fully updates an existing resource.
     *
     * <ul>
     *   <li>{@code 200 OK}        – resource updated; returns the updated entity</li>
     *   <li>{@code 404 Not Found} – no resource with the given id</li>
     * </ul>
     *
     * @param id      path variable identifying the resource to update
     * @param updated request body with the new field values
     * @return {@code 200 OK} with the updated resource
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody Resource updated) {

        Resource result = resourceService.updateResource(id, updated);
        return ResponseEntity.ok(result);
    }

    // ── Admin: Delete ─────────────────────────────────────────────────────────

    /**
     * Admin endpoint: permanently deletes a resource.
     *
     * <ul>
     *   <li>{@code 204 No Content} – resource deleted successfully</li>
     *   <li>{@code 404 Not Found}  – no resource with the given id</li>
     * </ul>
     *
     * @param id the ID of the resource to delete
     * @return {@code 204 No Content}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }

    // ── Admin: Patch status ───────────────────────────────────────────────────

    /**
     * Admin endpoint: quick-toggles the status of a resource without affecting
     * other fields.  Typically used to put a resource into {@code MAINTENANCE}
     * or restore it to {@code AVAILABLE}.
     *
     * <ul>
     *   <li>{@code 200 OK}        – status updated; returns the updated resource</li>
     *   <li>{@code 400 Bad Request} – unknown status value</li>
     *   <li>{@code 404 Not Found} – no resource with the given id</li>
     * </ul>
     *
     * <p>Example request body:
     * <pre>{@code
     * { "status": "MAINTENANCE" }
     * }</pre>
     * </p>
     *
     * @param id   the ID of the resource to update
     * @param body a JSON object with a single {@code "status"} key
     * @return {@code 200 OK} with the updated resource
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> patchStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Resource.Status newStatus;
        try {
            newStatus = Resource.Status.valueOf(body.get("status"));
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.badRequest().build();
        }

        Resource result = resourceService.patchStatus(id, newStatus);
        return ResponseEntity.ok(result);
    }
}
