package com.campusbooking.controller;

import com.campusbooking.model.Kit;
import com.campusbooking.model.Resource;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitBookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AvailabilitySearchIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private KitRepository kitRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private KitBookingRepository kitBookingRepository;

    @Test
    void searchRequiresStudentRoleAndReturnsOnlySearchData() throws Exception {
        LocalDateTime start = futureStart(5);
        LocalDateTime end = start.plusHours(1);
        mockMvc.perform(searchRequest(start, end))
                .andExpect(status().isUnauthorized());

        String body = mockMvc.perform(searchRequest(start, end)
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode response = objectMapper.readTree(body);
        assertThat(response.path("results").isArray()).isTrue();
        assertThat(body).doesNotContain("username", "userId", "groupMembers", "email", "bookingOwner");

        mockMvc.perform(searchRequest(start, end)
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void normalSearchThenCreateAndApproveUsesExistingBookingLifecycle() throws Exception {
        Resource room = resourceRepository.findByName("Study Room A").orElseThrow();
        LocalDateTime start = futureStart(6);
        LocalDateTime end = start.plusHours(1);
        String beforeBody = mockMvc.perform(searchRequest(start, end)
                        .param("type", "ROOM")
                        .param("minCapacity", "6")
                        .param("keyword", "Study Room A")
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(containsResult(objectMapper.readTree(beforeBody), room.getId())).isTrue();

        String createdBody = mockMvc.perform(post("/api/bookings")
                        .with(user("alice_student").roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId":%d,"resourceId":%d,"startTime":"%s","endTime":"%s","memberUsernames":["maya_chen"]}
                                """.formatted(
                                userRepository.findByUsername("alice_student").orElseThrow().getId(),
                                room.getId(), start, end)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.groupBooking").value(true))
                .andExpect(jsonPath("$.groupMemberNames[0]").value("maya_chen"))
                .andReturn().getResponse().getContentAsString();
        long bookingId = objectMapper.readTree(createdBody).path("bookingId").asLong();

        mockMvc.perform(get("/api/bookings")
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.bookingId == " + bookingId + ")]").isNotEmpty());

        mockMvc.perform(put("/api/bookings/{id}/approve", bookingId)
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
        Long aliceId = userRepository.findByUsername("alice_student").orElseThrow().getId();
        mockMvc.perform(get("/api/bookings/user/{id}", aliceId)
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.bookingId == " + bookingId + ")].status")
                        .value(org.hamcrest.Matchers.hasItem("APPROVED")));

        String afterBody = mockMvc.perform(searchRequest(start, end)
                        .param("type", "ROOM")
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(containsResult(objectMapper.readTree(afterBody), room.getId())).isFalse();
    }

    @Test
    void kitSearchAndSubmissionCreateOneParentAndChildHolds() throws Exception {
        Kit kit = kitRepository.findAllWithResources().stream()
                .filter(candidate -> "Hybrid Teaching Kit".equals(candidate.getName()))
                .findFirst().orElseThrow();
        LocalDateTime start = futureStart(7);
        LocalDateTime end = start.plusHours(1);

        String searchBody = mockMvc.perform(searchRequest(start, end)
                        .param("type", "KIT")
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(containsResult(objectMapper.readTree(searchBody), kit.getId())).isTrue();

        String createdBody = mockMvc.perform(post("/api/kits/{id}/book", kit.getId())
                        .with(user("alice_student").roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId":%d,"startTime":"%s","endTime":"%s","memberUsernames":["maya_chen"]}
                                """.formatted(
                                userRepository.findByUsername("alice_student").orElseThrow().getId(), start, end)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.kitId").value(kit.getId()))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.groupBooking").value(true))
                .andExpect(jsonPath("$.groupMemberNames[0]").value("maya_chen"))
                .andExpect(jsonPath("$.resourceCount").value(kit.getResources().size()))
                .andReturn().getResponse().getContentAsString();
        long parentId = objectMapper.readTree(createdBody).path("id").asLong();
        assertThat(kitBookingRepository.findById(parentId)).isPresent();
        assertThat(bookingRepository.findByKitBookingIdOrderByResourceId(parentId))
                .hasSize(kit.getResources().size());

        mockMvc.perform(get("/api/kit-bookings")
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + parentId + ")]").isNotEmpty());

        mockMvc.perform(put("/api/kit-bookings/{id}/approve", parentId)
                        .with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
        Long aliceId = userRepository.findByUsername("alice_student").orElseThrow().getId();
        mockMvc.perform(get("/api/kit-bookings/user/{id}", aliceId)
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + parentId + ")].status")
                        .value(org.hamcrest.Matchers.hasItem("APPROVED")));
    }

    @Test
    @WithMockUser(username = "alice_student", roles = "STUDENT")
    void invalidSearchParametersAreRejected() throws Exception {
        LocalDateTime start = futureStart(4);
        mockMvc.perform(searchRequest(start, start.minusMinutes(1)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(searchRequest(start, start.plusHours(1)).param("type", "BUILDING"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(searchRequest(start, start.plusHours(1)).param("minCapacity", "-1"))
                .andExpect(status().isBadRequest());
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder searchRequest(
            LocalDateTime start, LocalDateTime end) {
        return get("/api/availability/search")
                .param("start", start.toString())
                .param("end", end.toString());
    }

    private LocalDateTime futureStart(int daysAhead) {
        return LocalDate.now().plusDays(daysAhead).atTime(10, 0);
    }

    private boolean containsResult(JsonNode response, Long id) {
        for (JsonNode result : response.path("results")) {
            if (result.path("id").asLong() == id) return true;
        }
        return false;
    }
}
