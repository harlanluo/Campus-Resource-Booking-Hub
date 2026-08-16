package com.campusbooking.service;

import com.campusbooking.dto.WaitlistRequestDTO;
import com.campusbooking.dto.WaitlistResponseDTO;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.model.Waitlist;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import com.campusbooking.repository.WaitlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for {@link WaitlistService}.
 *
 * <p>All repository dependencies are mocked with Mockito so no Spring context
 * or database is required.  Each test group is nested under a descriptive
 * {@link Nested} class for readability.</p>
 */
@ExtendWith(MockitoExtension.class)
class WaitlistServiceTest {

    // ── Mocks ─────────────────────────────────────────────────────────────────

    @Mock
    private WaitlistRepository waitlistRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private WaitlistService waitlistService;

    // ── Shared test fixtures ──────────────────────────────────────────────────

    private User     testUser;
    private Resource testResource;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("alice_student")
                .email("alice@campus.edu")
                .password("secret")
                .role(User.Role.STUDENT)
                .build();

        testResource = Resource.builder()
                .id(2L)
                .name("Room A101")
                .type("ROOM")
                .description("Seminar room")
                .status(Resource.Status.AVAILABLE)
                .build();
    }

    /** Builds a {@link WaitlistRequestDTO} from the shared fixtures. */
    private WaitlistRequestDTO buildRequest() {
        WaitlistRequestDTO req = new WaitlistRequestDTO();
        req.setUserId(testUser.getId());
        req.setResourceId(testResource.getId());
        return req;
    }

    // =========================================================================
    // joinWaitlist — happy path
    // =========================================================================

    @Nested
    @DisplayName("joinWaitlist — success")
    class JoinWaitlistSuccess {

        @Test
        @DisplayName("Returns a WaitlistResponseDTO when user successfully joins the queue")
        void whenValidRequest_thenEntryIsSavedAndReturned() {
            // Arrange
            WaitlistRequestDTO request = buildRequest();

            given(userRepository.findById(testUser.getId()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(testResource.getId()))
                    .willReturn(Optional.of(testResource));
            given(waitlistRepository.existsByUserIdAndResourceIdAndStatus(
                    testUser.getId(), testResource.getId(), Waitlist.Status.WAITING))
                    .willReturn(false); // not already waiting

            Waitlist savedEntry = Waitlist.builder()
                    .id(10L)
                    .user(testUser)
                    .resource(testResource)
                    .requestTime(LocalDateTime.now())
                    .status(Waitlist.Status.WAITING)
                    .build();

            given(waitlistRepository.save(any(Waitlist.class)))
                    .willReturn(savedEntry);

            // Act
            WaitlistResponseDTO response = waitlistService.joinWaitlist(request);

            // Assert – response is populated correctly
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(10L);
            assertThat(response.getUserId()).isEqualTo(testUser.getId());
            assertThat(response.getUsername()).isEqualTo(testUser.getUsername());
            assertThat(response.getResourceId()).isEqualTo(testResource.getId());
            assertThat(response.getResourceName()).isEqualTo(testResource.getName());
            assertThat(response.getStatus()).isEqualTo(Waitlist.Status.WAITING);

            // Assert – entry was persisted exactly once
            then(waitlistRepository).should(times(1)).save(any(Waitlist.class));
        }

        @Test
        @DisplayName("New waitlist entry always starts with WAITING status")
        void joinedEntry_hasStatusWaiting() {
            // Arrange
            WaitlistRequestDTO request = buildRequest();

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(anyLong()))
                    .willReturn(Optional.of(testResource));
            given(waitlistRepository.existsByUserIdAndResourceIdAndStatus(
                    anyLong(), anyLong(), eq(Waitlist.Status.WAITING)))
                    .willReturn(false);

            // Echo back whatever was passed to save with an id
            given(waitlistRepository.save(any(Waitlist.class)))
                    .willAnswer(inv -> {
                        Waitlist w = inv.getArgument(0);
                        return Waitlist.builder()
                                .id(99L)
                                .user(w.getUser())
                                .resource(w.getResource())
                                .requestTime(LocalDateTime.now())
                                .status(w.getStatus())
                                .build();
                    });

            // Act
            WaitlistResponseDTO response = waitlistService.joinWaitlist(request);

            // Assert
            assertThat(response.getStatus()).isEqualTo(Waitlist.Status.WAITING);
        }
    }

    // =========================================================================
    // joinWaitlist — validation failures
    // =========================================================================

    @Nested
    @DisplayName("joinWaitlist — validation guards")
    class JoinWaitlistValidation {

        @Test
        @DisplayName("Throws 404 when user does not exist")
        void whenUserNotFound_thenThrows404() {
            WaitlistRequestDTO request = buildRequest();

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.empty());

            assertThatThrownBy(() -> waitlistService.joinWaitlist(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");

            // Must not attempt to save
            then(waitlistRepository).should(never()).save(any(Waitlist.class));
        }

        @Test
        @DisplayName("Throws 404 when resource does not exist")
        void whenResourceNotFound_thenThrows404() {
            WaitlistRequestDTO request = buildRequest();

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(anyLong()))
                    .willReturn(Optional.empty());

            assertThatThrownBy(() -> waitlistService.joinWaitlist(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("404");

            then(waitlistRepository).should(never()).save(any(Waitlist.class));
        }

        @Test
        @DisplayName("Throws 409 when user already has a WAITING entry for the resource")
        void whenAlreadyOnWaitlist_thenThrows409() {
            WaitlistRequestDTO request = buildRequest();

            given(userRepository.findById(anyLong()))
                    .willReturn(Optional.of(testUser));
            given(resourceRepository.findById(anyLong()))
                    .willReturn(Optional.of(testResource));
            given(waitlistRepository.existsByUserIdAndResourceIdAndStatus(
                    anyLong(), anyLong(), eq(Waitlist.Status.WAITING)))
                    .willReturn(true); // duplicate!

            assertThatThrownBy(() -> waitlistService.joinWaitlist(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("409");

            then(waitlistRepository).should(never()).save(any(Waitlist.class));
        }
    }

    // =========================================================================
    // getWaitlistByResource
    // =========================================================================

    @Nested
    @DisplayName("getWaitlistByResource")
    class GetWaitlistByResource {

        @Test
        @DisplayName("Returns mapped DTOs for a resource with waitlist entries")
        void whenEntriesExist_thenReturnsMappedDTOs() {
            // Arrange
            Waitlist entry1 = Waitlist.builder()
                    .id(1L).user(testUser).resource(testResource)
                    .requestTime(LocalDateTime.now().minusMinutes(10))
                    .status(Waitlist.Status.WAITING)
                    .build();

            Waitlist entry2 = Waitlist.builder()
                    .id(2L).user(testUser).resource(testResource)
                    .requestTime(LocalDateTime.now())
                    .status(Waitlist.Status.PROMOTED)
                    .build();

            given(waitlistRepository.findByResourceId(testResource.getId()))
                    .willReturn(List.of(entry1, entry2));

            // Act
            List<WaitlistResponseDTO> result =
                    waitlistService.getWaitlistByResource(testResource.getId());

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getId()).isEqualTo(1L);
            assertThat(result.get(1).getStatus()).isEqualTo(Waitlist.Status.PROMOTED);
        }

        @Test
        @DisplayName("Returns empty list when no waitlist entries exist for resource")
        void whenNoEntries_thenReturnsEmptyList() {
            given(waitlistRepository.findByResourceId(anyLong()))
                    .willReturn(List.of());

            List<WaitlistResponseDTO> result =
                    waitlistService.getWaitlistByResource(99L);

            assertThat(result).isEmpty();
        }
    }
}
