package com.campusbooking.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Kit;
import com.campusbooking.model.Resource;
import com.campusbooking.model.ResourceIssue;
import com.campusbooking.model.User;
import com.campusbooking.model.Waitlist;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.ResourceIssueRepository;
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
import java.util.Comparator;
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
    @Autowired private ResourceIssueRepository resourceIssueRepository;
    @Autowired private KitRepository kitRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private WaitlistRepository waitlistRepository;

    @Test
    @DisplayName("Expanded seeded catalogue preserves legacy resource IDs and kit compositions")
    void expandedCataloguePreservesSeededIdentitiesAndKitRelationships() {
        List<Resource> resources = resourceRepository.findAll().stream()
                .sorted(Comparator.comparing(Resource::getId))
                .toList();
        assertThat(resources).hasSize(21);
        assertThat(resources.subList(0, 9)).extracting(Resource::getId)
                .containsExactly(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L);
        assertThat(resources.subList(0, 9)).extracting(Resource::getName)
                .containsExactly("Study Room A", "Computer Lab 101", "Projector Unit #3",
                        "DSLR 4K Camera", "Heavy-Duty Tripod", "Shotgun Mic Kit",
                        "Studio Podcast Mic", "Audio Interface Mixer", "Studio Monitor Headphones");
        assertThat(resources.get(0).getLocation()).isEqualTo("Library, Level 2, A");
        assertThat(resources.get(0).getCapacity()).isEqualTo(6);
        assertThat(resources.get(2).getStatus()).isEqualTo(Resource.Status.MAINTENANCE);
        assertThat(resources.get(2).getCapacity()).isNull();

        List<Kit> kits = kitRepository.findAllWithResources().stream()
                .sorted(Comparator.comparing(Kit::getId))
                .toList();
        assertThat(kits).hasSize(4);
        assertThat(kits).extracting(Kit::getName)
                .containsExactly("Media Production Kit", "Podcast Recording Kit",
                        "Hybrid Teaching Kit", "Field Interview Kit");
        assertThat(kits.get(0).getResources()).extracting(Resource::getId)
                .containsExactlyInAnyOrder(4L, 5L, 6L);
        assertThat(kits.get(1).getResources()).extracting(Resource::getId)
                .containsExactlyInAnyOrder(7L, 8L, 9L);
        assertThat(kits.get(2).getResources()).extracting(Resource::getId)
                .containsExactlyInAnyOrder(18L, 19L);
        assertThat(kits.get(3).getResources()).extracting(Resource::getId)
                .containsExactlyInAnyOrder(4L, 5L, 20L, 21L);
    }

    @Test
    @DisplayName("Resource API serializes seeded location and capacity metadata")
    void resourceApiReturnsMetadata() throws Exception {
        String body = mockMvc.perform(get("/api/resources")
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode resources = objectMapper.readTree(body);
        assertThat(resources.size()).isEqualTo(21);
        JsonNode studyRoom = null;
        for (JsonNode resource : resources) {
            if ("Study Room A".equals(resource.path("name").asText())) {
                studyRoom = resource;
                break;
            }
        }
        assertThat(studyRoom).isNotNull();
        assertThat(studyRoom.path("location").asText()).isEqualTo("Library, Level 2, A");
        assertThat(studyRoom.path("capacity").asInt()).isEqualTo(6);
    }

    @Test
    @DisplayName("Student booking responses include the resource location")
    void studentBookingResponseIncludesLocation() throws Exception {
        User owner = saveUser("loc-" + UUID.randomUUID().toString().substring(0, 8));
        Resource resource = resourceRepository.saveAndFlush(Resource.builder()
                .name("Location Booking Resource")
                .type("ROOM")
                .location("Library, Level 2")
                .status(Resource.Status.AVAILABLE)
                .build());
        LocalDateTime start = LocalDateTime.now().plusDays(10).withNano(0);
        saveBooking(owner, resource, start, Booking.Status.PENDING);

        mockMvc.perform(get("/api/bookings/user/{userId}", owner.getId())
                        .with(user(owner.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].resourceLocation").value("Library, Level 2"));
    }

    @Test
    @DisplayName("Student Project Kit detail uses the safe catalogue DTO")
    void kitDetailReturnsOnlyCatalogueAndOperationalData() throws Exception {
        mockMvc.perform(get("/api/kits/1")
                        .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Media Production Kit"))
                .andExpect(jsonPath("$.itemCount").value(3))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].status").exists())
                .andExpect(jsonPath("$.ownerId").doesNotExist())
                .andExpect(jsonPath("$.bookings").doesNotExist());
    }

    @Test
    @DisplayName("Admin resource creation persists and returns location and capacity")
    void resourceCreationPersistsMetadata() throws Exception {
        String name = "Metadata Test Lab";
        String body = """
                {"name":"Metadata Test Lab","type":"LAB","description":"Test lab",
                 "location":"Computing Building, Level 4","capacity":12,"status":"AVAILABLE"}
                """;

        String response = mockMvc.perform(post("/api/resources")
                        .with(user("bob_admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.location").value("Computing Building, Level 4"))
                .andExpect(jsonPath("$.capacity").value(12))
                .andReturn().getResponse().getContentAsString();

        assertThat(objectMapper.readTree(response).path("name").asText()).isEqualTo(name);
        Resource saved = resourceRepository.findByName(name).orElseThrow();
        assertThat(saved.getLocation()).isEqualTo("Computing Building, Level 4");
        assertThat(saved.getCapacity()).isEqualTo(12);
    }

    @Test
    @DisplayName("Resource API rejects zero capacity with a clear validation message")
    void resourceCreationRejectsNonPositiveCapacity() throws Exception {
        mockMvc.perform(post("/api/resources")
                        .with(user("bob_admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Invalid Capacity Lab","type":"LAB","capacity":0,"status":"AVAILABLE"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("capacity: must be a positive whole number"));
    }

    @Test
    @DisplayName("Resource API allows equipment without a capacity")
    void resourceCreationAllowsNullEquipmentCapacity() throws Exception {
        mockMvc.perform(post("/api/resources")
                        .with(user("bob_admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Null Capacity Equipment","type":"EQUIPMENT","capacity":null,"status":"AVAILABLE"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.capacity").value(org.hamcrest.Matchers.nullValue()));

        assertThat(resourceRepository.findByName("Null Capacity Equipment").orElseThrow().getCapacity())
                .isNull();
    }

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
        Waitlist waitingEntry = waitlistRepository.saveAndFlush(Waitlist.builder()
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
        mockMvc.perform(get("/api/waitlists/mine")
                        .with(user(waiting.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(waitingEntry.getId()))
                .andExpect(jsonPath("$[0].status").value("OFFERED"))
                .andExpect(jsonPath("$[0].offerExpiresAt").isNotEmpty());
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
    @DisplayName("Students can read only their own issue reports")
    void studentIssueHistoryIsScopedToAuthenticatedOwner() throws Exception {
        String suffix = UUID.randomUUID().toString();
        User reporter = saveUser("issue-owner-" + suffix);
        User otherStudent = saveUser("issue-other-" + suffix);
        Resource ownResource = saveResource("Own Issue Resource " + suffix);
        Resource otherResource = saveResource("Other Issue Resource " + suffix);
        resourceIssueRepository.saveAndFlush(ResourceIssue.builder()
                .resource(ownResource)
                .reporter(reporter)
                .description("Loose power connector")
                .status(ResourceIssue.Status.PENDING)
                .build());
        resourceIssueRepository.saveAndFlush(ResourceIssue.builder()
                .resource(otherResource)
                .reporter(otherStudent)
                .description("Private report from another student")
                .status(ResourceIssue.Status.OPEN)
                .build());

        mockMvc.perform(get("/api/issues/mine")
                        .with(user(reporter.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].resourceName").value(ownResource.getName()))
                .andExpect(jsonPath("$[0].description").value("Loose power connector"))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        mockMvc.perform(get("/api/issues/mine")
                        .with(user(otherStudent.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].resourceName").value(otherResource.getName()))
                .andExpect(jsonPath("$[0].description").value("Private report from another student"));
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
