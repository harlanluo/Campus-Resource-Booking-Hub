package com.campusbooking.controller;

import com.campusbooking.model.Booking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.model.Waitlist;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import com.campusbooking.repository.WaitlistRepository;
import com.campusbooking.service.WaitlistService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class WaitlistOfferIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private WaitlistRepository waitlistRepository;
    @Autowired private WaitlistService waitlistService;

    @Test
    void authenticatedJoinStoresExactSlotAndRejectsAvailableMaintenanceDuplicateAndInvalidIntervals()
            throws Exception {
        Fixture fixture = fixture("join");
        Booking conflict = booking(fixture.owner, fixture.resource, fixture.start, fixture.end,
                Booking.Status.APPROVED);

        var joinResult = mockMvc.perform(post("/api/waitlists")
                        .with(user(fixture.first.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(joinJson(fixture.resource.getId(), fixture.start, fixture.end)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requestedStart").value(fixture.start.toString()))
                .andExpect(jsonPath("$.requestedEnd").value(fixture.end.toString()))
                .andExpect(jsonPath("$.queuePosition").value(1))
                .andReturn();
        String created = joinResult.getResponse().getContentAsString();
        long id = objectMapper.readTree(created).get("id").asLong();
        assertThat(waitlistRepository.findById(id).orElseThrow().getUser().getId())
                .isEqualTo(fixture.first.getId());

        MockHttpSession session = (MockHttpSession) joinResult.getRequest().getSession(false);
        mockMvc.perform(get("/api/waitlists/mine").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].resourceId").value(fixture.resource.getId()))
                .andExpect(jsonPath("$[0].requestedStart").value(fixture.start.toString()))
                .andExpect(jsonPath("$[0].requestedEnd").value(fixture.end.toString()));

        mockMvc.perform(post("/api/waitlists")
                        .with(user(fixture.first.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(joinJson(fixture.resource.getId(), fixture.start, fixture.end)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("already")));

        Resource free = resource("Free " + fixture.suffix, Resource.Status.AVAILABLE);
        mockMvc.perform(post("/api/waitlists")
                        .with(user(fixture.first.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(joinJson(free.getId(), fixture.start, fixture.end)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("available")));

        Resource maintenance = resource("Maintenance " + fixture.suffix, Resource.Status.MAINTENANCE);
        mockMvc.perform(post("/api/waitlists")
                        .with(user(fixture.first.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(joinJson(maintenance.getId(), fixture.start, fixture.end)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("maintenance")));

        mockMvc.perform(post("/api/waitlists")
                        .with(user(fixture.first.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(joinJson(fixture.resource.getId(), fixture.end, fixture.start)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/waitlists")
                        .with(user(fixture.first.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(joinJson(fixture.resource.getId(),
                                LocalDateTime.now().minusHours(2), LocalDateTime.now().minusHours(1))))
                .andExpect(status().isBadRequest());
        assertThat(conflict.getStatus()).isEqualTo(Booking.Status.APPROVED);
    }

    @Test
    void fifoOfferDoesNotCreateOverlappingHoldsOrABooking() {
        Fixture fixture = fixture("fifo");
        LocalDateTime joined = LocalDateTime.now().minusMinutes(5).withNano(0);
        Waitlist first = wait(fixture.first, fixture.resource, fixture.start, fixture.end, joined);
        Waitlist second = wait(fixture.second, fixture.resource, fixture.start, fixture.end, joined);
        Waitlist differentEnd = wait(fixture.third, fixture.resource, fixture.start,
                fixture.end.plusMinutes(30), joined.minusMinutes(1));
        Resource otherResource = resource("Other " + fixture.suffix, Resource.Status.AVAILABLE);
        Waitlist differentResource = wait(fixture.third, otherResource, fixture.start, fixture.end,
                joined.minusMinutes(2));
        long before = bookingRepository.count();

        waitlistService.offerReleasedSlot(fixture.resource, fixture.start, fixture.end);

        assertThat(waitlistRepository.findById(first.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.OFFERED);
        assertThat(waitlistRepository.findById(second.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
        assertThat(waitlistRepository.findById(differentEnd.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
        assertThat(waitlistRepository.findById(differentResource.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
        assertThat(bookingRepository.count()).isEqualTo(before);

        waitlistService.offerReleasedSlot(fixture.resource, fixture.start, fixture.end);
        assertThat(List.of(first.getId(), second.getId()).stream()
                .map(id -> waitlistRepository.findById(id).orElseThrow())
                .filter(item -> item.getStatus() == Waitlist.Status.OFFERED))
                .hasSize(1);
    }

    @Test
    void adminCancellationOffersExactSlotAndMineApiReturnsUpdatedState() throws Exception {
        Fixture fixture = fixture("task5-admin-cancel-repro");
        LocalDateTime start = LocalDateTime.of(2031, 4, 15, 9, 0, 17);
        LocalDateTime end = LocalDateTime.of(2031, 4, 15, 11, 0, 17);
        Booking blocking = booking(fixture.owner, fixture.resource, start, end, Booking.Status.APPROVED);
        Waitlist waiting = wait(fixture.first, fixture.resource, start, end,
                LocalDateTime.of(2031, 4, 14, 12, 0));
        Waitlist nextExact = wait(fixture.second, fixture.resource, start, end,
                LocalDateTime.of(2031, 4, 14, 12, 1));
        Waitlist differentStart = wait(fixture.third, fixture.resource,
                start.plusMinutes(30), end, LocalDateTime.of(2031, 4, 14, 12, 2));
        Waitlist differentEnd = wait(fixture.owner, fixture.resource,
                start, end.plusMinutes(30), LocalDateTime.of(2031, 4, 14, 12, 3));
        Resource otherResource = resource("Other task5-admin-cancel-repro", Resource.Status.AVAILABLE);
        Waitlist differentResource = wait(fixture.third, otherResource, start, end,
                LocalDateTime.of(2031, 4, 14, 12, 4));

        System.out.printf("TASK5 BUG A REPRO: resourceId=%d resourceName=%s start=%s end=%s blockingBookingId=%d waitlistEntryId=%d%n",
                fixture.resource.getId(), fixture.resource.getName(), start, end, blocking.getId(), waiting.getId());

        mockMvc.perform(put("/api/bookings/{id}/cancel", blocking.getId())
                        .with(user("waitlist-admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        mockMvc.perform(get("/api/waitlists/mine")
                        .with(user(fixture.first.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(waiting.getId()))
                .andExpect(jsonPath("$[0].resourceId").value(fixture.resource.getId()))
                .andExpect(jsonPath("$[0].requestedStart").value(start.toString()))
                .andExpect(jsonPath("$[0].requestedEnd").value(end.toString()))
                .andExpect(jsonPath("$[0].status").value("OFFERED"))
                .andExpect(jsonPath("$[0].offerExpiresAt").isNotEmpty());

        assertThat(waitlistRepository.findById(nextExact.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
        assertThat(waitlistRepository.findById(differentStart.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
        assertThat(waitlistRepository.findById(differentEnd.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
        assertThat(waitlistRepository.findById(differentResource.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
    }

    @Test
    void cancellingLargerBookingDoesNotOfferNonMatchingContainedRequest()
            throws Exception {
        Fixture fixture = fixture("contained-cancel");
        LocalDateTime requestedStart = fixture.start.plusMinutes(30);
        LocalDateTime requestedEnd = fixture.end.minusMinutes(30);
        Booking released = booking(fixture.owner, fixture.resource, fixture.start, fixture.end,
                Booking.Status.APPROVED);
        Waitlist eligible = wait(fixture.first, fixture.resource, requestedStart, requestedEnd,
                LocalDateTime.now().minusMinutes(2));

        mockMvc.perform(put("/api/bookings/{id}/cancel", released.getId())
                        .with(user(fixture.owner.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        assertThat(waitlistRepository.findById(eligible.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);

        Fixture blockedFixture = fixture("remaining-blocker");
        LocalDateTime blockedStart = blockedFixture.start.plusMinutes(30);
        LocalDateTime blockedEnd = blockedFixture.end.minusMinutes(30);
        Booking one = booking(blockedFixture.owner, blockedFixture.resource,
                blockedFixture.start, blockedFixture.end, Booking.Status.APPROVED);
        booking(blockedFixture.second, blockedFixture.resource,
                blockedStart.minusMinutes(5), blockedEnd.plusMinutes(5), Booking.Status.PENDING);
        Waitlist blocked = wait(blockedFixture.first, blockedFixture.resource,
                blockedStart, blockedEnd, LocalDateTime.now().minusMinutes(1));

        mockMvc.perform(put("/api/bookings/{id}/cancel", one.getId())
                        .with(user(blockedFixture.owner.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk());
        assertThat(waitlistRepository.findById(blocked.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
    }

    @Test
    void rejectingLargerPendingBookingDoesNotOfferNonMatchingContainedRequest() throws Exception {
        Fixture fixture = fixture("contained-reject");
        LocalDateTime requestedStart = fixture.start.plusMinutes(30);
        LocalDateTime requestedEnd = fixture.end.minusMinutes(30);
        Booking blocking = booking(fixture.owner, fixture.resource, fixture.start, fixture.end,
                Booking.Status.PENDING);
        Waitlist eligible = wait(fixture.first, fixture.resource, requestedStart, requestedEnd,
                LocalDateTime.now().minusMinutes(1));

        mockMvc.perform(put("/api/bookings/{id}/reject", blocking.getId())
                        .with(user("waitlist-admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
        assertThat(waitlistRepository.findById(eligible.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
    }

    @Test
    void adminRejectionOffersNextExactSlotEntryOnly() throws Exception {
        Fixture fixture = fixture("admin-reject-exact");
        Booking blocking = booking(fixture.owner, fixture.resource, fixture.start, fixture.end,
                Booking.Status.PENDING);
        Waitlist first = wait(fixture.first, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(3));
        Waitlist second = wait(fixture.second, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(2));

        mockMvc.perform(put("/api/bookings/{id}/reject", blocking.getId())
                        .with(user("waitlist-admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        assertThat(waitlistRepository.findById(first.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.OFFERED);
        assertThat(waitlistRepository.findById(second.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);
    }

    @Test
    void adminOverviewAggregatesActiveSlotsWithoutExposingStudentIdentity() throws Exception {
        Fixture fixture = fixture("admin-overview");
        wait(fixture.first, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(3));
        wait(fixture.second, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(2));
        Waitlist terminal = wait(fixture.third, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(1));
        terminal.setStatus(Waitlist.Status.LEFT);
        terminal.setClosedAt(LocalDateTime.now());
        waitlistRepository.saveAndFlush(terminal);
        waitlistService.offerReleasedSlot(fixture.resource, fixture.start, fixture.end);

        mockMvc.perform(get("/api/waitlists/admin/overview")
                        .with(user(fixture.first.getUsername()).roles("STUDENT")))
                .andExpect(status().isForbidden());

        String body = mockMvc.perform(get("/api/waitlists/admin/overview")
                        .with(user("waitlist-admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode row = null;
        for (JsonNode candidate : objectMapper.readTree(body)) {
            if (candidate.get("resourceId").asLong() == fixture.resource.getId()) {
                row = candidate;
                break;
            }
        }
        assertThat(row).isNotNull();
        assertThat(row.get("waitingCount").asLong()).isEqualTo(1);
        assertThat(row.get("activeOffer").asBoolean()).isTrue();
        assertThat(row.get("status").asText()).isEqualTo("OFFERED");
        assertThat(row.get("offerExpiresAt").isNull()).isFalse();
        assertThat(body).doesNotContain(fixture.first.getUsername(), fixture.second.getUsername(),
                fixture.first.getEmail(), fixture.second.getEmail());
    }

    @Test
    void offerIsPrivateHoldRecipientAcceptsOnePendingBookingAndRepeatIsRejected() throws Exception {
        Fixture fixture = fixture("accept");
        Waitlist offer = wait(fixture.first, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(2));
        waitlistService.offerReleasedSlot(fixture.resource, fixture.start, fixture.end);

        mockMvc.perform(post("/api/bookings")
                        .with(user(fixture.second.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingJson(fixture.second.getId(), fixture.resource.getId(),
                                fixture.start, fixture.end)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString(fixture.first.getUsername()))));

        mockMvc.perform(get("/api/waitlists/{id}", offer.getId())
                        .with(user(fixture.second.getUsername()).roles("STUDENT")))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/waitlists/{id}/accept", offer.getId())
                        .with(user(fixture.second.getUsername()).roles("STUDENT")))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/waitlists/{id}/decline", offer.getId())
                        .with(user(fixture.second.getUsername()).roles("STUDENT")))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/waitlists/{id}", offer.getId())
                        .with(user(fixture.second.getUsername()).roles("STUDENT")))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/waitlists/{id}/accept", offer.getId())
                        .with(user(fixture.first.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
        mockMvc.perform(put("/api/waitlists/{id}/accept", offer.getId())
                        .with(user(fixture.first.getUsername()).roles("STUDENT")))
                .andExpect(status().isConflict());

        List<Booking> accepted = bookingRepository.findByResourceId(fixture.resource.getId()).stream()
                .filter(item -> item.getUser().getId().equals(fixture.first.getId()))
                .filter(item -> item.getStartTime().equals(fixture.start) && item.getEndTime().equals(fixture.end))
                .toList();
        assertThat(accepted).singleElement()
                .extracting(Booking::getStatus).isEqualTo(Booking.Status.PENDING);
    }

    @Test
    void declineAndExpiryAdvanceSameSlotWhileClosedEntriesDoNotCount() throws Exception {
        Fixture fixture = fixture("advance");
        Waitlist first = wait(fixture.first, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(3));
        Waitlist second = wait(fixture.second, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(2));
        Waitlist different = wait(fixture.third, fixture.resource, fixture.start.plusHours(3),
                fixture.end.plusHours(3), LocalDateTime.now().minusMinutes(4));
        waitlistService.offerReleasedSlot(fixture.resource, fixture.start, fixture.end);

        mockMvc.perform(put("/api/waitlists/{id}/decline", first.getId())
                        .with(user(fixture.first.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk());
        assertThat(waitlistRepository.findById(first.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.DECLINED);
        assertThat(waitlistRepository.findById(second.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.OFFERED);
        assertThat(waitlistRepository.findById(different.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.WAITING);

        Waitlist expiring = waitlistRepository.findById(second.getId()).orElseThrow();
        expiring.setOfferExpiresAt(LocalDateTime.now().minusSeconds(1));
        waitlistRepository.saveAndFlush(expiring);
        Waitlist third = wait(fixture.third, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(1));

        mockMvc.perform(put("/api/waitlists/{id}/accept", second.getId())
                        .with(user(fixture.second.getUsername()).roles("STUDENT")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("expired")));
        assertThat(waitlistRepository.findById(second.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.EXPIRED);
        assertThat(waitlistRepository.findById(third.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.OFFERED);
    }

    @Test
    void leavingOwnWaitingEntryRefreshesQueuePositionAndAllowsRejoin() throws Exception {
        Fixture fixture = fixture("leave");
        booking(fixture.owner, fixture.resource, fixture.start, fixture.end, Booking.Status.PENDING);
        Waitlist first = wait(fixture.first, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(2));
        wait(fixture.second, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(1));

        mockMvc.perform(delete("/api/waitlists/{id}", first.getId())
                        .with(user(fixture.first.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/waitlists/mine")
                        .with(user(fixture.second.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].queuePosition").value(1));
        mockMvc.perform(post("/api/waitlists")
                        .with(user(fixture.first.getUsername()).roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(joinJson(fixture.resource.getId(), fixture.start, fixture.end)))
                .andExpect(status().isCreated());
    }

    @Test
    void mineIncludesOwnWaitlistHistoryWithoutShowingAnotherStudentsEntries() throws Exception {
        Fixture fixture = fixture("mine-history");
        Waitlist accepted = wait(fixture.first, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(4));
        accepted.setStatus(Waitlist.Status.ACCEPTED);
        waitlistRepository.saveAndFlush(accepted);
        Waitlist declined = wait(fixture.first, fixture.resource, fixture.start.plusHours(3), fixture.end.plusHours(3),
                LocalDateTime.now().minusMinutes(3));
        declined.setStatus(Waitlist.Status.DECLINED);
        waitlistRepository.saveAndFlush(declined);
        Waitlist expired = wait(fixture.first, fixture.resource, fixture.start.plusHours(6), fixture.end.plusHours(6),
                LocalDateTime.now().minusMinutes(2));
        expired.setStatus(Waitlist.Status.EXPIRED);
        waitlistRepository.saveAndFlush(expired);
        Waitlist left = wait(fixture.first, fixture.resource, fixture.start.plusHours(9), fixture.end.plusHours(9),
                LocalDateTime.now().minusMinutes(1));
        left.setStatus(Waitlist.Status.LEFT);
        waitlistRepository.saveAndFlush(left);
        wait(fixture.second, fixture.resource, fixture.start, fixture.end, LocalDateTime.now());

        mockMvc.perform(get("/api/waitlists/mine")
                        .with(user(fixture.first.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(4)))
                .andExpect(jsonPath("$[*].status", org.hamcrest.Matchers.containsInAnyOrder(
                        "ACCEPTED", "DECLINED", "EXPIRED", "LEFT")))
                .andExpect(jsonPath("$[*].resourceName",
                        org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.equalTo(fixture.resource.getName()))));

        mockMvc.perform(get("/api/waitlists/mine")
                        .with(user(fixture.second.getUsername()).roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("WAITING"));
    }

    @Test
    void simultaneousAcceptanceCreatesExactlyOneBooking() throws Exception {
        Fixture fixture = fixture("race");
        Waitlist offer = wait(fixture.first, fixture.resource, fixture.start, fixture.end,
                LocalDateTime.now().minusMinutes(1));
        waitlistService.offerReleasedSlot(fixture.resource, fixture.start, fixture.end);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch startGate = new CountDownLatch(1);
        Callable<Boolean> attempt = () -> {
            ready.countDown();
            startGate.await();
            try {
                waitlistService.acceptOffer(fixture.first.getUsername(), offer.getId());
                return true;
            } catch (ResponseStatusException expected) {
                return false;
            }
        };
        Future<Boolean> one = executor.submit(attempt);
        Future<Boolean> two = executor.submit(attempt);
        ready.await();
        startGate.countDown();
        assertThat(List.of(one.get(), two.get())).containsExactlyInAnyOrder(true, false);
        executor.shutdownNow();

        assertThat(bookingRepository.findByResourceId(fixture.resource.getId()).stream()
                .filter(item -> item.getStartTime().equals(fixture.start)
                        && item.getEndTime().equals(fixture.end)
                        && item.getUser().getId().equals(fixture.first.getId())))
                .hasSize(1);
        assertThat(waitlistRepository.findById(offer.getId()).orElseThrow().getStatus())
                .isEqualTo(Waitlist.Status.ACCEPTED);
    }

    private Fixture fixture(String label) {
        String suffix = label + "-" + UUID.randomUUID().toString().substring(0, 8);
        User owner = saveUser("owner-" + suffix);
        User first = saveUser("first-" + suffix);
        User second = saveUser("second-" + suffix);
        User third = saveUser("third-" + suffix);
        Resource resource = resource("Room " + suffix, Resource.Status.AVAILABLE);
        LocalDateTime start = LocalDateTime.now().plusDays(30).withNano(0);
        return new Fixture(suffix, owner, first, second, third, resource, start, start.plusHours(2));
    }

    private User saveUser(String username) {
        return userRepository.save(User.builder().username(username).password("test-only")
                .email(username + "@test.local").role(User.Role.STUDENT).build());
    }

    private Resource resource(String name, Resource.Status status) {
        return resourceRepository.save(Resource.builder().name(name).type("ROOM")
                .status(status).build());
    }

    private Booking booking(
            User owner, Resource resource, LocalDateTime start, LocalDateTime end, Booking.Status status) {
        return bookingRepository.saveAndFlush(Booking.builder().user(owner).resource(resource)
                .startTime(start).endTime(end).status(status).build());
    }

    private Waitlist wait(
            User user, Resource resource, LocalDateTime start, LocalDateTime end, LocalDateTime joined) {
        return waitlistRepository.saveAndFlush(Waitlist.builder().user(user).resource(resource)
                .requestedStart(start).requestedEnd(end).requestTime(joined)
                .status(Waitlist.Status.WAITING).build());
    }

    private String joinJson(Long resourceId, LocalDateTime start, LocalDateTime end) {
        return """
                {"resourceId":%d,"startTime":"%s","endTime":"%s","userId":999999}
                """.formatted(resourceId, start, end);
    }

    private String bookingJson(Long userId, Long resourceId, LocalDateTime start, LocalDateTime end) {
        return """
                {"userId":%d,"resourceId":%d,"startTime":"%s","endTime":"%s"}
                """.formatted(userId, resourceId, start, end);
    }

    private record Fixture(
            String suffix, User owner, User first, User second, User third,
            Resource resource, LocalDateTime start, LocalDateTime end) { }
}
