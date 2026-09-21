package com.campusbooking.service;

import com.campusbooking.model.*;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitBookingRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class KitBookingReceiptServiceTest {

    @Mock private KitBookingRepository kitBookingRepository;
    @Mock private BookingRepository bookingRepository;
    @InjectMocks private KitBookingReceiptService service;
    private KitBooking parent;
    private List<Booking> children;

    @BeforeEach
    void setUp() {
        User owner = User.builder().id(1L).username("alice_student").build();
        User member = User.builder().id(2L).username("maya_member").build();
        Kit kit = Kit.builder().id(1L).name("Media Production Kit").build();
        Resource camera = Resource.builder().id(4L).name("DSLR Camera")
                .type("EQUIPMENT").build();
        Resource mic = Resource.builder().id(6L).name("Shotgun Mic")
                .type("EQUIPMENT").build();
        parent = KitBooking.builder().id(42L).bookingReference("KIT-2026-000042")
                .kit(kit).user(owner)
                .startTime(LocalDateTime.now().plusDays(2).withNano(0))
                .endTime(LocalDateTime.now().plusDays(2).plusHours(2).withNano(0))
                .status(KitBooking.Status.APPROVED).groupMembers(Set.of(member)).build();
        children = List.of(
                Booking.builder().kitBooking(parent).user(owner).resource(camera)
                        .startTime(parent.getStartTime()).endTime(parent.getEndTime())
                        .status(Booking.Status.APPROVED).build(),
                Booking.builder().kitBooking(parent).user(owner).resource(mic)
                        .startTime(parent.getStartTime()).endTime(parent.getEndTime())
                        .status(Booking.Status.APPROVED).build());
    }

    @Test
    @DisplayName("Approved Kit gets one readable receipt containing the aggregate details")
    void approvedKit_generatesReceipt() throws Exception {
        given(kitBookingRepository.findById(42L)).willReturn(Optional.of(parent));
        given(bookingRepository.findByKitBookingIdOrderByResourceId(42L)).willReturn(children);

        byte[] pdf = service.generateReceipt(42L);

        assertThat(pdf).startsWith((byte) '%', (byte) 'P', (byte) 'D', (byte) 'F');
        try (PDDocument document = Loader.loadPDF(pdf)) {
            String text = new PDFTextStripper().getText(document);
            assertThat(text).contains(
                    "Project Kit Booking Receipt", "KIT-2026-000042",
                    "Media Production Kit", "alice_student", "maya_member",
                    "DSLR Camera", "Shotgun Mic", "APPROVED", "Receipt generated:")
                    .containsPattern("Start time: \\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}")
                    .containsPattern("End time: \\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}")
                    .containsPattern("Receipt generated: \\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}")
                    .doesNotContain("?");
        }
    }

    @Test
    @DisplayName("Pending Kit cannot download a receipt")
    void pendingKit_isRejected() {
        parent.setStatus(KitBooking.Status.PENDING);
        given(kitBookingRepository.findById(42L)).willReturn(Optional.of(parent));

        assertThatThrownBy(() -> service.generateReceipt(42L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }
}
