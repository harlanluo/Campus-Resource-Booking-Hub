package com.campusbooking.service;

import com.campusbooking.model.Resource;
import com.campusbooking.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Business logic layer for campus {@link Resource} operations.
 *
 * <p>All public methods are read-only transactions unless otherwise noted,
 * allowing Hibernate to skip dirty-checking and improve performance.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourceService {

    private final ResourceRepository resourceRepository;

    /**
     * Returns every resource in the system regardless of status.
     *
     * @return unmodifiable list of all resources
     */
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    /**
     * Returns only resources that are currently {@link Resource.Status#AVAILABLE}.
     *
     * @return list of available resources (may be empty)
     */
    public List<Resource> getAvailableResources() {
        return resourceRepository.findByStatus(Resource.Status.AVAILABLE);
    }
}
