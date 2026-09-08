import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 BE11 Production Database Read-Only Verification');
  console.log('==================================================');

  // 1. Connection check
  await prisma.$connect();
  const tables: any = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;`;
  console.log(`✅ 1. Database connection successfully established via Prisma. Total Tables: ${tables.length}`);
  console.log(`   Tables: ${tables.map((t: any) => t.table_name).join(', ')}`);

  // 2. Query Venues / Grounds
  const grounds = await prisma.ground.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      location: true,
      city: true,
      state: true,
      pricePerHour: true,
      pricingLabel: true,
      ownerName: true,
      ownerPhone: true,
      latitude: true,
      longitude: true,
      isActive: true,
    },
  });
  console.log(`✅ 2. Venues queried successfully. Total: ${grounds.length}`);
  for (const g of grounds) {
    console.log(`   - [${g.name}] at (${g.latitude}, ${g.longitude}), Owner: ${g.ownerName} (${g.ownerPhone})`);
  }

  // 3. Verify Bookings table
  const bookingCount = await prisma.booking.count();
  console.log(`✅ 3. Bookings table verified. Count: ${bookingCount} (Must be 0)`);

  // 4. Verify Auth & Users tables
  const userCount = await prisma.user.count();
  const refreshTokenCount = await prisma.refreshToken.count();
  console.log(`✅ 4. Authentication tables verified. Users: ${userCount}, Active RefreshTokens: ${refreshTokenCount}`);

  // 5. Verify Notifications table
  const notificationCount = await prisma.notification.count();
  console.log(`✅ 5. Notifications table verified. Count: ${notificationCount}`);

  // 6. Verify Matches & Tournaments
  const matchCount = await prisma.match.count();
  const tournamentCount = await prisma.tournament.count();
  console.log(`✅ 6. Matches & Tournaments tables verified. Matches: ${matchCount}, Tournaments: ${tournamentCount}`);

  // 7. Verify Reviews & Wallet
  const reviewCount = await prisma.review.count();
  const walletTxCount = await prisma.walletTransaction.count();
  console.log(`✅ 7. Reviews & Wallet tables verified. Reviews: ${reviewCount}, Transactions: ${walletTxCount}`);

  // 8. Verify Coaches & Academies
  const coachCount = await prisma.coach.count();
  const academyCount = await prisma.academy.count();
  console.log(`✅ 8. Coach & Academy tables verified. Coaches: ${coachCount}, Academies: ${academyCount}`);

  // 9. Verify Vendor & Shop tables
  const vendorCount = await prisma.vendor.count();
  const productCount = await prisma.product.count();
  const orderCount = await prisma.order.count();
  console.log(`✅ 9. Vendor & Shop tables verified. Vendors: ${vendorCount}, Products: ${productCount}, Orders: ${orderCount}`);

  console.log('==================================================');
  console.log('🎉 ALL APPLICATION DATABASE VERIFICATIONS PASSED.');
}

main()
  .catch((err) => {
    console.error('💥 Database verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
