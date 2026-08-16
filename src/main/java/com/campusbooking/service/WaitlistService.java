package com.campusbooking.service;

import com.campusbooking.dto.WaitlistRequestDTO;
import com.campusbooking.dto.WaitlistResponseDTO;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.model.Waitlist;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import com.campusbooking.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Business logic layer for waitlist operations.
 *
 * <h3>Queue ordering</h3>
 * Entries are stored with a {@code request_time} timestamp (set automatically
 * by {@link org.hibernate.annotations.CreationTimestamp}).  All queue reads
 * use {@code ORDER BY request_time ASC}, ensuring FIFO promotion.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;
    private final UserRepository     userRepository;
    private final ResourceRepository resourceRepository;

    // ── Join ──────────────────────────────────────────────────────────────────

    /**
     * Adds a user to the waitlist for a specific resource.
     *
     * <h4>Validation sequence</h4>
     * <ol>
     *   <li>User must exist.</li>
     *   <li>Resource must exist.</li>
     *   <li>User must not already have an active {@code WAITING} entry for the resource.</li>
     * </ol>
     *
     * @param request DTO containing {@code userId} and {@code resourceId}
     * @return {@link WaitlistResponseDTO} representing the newly created entry
     * @throws ResponseStatusException {@code 404} if user or resource not found;
     *                                 {@code 409} if user is already on the waitlist
     */
    @Transactional
    public WaitlistResponseDTO joinWaitlist(WaitlistRequestDTO request) {

        // 1. Resolve user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with id: " + request.getUserId()));

        // 2. Resolve resource
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resource not found with id: " + request.getResourceId()));

        // 3. Prevent duplicate WAITING entries
        if (waitlistRepository.existsByUserIdAndResourceIdAndStatus(
                user.getId(), resource.getId(), Waitlist.Status.WAITING)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "User " + user.getId() + " is already on the waitlist for resource " + resource.getId());
        }

        // 4. Persist the waitlist entry (request_time set by @CreationTimestamp)
        Waitlist entry = Waitlist.builder()
                .user(user)
                .resource(resource)
                .status(Waitlist.Status.WAITING)
                .build();

        Waitlist saved = waitlistRepository.save(entry);
        return WaitlistResponseDTO.from(saved);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Retrieves the full waitlist queue for a resource, ordered chronologically
     * (oldest request first = highest priority).
     *
     * @param resourceId the ID of the resource
     * @return list of all waitlist entries for the resource (any status), oldest first
     */
    public List<WaitlistResponseDTO> getWaitlistByResource(Long resourceId) {
        return waitlistRepository.findByResourceId(resourceId)
                .stream()
                .map(WaitlistResponseDTO::from)
                .toList();
    }

    /**
     * Retrieves all waitlist entries submitted by a specific user.
     *
     * @param userId the ID of the user
     * @return list of that user's waitlist entries
     */
    public List<WaitlistResponseDTO> getWaitlistByUser(Long userId) {
        return waitlistRepository.findByUserId(userId)
                .stream()
                .map(WaitlistResponseDTO::from)
                .toList();
    }
}
