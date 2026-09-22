package com.campusbooking.controller;

import com.campusbooking.dto.IssueReportRequestDTO;
import com.campusbooking.dto.IssueResponseDTO;
import com.campusbooking.service.ResourceIssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** REST endpoints for the resource issue and maintenance workflow. */
@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class ResourceIssueController {

    private final ResourceIssueService issueService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or @apiAuthorization.isSelf(#request.reporterUserId, authentication)")
    public ResponseEntity<IssueResponseDTO> reportIssue(
            @Valid @RequestBody IssueReportRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(issueService.reportIssue(request));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<IssueResponseDTO>> getOwnIssues(Authentication authentication) {
        return ResponseEntity.ok(issueService.getOwnIssues(authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<IssueResponseDTO>> getAllIssues() {
        return ResponseEntity.ok(issueService.getAllIssues());
    }

    @PutMapping("/{issueId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IssueResponseDTO> approveIssue(@PathVariable Long issueId) {
        return ResponseEntity.ok(issueService.approveIssue(issueId));
    }

    @PutMapping("/{issueId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IssueResponseDTO> rejectIssue(@PathVariable Long issueId) {
        return ResponseEntity.ok(issueService.rejectIssue(issueId));
    }

    @PutMapping("/{issueId}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IssueResponseDTO> resolveIssue(@PathVariable Long issueId) {
        return ResponseEntity.ok(issueService.resolveIssue(issueId));
    }
}
