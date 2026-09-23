package com.campusbooking.service;

import com.campusbooking.model.Booking;
import com.campusbooking.model.KitBooking;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitBookingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties =
        "spring.datasource.url=jdbc:h2:mem:kitbookingqueries;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
@Transactional
class KitBookingRepositoryIntegrationTest {

    @Autowired private KitBookingRepository kitBookingRepository;
    @Autowired private BookingRepository bookingRepository;

    @Test
    @DisplayName("Owner and member each see the seeded Kit parent exactly once")
    void parentQueries_areDistinctForOwnerAndMember() {
        LocalDateTime now = LocalDateTime.of(2026, 9, 21, 12, 0);

        assertThat(kitBookingRepository.findActiveForUser(1L, now))
                .extracting(KitBooking::getBookingReference)
                .containsExactly("KIT-2026-000001");
        assertThat(kitBookingRepository.findActiveForUser(3L, now))
                .extracting(KitBooking::getBookingReference)
                .containsExactly("KIT-2026-000001");
    }

    @Test
    @DisplayName("Kit children are hidden from ordinary student and Admin lists")
    void ordinaryQueries_excludeKitChildren() {
        LocalDateTime now = LocalDateTime.of(2026, 9, 21, 12, 0);

        assertThat(bookingRepository.findActiveUserBookings(1L, now))
                .allMatch(booking -> booking.getKitBooking() == null);
        assertThat(bookingRepository.findActiveAdminBookings(now))
                .allMatch(booking -> booking.getKitBooking() == null);
    }

    @Test
    @DisplayName("Admin Kit history includes closed parent reservations once")
    void adminHistory_returnsClosedParentsWithoutChildRows() {
        LocalDateTime now = LocalDateTime.of(2026, 9, 21, 12, 0);
        KitBooking parent = kitBookingRepository.findById(1L).orElseThrow();
        parent.setStatus(KitBooking.Status.CANCELLED);
        kitBookingRepository.saveAndFlush(parent);

        assertThat(kitBookingRepository.findHistoryForAdmin(now))
                .extracting(KitBooking::getBookingReference)
                .containsExactly("KIT-2026-000001");
    }

    @Test
    @DisplayName("Active Kit children still block resource overlap and closed children release it")
    void childRows_remainOccupancySource() {
        LocalDateTime start = LocalDateTime.of(2026, 10, 6, 13, 0);
        LocalDateTime end = LocalDateTime.of(2026, 10, 6, 15, 0);
        List<Booking> active = bookingRepository.findOverlappingBookings(7L, start, end);
        assertThat(active).hasSize(1);
        assertThat(active.get(0).getKitBooking().getBookingReference())
                .isEqualTo("KIT-2026-000001");

        List<Booking> children = bookingRepository.findByKitBookingIdOrderByResourceId(1L);
        children.forEach(child -> child.setStatus(Booking.Status.CANCELLED));
        bookingRepository.saveAllAndFlush(children);

        assertThat(bookingRepository.findOverlappingBookings(7L, start, end)).isEmpty();
    }
}
