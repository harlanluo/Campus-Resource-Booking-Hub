package com.campusbooking.repository;

import com.campusbooking.model.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link Waitlist} entities.
 *
 * <p>Inherits standard CRUD and pagination operations from {@link JpaRepository}.
 * Custom query methods follow Spring Data naming conventions.</p>
 */
@Repository
public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {

    /**
     * Returns all waitlist entries for a specific user.
     *
     * @param userId the ID of the user
     * @return list of that user's waitlist entries
     */
    List<Waitlist> findByUserId(Long userId);

    /**
     * Returns all waitlist entries for a specific resource.
     *
     * @param resourceId the ID of the resource
     * @return list of waitlist entries for that resource
     */
    List<Waitlist> findByResourceId(Long resourceId);

    /**
     * Returns all WAITING entries for a resource, ordered oldest-first.
     * Useful for promoting the next person in the queue when a slot opens.
     *
     * @param resourceId the ID of the resource
     * @param status     the desired {@link Waitlist.Status} (typically WAITING)
     * @return ordered list of waitlist entries
     */
    List<Waitlist> findByResourceIdAndStatusOrderByRequestTimeAsc(
            Long resourceId, Waitlist.Status status
    );

    /**
     * Checks whether a user already has an active waitlist entry for a resource.
     *
     * @param userId     the user's ID
     * @param resourceId the resource's ID
     * @param status     the status to check for (typically WAITING)
     * @return {@code true} if a matching entry exists
     */
    boolean existsByUserIdAndResourceIdAndStatus(
            Long userId, Long resourceId, Waitlist.Status status
    );
}
