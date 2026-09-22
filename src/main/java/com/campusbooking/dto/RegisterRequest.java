package com.campusbooking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for {@code POST /api/users/register}.
 *
 * <p>Keeps the API surface clean — callers cannot accidentally set
 * the {@code id} or {@code role} fields (new registrations are always STUDENT).</p>
 */
@Data
public class RegisterRequest {

    /** Desired username (must be unique, 3-50 characters). */
    @NotBlank(message = "Username is required.")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters.")
    private String username;

    /** Plain-text password provided by the client. */
    @NotBlank(message = "Password is required.")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters.")
    private String password;

    /** Email address (must be unique). */
    @NotBlank(message = "Email is required.")
    @Email(message = "Enter a valid email address.")
    @Size(max = 100, message = "Email must be 100 characters or fewer.")
    private String email;
}
