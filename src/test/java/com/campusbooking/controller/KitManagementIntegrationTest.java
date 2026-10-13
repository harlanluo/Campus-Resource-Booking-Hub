package com.campusbooking.controller;

import com.campusbooking.model.*;
import com.campusbooking.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class KitManagementIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ResourceRepository resources;
    @Autowired KitRepository kits;
    @Autowired KitBookingRepository parents;
    @Autowired BookingRepository children;
    @Autowired UserRepository users;
    @Autowired WaitlistRepository waitlists;

    private Resource resource(Resource.Status status) {
        return resources.saveAndFlush(Resource.builder().name("kit-component-" + UUID.randomUUID())
                .type("EQUIPMENT").status(status).build());
    }
    private long create(String name, List<Long> ids) throws Exception {
        String json = mapper.writeValueAsString(Map.of("name", name, "description", "Test kit", "resourceIds", ids));
        String body = mvc.perform(post("/api/kits").with(user("bob_admin").roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content(json)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).get("id").asLong();
    }
    private String booking(long kit) {
        LocalDateTime start = LocalDateTime.now().plusDays(45).withNano(0);
        return "{\"userId\":1,\"startTime\":\"" + start + "\",\"endTime\":\"" + start.plusHours(2) + "\"}";
    }

    @Test
    void createOneAndMultipleResourcesThenDeleteUnreferencedWithoutDeletingComponents() throws Exception {
        Resource a = resource(Resource.Status.AVAILABLE), b = resource(Resource.Status.AVAILABLE);
        String name = "New Kit " + UUID.randomUUID();
        long one = create("  " + name + "  ", List.of(a.getId()));
        mvc.perform(get("/api/kits/" + one).with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value(name)).andExpect(jsonPath("$.itemCount").value(1));
        long multiple = create("Multiple " + UUID.randomUUID(), List.of(a.getId(), b.getId()));
        mvc.perform(post("/api/kits/" + multiple + "/book").with(user("alice_student").roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON).content(booking(multiple)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDING"));
        assertThat(parents.findAll().stream().filter(p -> p.getKit().getId().equals(multiple))).hasSize(1);
        mvc.perform(delete("/api/kits/" + one).with(user("bob_admin").roles("ADMIN"))).andExpect(status().isNoContent());
        assertThat(kits.findById(one)).isEmpty();
        assertThat(resources.findById(a.getId())).isPresent(); assertThat(resources.findById(b.getId())).isPresent();
        mvc.perform(get("/api/kits/" + one).with(user("alice_student").roles("STUDENT"))).andExpect(status().isNotFound());
    }

    @Test
    void validationAndRoleChecksPreventPartialCreation() throws Exception {
        Resource r = resource(Resource.Status.AVAILABLE);
        String name = "Unique " + UUID.randomUUID();
        long id = create(name, List.of(r.getId()));
        long before = kits.count();
        for (String json : List.of(
                "{not-json}",
                "{\"name\":\"Invalid ID type\",\"resourceIds\":[\"not-a-number\"]}",
                "{\"name\":\"Fractional ID\",\"resourceIds\":[1.9]}",
                "{\"name\":\"String ID\",\"resourceIds\":[\"1\"]}",
                "{\"name\":\"Boolean ID\",\"resourceIds\":[true]}",
                "{\"name\":\"Overflow ID\",\"resourceIds\":[9223372036854775808]}",
                "{\"name\":\" \" ,\"resourceIds\":[" + r.getId() + "]}",
                "{\"name\":\"Empty\",\"resourceIds\":[]}",
                "{\"name\":\"Duplicate components\",\"resourceIds\":[" + r.getId() + "," + r.getId() + "]}",
                "{\"name\":\"Missing\",\"resourceIds\":[9223372036854775807]}",
                "{\"name\":\"Null\",\"resourceIds\":[null]}",
                "{\"name\":\"Negative\",\"resourceIds\":[-1]}",
                mapper.writeValueAsString(Map.of("name", "x".repeat(101), "resourceIds", List.of(r.getId()))),
                mapper.writeValueAsString(Map.of("name", "Long description", "description", "x".repeat(501), "resourceIds", List.of(r.getId()))))) {
            mvc.perform(post("/api/kits").with(user("bob_admin").roles("ADMIN"))
                    .contentType(MediaType.APPLICATION_JSON).content(json)).andExpect(status().isBadRequest());
        }
        String duplicate = mapper.writeValueAsString(Map.of("name", " " + name + " ", "resourceIds", List.of(r.getId())));
        mvc.perform(post("/api/kits").with(user("bob_admin").roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content(duplicate)).andExpect(status().isConflict());
        mvc.perform(post("/api/kits").with(user("alice_student").roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON).content(duplicate)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/kits/" + id).with(user("alice_student").roles("STUDENT"))).andExpect(status().isForbidden());
        assertThat(kits.count()).isEqualTo(before);
    }

    @ParameterizedTest
    @EnumSource(KitBooking.Status.class)
    void anyBookingHistoryBlocksDeletion(KitBooking.Status state) throws Exception {
        Resource r = resource(Resource.Status.AVAILABLE);
        long id = create("History " + UUID.randomUUID(), List.of(r.getId()));
        LocalDateTime start = LocalDateTime.of(2020, 1, 1, 10, 0);
        KitBooking parent = parents.saveAndFlush(KitBooking.builder().kit(kits.findById(id).orElseThrow())
                .user(users.findById(1L).orElseThrow()).startTime(start).endTime(start.plusHours(2))
                .resourceCount(1).status(state).build());
        mvc.perform(delete("/api/kits/" + id).with(user("bob_admin").roles("ADMIN")))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("history")));
        assertThat(kits.findById(id)).isPresent(); assertThat(parents.findById(parent.getId())).isPresent();
        assertThat(resources.findById(r.getId())).isPresent();
    }

    @Test
    void maintenanceComponentIsVisibleAndBlocksBooking() throws Exception {
        Resource r = resource(Resource.Status.MAINTENANCE);
        long id = create("Maintenance " + UUID.randomUUID(), List.of(r.getId()));
        mvc.perform(get("/api/kits/" + id).with(user("alice_student").roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].status").value("MAINTENANCE"));
        mvc.perform(post("/api/kits/" + id + "/book").with(user("alice_student").roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON).content(booking(id))).andExpect(status().isConflict());
        assertThat(parents.existsByKitId(id)).isFalse();
    }

    @org.junit.jupiter.api.RepeatedTest(5)
    void bookingVersusDeleteHasOneWinnerAndNoOrphans() throws Exception {
        Resource r = resource(Resource.Status.AVAILABLE);
        long id = create("Race " + UUID.randomUUID(), List.of(r.getId()));
        String request = booking(id);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2), gate = new CountDownLatch(1);
        Callable<Integer> book = () -> {
            ready.countDown(); gate.await();
            return mvc.perform(post("/api/kits/" + id + "/book").with(user("alice_student").roles("STUDENT"))
                    .contentType(MediaType.APPLICATION_JSON).content(request)).andReturn().getResponse().getStatus();
        };
        Callable<Integer> remove = () -> {
            ready.countDown(); gate.await();
            return mvc.perform(delete("/api/kits/" + id).with(user("bob_admin").roles("ADMIN")))
                    .andReturn().getResponse().getStatus();
        };
        try {
            Future<Integer> one = executor.submit(book), two = executor.submit(remove);
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue(); gate.countDown();
            int booked = one.get(15, TimeUnit.SECONDS), deleted = two.get(15, TimeUnit.SECONDS);
            assertThat((booked == 201 && deleted == 409) || (booked == 404 && deleted == 204)).isTrue();
            assertThat(parents.existsByKitId(id)).isEqualTo(booked == 201);
            assertThat(kits.findById(id).isPresent()).isEqualTo(booked == 201);
            assertThat(resources.findById(r.getId())).isPresent();
            assertThat(children.findByResourceId(r.getId())).hasSize(booked == 201 ? 1 : 0);
        } finally { gate.countDown(); executor.shutdownNow(); }
    }

    @Test
    void concurrentSameNameCreationHasOneWinnerAndNoPartialKit() throws Exception {
        Resource a = resource(Resource.Status.AVAILABLE), b = resource(Resource.Status.AVAILABLE);
        String name = "Same name " + UUID.randomUUID();
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2), gate = new CountDownLatch(1);
        try {
            List<Future<Integer>> attempts = new ArrayList<>();
            for (Resource r : List.of(a, b)) {
                String request = mapper.writeValueAsString(Map.of("name", name, "resourceIds", List.of(r.getId())));
                attempts.add(executor.submit(() -> {
                    ready.countDown(); gate.await();
                    return mvc.perform(post("/api/kits").with(user("bob_admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON).content(request)).andReturn().getResponse().getStatus();
                }));
            }
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue(); gate.countDown();
            assertThat(List.of(attempts.get(0).get(15, TimeUnit.SECONDS), attempts.get(1).get(15, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(201, 409);
            var matching = kits.findAllWithResources().stream().filter(k -> k.getName().equals(name)).toList();
            assertThat(matching).hasSize(1);
            assertThat(matching.get(0).getResources()).hasSize(1);
        } finally { gate.countDown(); executor.shutdownNow(); }
    }

    @Test
    void newlyCreatedKitAvailabilityIntersectsItsComponentSchedules() throws Exception {
        Resource a = resource(Resource.Status.AVAILABLE), b = resource(Resource.Status.AVAILABLE);
        long id = create("Availability " + UUID.randomUUID(), List.of(a.getId(), b.getId()));
        LocalDateTime start = LocalDateTime.now().plusDays(80).withHour(10).withMinute(0).withSecond(0).withNano(0);
        children.saveAndFlush(Booking.builder().user(users.findById(1L).orElseThrow()).resource(a)
                .startTime(start).endTime(start.plusHours(1)).status(Booking.Status.APPROVED).build());
        mvc.perform(get("/api/kits/" + id + "/availability").with(user("alice_student").roles("STUDENT"))
                .param("start", start.toString()).param("end", start.plusHours(2).toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.resourceCount").value(2))
                .andExpect(jsonPath("$.slots[0].status").value("BOOKED"))
                .andExpect(jsonPath("$.slots[-1:].status", org.hamcrest.Matchers.hasItem("AVAILABLE")));
    }

    @Test
    void october15SeedBlockerAndWaitlistShareResourceAndExactSlot() {
        LocalDateTime start = LocalDateTime.of(2026, 10, 15, 10, 0), end = start.plusHours(2);
        assertThat(children.findByResourceId(1L)).anyMatch(b -> b.getUser().getId().equals(6L)
                && b.getStartTime().equals(start) && b.getEndTime().equals(end) && b.getStatus() == Booking.Status.APPROVED);
        assertThat(waitlists.findByUserId(1L)).anyMatch(w -> w.getResource().getId().equals(1L)
                && w.getRequestedStart().equals(start) && w.getRequestedEnd().equals(end));
    }
}
