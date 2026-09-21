package com.campusbooking.service;

import com.campusbooking.dto.KitResponseDTO;
import com.campusbooking.model.Kit;
import com.campusbooking.repository.KitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Business logic layer for {@link Kit} (Resource Bundle) operations.
 *
 * Reservation lifecycle orchestration belongs to {@link KitBookingService};
 * this service exposes only the Project Kit catalogue.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KitService {

    private final KitRepository     kitRepository;

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
