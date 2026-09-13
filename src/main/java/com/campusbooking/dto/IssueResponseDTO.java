package com.campusbooking.dto;

import com.campusbooking.model.ResourceIssue;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** Safe response projection for a reported resource issue. */
@Data
@Builder
public class IssueResponseDTO {

    private Long issueId;
    private Long resourceId;
    private String resourceName;
    private String resourceType;
    private Long reporterUserId;
    private String reporterUsername;
    private String description;
    private ResourceIssue.Status status;
    private LocalDateTime reportedTime;
    private LocalDateTime resolvedTime;

    public static IssueResponseDTO from(ResourceIssue issue) {
        return IssueResponseDTO.builder()
                .issueId(issue.getId())
                .resourceId(issue.getResource().getId())
                .resourceName(issue.getResource().getName())
                .resourceType(issue.getResource().getType())
                .reporterUserId(issue.getReporter().getId())
                .reporterUsername(issue.getReporter().getUsername())
                .description(issue.getDescription())
                .status(issue.getStatus())
                .reportedTime(issue.getReportedTime())
                .resolvedTime(issue.getResolvedTime())
                .build();
    }
}
