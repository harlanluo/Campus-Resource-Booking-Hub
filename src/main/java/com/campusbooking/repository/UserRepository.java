package com.campusbooking.repository;

import com.campusbooking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link User} entities.
 *
 * <p>Inherits standard CRUD and pagination operations from {@link JpaRepository}.
 * Custom query methods follow Spring Data naming conventions.</p>
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their unique username.
     *
     * @param username the username to search for
     * @return an {@link Optional} containing the user if found
     */
    Optional<User> findByUsername(String username);

    /**
     * Finds a user by their unique email address.
     *
     * @param email the email to search for
     * @return an {@link Optional} containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks whether a username is already taken.
     *
     * @param username the username to check
     * @return {@code true} if a user with this username exists
     */
    boolean existsByUsername(String username);

    /**
     * Checks whether an email address is already registered.
     *
     * @param email the email to check
     * @return {@code true} if a user with this email exists
     */
    boolean existsByEmail(String email);
}
