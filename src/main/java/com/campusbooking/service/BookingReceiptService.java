package com.campusbooking.service;

import com.campusbooking.model.Booking;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/** Generates downloadable PDF receipts for approved bookings. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingReceiptService {

    private static final DateTimeFormatter DATE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm", Locale.ROOT);

    private final BookingRepository bookingRepository;

    public byte[] generateReceipt(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Booking not found with id: " + bookingId));

        if (booking.getKitBooking() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This booking belongs to a Project Kit; use the Kit booking receipt endpoint.");
        }

        if (booking.getStatus() != Booking.Status.APPROVED
                && booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A receipt is available only for a confirmed booking.");
        }

        try {
            return createPdf(booking, LocalDateTime.now());
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to generate the booking receipt.", ex);
        }
    }

    private byte[] createPdf(Booking booking, LocalDateTime generatedAt) throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font labelFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = 790;
                writeLine(content, titleFont, 20, 55, y, "Campus Resource Booking Hub");
                y -= 30;
                writeLine(content, titleFont, 15, 55, y, "Approved Booking Receipt");
                y -= 38;

                y = writeField(content, labelFont, bodyFont, y, "Booking ID", "#" + booking.getId());
                y = writeField(content, labelFont, bodyFont, y, "Primary student", booking.getUser().getUsername());
                y = writeField(content, labelFont, bodyFont, y, "Resource", booking.getResource().getName());
                y = writeField(content, labelFont, bodyFont, y, "Resource type", booking.getResource().getType());
                y = writeField(content, labelFont, bodyFont, y, "Start time", booking.getStartTime().format(DATE_TIME_FORMAT));
                y = writeField(content, labelFont, bodyFont, y, "End time", booking.getEndTime().format(DATE_TIME_FORMAT));
                y = writeField(content, labelFont, bodyFont, y, "Booking status", booking.getStatus().name());

                List<String> members = booking.getGroupMembers() == null
                        ? List.of()
                        : booking.getGroupMembers().stream()
                                .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                                .map(User::getUsername)
                                .toList();
                y = writeField(content, labelFont, bodyFont, y, "Group members",
                        members.isEmpty() ? "None" : String.join(", ", members));

                y -= 18;
                writeLine(content, bodyFont, 9, 55, y,
                        "Receipt generated: " + generatedAt.format(DATE_TIME_FORMAT));
            }

            document.save(output);
            return output.toByteArray();
        }
    }

    private float writeField(PDPageContentStream content, PDType1Font labelFont,
                             PDType1Font bodyFont, float y, String label, String value)
            throws IOException {
        writeLine(content, labelFont, 11, 55, y, label + ":");
        writeLine(content, bodyFont, 11, 175, y, value);
        return y - 27;
    }

    private void writeLine(PDPageContentStream content, PDType1Font font,
                           float size, float x, float y, String text) throws IOException {
        content.beginText();
        content.setFont(font, size);
        content.newLineAtOffset(x, y);
        content.showText(toPdfText(font, text));
        content.endText();
    }

    private String toPdfText(PDType1Font font, String text) {
        StringBuilder safe = new StringBuilder();
        for (int offset = 0; offset < text.length();) {
            int codePoint = text.codePointAt(offset);
            String character = new String(Character.toChars(codePoint));
            try {
                font.encode(character);
                safe.append(character);
            } catch (IOException | IllegalArgumentException ex) {
                safe.append('?');
            }
            offset += Character.charCount(codePoint);
        }
        return safe.toString();
    }
}
