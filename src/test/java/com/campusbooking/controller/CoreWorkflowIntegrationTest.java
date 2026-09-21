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
    @DisplayName("Cancelling through the API creates an exact-slot offer without creating a booking")
    void cancellationCreatesWaitlistOfferThroughApi() throws Exception {
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
                .requestedStart(start)
                .requestedEnd(start.plusHours(1))
                .requestTime(LocalDateTime.now().minusMinutes(5))
                .status(Waitlist.Status.WAITING)
                .build());

        mockMvc.perform(put("/api/bookings/{id}/cancel", booking.getId())
                        .with(user(owner.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        List<Booking> stored = bookingRepository.findByResourceId(resource.getId());
        assertThat(stored).hasSize(1);
        assertThat(waitlistRepository.findByUserId(waiting.getId()))
                .singleElement()
                .extracting(Waitlist::getStatus)
                .isEqualTo(Waitlist.Status.OFFERED);
    }

    @Test
    @DisplayName("Student issue report waits for approval before maintenance and can then be resolved")
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
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();
        long issueId = objectMapper.readTree(response).get("issueId").asLong();
        assertThat(resourceRepository.findById(resource.getId()).orElseThrow().getStatus())
                .isEqualTo(Resource.Status.AVAILABLE);

        mockMvc.perform(put("/api/issues/{id}/approve", issueId)
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"));
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
    @DisplayName("Administrator rejection closes a pending issue without changing resource status")
    void rejectedIssueDoesNotEnterMaintenance() throws Exception {
        String suffix = UUID.randomUUID().toString();
        User reporter = saveUser("reject-" + suffix);
        Resource resource = saveResource("Rejected Issue Resource " + suffix);
        String body = """
                {"resourceId":%d,"reporterUserId":%d,"description":"False alarm"}
                """.formatted(resource.getId(), reporter.getId());

        String response = mockMvc.perform(post("/api/issues")
                        .with(user(reporter.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();
        long issueId = objectMapper.readTree(response).get("issueId").asLong();

        mockMvc.perform(put("/api/issues/{id}/reject", issueId)
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
        assertThat(resourceRepository.findById(resource.getId()).orElseThrow().getStatus())
                .isEqualTo(Resource.Status.AVAILABLE);
    }

    @Test
    @DisplayName("Student and admin booking APIs show only current pending and approved bookings")
    void bookingDashboardsHideHistoricalAndTerminalBookings() throws Exception {
        String suffix = UUID.randomUUID().toString();
        User owner = saveUser("dashboard-" + suffix);
        Resource resource = saveResource("Dashboard Resource " + suffix);
        LocalDateTime future = LocalDateTime.now().plusDays(10).withNano(0);
        LocalDateTime past = LocalDateTime.now().minusDays(10).withNano(0);

        Booking pending = saveBooking(owner, resource, future, Booking.Status.PENDING);
        Booking approved = saveBooking(owner, resource, future.plusHours(2), Booking.Status.APPROVED);
        Booking confirmed = saveBooking(owner, resource, future.plusHours(4), Booking.Status.CONFIRMED);
        Booking cancelled = saveBooking(owner, resource, future.plusHours(6), Booking.Status.CANCELLED);
        Booking rejected = saveBooking(owner, resource, future.plusHours(8), Booking.Status.REJECTED);
        Booking completed = saveBooking(owner, resource, future.plusHours(10), Booking.Status.COMPLETED);
        Booking expired = saveBooking(owner, resource, past, Booking.Status.APPROVED);
        Booking expiredConfirmed = saveBooking(owner, resource, past.plusHours(2), Booking.Status.CONFIRMED);

        String studentResponse = mockMvc.perform(get("/api/bookings/user/{id}", owner.getId())
                        .with(user(owner.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String adminResponse = mockMvc.perform(get("/api/bookings")
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String historyResponse = mockMvc.perform(get("/api/bookings/user/{id}/history", owner.getId())
                        .with(user(owner.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<Long> expected = List.of(pending.getId(), approved.getId(), confirmed.getId());
        List<Long> studentIds = objectMapper.readTree(studentResponse).findValuesAsText("bookingId")
                .stream().map(Long::valueOf).toList();
        List<Long> adminIds = objectMapper.readTree(adminResponse).findValuesAsText("bookingId")
                .stream().map(Long::valueOf).toList();

        assertThat(studentIds).containsExactlyInAnyOrderElementsOf(expected);
        assertThat(adminIds).containsAll(expected);
        for (List<Long> ids : List.of(studentIds, adminIds)) {
            assertThat(ids).doesNotContain(cancelled.getId(), rejected.getId(), completed.getId(),
                    expired.getId(), expiredConfirmed.getId());
        }

        var history = objectMapper.readTree(historyResponse);
        List<Long> historyIds = history.findValuesAsText("bookingId").stream()
                .map(Long::valueOf).toList();
        assertThat(historyIds).containsExactlyInAnyOrder(
                cancelled.getId(), rejected.getId(), completed.getId(), expired.getId(), expiredConfirmed.getId());
        assertThat(history.findValuesAsText("status")).contains("CANCELLED", "REJECTED", "COMPLETED");
        history.forEach(item -> {
            long id = item.get("bookingId").asLong();
            if (id == expired.getId() || id == expiredConfirmed.getId()) {
                assertThat(item.get("status").asText()).isEqualTo("COMPLETED");
            }
        });
    }

    @Test
    @DisplayName("Closed booking transitions return a clear conflict response")
    void closedBookingCannotBeApprovedOrRejected() throws Exception {
        String suffix = UUID.randomUUID().toString();
        User owner = saveUser("closed-" + suffix);
        Resource resource = saveResource("Closed Resource " + suffix);
        Booking rejected = saveBooking(owner, resource, LocalDateTime.now().plusDays(12), Booking.Status.REJECTED);

        mockMvc.perform(put("/api/bookings/{id}/approve", rejected.getId())
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("REJECTED to APPROVED")));
        mockMvc.perform(put("/api/bookings/{id}/reject", rejected.getId())
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isConflict());
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

    private Booking saveBooking(
            User owner,
            Resource resource,
            LocalDateTime start,
            Booking.Status status) {
        return bookingRepository.saveAndFlush(Booking.builder()
                .user(owner)
                .resource(resource)
                .startTime(start)
                .endTime(start.plusHours(1))
                .status(status)
                .build());
    }
}
