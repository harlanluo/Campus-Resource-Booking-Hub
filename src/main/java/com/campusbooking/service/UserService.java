package com.campusbooking.service;

import com.campusbooking.dto.LoginRequest;
import com.campusbooking.dto.LoginResponse;
import com.campusbooking.dto.RegisterRequest;
import com.campusbooking.model.User;
import com.campusbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Business logic layer for {@link User} operations.
 *
 * Passwords are encoded with BCrypt before persistence and checked through the
 * same encoder during login.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Registers a new student user.
     *
     * <p>Validates that neither the username nor the email are already taken,
     * then persists a new {@link User} with role {@link User.Role#STUDENT}.</p>
     *
     * @param request the registration payload
     * @return the saved {@link User} (id populated by the database)
     * @throws ResponseStatusException {@code 409 CONFLICT} if username or email already exists
     */
    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Username '" + request.getUsername() + "' is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Email '" + request.getEmail() + "' is already registered.");
        }

        User newUser = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .role(User.Role.STUDENT)   // all self-registered users start as STUDENT
                .build();

        return userRepository.save(newUser);
    }

    /**
     * Verifies that a user with the given username exists
     * and that the supplied password matches the stored value.
     *
     * @param request the login payload containing username and password
     * @return a {@link LoginResponse} with the authenticated user's details
     * @throws ResponseStatusException {@code 401 UNAUTHORIZED} if credentials are invalid
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid username or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid username or password.");
        }

        return new LoginResponse(
                "Login successful. Welcome back, " + user.getUsername() + "!",
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }
}
