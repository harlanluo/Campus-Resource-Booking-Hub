package com.campusbooking.dto;

import lombok.Data;

/**
 * Request body for {@code POST /api/users/register}.
 *
 * <p>Keeps the API surface clean — callers cannot accidentally set
 * the {@code id} or {@code role} fields (new registrations are always STUDENT).</p>
 */
@Data
public class RegisterRequest {

    /** Desired username (must be unique, 1-50 characters). */
    private String username;

    /** Plain-text password provided by the client. */
    private String password;

    /** Email address (must be unique). */
    private String email;
}
