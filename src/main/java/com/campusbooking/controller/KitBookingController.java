package com.campusbooking.controller;

import com.campusbooking.dto.KitBookingResponseDTO;
import com.campusbooking.service.KitBookingReceiptService;
import com.campusbooking.service.KitBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Product-level API for Project Kit reservations. */
@RestController
@RequestMapping("/api/kit-bookings")
@RequiredArgsConstructor
public class KitBookingController {

    private final KitBookingService kitBookingService;
    private final KitBookingReceiptService receiptService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<KitBookingResponseDTO>> getAdminActive() {
        return ResponseEntity.ok(kitBookingService.getAdminActive());
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<KitBookingResponseDTO>> getAdminHistory() {
        return ResponseEntity.ok(kitBookingService.getAdminHistory());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or @apiAuthorization.isSelf(#userId, authentication)")
    public ResponseEntity<List<KitBookingResponseDTO>> getUserActive(@PathVariable Long userId) {
        return ResponseEntity.ok(kitBookingService.getUserActive(userId));
    }

    @GetMapping("/user/{userId}/history")
    @PreAuthorize("hasRole('ADMIN') or @apiAuthorization.isSelf(#userId, authentication)")
    public ResponseEntity<List<KitBookingResponseDTO>> getUserHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(kitBookingService.getUserHistory(userId));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KitBookingResponseDTO> approve(@PathVariable Long id) {
        return ResponseEntity.ok(kitBookingService.approve(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KitBookingResponseDTO> reject(@PathVariable Long id) {
        return ResponseEntity.ok(kitBookingService.reject(id));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("@apiAuthorization.canManageKitBooking(#id, authentication)")
    public ResponseEntity<KitBookingResponseDTO> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(kitBookingService.cancel(id));
    }

    @GetMapping(value = "/{id}/receipt", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("@apiAuthorization.canViewKitBooking(#id, authentication)")
    public ResponseEntity<byte[]> receipt(@PathVariable Long id) {
        byte[] pdf = receiptService.generateReceipt(id);
        String reference = kitBookingService.getReference(id);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(reference + "-receipt.pdf")
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .body(pdf);
    }
}
