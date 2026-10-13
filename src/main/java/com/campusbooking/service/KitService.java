package com.campusbooking.service;

import com.campusbooking.dto.KitCreateRequestDTO;
import com.campusbooking.dto.KitResponseDTO;
import com.campusbooking.model.Kit;
import com.campusbooking.repository.KitBookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;

/**
 * Business logic layer for {@link Kit} (Resource Bundle) operations.
 *
 * Reservation lifecycle orchestration belongs to {@link KitBookingService};
 * this service manages the Project Kit catalogue and its definitions.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KitService {

    private final KitRepository kitRepository;

    private final ResourceRepository resourceRepository;
    private final KitBookingRepository kitBookingRepository;

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public KitResponseDTO create(KitCreateRequestDTO request) {
        String name = request.getName() == null ? "" : request.getName().trim();
        String description = request.getDescription() == null ? null : request.getDescription().trim();
        List<Long> ids = request.getResourceIds();
        if (name.isEmpty() || name.length() > 100 || (description != null && description.length() > 500)
                || ids == null || ids.isEmpty() || ids.stream().anyMatch(id -> id == null || id <= 0)
                || ids.stream().distinct().count() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a name, valid description and distinct resource IDs.");
        }
        if (kitRepository.existsByName(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A Project Kit with this name already exists.");
        }
        var resources = resourceRepository.findAllByIdForUpdate(ids.stream().sorted().toList());
        if (resources.size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more selected resources do not exist.");
        }
        Kit kit = kitRepository.saveAndFlush(Kit.builder().name(name).description(description)
                .resources(new HashSet<>(resources)).build());
        return KitResponseDTO.from(kit);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(Long id) {
        Kit kit = kitRepository.findByIdForUpdate(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Project Kit not found."));
        if (kitBookingRepository.existsByKitId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This Project Kit has booking history and cannot be deleted.");
        }
        kitRepository.delete(kit);
        kitRepository.flush();
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    /**
     * Retrieves all available project kits with their bundled items.
     *
     * @return list of {@link KitResponseDTO}
     */
    public List<KitResponseDTO> getAllKits() {
        return kitRepository.findAllWithResources()
                .stream()
                .map(KitResponseDTO::from)
                .toList();
    }

    /**
     * Retrieves a single kit by its ID.
     *
     * @param kitId the ID of the kit
     * @return the {@link KitResponseDTO}
     * @throws ResponseStatusException {@code 404} if the kit is not found
     */
    public KitResponseDTO getKitById(Long kitId) {
        Kit kit = kitRepository.findByIdWithResources(kitId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Kit not found with id: " + kitId));
        return KitResponseDTO.from(kit);
    }

}
