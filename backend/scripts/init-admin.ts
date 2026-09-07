import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🛡️  BE11 SECURE PRODUCTION ADMIN INITIALIZATION');
  console.log('====================================================\n');

  const email = process.env.ADMIN_EMAIL || 'admin@be11.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const firstName = process.env.ADMIN_FIRST_NAME || 'System';
  const lastName = process.env.ADMIN_LAST_NAME || 'Administrator';
  const phone = process.env.ADMIN_PHONE || '+919876543212';

  if (!email || !password) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Admin password must be at least 8 characters long.');
    process.exit(1);
  }

  console.log(`Configuring administrator account for: ${email}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      firstName,
      lastName,
      phone,
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: 'ADMIN',
      walletBalance: 0.0,
      emailVerified: true,
    },
  });

  console.log(`✅ Administrator account initialized successfully! (User ID: ${adminUser.id})`);
  console.log(`Role: ${adminUser.role}`);
  console.log(`Email Verified: ${adminUser.emailVerified}`);
  console.log(`Initial Wallet Balance: ₹${adminUser.walletBalance.toFixed(2)}\n`);
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('💥 Failed to initialize admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
