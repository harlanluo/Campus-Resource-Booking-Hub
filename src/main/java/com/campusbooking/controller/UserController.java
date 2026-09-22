package com.campusbooking.controller;

import com.campusbooking.dto.CurrentUserResponse;
import com.campusbooking.dto.LoginRequest;
import com.campusbooking.dto.LoginResponse;
import com.campusbooking.dto.RegisterRequest;
import com.campusbooking.model.User;
import com.campusbooking.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller handling public account entry and authenticated session identity.
 *
 * <pre>
 * POST /api/users/register – Register a new student account
 * POST /api/users/login    – Authenticate username and password
 * GET  /api/users/me       – Return the current session identity
 * </pre>
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    /**
     * Registers a new student user.
     *
     * <p>All self-registered users are assigned the {@code STUDENT} role automatically.</p>
     *
     * <ul>
     *   <li>{@code 201 Created}  – user successfully created; returns safe identity details</li>
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
     * @return {@code 201 Created} with safe identity details for the new student
     */
    @PostMapping("/register")
    public ResponseEntity<CurrentUserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User created = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(CurrentUserResponse.from(created));
    }

    /**
     * Authenticates credentials and stores the resulting identity in the HTTP
     * session used by later API calls.
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
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.getUsername(), request.getPassword()));
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);
            return ResponseEntity.ok(userService.login(request));
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid username or password.");
        }
    }

    /** Returns only the safe identity details associated with the current session. */
    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> currentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.currentUser(authentication.getName()));
    }
}
