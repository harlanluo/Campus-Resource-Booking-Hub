package com.campusbooking.controller;

import com.campusbooking.model.Booking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Test
    @DisplayName("Protected API requests require authentication")
    void protectedApiRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/resources"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "alice_student", roles = "STUDENT")
    @DisplayName("A student cannot call administrator booking operations")
    void studentCannotCallAdminBookingOperations() throws Exception {
        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/bookings/2/approve"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "alice_student", roles = "STUDENT")
    @DisplayName("A student cannot manage resources or administrator issue records")
    void studentCannotCallOtherAdminOperations() throws Exception {
        mockMvc.perform(post("/api/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Restricted Room","type":"ROOM","status":"AVAILABLE"}
                                """))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/issues"))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/issues/1/resolve"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "alice_student", roles = "STUDENT")
    @DisplayName("A student cannot request another user's private booking list")
    void studentCannotReadAnotherUsersBookings() throws Exception {
        mockMvc.perform(get("/api/bookings/user/2"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "alice_student", roles = "STUDENT")
    @DisplayName("A student can read their own booking list")
    void studentCanReadOwnBookings() throws Exception {
        mockMvc.perform(get("/api/bookings/user/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "alice_student", roles = "STUDENT")
    @DisplayName("A student cannot create a booking under another user's identity")
    void studentCannotSpoofBookingOwner() throws Exception {
        String request = """
                {
                  "userId": 2,
                  "resourceId": 4,
                  "startTime": "%s",
                  "endTime": "%s"
                }
                """.formatted(
                LocalDateTime.now().plusDays(20),
                LocalDateTime.now().plusDays(20).plusHours(1));

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("A valid login creates a session that authorizes later requests")
    void loginCreatesAuthenticatedSession() throws Exception {
        MockHttpSession session = (MockHttpSession) mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"alice_student","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andReturn()
                .getRequest()
                .getSession(false);

        mockMvc.perform(get("/api/bookings/user/1").session(session))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("An administrator login session can access administrator APIs")
    void adminLoginCanAccessAdminApi() throws Exception {
        MockHttpSession session = (MockHttpSession) mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"bob_admin","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andReturn()
                .getRequest()
                .getSession(false);

        mockMvc.perform(get("/api/bookings").session(session))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("A booking group member can cancel a booking they are involved in")
    void groupMemberCanCancelBooking() throws Exception {
        User owner = userRepository.findByUsername("bob_admin").orElseThrow();
        User member = userRepository.findByUsername("alice_student").orElseThrow();
        Resource resource = resourceRepository.findById(4L).orElseThrow();
        Booking booking = bookingRepository.save(Booking.builder()
                .user(owner)
                .resource(resource)
                .startTime(LocalDateTime.now().plusDays(30))
                .endTime(LocalDateTime.now().plusDays(30).plusHours(1))
                .status(Booking.Status.PENDING)
                .groupMembers(new HashSet<>(java.util.Set.of(member)))
                .build());

        mockMvc.perform(put("/api/bookings/{id}/cancel", booking.getId())
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("A student cannot cancel a booking they do not own or participate in")
    void unrelatedStudentCannotCancelBooking() throws Exception {
        User owner = userRepository.findByUsername("bob_admin").orElseThrow();
        Resource resource = resourceRepository.findById(5L).orElseThrow();
        Booking booking = bookingRepository.save(Booking.builder()
                .user(owner)
                .resource(resource)
                .startTime(LocalDateTime.now().plusDays(31))
                .endTime(LocalDateTime.now().plusDays(31).plusHours(1))
                .status(Booking.Status.PENDING)
                .build());

        mockMvc.perform(put("/api/bookings/{id}/cancel", booking.getId())
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("APPROVED bookings block overlapping booking requests")
    void approvedBookingBlocksOverlap() throws Exception {
        User owner = userRepository.findByUsername("bob_admin").orElseThrow();
        Resource resource = resourceRepository.findById(6L).orElseThrow();
        LocalDateTime start = LocalDateTime.now().plusDays(40);
        LocalDateTime end = start.plusHours(2);
        bookingRepository.saveAndFlush(Booking.builder()
                .user(owner)
                .resource(resource)
                .startTime(start)
                .endTime(end)
                .status(Booking.Status.APPROVED)
                .build());

        String request = """
                {
                  "userId": 1,
                  "resourceId": 6,
                  "startTime": "%s",
                  "endTime": "%s"
                }
                """.formatted(start.plusMinutes(30), end.plusMinutes(30));

        mockMvc.perform(post("/api/bookings")
                        .with(user("alice_student").roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isConflict());
    }
}
