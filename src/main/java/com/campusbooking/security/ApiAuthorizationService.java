package com.campusbooking.security;

import com.campusbooking.model.Booking;
import com.campusbooking.model.User;
import com.campusbooking.repository.BookingRepository;
import com.campusbooking.repository.KitBookingRepository;
import com.campusbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Database-backed ownership checks used by method-security expressions. */
@Component("apiAuthorization")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApiAuthorizationService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final KitBookingRepository kitBookingRepository;

    public boolean isSelf(Long requestedUserId, Authentication authentication) {
        if (requestedUserId == null || !isAuthenticated(authentication)) {
            return false;
        }
        return userRepository.findByUsername(authentication.getName())
                .map(User::getId)
                .filter(requestedUserId::equals)
                .isPresent();
    }

    public boolean canAccessBooking(Long bookingId, Authentication authentication) {
        if (bookingId == null || !isAuthenticated(authentication)) {
            return false;
        }
        if (hasAdminRole(authentication)) {
            return true;
        }

        return userRepository.findByUsername(authentication.getName())
                .flatMap(user -> bookingRepository.findById(bookingId)
                        .filter(booking -> isParticipant(booking, user.getId())))
                .isPresent();
    }

    public boolean canViewKitBooking(Long kitBookingId, Authentication authentication) {
        if (kitBookingId == null || !isAuthenticated(authentication)) {
            return false;
        }
        if (hasAdminRole(authentication)) {
            return true;
        }
        return userRepository.findByUsername(authentication.getName())
                .flatMap(user -> kitBookingRepository.findById(kitBookingId)
                        .filter(booking -> user.getId().equals(booking.getUser().getId())
                                || booking.getGroupMembers().stream()
                                    .anyMatch(member -> user.getId().equals(member.getId()))))
                .isPresent();
    }

    public boolean canManageKitBooking(Long kitBookingId, Authentication authentication) {
        if (kitBookingId == null || !isAuthenticated(authentication)) {
            return false;
        }
        if (hasAdminRole(authentication)) {
            return true;
        }
        return userRepository.findByUsername(authentication.getName())
                .flatMap(user -> kitBookingRepository.findById(kitBookingId)
                        .filter(booking -> user.getId().equals(booking.getUser().getId())))
                .isPresent();
    }

    private boolean isParticipant(Booking booking, Long userId) {
        if (booking.getUser() != null && userId.equals(booking.getUser().getId())) {
            return true;
        }
        return booking.getGroupMembers() != null
                && booking.getGroupMembers().stream()
                .anyMatch(member -> userId.equals(member.getId()));
    }

    private boolean hasAdminRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated();
    }
}
