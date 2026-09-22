package com.campusbooking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for {@code POST /api/users/login}.
 */
@Data
public class LoginRequest {

    /** The user's username. */
    @NotBlank(message = "Username is required.")
    private String username;

    /** The plain-text password supplied by the client. */
    @NotBlank(message = "Password is required.")
    private String password;
}
