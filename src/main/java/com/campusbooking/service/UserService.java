package com.campusbooking.service;

import com.campusbooking.dto.LoginRequest;
import com.campusbooking.dto.LoginResponse;
import com.campusbooking.dto.RegisterRequest;
import com.campusbooking.model.User;
import com.campusbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Business logic layer for {@link User} operations.
 *
 * <h3>Password note</h3>
 * Passwords are stored as plain text in this simulated Week-2 implementation.
 * In a production system (Week 3+), integrate BCryptPasswordEncoder from
 * Spring Security Crypto to hash passwords before persistence and to verify
 * them on login.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

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
                // TODO (Week 3): replace with BCryptPasswordEncoder.encode(request.getPassword())
                .password(request.getPassword())
                .email(request.getEmail())
                .role(User.Role.STUDENT)   // all self-registered users start as STUDENT
                .build();

        return userRepository.save(newUser);
    }

    /**
     * Simulates a login by verifying that a user with the given username exists
     * and that the supplied password matches the stored value.
     *
     * <p><strong>Important:</strong> This is a plain-text comparison suitable only
     * for this Week-2 demo.  Replace with a BCrypt check when Spring Security is added.</p>
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

        // Plain-text comparison — swap for BCrypt in Week 3
        if (!user.getPassword().equals(request.getPassword())) {
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
