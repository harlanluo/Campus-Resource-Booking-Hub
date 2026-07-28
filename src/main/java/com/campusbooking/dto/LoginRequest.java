package com.campusbooking.dto;

import lombok.Data;

/**
 * Request body for {@code POST /api/users/login}.
 */
@Data
public class LoginRequest {

    /** The user's username. */
    private String username;

    /** The plain-text password supplied by the client. */
    private String password;
}
