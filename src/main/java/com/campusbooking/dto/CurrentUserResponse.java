package com.campusbooking.dto;

import com.campusbooking.model.User;

/** Safe identity details exposed to the authenticated frontend. */
public record CurrentUserResponse(
        Long id,
        String username,
        String email,
        User.Role role) {

    public static CurrentUserResponse from(User user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole());
    }
}
