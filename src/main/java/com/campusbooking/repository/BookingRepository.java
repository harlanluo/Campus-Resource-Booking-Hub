package com.campusbooking.repository;

import com.campusbooking.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Data JPA repository for {@link Booking} entities.
 *
 * <p>Inherits standard CRUD and pagination operations from {@link JpaRepository}.
 * Custom query methods follow Spring Data naming conventions; complex overlap
 * detection uses JPQL for clarity.</p>
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Returns all bookings made by a specific user.
     *
     * @param userId the ID of the user
     * @return list of that user's bookings
     */
    List<Booking> findByUserId(Long userId);

    /**
     * Returns all bookings for a specific resource.
     *
     * @param resourceId the ID of the resource
     * @return list of bookings for that resource
     */
    List<Booking> findByResourceId(Long resourceId);

    /**
     * Returns all bookings with a given status.
     *
     * @param status the target {@link Booking.Status}
     * @return list of matching bookings
     */
    List<Booking> findByStatus(Booking.Status status);

    /**
     * Returns all bookings for a user filtered by status.
     *
     * @param userId the ID of the user
     * @param status the desired booking status
     * @return list of matching bookings
     */
    List<Booking> findByUserIdAndStatus(Long userId, Booking.Status status);

    /**
     * Finds any CONFIRMED or PENDING bookings that overlap a proposed time window
     * for the given resource.  Used to detect scheduling conflicts.
     *
     * <p>Overlap condition: {@code existingStart < proposedEnd AND existingEnd > proposedStart}</p>
     *
     * @param resourceId the resource to check
     * @param startTime  the proposed booking start
     * @param endTime    the proposed booking end
     * @return list of conflicting bookings (empty ⟹ slot is free)
     */
    @Query("""
           SELECT b FROM Booking b
           WHERE b.resource.id = :resourceId
             AND b.status IN (com.campusbooking.model.Booking.Status.CONFIRMED,
                              com.campusbooking.model.Booking.Status.PENDING)
             AND b.startTime < :endTime
             AND b.endTime   > :startTime
           """)
    List<Booking> findOverlappingBookings(
            @Param("resourceId") Long resourceId,
            @Param("startTime")  LocalDateTime startTime,
            @Param("endTime")    LocalDateTime endTime
    );
}
