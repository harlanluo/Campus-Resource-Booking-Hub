package com.campusbooking.service;

import com.campusbooking.model.Resource;
import com.campusbooking.repository.ResourceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private ResourceService resourceService;

    @Test
    @DisplayName("Admin maintenance toggle records manual maintenance")
    void patchMaintenance_marksResourceAsManual() {
        Resource resource = Resource.builder().id(1L).name("Room A").type("ROOM")
                .status(Resource.Status.AVAILABLE).build();
        given(resourceRepository.findById(1L)).willReturn(Optional.of(resource));
        given(resourceRepository.save(any(Resource.class))).willAnswer(inv -> inv.getArgument(0));

        Resource result = resourceService.patchStatus(1L, Resource.Status.MAINTENANCE);

        assertThat(result.getStatus()).isEqualTo(Resource.Status.MAINTENANCE);
        assertThat(result.isManualMaintenance()).isTrue();
    }

    @Test
    @DisplayName("Admin availability toggle clears manual maintenance")
    void patchAvailable_clearsManualMaintenance() {
        Resource resource = Resource.builder().id(1L).name("Room A").type("ROOM")
                .status(Resource.Status.MAINTENANCE).manualMaintenance(true).build();
        given(resourceRepository.findById(1L)).willReturn(Optional.of(resource));
        given(resourceRepository.save(any(Resource.class))).willAnswer(inv -> inv.getArgument(0));

        Resource result = resourceService.patchStatus(1L, Resource.Status.AVAILABLE);

        assertThat(result.getStatus()).isEqualTo(Resource.Status.AVAILABLE);
        assertThat(result.isManualMaintenance()).isFalse();
    }
}
