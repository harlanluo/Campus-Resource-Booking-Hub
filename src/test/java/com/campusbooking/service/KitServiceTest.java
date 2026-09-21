package com.campusbooking.service;

import com.campusbooking.dto.KitResponseDTO;
import com.campusbooking.model.Kit;
import com.campusbooking.model.Resource;
import com.campusbooking.repository.KitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class KitServiceTest {

    @Mock private KitRepository kitRepository;
    @InjectMocks private KitService kitService;
    private Kit kit;

    @BeforeEach
    void setUp() {
        Resource camera = Resource.builder().id(10L).name("Camera").type("EQUIPMENT")
                .status(Resource.Status.AVAILABLE).build();
        kit = Kit.builder().id(1L).name("Media Kit").description("Complete bundle")
                .resources(Set.of(camera)).build();
    }

    @Test
    @DisplayName("Lists configured Kits with bundled resources")
    void getAllKits_returnsDtos() {
        given(kitRepository.findAllWithResources()).willReturn(List.of(kit));
        List<KitResponseDTO> result = kitService.getAllKits();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Media Kit");
        assertThat(result.get(0).getItemCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Returns one configured Kit")
    void getKitById_returnsDto() {
        given(kitRepository.findByIdWithResources(1L)).willReturn(Optional.of(kit));
        assertThat(kitService.getKitById(1L).getName()).isEqualTo("Media Kit");
    }

    @Test
    @DisplayName("Missing Kit returns 404")
    void getKitById_missingReturns404() {
        given(kitRepository.findByIdWithResources(99L)).willReturn(Optional.empty());
        assertThatThrownBy(() -> kitService.getKitById(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }
}
