package com.campusbooking.service;

import com.campusbooking.model.Resource;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private KitRepository kitRepository;

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

    @Test
    @DisplayName("Resource deletion is blocked when the resource belongs to a Kit")
    void deleteResource_inKitIsRejected() {
        given(resourceRepository.existsById(1L)).willReturn(true);
        given(kitRepository.existsContainingResource(1L)).willReturn(true);

        assertThatThrownBy(() -> resourceService.deleteResource(1L))
                .hasMessageContaining("409")
                .hasMessageContaining("Project Kit");
    }

    @Test
    @DisplayName("Resource deletion is blocked when booking history exists")
    void deleteResource_withHistoryIsRejected() {
        given(resourceRepository.existsById(1L)).willReturn(true);
        given(bookingRepository.existsByResourceId(1L)).willReturn(true);

        assertThatThrownBy(() -> resourceService.deleteResource(1L))
                .hasMessageContaining("409")
                .hasMessageContaining("history");
    }
}
