package com.campusbooking.controller;

import com.campusbooking.model.Booking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.Waitlist;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import com.campusbooking.repository.WaitlistRepository;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties =
        "spring.datasource.url=jdbc:h2:mem:lifecycleacceptance;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
@AutoConfigureMockMvc
class BookingLifecycleConcurrencyIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired BookingRepository bookings;
    @Autowired ResourceRepository resources;
    @Autowired UserRepository users;
    @Autowired WaitlistRepository waitlists;
    @Autowired PlatformTransactionManager transactionManager;

    record Fixture(Long resourceId, Long bookingId, Long waiterId, LocalDateTime start, LocalDateTime end) {}

    private Fixture fixture() {
        Resource resource = resources.saveAndFlush(Resource.builder()
                .name("Lifecycle acceptance " + UUID.randomUUID()).type("ROOM")
                .status(Resource.Status.AVAILABLE).build());
        LocalDateTime start = LocalDateTime.now().plusDays(60).withNano(0), end = start.plusHours(1);
        Booking booking = bookings.saveAndFlush(Booking.builder().resource(resource)
                .user(users.findById(6L).orElseThrow()).startTime(start).endTime(end)
                .status(Booking.Status.PENDING).build());
        Waitlist waiter = waitlists.saveAndFlush(Waitlist.builder().resource(resource)
                .user(users.findById(1L).orElseThrow()).requestedStart(start).requestedEnd(end)
                .status(Waitlist.Status.WAITING).build());
        return new Fixture(resource.getId(), booking.getId(), waiter.getId(), start, end);
    }

    private int decision(Fixture fixture, String action, CyclicBarrier barrier) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            // Simulate an entity already loaded by ownership/security before
            // another transaction changes it. Both requests observe PENDING.
            assertThat(bookings.findById(fixture.bookingId()).orElseThrow().getStatus())
                    .isEqualTo(Booking.Status.PENDING);
            try {
                barrier.await(10, TimeUnit.SECONDS);
                int responseStatus = mvc.perform(put("/api/bookings/" + fixture.bookingId() + "/" + action)
                        .with(user("bob_admin").roles("ADMIN")))
                        .andReturn().getResponse().getStatus();
                // MockMvc handles the service exception, so finish the test's
                // outer transaction as a rollback for the rejected decision.
                if (responseStatus == 409) status.setRollbackOnly();
                return responseStatus;
            } catch (Exception ex) { throw new IllegalStateException(ex); }
        });
    }

    private void race(String first, String second) throws Exception {
        Fixture f = fixture();
        var executor = Executors.newFixedThreadPool(2);
        var barrier = new CyclicBarrier(2);
        try {
            var a = executor.submit(() -> decision(f, first, barrier));
            var b = executor.submit(() -> decision(f, second, barrier));
            assertThat(List.of(a.get(20, TimeUnit.SECONDS), b.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(200, 409);
        } finally { executor.shutdownNow(); }
        Booking.Status finalStatus = bookings.findById(f.bookingId()).orElseThrow().getStatus();
        Waitlist.Status waiterStatus = waitlists.findById(f.waiterId()).orElseThrow().getStatus();
        if (finalStatus == Booking.Status.APPROVED) {
            assertThat(waiterStatus).isEqualTo(Waitlist.Status.WAITING);
            mvc.perform(put("/api/waitlists/" + f.waiterId() + "/accept")
                    .with(user("alice_student").roles("STUDENT"))).andExpect(status().isConflict());
        } else {
            assertThat(finalStatus).isIn(Booking.Status.REJECTED, Booking.Status.CANCELLED);
            assertThat(waiterStatus).isEqualTo(Waitlist.Status.OFFERED);
            assertThat(bookings.findOverlappingBookings(f.resourceId(), f.start(), f.end())).isEmpty();
            mvc.perform(put("/api/waitlists/" + f.waiterId() + "/accept")
                    .with(user("alice_student").roles("STUDENT")))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING"));
        }
        assertThat(bookings.findOverlappingBookings(f.resourceId(), f.start(), f.end())).hasSize(1);
    }

    @RepeatedTest(5)
    void approveVersusRejectCannotCreateAnOfferAlongsideAnApprovedBooking() throws Exception {
        race("approve", "reject");
    }

    @RepeatedTest(5)
    void staleApproveVersusCancelHasOneWinner() throws Exception { race("approve", "cancel"); }

    @RepeatedTest(5)
    void rejectVersusCancelReleasesExactlyOnce() throws Exception { race("reject", "cancel"); }

    @RepeatedTest(5)
    void duplicateCancellationCannotReleaseTwice() throws Exception { race("cancel", "cancel"); }

    @Test
    void laterCancellationOfAnApprovedBookingStillWorks() throws Exception {
        Fixture f = fixture();
        mvc.perform(put("/api/bookings/" + f.bookingId() + "/approve")
                .with(user("bob_admin").roles("ADMIN"))).andExpect(status().isOk());
        mvc.perform(put("/api/bookings/" + f.bookingId() + "/cancel")
                .with(user("bob_admin").roles("ADMIN"))).andExpect(status().isOk());
        assertThat(waitlists.findById(f.waiterId()).orElseThrow().getStatus()).isEqualTo(Waitlist.Status.OFFERED);
    }

    @Test
    void unsupportedMethodReturns405AndAllowWithoutChangingTheEntry() throws Exception {
        Fixture f = fixture();
        mvc.perform(post("/api/waitlists/" + f.waiterId() + "/accept")
                .with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isMethodNotAllowed()).andExpect(header().string("Allow", containsString("PUT")))
                .andExpect(jsonPath("$.status").value(405));
        assertThat(waitlists.findById(f.waiterId()).orElseThrow().getStatus()).isEqualTo(Waitlist.Status.WAITING);
        assertThat(bookings.findById(f.bookingId()).orElseThrow().getStatus()).isEqualTo(Booking.Status.PENDING);
    }
}
