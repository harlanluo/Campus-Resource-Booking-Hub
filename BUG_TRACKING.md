# Week 8 Bug Tracking

Only defects reproduced or verified during Week 8 testing are recorded here.

| Bug ID | Description | Severity | How discovered | Root cause | Fix | Verification/Test | Status |
|---|---|---|---|---|---|---|---|
| W8-001 | Simultaneous overlapping booking requests could all succeed for the same resource and time slot. | High | A genuine eight-thread Spring Boot/H2 test produced eight active overlapping bookings. | Conflict detection used a non-locking check followed by an insert, so concurrent transactions could all observe an empty result before any commit. | Acquire a pessimistic write lock on the resource row before checking overlaps and inserting. | `BookingConcurrencyIntegrationTest.simultaneousBookingsAllowExactlyOneWinner` | Fixed |
| W8-002 | Simultaneous Project Kit requests could reserve duplicate kits and did not provide concurrency-safe all-or-nothing behavior. | High | Code review plus the verified single-resource race showed each kit item used the same non-locking check-then-insert pattern. | Kit validation did not serialize competing transactions across its resource set. | Lock every kit resource in ascending ID order before validation and atomic persistence. | `BookingConcurrencyIntegrationTest.simultaneousKitBookingsAreAtomic` | Fixed |

## Notes

- The locking change is limited to booking creation and Project Kit booking.
- Existing sequential conflict checks and transaction boundaries are preserved.
- No unrelated or unverified defects are included.
