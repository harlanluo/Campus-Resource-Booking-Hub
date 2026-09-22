package com.campusbooking.controller;

import com.campusbooking.dto.AvailabilitySearchResponseDTO;
import com.campusbooking.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/** Student-facing, privacy-safe search for resources available at one interval. */
@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilitySearchController {

    private final AvailabilityService availabilityService;

    @GetMapping("/search")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AvailabilitySearchResponseDTO> search(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "ANY") String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(
                availabilityService.searchAvailable(start, end, type, minCapacity, keyword));
    }
}
