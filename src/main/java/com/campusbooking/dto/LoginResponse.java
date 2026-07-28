package com.campusbooking.dto;

import com.campusbooking.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response body returned by {@code POST /api/users/login} on success.
 *
 * <p>Returns the authenticated user's non-sensitive details only —
 * the password hash is intentionally excluded from the response.</p>
 */
@Data
@AllArgsConstructor
public class LoginResponse {

    private String message;
    private Long   userId;
    private String username;
    private String email;
    private User.Role role;
}
