package com.campusbooking.controller;

import com.campusbooking.service.BookingReceiptService;
import com.campusbooking.service.BookingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookingController.class)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private BookingReceiptService bookingReceiptService;

    @Test
    @DisplayName("Receipt endpoint returns PDF content and a download filename")
    void downloadReceipt_returnsPdfHeaders() throws Exception {
        byte[] pdf = "%PDF-test".getBytes();
        given(bookingReceiptService.generateReceipt(42L)).willReturn(pdf);

        mockMvc.perform(get("/api/bookings/42/receipt"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"booking-42-receipt.pdf\""))
                .andExpect(header().longValue("Content-Length", pdf.length))
                .andExpect(content().bytes(pdf));
    }
}
