package com.campusbooking.repository;

import com.campusbooking.model.Waitlist;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Waitlist w WHERE w.id = :id")
    Optional<Waitlist> findByIdForUpdate(@Param("id") Long id);

    List<Waitlist> findByUserIdAndStatusInOrderByRequestedStartAscRequestTimeAscIdAsc(
            Long userId, Collection<Waitlist.Status> statuses);

    List<Waitlist> findByUserId(Long userId);

    @Query("""
           SELECT w FROM Waitlist w
           WHERE w.status IN :statuses
           ORDER BY w.resource.id, w.requestedStart, w.requestedEnd, w.requestTime, w.id
           """)
    List<Waitlist> findByStatusInOrderBySlot(
            @Param("statuses") Collection<Waitlist.Status> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
           SELECT w FROM Waitlist w
           WHERE w.resource.id = :resourceId
             AND w.requestedStart = :startTime
             AND w.requestedEnd = :endTime
             AND w.status = com.campusbooking.model.Waitlist.Status.WAITING
           ORDER BY w.requestTime, w.id
           """)
    List<Waitlist> findWaitingForSlotForUpdate(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
           SELECT w FROM Waitlist w
           WHERE w.resource.id = :resourceId
             AND w.status = com.campusbooking.model.Waitlist.Status.WAITING
             AND w.requestedStart < :releasedEnd
             AND w.requestedEnd > :releasedStart
           ORDER BY w.requestTime, w.id
           """)
    List<Waitlist> findWaitingAffectedByReleaseForUpdate(
            @Param("resourceId") Long resourceId,
            @Param("releasedStart") LocalDateTime releasedStart,
            @Param("releasedEnd") LocalDateTime releasedEnd);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
           SELECT w FROM Waitlist w
           WHERE w.resource.id = :resourceId
             AND w.requestedStart = :startTime
             AND w.requestedEnd = :endTime
             AND w.status = com.campusbooking.model.Waitlist.Status.OFFERED
           ORDER BY w.id
           """)
    List<Waitlist> findOfferedForSlotForUpdate(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("""
           SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END FROM Waitlist w
           WHERE w.user.id = :userId
             AND w.resource.id = :resourceId
             AND w.requestedStart = :startTime
             AND w.requestedEnd = :endTime
             AND w.status IN (com.campusbooking.model.Waitlist.Status.WAITING,
                              com.campusbooking.model.Waitlist.Status.OFFERED)
           """)
    boolean existsActiveExactRequest(
            @Param("userId") Long userId,
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("""
           SELECT COUNT(w) FROM Waitlist w
           WHERE w.resource.id = :resourceId
             AND w.requestedStart = :startTime
             AND w.requestedEnd = :endTime
             AND w.status = com.campusbooking.model.Waitlist.Status.WAITING
             AND (w.requestTime < :requestTime
                  OR (w.requestTime = :requestTime AND w.id <= :id))
           """)
    long queuePosition(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("requestTime") LocalDateTime requestTime,
            @Param("id") Long id);

    @Query("""
           SELECT w FROM Waitlist w
           WHERE w.resource.id = :resourceId
             AND w.status = com.campusbooking.model.Waitlist.Status.OFFERED
             AND (w.offerExpiresAt IS NULL OR w.offerExpiresAt <= :now)
           ORDER BY w.offerExpiresAt, w.id
           """)
    List<Waitlist> findExpiredOffersForResource(
            @Param("resourceId") Long resourceId,
            @Param("now") LocalDateTime now);

    @Query("""
           SELECT w FROM Waitlist w
           WHERE w.resource.id = :resourceId
             AND w.status = com.campusbooking.model.Waitlist.Status.OFFERED
             AND w.offerExpiresAt > :now
             AND w.requestedStart < :endTime
             AND w.requestedEnd > :startTime
           """)
    List<Waitlist> findActiveOffersOverlapping(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("now") LocalDateTime now);
}
