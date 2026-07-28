package com.campusbooking.repository;

import com.campusbooking.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Resource} entities.
 *
 * <p>Inherits standard CRUD and pagination operations from {@link JpaRepository}.
 * Custom query methods follow Spring Data naming conventions.</p>
 */
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    /**
     * Finds a resource by its unique name.
     *
     * @param name the resource name
     * @return an {@link Optional} containing the resource if found
     */
    Optional<Resource> findByName(String name);

    /**
     * Returns all resources matching a given type (e.g. "ROOM", "LAB").
     *
     * @param type the resource type label
     * @return list of matching resources (may be empty)
     */
    List<Resource> findByType(String type);

    /**
     * Returns all resources with the specified availability status.
     *
     * @param status the target {@link Resource.Status}
     * @return list of matching resources (may be empty)
     */
    List<Resource> findByStatus(Resource.Status status);

    /**
     * Returns all resources of a given type and status.
     *
     * @param type   the resource type label
     * @param status the target {@link Resource.Status}
     * @return list of matching resources (may be empty)
     */
    List<Resource> findByTypeAndStatus(String type, Resource.Status status);
}
