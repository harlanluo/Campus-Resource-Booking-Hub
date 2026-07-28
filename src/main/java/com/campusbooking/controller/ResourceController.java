package com.campusbooking.controller;

import com.campusbooking.model.Resource;
import com.campusbooking.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller exposing read-only endpoints for campus {@link Resource} data.
 *
 * <pre>
 * GET /api/resources           – All resources (regardless of status)
 * GET /api/resources/available – Only AVAILABLE resources
 * </pre>
 */
@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    /**
     * Returns a list of all campus resources.
     *
     * <p>HTTP 200 OK with an empty array if no resources exist.</p>
     *
     * @return {@code 200 OK} – list of all {@link Resource} objects
     */
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        List<Resource> resources = resourceService.getAllResources();
        return ResponseEntity.ok(resources);
    }

    /**
     * Returns only resources that have status {@code AVAILABLE}.
     *
     * <p>HTTP 200 OK with an empty array if none are currently available.</p>
     *
     * @return {@code 200 OK} – list of available {@link Resource} objects
     */
    @GetMapping("/available")
    public ResponseEntity<List<Resource>> getAvailableResources() {
        List<Resource> available = resourceService.getAvailableResources();
        return ResponseEntity.ok(available);
    }
}
