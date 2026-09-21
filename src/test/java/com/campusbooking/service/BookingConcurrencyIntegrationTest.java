package com.campusbooking.service;

import com.campusbooking.dto.BookingRequestDTO;
import com.campusbooking.dto.KitBookingResponseDTO;
import com.campusbooking.dto.KitBookingRequestDTO;
import com.campusbooking.exception.BookingConflictException;
import com.campusbooking.model.Booking;
import com.campusbooking.model.Kit;
import com.campusbooking.model.KitBooking;
import com.campusbooking.model.Resource;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitRepository;
import com.campusbooking.repository.KitBookingRepository;
import com.campusbooking.repository.ResourceRepository;
import com.campusbooking.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.RepeatedTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties =
        "spring.datasource.url=jdbc:h2:mem:week8concurrency;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
class BookingConcurrencyIntegrationTest {

    @Autowired private BookingService bookingService;
    @Autowired private KitBookingService kitBookingService;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private KitRepository kitRepository;
    @Autowired private KitBookingRepository kitBookingRepository;

    @RepeatedTest(5)
    @DisplayName("Simultaneous overlapping bookings produce one winner and no duplicate active slot")
    void simultaneousBookingsAllowExactlyOneWinner() throws Exception {
        String suffix = UUID.randomUUID().toString();
        Resource resource = saveResource("Concurrent Room " + suffix);
        List<User> users = saveUsers("booking-" + suffix, 6);
        LocalDateTime start = LocalDateTime.now().plusDays(10).withNano(0);

        List<Callable<Integer>> attempts = new ArrayList<>();
        for (User user : users) {
            attempts.add(() -> {
                try {
                    bookingService.createBooking(bookingRequest(user.getId(), resource.getId(), start));
                    return 1;
                } catch (BookingConflictException expected) {
                    return 0;
                }
            });
        }

        List<Integer> results = runTogether(attempts);
        assertThat(results).containsExactlyInAnyOrder(1, 0, 0, 0, 0, 0);

        List<Booking> stored = bookingRepository.findByResourceId(resource.getId());
        assertThat(stored).hasSize(1);
        assertThat(stored.get(0).getStatus()).isEqualTo(Booking.Status.PENDING);
        assertThat(stored.get(0).getStartTime()).isEqualTo(start);
        assertThat(stored.get(0).getEndTime()).isEqualTo(start.plusHours(1));
    }

    @RepeatedTest(5)
    @DisplayName("Simultaneous Project Kit bookings leave one complete kit and no partial loser")
    void simultaneousKitBookingsAreAtomic() throws Exception {
        String suffix = UUID.randomUUID().toString();
        List<Resource> resources = List.of(
                saveResource("Kit Camera " + suffix),
                saveResource("Kit Tripod " + suffix),
                saveResource("Kit Microphone " + suffix));
        Kit kit = kitRepository.save(Kit.builder()
                .name("Concurrent Kit " + suffix)
                .description("Week 8 concurrency test kit")
                .resources(new HashSet<>(resources))
                .build());
        List<User> users = saveUsers("kit-" + suffix, 4);
        LocalDateTime start = LocalDateTime.now().plusDays(12).withNano(0);

        List<Callable<Integer>> attempts = new ArrayList<>();
        for (User user : users) {
            attempts.add(() -> {
                try {
                    KitBookingResponseDTO saved = kitBookingService.create(
                            kit.getId(), kitRequest(user.getId(), start));
                    return saved.getResourceCount();
                } catch (BookingConflictException expected) {
                    return 0;
                }
            });
        }

        List<Integer> results = runTogether(attempts);
        assertThat(results).containsExactlyInAnyOrder(3, 0, 0, 0);

        List<Booking> kitBookings = resources.stream()
                .flatMap(resource -> bookingRepository.findByResourceId(resource.getId()).stream())
                .toList();
        assertThat(kitBookings).hasSize(3);
        assertThat(kitBookings).extracting(booking -> booking.getResource().getId())
                .containsExactlyInAnyOrderElementsOf(resources.stream().map(Resource::getId).toList());
        assertThat(kitBookings).extracting(booking -> booking.getUser().getId()).containsOnly(
                kitBookings.get(0).getUser().getId());
        assertThat(kitBookings).allMatch(booking -> booking.getKitBooking() != null);
        assertThat(kitBookings).extracting(booking -> booking.getKitBooking().getId())
                .containsOnly(kitBookings.get(0).getKitBooking().getId());
    }

    @RepeatedTest(5)
    @DisplayName("A Project Kit and single-resource request cannot both win the same slot")
    void kitVsSingleResourceRaceHasOneCompleteWinner() throws Exception {
        String suffix = UUID.randomUUID().toString();
        Resource shared = saveResource("Shared Camera " + suffix);
        Resource second = saveResource("Shared Tripod " + suffix);
        Resource third = saveResource("Shared Mic " + suffix);
        Kit kit = kitRepository.save(Kit.builder()
                .name("Mixed Race Kit " + suffix)
                .description("Kit versus standalone race")
                .resources(new HashSet<>(List.of(shared, second, third)))
                .build());
        List<User> users = saveUsers("mixed-" + suffix, 2);
        LocalDateTime start = LocalDateTime.now().plusDays(15).withNano(0);

        List<Callable<Integer>> attempts = List.of(
                () -> {
                    try {
                        return kitBookingService.create(
                                kit.getId(), kitRequest(users.get(0).getId(), start)).getResourceCount();
                    } catch (BookingConflictException expected) {
                        return 0;
                    }
                },
                () -> {
                    try {
                        bookingService.createBooking(
                                bookingRequest(users.get(1).getId(), shared.getId(), start));
                        return 1;
                    } catch (BookingConflictException expected) {
                        return 0;
                    }
                });

        List<Integer> results = runTogether(attempts);
        assertThat(results).contains(0);
        assertThat(results.stream().filter(value -> value > 0).count()).isEqualTo(1);
        assertThat(results.stream().mapToInt(Integer::intValue).sum()).isIn(1, 3);

        List<Booking> sharedBookings = bookingRepository.findByResourceId(shared.getId());
        assertThat(sharedBookings).hasSize(1);
        long totalForRace = List.of(shared, second, third).stream()
                .flatMap(resource -> bookingRepository.findByResourceId(resource.getId()).stream())
                .count();
        assertThat(totalForRace).isIn(1L, 3L);
    }

    @RepeatedTest(5)
    @DisplayName("Reject and cancel races leave one uniform terminal Kit aggregate")
    void lifecycleRaceLeavesOneConsistentTerminalState() throws Exception {
        String suffix = UUID.randomUUID().toString();
        List<Resource> resources = List.of(
                saveResource("Lifecycle Camera " + suffix),
                saveResource("Lifecycle Mic " + suffix));
        Kit kit = kitRepository.save(Kit.builder()
                .name("Lifecycle Kit " + suffix)
                .resources(new HashSet<>(resources))
                .build());
        User owner = saveUsers("lifecycle-" + suffix, 1).get(0);
        LocalDateTime start = LocalDateTime.now().plusDays(18).withNano(0);
        Long parentId = kitBookingService.create(
                kit.getId(), kitRequest(owner.getId(), start)).getId();

        List<Callable<Integer>> attempts = List.of(
                () -> {
                    try {
                        kitBookingService.reject(parentId);
                        return 1;
                    } catch (ResponseStatusException expected) {
                        return 0;
                    }
                },
                () -> {
                    try {
                        kitBookingService.cancel(parentId);
                        return 1;
                    } catch (ResponseStatusException expected) {
                        return 0;
                    }
                });

        assertThat(runTogether(attempts)).containsExactlyInAnyOrder(1, 0);
        KitBooking parent = kitBookingRepository.findById(parentId).orElseThrow();
        List<Booking> children = bookingRepository.findByKitBookingIdOrderByResourceId(parentId);
        if (parent.getStatus() == KitBooking.Status.REJECTED) {
            assertThat(children).allMatch(child -> child.getStatus() == Booking.Status.REJECTED);
        } else {
            assertThat(parent.getStatus()).isEqualTo(KitBooking.Status.CANCELLED);
            assertThat(children).allMatch(child -> child.getStatus() == Booking.Status.CANCELLED);
        }
    }

    private Resource saveResource(String name) {
        return resourceRepository.save(Resource.builder()
                .name(name)
                .type("EQUIPMENT")
                .status(Resource.Status.AVAILABLE)
                .build());
    }

    private List<User> saveUsers(String prefix, int count) {
        List<User> users = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            users.add(userRepository.save(User.builder()
                    .username(prefix + "-" + i)
                    .password("test-only")
                    .email(prefix + "-" + i + "@test.local")
                    .role(User.Role.STUDENT)
                    .build()));
        }
        return users;
    }

    private BookingRequestDTO bookingRequest(Long userId, Long resourceId, LocalDateTime start) {
        BookingRequestDTO request = new BookingRequestDTO();
        request.setUserId(userId);
        request.setResourceId(resourceId);
        request.setStartTime(start);
        request.setEndTime(start.plusHours(1));
        return request;
    }

    private KitBookingRequestDTO kitRequest(Long userId, LocalDateTime start) {
        KitBookingRequestDTO request = new KitBookingRequestDTO();
        request.setUserId(userId);
        request.setStartTime(start);
        request.setEndTime(start.plusHours(2));
        return request;
    }

    private <T> List<T> runTogether(List<Callable<T>> tasks) throws Exception {
        CyclicBarrier startGate = new CyclicBarrier(tasks.size());
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        try {
            List<Future<T>> futures = new ArrayList<>();
            for (Callable<T> task : tasks) {
                futures.add(pool.submit(() -> {
                    startGate.await(5, TimeUnit.SECONDS);
                    return task.call();
                }));
            }

            List<T> results = new ArrayList<>();
            for (Future<T> future : futures) {
                results.add(future.get(15, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            pool.shutdownNow();
            assertThat(pool.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }
    }
}
