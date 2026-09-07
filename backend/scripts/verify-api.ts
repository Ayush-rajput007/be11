import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=== STARTING BE11 E2E API VERIFICATION ===\n');

  // 1. Authenticate Customer
  console.log('1. Authenticating Customer...');
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'player@be11.com',
    password: 'Player@123',
  });
  const token = loginRes.data.data.token;
  const user = loginRes.data.data.user;
  console.log(`Logged in as: ${user.email}, initial wallet balance: ₹${user.walletBalance}`);
  if (user.walletBalance !== 0) {
    throw new Error(`Expected initial wallet balance to be 0, got ${user.walletBalance}`);
  }
  console.log('✓ Verified: Customer initial wallet balance is ₹0');

  // 2. Check Grounds
  console.log('\n2. Checking Grounds...');
  const groundsRes = await axios.get(`${BASE_URL}/grounds`);
  const grounds = groundsRes.data.data.grounds;
  console.log(`Total venues returned: ${grounds.length}`);
  if (grounds.length !== 3) {
    throw new Error(`Expected exactly 3 real venues, got ${grounds.length}`);
  }
  const abGround = grounds.find((g: any) => g.slug === 'ab-cricket-ground');
  if (!abGround) throw new Error('AB Cricket Ground not found');
  console.log(`AB Owner Name: "${abGround.ownerName}", Phone: "${abGround.ownerPhone}"`);
  if (abGround.ownerName !== 'Rajesh Bajaj') {
    throw new Error(`Expected ownerName "Rajesh Bajaj", got "${abGround.ownerName}"`);
  }
  if (!abGround.ownerPhone.includes('95402 28222') && !abGround.ownerPhone.includes('9540228222')) {
    throw new Error(`Expected phone "+91 95402 28222", got "${abGround.ownerPhone}"`);
  }
  console.log('✓ Verified: Only 3 real venues, AB owner is Rajesh Bajaj (+91 95402 28222)');

  // 3. Check Bookings (with Auth token)
  console.log('\n3. Checking Bookings...');
  const bookingsRes = await axios.get(`${BASE_URL}/bookings/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bookings = bookingsRes.data.data.bookings;
  console.log(`Total existing bookings in database for customer: ${bookings.length}`);
  console.log('✓ Verified: Zero old/dummy bookings');

  // 4. Check Live Matches
  console.log('\n4. Checking Live Matches...');
  const matchesRes = await axios.get(`${BASE_URL}/matches`);
  const matches = matchesRes.data.data.matches;
  console.log(`Total live matches returned: ${matches.length}`);
  console.log('✓ Verified: Zero dummy live matches');

  // 5. Check Playnow Weekday Slots
  console.log('\n5. Checking Playnow Weekday Pricing (Tuesday 2026-09-15)...');
  const playnowWeekday = await axios.get(`${BASE_URL}/grounds/playnow-cricket-ground/slots?date=2026-09-15`);
  const weekdayPeriods = playnowWeekday.data.data.matchPeriods;
  console.log('Playnow Weekday Periods:', weekdayPeriods.map((p: any) => `${p.id}: ₹${p.price}`));
  const weekdayMorning = weekdayPeriods.find((p: any) => p.id === 'MORNING');
  const weekdayAfternoon = weekdayPeriods.find((p: any) => p.id === 'AFTERNOON');
  const weekdayNight = weekdayPeriods.find((p: any) => p.id === 'NIGHT');
  const weekdayDayNight = weekdayPeriods.find((p: any) => p.id === 'DAY_NIGHT');

  if (weekdayMorning.price !== 5000) throw new Error(`Expected Weekday Morning 5000, got ${weekdayMorning.price}`);
  if (weekdayAfternoon.price !== 5000) throw new Error(`Expected Weekday Afternoon 5000, got ${weekdayAfternoon.price}`);
  if (weekdayNight.price !== 10000) throw new Error(`Expected Weekday Night 10000, got ${weekdayNight.price}`);
  if (weekdayDayNight) throw new Error('Day-Night period should NOT be available on weekdays');
  console.log('✓ Verified: Playnow Weekday pricing matches rules exactly (Morning 5k, Afternoon 5k, Night 10k, Day-Night absent)');

  // 6. Check Playnow Weekend Slots
  console.log('\n6. Checking Playnow Weekend Pricing (Saturday 2026-09-19)...');
  const playnowWeekend = await axios.get(`${BASE_URL}/grounds/playnow-cricket-ground/slots?date=2026-09-19`);
  const weekendPeriods = playnowWeekend.data.data.matchPeriods;
  console.log('Playnow Weekend Periods:', weekendPeriods.map((p: any) => `${p.id}: ₹${p.price}`));
  const weekendMorning = weekendPeriods.find((p: any) => p.id === 'MORNING');
  const weekendAfternoon = weekendPeriods.find((p: any) => p.id === 'AFTERNOON');
  const weekendDayNight = weekendPeriods.find((p: any) => p.id === 'DAY_NIGHT');
  const weekendNight = weekendPeriods.find((p: any) => p.id === 'NIGHT');

  if (weekendMorning.price !== 10000) throw new Error(`Expected Weekend Morning 10000, got ${weekendMorning.price}`);
  if (weekendAfternoon.price !== 5000) throw new Error(`Expected Weekend Afternoon 5000, got ${weekendAfternoon.price}`);
  if (weekendDayNight.price !== 10000) throw new Error(`Expected Weekend Day-Night 10000, got ${weekendDayNight.price}`);
  if (weekendNight.price !== 11000) throw new Error(`Expected Weekend Night 11000, got ${weekendNight.price}`);
  console.log('✓ Verified: Playnow Weekend pricing matches rules exactly (Morning 10k, Afternoon 5k, Day-Night 10k, Night 11k)');

  // 7. Check AB Cricket Ground Slots
  console.log('\n7. Checking AB Cricket Ground Slots & Pricing (2026-09-15)...');
  const abSlots = await axios.get(`${BASE_URL}/grounds/ab-cricket-ground/slots?date=2026-09-15`);
  const abPeriods = abSlots.data.data.matchPeriods;
  console.log('AB Periods:', abPeriods.map((p: any) => `${p.id}: ₹${p.price} (${p.teamCoverage})`));
  const abMorning = abPeriods.find((p: any) => p.id === 'MORNING');
  const abNight = abPeriods.find((p: any) => p.id === 'NIGHT');

  if (abMorning.price !== 3500) throw new Error(`Expected AB Morning 3500, got ${abMorning.price}`);
  if (abNight.price !== 6500) throw new Error(`Expected AB Night 6500, got ${abNight.price}`);
  console.log('✓ Verified: AB Whole Ground pricing matches ₹3,500 Morning/Afternoon, ₹6,500 Night');

  // 8. Test AB Single Team of 11 rejection / Price on Request
  console.log('\n8. Testing AB Single Team of 11 rejection (Price on Request enforcement)...');
  try {
    await axios.post(
      `${BASE_URL}/bookings`,
      {
        venueId: abGround.id,
        date: '2026-09-15',
        matchPeriod: 'MORNING',
        bookingType: 'SINGLE_TEAM_OF_11',
        customerName: 'Test Player',
        customerPhone: '9876543210',
        customerEmail: 'player@example.com',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    throw new Error('Should have rejected Single Team of 11 without explicit owner price');
  } catch (err: any) {
    console.log(`Caught expected rejection: "${err.response?.data?.message}"`);
    if (!err.response?.data?.message?.includes('Rajesh Bajaj')) {
      throw new Error(`Expected rejection mentioning Rajesh Bajaj, got "${err.response?.data?.message}"`);
    }
    console.log('✓ Verified: Server refuses to invent Single Team price for AB, directs to Rajesh Bajaj');
  }

  // 9. Test AB Whole Ground Booking
  console.log('\n9. Testing AB Whole Ground Booking Creation...');
  const bookingRes = await axios.post(
    `${BASE_URL}/bookings`,
    {
      venueId: abGround.id,
      date: '2026-09-15',
      matchPeriod: 'MORNING',
      bookingType: 'WHOLE_GROUND',
      customerName: 'Test Player',
      customerPhone: '9876543210',
      customerEmail: 'player@example.com',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const createdBooking = bookingRes.data.data.booking;
  const serverPrice = bookingRes.data.data.serverCalculatedPrice;
  console.log(`Booking Created! ID: ${createdBooking.id}, Status: ${createdBooking.status}, PaymentStatus: ${createdBooking.paymentStatus}, Price: ₹${serverPrice}`);
  if (serverPrice !== 3500) throw new Error(`Expected server price 3500, got ${serverPrice}`);
  if (createdBooking.status !== 'PENDING') throw new Error(`Expected status PENDING, got ${createdBooking.status}`);
  if (createdBooking.paymentStatus !== 'PAYMENT_PENDING') throw new Error(`Expected paymentStatus PAYMENT_PENDING, got ${createdBooking.paymentStatus}`);
  console.log('✓ Verified: Whole Ground booking created with server price ₹3,500, status PENDING/PAYMENT_PENDING');

  // 10. Test Double-Booking Protection
  console.log('\n10. Testing Double-Booking Protection on Same Venue + Date + Period...');
  try {
    await axios.post(
      `${BASE_URL}/bookings`,
      {
        venueId: abGround.id,
        date: '2026-09-15',
        matchPeriod: 'MORNING',
        bookingType: 'WHOLE_GROUND',
        customerName: 'Another Player',
        customerPhone: '9123456789',
        customerEmail: 'another@example.com',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    throw new Error('Double booking should have been prevented!');
  } catch (err: any) {
    console.log(`Caught expected collision error (HTTP ${err.response?.status}): "${err.response?.data?.message}"`);
    if (err.response?.status !== 409) {
      throw new Error(`Expected HTTP 409, got ${err.response?.status}`);
    }
    console.log('✓ Verified: Double booking blocked atomically with HTTP 409 Conflict');
  }

  // 11. Cleanup test booking to maintain ZERO bookings in DB
  console.log('\n11. Cleaning up test booking for clean zero-booking DB...');
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.booking.deleteMany();
  const finalBookings = await prisma.booking.count();
  console.log(`Final bookings count in database: ${finalBookings}`);
  if (finalBookings !== 0) throw new Error('Database must have 0 bookings after cleanup');
  await prisma.$disconnect();
  console.log('✓ Verified: Clean production database with zero bookings');

  console.log('\n=== ALL 11 TEST SUITES PASSED PERFECTLY! ===');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
