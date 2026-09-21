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
     * Returns all bookings where the user is either the primary creator (owner)
     * OR an invited collaborative group member.
     *
     * @param userId the ID of the user
     * @return list of matching bookings, ordered by startTime descending
     */
    @Query("""
           SELECT DISTINCT b FROM Booking b
           LEFT JOIN b.groupMembers m
           WHERE (b.user.id = :userId OR m.id = :userId)
             AND b.kitBooking IS NULL
           ORDER BY b.startTime DESC
           """)
    List<Booking> findAllUserBookings(@Param("userId") Long userId);

    /**
     * Returns only current/future bookings that belong on the normal student
     * dashboard, including bookings shared with the user as a group member.
     */
    @Query("""
           SELECT DISTINCT b FROM Booking b
           LEFT JOIN b.groupMembers m
           WHERE (b.user.id = :userId OR m.id = :userId)
             AND b.kitBooking IS NULL
             AND b.status IN (com.campusbooking.model.Booking.Status.PENDING,
                              com.campusbooking.model.Booking.Status.CONFIRMED,
                              com.campusbooking.model.Booking.Status.APPROVED)
             AND b.endTime > :cutoff
           ORDER BY b.startTime
           """)
    List<Booking> findActiveUserBookings(
            @Param("userId") Long userId,
            @Param("cutoff") LocalDateTime cutoff);

    /** Returns closed or expired bookings for a student, including shared bookings. */
    @Query("""
           SELECT DISTINCT b FROM Booking b
           LEFT JOIN b.groupMembers m
           WHERE (b.user.id = :userId OR m.id = :userId)
             AND b.kitBooking IS NULL
             AND (b.status IN (com.campusbooking.model.Booking.Status.CANCELLED,
                               com.campusbooking.model.Booking.Status.REJECTED,
                               com.campusbooking.model.Booking.Status.COMPLETED)
                  OR b.endTime <= :cutoff)
           ORDER BY b.endTime DESC
           """)
    List<Booking> findHistoryUserBookings(
            @Param("userId") Long userId,
            @Param("cutoff") LocalDateTime cutoff);

    /** Returns current/future pending and approved bookings for the admin queue. */
    @Query("""
           SELECT b FROM Booking b
           WHERE b.kitBooking IS NULL
             AND b.status IN (com.campusbooking.model.Booking.Status.PENDING,
                              com.campusbooking.model.Booking.Status.CONFIRMED,
                              com.campusbooking.model.Booking.Status.APPROVED)
             AND b.endTime > :cutoff
           ORDER BY b.startTime
           """)
    List<Booking> findActiveAdminBookings(@Param("cutoff") LocalDateTime cutoff);

    /** Returns closed or expired bookings for optional administrative review. */
    @Query("""
           SELECT b FROM Booking b
           WHERE b.kitBooking IS NULL
             AND (b.status IN (com.campusbooking.model.Booking.Status.CANCELLED,
                              com.campusbooking.model.Booking.Status.REJECTED,
                              com.campusbooking.model.Booking.Status.COMPLETED)
                  OR b.endTime <= :cutoff)
           ORDER BY b.endTime DESC
           """)
    List<Booking> findHistoryAdminBookings(@Param("cutoff") LocalDateTime cutoff);


    /**
     * Returns all bookings for a specific resource.
     *
     * @param resourceId the ID of the resource
     * @return list of bookings for that resource
     */
    List<Booking> findByResourceId(Long resourceId);

    List<Booking> findByKitBookingIdOrderByResourceId(Long kitBookingId);

    boolean existsByResourceId(Long resourceId);

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
     * Finds any CONFIRMED, PENDING, or APPROVED bookings that overlap a proposed time window
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
                              com.campusbooking.model.Booking.Status.PENDING,
                              com.campusbooking.model.Booking.Status.APPROVED)
             AND b.startTime < :endTime
             AND b.endTime   > :startTime
           """)
    List<Booking> findOverlappingBookings(
            @Param("resourceId") Long resourceId,
            @Param("startTime")  LocalDateTime startTime,
            @Param("endTime")    LocalDateTime endTime
    );
}
