package com.campusbooking.service;

import com.campusbooking.dto.IssueReportRequestDTO;
import com.campusbooking.dto.IssueResponseDTO;
import com.campusbooking.model.Resource;
import com.campusbooking.model.ResourceIssue;
import com.campusbooking.model.User;
import com.campusbooking.repository.ResourceIssueRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/** Business logic for reporting and resolving resource issues. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourceIssueService {

    private final ResourceIssueRepository issueRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    @Transactional
    public IssueResponseDTO reportIssue(IssueReportRequestDTO request) {
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resource not found with id: " + request.getResourceId()));

        User reporter = userRepository.findById(request.getReporterUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with id: " + request.getReporterUserId()));

        ResourceIssue issue = ResourceIssue.builder()
                .resource(resource)
                .reporter(reporter)
                .description(request.getDescription().trim())
                .status(ResourceIssue.Status.OPEN)
                .build();

        resource.setStatus(Resource.Status.MAINTENANCE);
        resourceRepository.save(resource);

        return IssueResponseDTO.from(issueRepository.save(issue));
    }

    public List<IssueResponseDTO> getAllIssues() {
        return issueRepository.findAllByOrderByReportedTimeDesc()
                .stream()
                .map(IssueResponseDTO::from)
                .toList();
    }

    @Transactional
    public IssueResponseDTO resolveIssue(Long issueId) {
        ResourceIssue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resource issue not found with id: " + issueId));

        if (issue.getStatus() == ResourceIssue.Status.RESOLVED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Resource issue " + issueId + " is already resolved.");
        }

        Resource resource = issue.getResource();
        boolean anotherOpenIssue = issueRepository.existsByResourceIdAndStatusAndIdNot(
                resource.getId(), ResourceIssue.Status.OPEN, issueId);

        issue.setStatus(ResourceIssue.Status.RESOLVED);
        issue.setResolvedTime(LocalDateTime.now());
        ResourceIssue resolved = issueRepository.save(issue);

        if (!anotherOpenIssue && !resource.isManualMaintenance()) {
            resource.setStatus(Resource.Status.AVAILABLE);
            resourceRepository.save(resource);
        }

        return IssueResponseDTO.from(resolved);
    }
}
