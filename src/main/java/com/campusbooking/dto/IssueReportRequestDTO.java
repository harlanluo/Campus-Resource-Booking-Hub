package com.campusbooking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Request body used by a student to report a resource issue. */
@Data
public class IssueReportRequestDTO {

    @NotNull(message = "resourceId must not be null")
    private Long resourceId;

    @NotNull(message = "reporterUserId must not be null")
    private Long reporterUserId;

    @NotBlank(message = "description must not be blank")
    @Size(max = 500, message = "description must not exceed 500 characters")
    private String description;
}
