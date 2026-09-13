package com.campusbooking.service;

import com.campusbooking.dto.IssueReportRequestDTO;
import com.campusbooking.dto.IssueResponseDTO;
import com.campusbooking.model.Resource;
import com.campusbooking.model.ResourceIssue;
import com.campusbooking.model.User;
import com.campusbooking.repository.ResourceIssueRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceIssueServiceTest {

    @Mock private ResourceIssueRepository issueRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private ResourceIssueService issueService;

    private Resource resource;
    private User reporter;

    @BeforeEach
    void setUp() {
        resource = Resource.builder().id(2L).name("Room A101").type("ROOM")
                .status(Resource.Status.AVAILABLE).manualMaintenance(false).build();
        reporter = User.builder().id(1L).username("alice_student").build();
    }

    private IssueReportRequestDTO request() {
        IssueReportRequestDTO request = new IssueReportRequestDTO();
        request.setResourceId(2L);
        request.setReporterUserId(1L);
        request.setDescription("Projector does not power on");
        return request;
    }

    private ResourceIssue openIssue() {
        return ResourceIssue.builder().id(10L).resource(resource).reporter(reporter)
                .description("Projector does not power on")
                .status(ResourceIssue.Status.OPEN)
                .reportedTime(LocalDateTime.now().minusHours(1)).build();
    }

    @Nested
    @DisplayName("reportIssue")
    class ReportIssue {
        @Test
        @DisplayName("Stores an open issue and moves the resource to maintenance")
        void validReport_createsIssueAndSetsMaintenance() {
            given(resourceRepository.findById(2L)).willReturn(Optional.of(resource));
            given(userRepository.findById(1L)).willReturn(Optional.of(reporter));
            given(issueRepository.save(any(ResourceIssue.class))).willAnswer(invocation -> {
                ResourceIssue issue = invocation.getArgument(0);
                issue.setId(10L);
                issue.setReportedTime(LocalDateTime.now());
                return issue;
            });

            IssueResponseDTO result = issueService.reportIssue(request());

            assertThat(result.getIssueId()).isEqualTo(10L);
            assertThat(result.getStatus()).isEqualTo(ResourceIssue.Status.OPEN);
            assertThat(resource.getStatus()).isEqualTo(Resource.Status.MAINTENANCE);
            then(resourceRepository).should().save(resource);
        }

        @Test
        @DisplayName("Returns 404 when the resource is missing")
        void missingResource_returns404() {
            given(resourceRepository.findById(2L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> issueService.reportIssue(request()))
                    .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
            then(issueRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("Returns 404 when the reporting user is missing")
        void missingUser_returns404() {
            given(resourceRepository.findById(2L)).willReturn(Optional.of(resource));
            given(userRepository.findById(1L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> issueService.reportIssue(request()))
                    .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
            then(issueRepository).shouldHaveNoInteractions();
        }
    }

    @Nested
    @DisplayName("resolveIssue")
    class ResolveIssue {
        @Test
        @DisplayName("Resolves the issue and restores availability when it is the last open issue")
        void lastOpenIssue_restoresAvailable() {
            ResourceIssue issue = openIssue();
            resource.setStatus(Resource.Status.MAINTENANCE);
            given(issueRepository.findById(10L)).willReturn(Optional.of(issue));
            given(issueRepository.existsByResourceIdAndStatusAndIdNot(2L, ResourceIssue.Status.OPEN, 10L))
                    .willReturn(false);
            given(issueRepository.save(any(ResourceIssue.class))).willAnswer(inv -> inv.getArgument(0));

            IssueResponseDTO result = issueService.resolveIssue(10L);

            assertThat(result.getStatus()).isEqualTo(ResourceIssue.Status.RESOLVED);
            assertThat(result.getResolvedTime()).isNotNull();
            assertThat(resource.getStatus()).isEqualTo(Resource.Status.AVAILABLE);
            then(resourceRepository).should().save(resource);
        }

        @Test
        @DisplayName("Keeps maintenance when another open issue remains")
        void anotherOpenIssue_keepsMaintenance() {
            ResourceIssue issue = openIssue();
            resource.setStatus(Resource.Status.MAINTENANCE);
            given(issueRepository.findById(10L)).willReturn(Optional.of(issue));
            given(issueRepository.existsByResourceIdAndStatusAndIdNot(2L, ResourceIssue.Status.OPEN, 10L))
                    .willReturn(true);
            given(issueRepository.save(any(ResourceIssue.class))).willAnswer(inv -> inv.getArgument(0));

            issueService.resolveIssue(10L);

            assertThat(resource.getStatus()).isEqualTo(Resource.Status.MAINTENANCE);
            then(resourceRepository).should(never()).save(any(Resource.class));
        }

        @Test
        @DisplayName("Preserves maintenance that was set manually by an admin")
        void manualMaintenance_isPreserved() {
            ResourceIssue issue = openIssue();
            resource.setStatus(Resource.Status.MAINTENANCE);
            resource.setManualMaintenance(true);
            given(issueRepository.findById(10L)).willReturn(Optional.of(issue));
            given(issueRepository.existsByResourceIdAndStatusAndIdNot(2L, ResourceIssue.Status.OPEN, 10L))
                    .willReturn(false);
            given(issueRepository.save(any(ResourceIssue.class))).willAnswer(inv -> inv.getArgument(0));

            issueService.resolveIssue(10L);

            assertThat(resource.getStatus()).isEqualTo(Resource.Status.MAINTENANCE);
            then(resourceRepository).should(never()).save(any(Resource.class));
        }

        @Test
        @DisplayName("Returns 404 when the issue is missing")
        void missingIssue_returns404() {
            given(issueRepository.findById(999L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> issueService.resolveIssue(999L))
                    .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
        }

        @Test
        @DisplayName("Rejects an issue that is already resolved")
        void alreadyResolved_returns400() {
            ResourceIssue issue = openIssue();
            issue.setStatus(ResourceIssue.Status.RESOLVED);
            given(issueRepository.findById(10L)).willReturn(Optional.of(issue));
            assertThatThrownBy(() -> issueService.resolveIssue(10L))
                    .isInstanceOf(ResponseStatusException.class).hasMessageContaining("400");
        }
    }
}
