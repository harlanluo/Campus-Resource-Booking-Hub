package com.campusbooking.service;

import com.campusbooking.model.Resource;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Business logic layer for campus {@link Resource} operations.
 *
 * <p>All public methods are read-only transactions unless otherwise noted,
 * allowing Hibernate to skip dirty-checking and improve performance.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final KitRepository kitRepository;

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Returns every resource in the system regardless of status.
     *
     * @return unmodifiable list of all resources
     */
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    /**
     * Returns only resources that are currently {@link Resource.Status#AVAILABLE}.
     *
     * @return list of available resources (may be empty)
     */
    public List<Resource> getAvailableResources() {
        return resourceRepository.findByStatus(Resource.Status.AVAILABLE);
    }

    // ── Admin: Create ─────────────────────────────────────────────────────────

    /**
     * Persists a new campus resource.
     *
     * <p>The {@code name} field must be unique (enforced by the DB constraint).
     * Defaults {@code status} to {@link Resource.Status#AVAILABLE} if not provided.</p>
     *
     * @param resource the resource entity to persist (id should be null)
     * @return the saved resource with its generated id
     */
    @Transactional
    public Resource createResource(Resource resource) {
        if (resource.getStatus() == null) {
            resource.setStatus(Resource.Status.AVAILABLE);
        }
        resource.setManualMaintenance(resource.getStatus() == Resource.Status.MAINTENANCE);
        return resourceRepository.save(resource);
    }

    // ── Admin: Update ─────────────────────────────────────────────────────────

    /**
     * Updates all mutable fields of an existing resource.
     *
     * @param id      the ID of the resource to update
     * @param updated an object carrying the new field values
     * @return the updated resource after persistence
     * @throws ResponseStatusException {@code 404} if no resource exists with the given id
     */
    @Transactional
    public Resource updateResource(Long id, Resource updated) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resource not found with id: " + id));

        existing.setName(updated.getName());
        existing.setType(updated.getType());
        existing.setDescription(updated.getDescription());
        existing.setLocation(updated.getLocation());
        existing.setCapacity(updated.getCapacity());
        existing.setStatus(updated.getStatus());
        existing.setManualMaintenance(updated.getStatus() == Resource.Status.MAINTENANCE);

        return resourceRepository.save(existing);
    }

    // ── Admin: Delete ─────────────────────────────────────────────────────────

    /**
     * Deletes a resource by its ID.
     *
     * @param id the ID of the resource to delete
     * @throws ResponseStatusException {@code 404} if no resource exists with the given id
     */
    @Transactional
    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Resource not found with id: " + id);
        }
        if (kitRepository.existsContainingResource(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Resource cannot be deleted while it belongs to a Project Kit.");
        }
        if (bookingRepository.existsByResourceId(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Resource cannot be deleted because booking history exists.");
        }
        resourceRepository.deleteById(id);
    }

    // ── Admin: Patch status ───────────────────────────────────────────────────

    /**
     * Quickly toggles the status of a resource without touching any other fields.
     * Useful for toggling a resource into/out of {@code MAINTENANCE} mode.
     *
     * @param id        the ID of the resource to update
     * @param newStatus the desired new {@link Resource.Status}
     * @return the updated resource after persistence
     * @throws ResponseStatusException {@code 404} if no resource exists with the given id
     */
    @Transactional
    public Resource patchStatus(Long id, Resource.Status newStatus) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resource not found with id: " + id));

        existing.setStatus(newStatus);
        existing.setManualMaintenance(newStatus == Resource.Status.MAINTENANCE);
        return resourceRepository.save(existing);
    }
}
