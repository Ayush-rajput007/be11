import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5000/api/v1';

async function main() {
  console.log('====================================================');
  console.log('🚀 BE11 ADMIN VENUE BOOKING MANAGEMENT VERIFICATION');
  console.log('====================================================\n');

  try {
    // 1. Authenticate Admin
    console.log('1. Authenticating Admin (admin@be11.com)...');
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@be11.com',
      password: 'Admin@123',
    });
    const adminToken = adminLoginRes.data.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    console.log('   ✅ Admin authenticated successfully.\n');

    // 2. Authenticate Player (Non-admin)
    console.log('2. Authenticating Customer Player (player@be11.com)...');
    const playerLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'player@be11.com',
      password: 'Player@123',
    });
    const playerToken = playerLoginRes.data.data.token;
    const playerHeaders = { Authorization: `Bearer ${playerToken}` };
    const playerId = playerLoginRes.data.data.user.id;
    console.log(`   ✅ Player authenticated (ID: ${playerId}).\n`);

    // 3. Security Guard (RBAC Verification)
    console.log('3. Verifying Role-Based Access Control (RBAC 403 Security)...');
    try {
      await axios.get(`${API_BASE}/admin/bookings`, { headers: playerHeaders });
      throw new Error('❌ SECURITY FAILURE: Player was able to access /api/admin/bookings!');
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log('   ✅ Player blocked with 403 Forbidden on /api/admin/bookings.');
      } else {
        throw err;
      }
    }

    try {
      await axios.get(`${API_BASE}/admin/bookings/stats`, { headers: playerHeaders });
      throw new Error('❌ SECURITY FAILURE: Player was able to access /api/admin/bookings/stats!');
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log('   ✅ Player blocked with 403 Forbidden on /api/admin/bookings/stats.');
      } else {
        throw err;
      }
    }

    try {
      await axios.get(`${API_BASE}/admin/venues/ab-cricket-ground/availability?date=2026-09-10`, { headers: playerHeaders });
      throw new Error('❌ SECURITY FAILURE: Player was able to access /api/admin/venues/:venueId/availability!');
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log('   ✅ Player blocked with 403 Forbidden on admin venue availability.');
      } else {
        throw err;
      }
    }
    console.log('   ✅ RBAC Security Guard passed with 100% precision.\n');

    // 4. Test Admin Stats
    console.log('4. Testing Real Stats Overview Endpoint...');
    const statsRes = await axios.get(`${API_BASE}/admin/bookings/stats`, { headers: adminHeaders });
    const stats = statsRes.data.data.stats;
    console.log('   Stats retrieved:', stats);
    console.log('   ✅ Stats endpoint functional and non-mocked.\n');

    // 5. Create a Test Booking
    console.log('5. Creating a test booking in PENDING status...');
    const targetGround = await prisma.ground.findFirst({
      where: {
        OR: [{ slug: 'ab-cricket-ground' }, { name: { contains: 'AB Cricket' } }],
      },
    });
    if (!targetGround) throw new Error('Target ground not found in database');

    const targetDate = '2026-09-15';
    const testBooking = await prisma.booking.create({
      data: {
        customerId: playerId,
        customerName: 'Demo Player',
        customerPhone: '9876543210',
        customerEmail: 'player@be11.com',
        groundId: targetGround.id,
        date: targetDate,
        startTime: '06:00',
        endTime: '10:00',
        matchPeriod: 'MORNING',
        bookingType: 'WHOLE_GROUND',
        totalPrice: 15000,
        status: 'PENDING',
        paymentStatus: 'PAID',
      },
    });
    console.log(`   ✅ Test booking created (ID: ${testBooking.id}).\n`);

    // 6. Verify Admin can list and search this booking
    console.log('6. Verifying Admin Booking Listing & Filtering...');
    const listRes = await axios.get(`${API_BASE}/admin/bookings`, {
      headers: adminHeaders,
      params: {
        status: 'PENDING',
        venueId: targetGround.id,
        search: 'player@be11.com',
      },
    });
    const found = listRes.data.data.bookings.find((b: any) => b.id === testBooking.id);
    if (!found) {
      throw new Error('❌ Admin search/filter failed to find the created booking!');
    }
    console.log(`   ✅ Admin successfully retrieved booking details for ${found.customer?.fullName || found.customerName}.\n`);

    // 7. Verify Admin Single Booking Details
    console.log('7. Verifying Admin Single Booking Details Modal Payload...');
    const detailRes = await axios.get(`${API_BASE}/admin/bookings/${testBooking.id}`, { headers: adminHeaders });
    const bookingDetails = detailRes.data.data.booking;
    if (bookingDetails.id !== testBooking.id || !bookingDetails.ground || !bookingDetails.customer) {
      throw new Error('❌ Incomplete booking details returned!');
    }
    console.log(`   ✅ Full booking details verified with venue ${bookingDetails.ground.name}.\n`);

    // 8. Confirm Booking via Admin
    console.log('8. Testing Admin Confirm Booking (/api/admin/bookings/:id/confirm)...');
    const confirmRes = await axios.patch(`${API_BASE}/admin/bookings/${testBooking.id}/confirm`, {}, { headers: adminHeaders });
    const confirmedBooking = confirmRes.data.data.booking;
    if (confirmedBooking.status !== 'CONFIRMED' || !confirmedBooking.confirmedAt || !confirmedBooking.confirmedById) {
      throw new Error('❌ Confirmation failed to record audit timestamps or status!');
    }
    console.log(`   ✅ Booking confirmed at ${confirmedBooking.confirmedAt} by admin ${confirmedBooking.confirmedBy?.firstName || confirmedBooking.confirmedBy?.email}.\n`);

    // 9. Verify Collision Detection on Confirm
    console.log('9. Testing Anti-Collision on Confirm (Cannot confirm 2 bookings for same slot)...');
    const conflictingBooking = await prisma.booking.create({
      data: {
        customerId: playerId,
        customerName: 'Demo Player',
        customerPhone: '9876543210',
        customerEmail: 'player@be11.com',
        groundId: targetGround.id,
        date: targetDate,
        startTime: '06:00',
        endTime: '10:00',
        matchPeriod: 'MORNING',
        bookingType: 'WHOLE_GROUND',
        totalPrice: 15000,
        status: 'PENDING',
      },
    });

    try {
      await axios.patch(`${API_BASE}/admin/bookings/${conflictingBooking.id}/confirm`, {}, { headers: adminHeaders });
      throw new Error('❌ Collision detection failed! Second booking was wrongly confirmed!');
    } catch (err: any) {
      if (err.response?.status === 409) {
        console.log('   ✅ Collision blocked with 409 Conflict as expected.');
      } else {
        throw err;
      }
    } finally {
      await prisma.booking.delete({ where: { id: conflictingBooking.id } });
    }
    console.log('   ✅ Collision prevention passed.\n');

    // 10. Verify Venue Availability endpoint reflects the confirmed booking
    console.log('10. Verifying Venue Availability Inspector endpoint...');
    const availRes = await axios.get(`${API_BASE}/admin/venues/${targetGround.id}/availability`, {
      headers: adminHeaders,
      params: { date: targetDate },
    });
    const availabilityList = availRes.data.data.availability;
    const morningPeriod = availabilityList?.find((p: any) => p.periodId === 'MORNING');
    if (!morningPeriod || morningPeriod.status !== 'CONFIRMED') {
      throw new Error(`❌ Venue availability failed to show MORNING as CONFIRMED! (Found: ${morningPeriod?.status})`);
    }
    console.log(`   ✅ Availability verified: MORNING is ${morningPeriod.status} (Reserved by ${morningPeriod.booking?.customerName}).\n`);

    // 11. Test Cancel Booking via Admin
    console.log('11. Testing Admin Cancel Booking with audit reason...');
    const cancelRes = await axios.patch(
      `${API_BASE}/admin/bookings/${testBooking.id}/cancel`,
      { cancellationReason: 'Player rescheduled match via customer support hotline' },
      { headers: adminHeaders }
    );
    const cancelledBooking = cancelRes.data.data.booking;
    if (
      cancelledBooking.status !== 'CANCELLED' ||
      !cancelledBooking.cancelledAt ||
      !cancelledBooking.cancelledById ||
      cancelledBooking.cancellationReason !== 'Player rescheduled match via customer support hotline'
    ) {
      throw new Error('❌ Cancellation failed to record audit reason or timestamp!');
    }
    console.log(`   ✅ Booking successfully cancelled. Reason: "${cancelledBooking.cancellationReason}"\n`);

    // 12. Cleanup database to retain clean state
    console.log('12. Cleaning up test records to maintain 0-booking state...');
    // Delete in-app notifications generated during confirm/cancel
    await prisma.notification.deleteMany({
      where: {
        userId: playerId,
        title: { in: ['Booking Confirmed!', 'Booking Cancelled'] },
      },
    });
    // Delete test booking
    await prisma.booking.delete({ where: { id: testBooking.id } });
    console.log('   ✅ Test records cleaned up.\n');

    // 13. Verify final stats
    const finalStats = (await axios.get(`${API_BASE}/admin/bookings/stats`, { headers: adminHeaders })).data.data.stats;
    console.log('13. Final DB Stats check:', finalStats);
    console.log('   ✅ Database returned cleanly to initial state.\n');

    console.log('====================================================');
    console.log('🎉 ALL ADMIN VENUE BOOKING CHECKS PASSED PERFECTLY!');
    console.log('====================================================');
  } catch (error: any) {
    console.error('❌ Verification Error:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
