package com.campusbooking.controller;

import com.campusbooking.dto.LoginRequest;
import com.campusbooking.dto.LoginResponse;
import com.campusbooking.dto.RegisterRequest;
import com.campusbooking.model.User;
import com.campusbooking.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller handling user registration and simulated login.
 *
 * <pre>
 * POST /api/users/register – Register a new student account
 * POST /api/users/login    – Simulate login (username + password lookup)
 * </pre>
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Registers a new student user.
     *
     * <p>All self-registered users are assigned the {@code STUDENT} role automatically.</p>
     *
     * <ul>
     *   <li>{@code 201 Created}  – user successfully created; returns the saved user object</li>
     *   <li>{@code 409 Conflict} – username or email is already taken</li>
     * </ul>
     *
     * <p>Example request body:
     * <pre>{@code
     * {
     *   "username": "charlie_student",
     *   "password": "mySecret123",
     *   "email":    "charlie@campus.edu"
     * }
     * }</pre>
     * </p>
     *
     * @param request registration payload
     * @return {@code 201 Created} with the persisted {@link User}
     */
    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        User created = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Simulates a user login by verifying credentials against the database.
     *
     * <p>No session or token is created at this stage — this is a stateless
     * credential check only.  JWT integration is planned for Week 3.</p>
     *
     * <ul>
     *   <li>{@code 200 OK}           – credentials valid; returns user details and welcome message</li>
     *   <li>{@code 401 Unauthorized} – username not found or password mismatch</li>
     * </ul>
     *
     * <p>Example request body:
     * <pre>{@code
     * {
     *   "username": "alice_student",
     *   "password": "password123"
     * }
     * }</pre>
     * </p>
     *
     * @param request login payload containing username and password
     * @return {@code 200 OK} with a {@link LoginResponse} on success
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }
}
