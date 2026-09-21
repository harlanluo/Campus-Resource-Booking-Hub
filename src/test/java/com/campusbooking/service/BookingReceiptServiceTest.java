package com.campusbooking.service;

import com.campusbooking.model.Booking;
import com.campusbooking.model.KitBooking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class BookingReceiptServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private BookingReceiptService receiptService;

    private Booking approvedBooking;

    @BeforeEach
    void setUp() {
        User owner = User.builder().id(1L).username("alice_student").build();
        User member = User.builder().id(2L).username("bob_member").build();
        Resource resource = Resource.builder().id(4L).name("DSLR Camera").type("EQUIPMENT")
                .status(Resource.Status.AVAILABLE).build();
        approvedBooking = Booking.builder()
                .id(50L)
                .user(owner)
                .resource(resource)
                .startTime(LocalDateTime.of(2026, 10, 10, 9, 0))
                .endTime(LocalDateTime.of(2026, 10, 10, 11, 0))
                .status(Booking.Status.APPROVED)
                .groupMembers(Set.of(member))
                .build();
    }

    @Test
    @DisplayName("Generates a readable PDF for an approved booking")
    void approvedBooking_generatesPdf() throws Exception {
        given(bookingRepository.findById(50L)).willReturn(Optional.of(approvedBooking));

        byte[] pdf = receiptService.generateReceipt(50L);

        assertThat(pdf).startsWith((byte) '%', (byte) 'P', (byte) 'D', (byte) 'F');
        try (PDDocument document = Loader.loadPDF(pdf)) {
            String text = new PDFTextStripper().getText(document);
            assertThat(text)
                    .contains("Approved Booking Receipt", "Booking ID:", "#50")
                    .contains("alice_student", "DSLR Camera", "EQUIPMENT")
                    .contains("APPROVED", "bob_member", "Receipt generated:");
        }
    }

    @Test
    @DisplayName("Rejects receipt generation for a non-approved booking")
    void nonApprovedBooking_isRejected() {
        approvedBooking.setStatus(Booking.Status.PENDING);
        given(bookingRepository.findById(50L)).willReturn(Optional.of(approvedBooking));

        assertThatThrownBy(() -> receiptService.generateReceipt(50L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409")
                .hasMessageContaining("confirmed");
    }

    @Test
    @DisplayName("Generates a receipt for a legacy confirmed booking")
    void confirmedBooking_generatesPdf() {
        approvedBooking.setStatus(Booking.Status.CONFIRMED);
        given(bookingRepository.findById(50L)).willReturn(Optional.of(approvedBooking));

        assertThat(receiptService.generateReceipt(50L))
                .startsWith((byte) '%', (byte) 'P', (byte) 'D', (byte) 'F');
    }

    @Test
    @DisplayName("Returns 404 when the booking does not exist")
    void missingBooking_returns404() {
        given(bookingRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> receiptService.generateReceipt(999L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    @DisplayName("Rejects a direct receipt for a Kit child booking")
    void kitChildReceipt_isRejected() {
        approvedBooking.setKitBooking(KitBooking.builder()
                .id(9L).bookingReference("KIT-2026-000009").build());
        given(bookingRepository.findById(50L)).willReturn(Optional.of(approvedBooking));

        assertThatThrownBy(() -> receiptService.generateReceipt(50L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409")
                .hasMessageContaining("Kit");
    }
}
