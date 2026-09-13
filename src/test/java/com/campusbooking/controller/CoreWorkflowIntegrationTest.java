package com.campusbooking.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.model.Waitlist;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import com.campusbooking.repository.WaitlistRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CoreWorkflowIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private WaitlistRepository waitlistRepository;

    @Test
    @DisplayName("Cancelling through the API promotes the earliest waitlisted user into the released slot")
    void cancellationPromotesWaitlistThroughApi() throws Exception {
        String suffix = UUID.randomUUID().toString();
        User owner = saveUser("owner-" + suffix);
        User waiting = saveUser("waiting-" + suffix);
        Resource resource = saveResource("Waitlist Room " + suffix);
        LocalDateTime start = LocalDateTime.now().plusDays(20).withNano(0);
        Booking booking = bookingRepository.saveAndFlush(Booking.builder()
                .user(owner)
                .resource(resource)
                .startTime(start)
                .endTime(start.plusHours(1))
                .status(Booking.Status.PENDING)
                .build());
        waitlistRepository.saveAndFlush(Waitlist.builder()
                .user(waiting)
                .resource(resource)
                .requestTime(LocalDateTime.now().minusMinutes(5))
                .status(Waitlist.Status.WAITING)
                .build());

        mockMvc.perform(put("/api/bookings/{id}/cancel", booking.getId())
                        .with(user(owner.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        List<Booking> stored = bookingRepository.findByResourceId(resource.getId());
        assertThat(stored).hasSize(2);
        assertThat(stored).filteredOn(item -> item.getStatus() == Booking.Status.PENDING)
                .singleElement()
                .extracting(item -> item.getUser().getId(), Booking::getStartTime, Booking::getEndTime)
                .containsExactly(waiting.getId(), start, start.plusHours(1));
        assertThat(waitlistRepository.findByUserId(waiting.getId()))
                .singleElement()
                .extracting(Waitlist::getStatus)
                .isEqualTo(Waitlist.Status.PROMOTED);
    }

    @Test
    @DisplayName("Student issue report and administrator resolution complete through secured APIs")
    void issueLifecycleWorksThroughApi() throws Exception {
        String suffix = UUID.randomUUID().toString();
        User reporter = saveUser("reporter-" + suffix);
        Resource resource = saveResource("Issue Resource " + suffix);

        String body = """
                {"resourceId":%d,"reporterUserId":%d,"description":"Damaged connector"}
                """.formatted(resource.getId(), reporter.getId());

        String response = mockMvc.perform(post("/api/issues")
                        .with(user(reporter.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andReturn().getResponse().getContentAsString();
        long issueId = objectMapper.readTree(response).get("issueId").asLong();
        assertThat(resourceRepository.findById(resource.getId()).orElseThrow().getStatus())
                .isEqualTo(Resource.Status.MAINTENANCE);

        mockMvc.perform(put("/api/issues/{id}/resolve", issueId)
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));
        assertThat(resourceRepository.findById(resource.getId()).orElseThrow().getStatus())
                .isEqualTo(Resource.Status.AVAILABLE);
    }

    @Test
    @DisplayName("An approved booking owner can download a PDF receipt through the API")
    void approvedBookingReceiptWorksThroughApi() throws Exception {
        String suffix = UUID.randomUUID().toString();
        User owner = saveUser("receipt-" + suffix);
        Resource resource = saveResource("Receipt Resource " + suffix);
        LocalDateTime start = LocalDateTime.now().plusDays(25).withNano(0);
        Booking booking = bookingRepository.saveAndFlush(Booking.builder()
                .user(owner)
                .resource(resource)
                .startTime(start)
                .endTime(start.plusHours(1))
                .status(Booking.Status.APPROVED)
                .build());

        byte[] pdf = mockMvc.perform(get("/api/bookings/{id}/receipt", booking.getId())
                        .with(user(owner.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"booking-" + booking.getId() + "-receipt.pdf\""))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
    }

    @Test
    @DisplayName("Invalid booking JSON returns a clear 400 response without creating data")
    void invalidBookingReturnsBadRequest() throws Exception {
        long before = bookingRepository.count();
        mockMvc.perform(post("/api/bookings")
                        .with(user("alice_student").roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId":1,"resourceId":1,"startTime":null,"endTime":null}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("startTime")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("endTime")));
        assertThat(bookingRepository.count()).isEqualTo(before);
    }

    private User saveUser(String username) {
        return userRepository.save(User.builder()
                .username(username)
                .password("test-only")
                .email(username + "@test.local")
                .role(User.Role.STUDENT)
                .build());
    }

    private Resource saveResource(String name) {
        return resourceRepository.save(Resource.builder()
                .name(name)
                .type("EQUIPMENT")
                .status(Resource.Status.AVAILABLE)
                .build());
    }
}
