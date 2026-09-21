package com.campusbooking.repository;

import com.campusbooking.model.KitBooking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface KitBookingRepository extends JpaRepository<KitBooking, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT kb FROM KitBooking kb WHERE kb.id = :id")
    Optional<KitBooking> findByIdForUpdate(@Param("id") Long id);

    @Query("""
           SELECT DISTINCT kb FROM KitBooking kb
           LEFT JOIN kb.groupMembers m
           WHERE (kb.user.id = :userId OR m.id = :userId)
             AND kb.status IN (com.campusbooking.model.KitBooking.Status.PENDING,
                               com.campusbooking.model.KitBooking.Status.APPROVED)
             AND kb.endTime > :cutoff
           ORDER BY kb.startTime
           """)
    List<KitBooking> findActiveForUser(@Param("userId") Long userId,
                                       @Param("cutoff") LocalDateTime cutoff);

    @Query("""
           SELECT DISTINCT kb FROM KitBooking kb
           LEFT JOIN kb.groupMembers m
           WHERE (kb.user.id = :userId OR m.id = :userId)
             AND (kb.status IN (com.campusbooking.model.KitBooking.Status.REJECTED,
                                com.campusbooking.model.KitBooking.Status.CANCELLED,
                                com.campusbooking.model.KitBooking.Status.COMPLETED)
                  OR kb.endTime <= :cutoff)
           ORDER BY kb.endTime DESC
           """)
    List<KitBooking> findHistoryForUser(@Param("userId") Long userId,
                                        @Param("cutoff") LocalDateTime cutoff);

    @Query("""
           SELECT kb FROM KitBooking kb
           WHERE kb.status IN (com.campusbooking.model.KitBooking.Status.PENDING,
                               com.campusbooking.model.KitBooking.Status.APPROVED)
             AND kb.endTime > :cutoff
           ORDER BY kb.startTime
           """)
    List<KitBooking> findActiveForAdmin(@Param("cutoff") LocalDateTime cutoff);
}
