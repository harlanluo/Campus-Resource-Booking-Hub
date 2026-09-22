package com.campusbooking.controller;

import com.campusbooking.dto.BookingResponseDTO;
import com.campusbooking.dto.WaitlistAdminOverviewDTO;
import com.campusbooking.dto.WaitlistRequestDTO;
import com.campusbooking.dto.WaitlistResponseDTO;
import com.campusbooking.service.WaitlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Authenticated, privacy-safe waitlist and offer API. */
@RestController
@RequestMapping("/api/waitlists")
@RequiredArgsConstructor
public class WaitlistController {

    private final WaitlistService waitlistService;

    @PostMapping
    public ResponseEntity<WaitlistResponseDTO> join(
            Authentication authentication,
            @Valid @RequestBody WaitlistRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(waitlistService.joinWaitlist(authentication.getName(), request));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<WaitlistResponseDTO>> mine(Authentication authentication) {
        return ResponseEntity.ok(waitlistService.getOwnEntries(authentication.getName()));
    }

    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WaitlistAdminOverviewDTO>> adminOverview() {
        return ResponseEntity.ok(waitlistService.getAdminOverview());
    }

    @GetMapping("/{entryId}")
    public ResponseEntity<WaitlistResponseDTO> getOwn(
            Authentication authentication, @PathVariable Long entryId) {
        return ResponseEntity.ok(waitlistService.getOwnEntry(authentication.getName(), entryId));
    }

    @PutMapping("/{entryId}/accept")
    public ResponseEntity<BookingResponseDTO> accept(
            Authentication authentication, @PathVariable Long entryId) {
        return ResponseEntity.ok(waitlistService.acceptOffer(authentication.getName(), entryId));
    }

    @PutMapping("/{entryId}/decline")
    public ResponseEntity<WaitlistResponseDTO> decline(
            Authentication authentication, @PathVariable Long entryId) {
        return ResponseEntity.ok(waitlistService.declineOffer(authentication.getName(), entryId));
    }

    @DeleteMapping("/{entryId}")
    public ResponseEntity<WaitlistResponseDTO> leave(
            Authentication authentication, @PathVariable Long entryId) {
        return ResponseEntity.ok(waitlistService.leaveWaitlist(authentication.getName(), entryId));
    }
}
