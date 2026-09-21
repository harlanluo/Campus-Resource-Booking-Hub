package com.campusbooking.repository;

import com.campusbooking.model.Kit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Kit} entities.
 */
@Repository
public interface KitRepository extends JpaRepository<Kit, Long> {

    /**
     * Retrieves all project kits with their bundled resources eagerly loaded.
     *
     * @return list of all kits with resources
     */
    @Query("SELECT DISTINCT k FROM Kit k LEFT JOIN FETCH k.resources")
    List<Kit> findAllWithResources();

    /**
     * Retrieves a single kit by its ID with bundled resources eagerly loaded.
     *
     * @param id the ID of the kit
     * @return optional kit with resources
     */
    @Query("SELECT k FROM Kit k LEFT JOIN FETCH k.resources WHERE k.id = :id")
    Optional<Kit> findByIdWithResources(@Param("id") Long id);

    @Query("SELECT CASE WHEN COUNT(k) > 0 THEN true ELSE false END FROM Kit k JOIN k.resources r WHERE r.id = :resourceId")
    boolean existsContainingResource(@Param("resourceId") Long resourceId);
}
