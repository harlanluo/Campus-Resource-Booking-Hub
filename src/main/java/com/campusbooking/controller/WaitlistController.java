package com.campusbooking.controller;

import com.campusbooking.dto.WaitlistRequestDTO;
import com.campusbooking.dto.WaitlistResponseDTO;
import com.campusbooking.service.WaitlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for campus resource waitlist operations.
 *
 * <pre>
 * POST /api/waitlists                           – Join the waitlist for a resource
 * GET  /api/waitlists/resource/{resourceId}     – View the waitlist queue for a resource
 * </pre>
 */
@RestController
@RequestMapping("/api/waitlists")
@RequiredArgsConstructor
public class WaitlistController {

    private final WaitlistService waitlistService;

    /**
     * Adds the requesting user to the waitlist for a specific resource.
     *
     * <ul>
     *   <li>{@code 201 Created}   – entry saved; returns {@link WaitlistResponseDTO}</li>
     *   <li>{@code 404 Not Found} – user or resource does not exist</li>
     *   <li>{@code 409 Conflict}  – user is already on the waitlist for this resource</li>
     * </ul>
     *
     * <p>Example request body:
     * <pre>{@code
     * {
     *   "userId":     1,
     *   "resourceId": 2
     * }
     * }</pre>
     * </p>
     *
     * @param request the waitlist join payload (validated via Bean Validation)
     * @return {@code 201 Created} with the persisted waitlist entry details
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or @apiAuthorization.isSelf(#request.userId, authentication)")
    public ResponseEntity<WaitlistResponseDTO> joinWaitlist(
            @Valid @RequestBody WaitlistRequestDTO request) {

        WaitlistResponseDTO response = waitlistService.joinWaitlist(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves the complete waitlist queue for a given resource, in
     * chronological order (oldest request = front of queue).
     *
     * <ul>
     *   <li>{@code 200 OK} – returns list of {@link WaitlistResponseDTO} (may be empty)</li>
     * </ul>
     *
     * @param resourceId the ID of the resource whose waitlist is requested
     * @return {@code 200 OK} with the ordered list of waitlist entries
     */
    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<List<WaitlistResponseDTO>> getWaitlistByResource(
            @PathVariable Long resourceId) {

        List<WaitlistResponseDTO> queue = waitlistService.getWaitlistByResource(resourceId);
        return ResponseEntity.ok(queue);
    }

    /**
     * Retrieves all waitlist entries for a specific user.
     *
     * @param userId the ID of the user
     * @return {@code 200 OK} with a list of {@link WaitlistResponseDTO}
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or @apiAuthorization.isSelf(#userId, authentication)")
    public ResponseEntity<List<WaitlistResponseDTO>> getWaitlistByUser(
            @PathVariable Long userId) {

        List<WaitlistResponseDTO> list = waitlistService.getWaitlistByUser(userId);
        return ResponseEntity.ok(list);
    }
}
