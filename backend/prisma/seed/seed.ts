import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with detailed Indian style tournaments across all cities...');

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.match.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.ground.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.order.deleteMany();
  await prisma.tournamentRegistration.deleteMany();
  await prisma.tournamentMatch.deleteMany();
  await prisma.tournamentFavorite.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();

  // Create hash passwords
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const playerPasswordHash = await bcrypt.hash('Player@123', 10);
  const ownerPasswordHash = await bcrypt.hash('Ground@123', 10);
  const vendorPasswordHash = await bcrypt.hash('Vendor@123', 10);
  const storePasswordHash = await bcrypt.hash('Store@123', 10);
  const organizerPasswordHash = await bcrypt.hash('Organizer@123', 10);
  const supportPasswordHash = await bcrypt.hash('Support@123', 10);

  // 1. Create Users
  const superadmin = await prisma.user.create({
    data: {
      email: 'superadmin@be11.com',
      passwordHash: superAdminPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+919876543209',
      role: 'SUPER_ADMIN',
      walletBalance: 0.0,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@be11.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'System',
      phone: '+919876543212',
      role: 'ADMIN',
      walletBalance: 0.0,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'player@be11.com',
      passwordHash: playerPasswordHash,
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '+919876543210',
      role: 'PLAYER',
      walletBalance: 30000.0,
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: 'groundowner@be11.com',
      passwordHash: ownerPasswordHash,
      firstName: 'Vikram',
      lastName: 'Singh',
      phone: '+919876543211',
      role: 'OWNER',
      walletBalance: 0.0,
    },
  });

  const vendor = await prisma.user.create({
    data: {
      email: 'vendor@be11.com',
      passwordHash: vendorPasswordHash,
      firstName: 'Vendor',
      lastName: 'Pro',
      phone: '+919876543213',
      role: 'VENDOR',
      walletBalance: 0.0,
    },
  });

  const store = await prisma.user.create({
    data: {
      email: 'store@be11.com',
      passwordHash: storePasswordHash,
      firstName: 'Store',
      lastName: 'Manager',
      phone: '+919876543214',
      role: 'STORE_MANAGER',
      walletBalance: 0.0,
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@be11.com',
      passwordHash: organizerPasswordHash,
      firstName: 'Organizer',
      lastName: 'System',
      phone: '+919876543215',
      role: 'ORGANIZER',
      walletBalance: 0.0,
    },
  });

  const support = await prisma.user.create({
    data: {
      email: 'support@be11.com',
      passwordHash: supportPasswordHash,
      firstName: 'Support',
      lastName: 'Help',
      phone: '+919876543216',
      role: 'SUPPORT',
      walletBalance: 0.0,
    },
  });

  console.log('✅ Users created successfully!');

  // Helper arrays for seeding grounds in multiple cities
  const citiesData = [
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Ranchi', lat: 23.3441, lng: 85.3096 },
    { name: 'Deoghar', lat: 24.4820, lng: 86.7001 },
    { name: 'Dhanbad', lat: 23.7957, lng: 86.4304 },
    { name: 'Patna', lat: 25.5941, lng: 85.1376 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577 }
  ];

  const groundsMap: Record<string, any[]> = {};

  // Generate 2 grounds for every city (one Cricket, one Football)
  for (const city of citiesData) {
    const g1 = await prisma.ground.create({
      data: {
        name: `${city.name} Pavilion Arena`,
        description: `Premium sporting turf in ${city.name} with professional floodlights, spectators lounge, and elite level pitches designed for cricket matches.`,
        location: `Sector 3, ${city.name} Central`,
        city: city.name,
        pricePerHour: 1200.0,
        sport: 'Cricket',
        amenities: ['Floodlights', 'AC Lounge', 'Showers'],
        images: [
          'https://images.unsplash.com/photo-1540747737956-37872f84a62f?auto=format&fit=crop&w=600&q=80'
        ],
        ownerId: owner.id,
        rating: 4.9,
        reviewsCount: 1,
        latitude: city.lat + 0.005,
        longitude: city.lng + 0.005,
      },
    });

    const g2 = await prisma.ground.create({
      data: {
        name: `${city.name} Skyline Turf`,
        description: `FIFA-grade synthetic open-air turf in ${city.name}. Excellent spectators seating, parking space, and cafeteria on site.`,
        location: `Link Road, ${city.name} West`,
        city: city.name,
        pricePerHour: 900.0,
        sport: 'Football',
        amenities: ['Open Air', 'Cafe', 'Parking'],
        images: [
          'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=600&q=80'
        ],
        ownerId: owner.id,
        rating: 4.7,
        reviewsCount: 1,
        latitude: city.lat - 0.005,
        longitude: city.lng - 0.005,
      },
    });

    groundsMap[city.name] = [g1, g2];
  }

  console.log(`✅ Grounds created successfully across all 15 cities!`);

  // Seed reviews for grounds
  for (const city of citiesData) {
    const [g1, g2] = groundsMap[city.name];
    await prisma.review.create({
      data: {
        groundId: g1.id,
        userId: customer.id,
        rating: 5,
        comment: `Excellent pitch and extremely well-maintained facilities here at ${g1.name}.`,
      },
    });
    await prisma.review.create({
      data: {
        groundId: g2.id,
        userId: customer.id,
        rating: 4,
        comment: `Amazing turf quality and lighting at ${g2.name}. Perfect for football sessions.`,
      },
    });
  }

  // 3. Create Seed Products
  const products = [
    {
      name: 'be11 English Willow Bat',
      description: 'Grade 1 English Willow cricket bat, hand-crafted with sweet middle profiles, suitable for professional league matches.',
      price: 9499.0,
      image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=300&q=80',
      category: 'BATS',
      sport: 'Cricket',
      stock: 15,
    },
    {
      name: 'be11 Leather Seam Ball',
      description: 'Hand-stitched premium alum-tanned leather cricket ball, built for maximum longevity and seam stability.',
      price: 499.0,
      image: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=300&q=80',
      category: 'BALLS',
      sport: 'Cricket',
      stock: 50,
    },
    {
      name: 'be11 Professional Batting Gloves',
      description: 'High-density foam fingers with ergonomic flex designs, providing maximum sweat absorption and impact protection.',
      price: 1299.0,
      image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=300&q=80',
      category: 'GLOVES',
      sport: 'Cricket',
      stock: 25,
    },
    {
      name: 'be11 Pro Batting Pads',
      description: 'Ultra-lightweight protective leg guards with wide straps and foam padded knee rolls for superior comfort.',
      price: 2499.0,
      image: 'https://images.unsplash.com/photo-1544045560-723f63933a3e?auto=format&fit=crop&w=300&q=80',
      category: 'PADS',
      sport: 'Cricket',
      stock: 20,
    },
    {
      name: 'be11 Classic Cricket Jersey',
      description: 'Moisture-wicking, highly breathable team jersey with sublimated side stripes, ready for custom printing.',
      price: 799.0,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeAq8x7ZDx6hTr6C_oRuRW92H-lKMNP94o2CxewKPp6GQuIdup7YpAhUmSKCPChq9Zgnl5aSdkgjlAiydDRj_aZ3VZVDdF1DJ7K9nRPluYhDYMvZPz0tonY2hkRkDR8I0_qH6DWh8dsAJ9vXAutDemEFc6fykh5ygbXvN0oAKC_L9lKNoVhJH1UYkodZaU1KbLWjdedihdGFRE4cPS6gX_wmaZcWFCZwy19qVeyhIEAbFXPc6ay3jj',
      category: 'JERSEYS',
      sport: 'Cricket',
      stock: 100,
    },
    {
      name: 'be11 FIFA-Star Football',
      description: 'Thermally bonded seamless match football, engineered with aerodynamic grooves for true flight precision.',
      price: 1899.0,
      image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=300&q=80',
      category: 'FOOTBALLS',
      sport: 'Football',
      stock: 40,
    },
    {
      name: 'be11 Striker FG Shoes',
      description: 'Firm-ground football boots with molded TPU studs for excellent speed grip and synthetic upper durability.',
      price: 3499.0,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
      category: 'SHOES',
      sport: 'Football',
      stock: 30,
    },
    {
      name: 'be11 Impact Shin Guards',
      description: 'Hard outer shield plates with thick EVA foam padding backings to absorb heavy slide tackles.',
      price: 399.0,
      image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=300&q=80',
      category: 'SHIN_GUARDS',
      sport: 'Football',
      stock: 60,
    },
    {
      name: 'be11 Grip Goalkeeper Gloves',
      description: 'Super-cohesive latex palms with negative cut stitching for superior ball handling security.',
      price: 1599.0,
      image: 'https://images.unsplash.com/photo-1516287985838-70215a3d76e8?auto=format&fit=crop&w=300&q=80',
      category: 'GLOVES',
      sport: 'Football',
      stock: 15,
    }
  ];

  await prisma.product.createMany({ data: products });
  console.log('✅ Seed Products created successfully!');

  // Seed active coupons
  await prisma.coupon.deleteMany();
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', discountPercent: 10 },
      { code: 'BE11SUPER', discountPercent: 20 },
      { code: 'FESTIVAL15', discountPercent: 15 },
    ]
  });
  console.log('✅ Seed Coupons created successfully!');

  // Define comprehensive Indian-style tournament data covering all cities, sports, statuses, and pricing filters
  const tournamentSeeds = [
    // --- MUMBAI ---
    {
      name: 'be11 Mumbai Monsoon Cricket League',
      description: 'The premium T20 cricket league in Mumbai. Teams compete across round-robin fixtures to win the grand champion trophy.',
      sport: 'Cricket',
      status: 'UPCOMING',
      startDate: '2026-08-15',
      endDate: '2026-08-30',
      registrationDeadline: '2026-08-12',
      teamsLimit: 8,
      entryFee: 1500.0,
      prizePool: 50000.0,
      organizerId: admin.id,
      groundId: groundsMap['Mumbai'][0].id,
      city: 'Mumbai',
      rules: 'Standard T20 rules. Max 15 players per squad.',
      sponsors: JSON.stringify(['CEAT', 'Gatorade']),
      gallery: JSON.stringify([])
    },
    {
      name: 'Bandra Soccer Blitz Championship',
      description: 'Fast-paced 5v5 soccer cup held under the lights on Skyline Turf Bandra.',
      sport: 'Football',
      status: 'ONGOING',
      startDate: '2026-07-28',
      endDate: '2026-08-08',
      registrationDeadline: '2026-07-25',
      teamsLimit: 12,
      entryFee: 800.0,
      prizePool: 25000.0,
      organizerId: admin.id,
      groundId: groundsMap['Mumbai'][1].id,
      city: 'Mumbai',
      rules: '5v5 rolling subs, 15-minute halves.',
      sponsors: JSON.stringify(['Nike India']),
      gallery: JSON.stringify([])
    },
    {
      name: 'Worli Gully Cricket Carnival',
      description: 'Traditional style gully cricket rules with soft tennis ball. Celebrated tournament across Worli sea-face.',
      sport: 'Cricket',
      status: 'COMPLETED',
      startDate: '2026-07-10',
      endDate: '2026-07-12',
      registrationDeadline: '2026-07-08',
      teamsLimit: 16,
      entryFee: 0.0, // Free entry filter test
      prizePool: 15000.0,
      organizerId: admin.id,
      groundId: groundsMap['Mumbai'][0].id,
      city: 'Mumbai',
      rules: 'Soft tennis ball, 6-overs matches.',
      sponsors: JSON.stringify(['Local Merchants']),
      gallery: JSON.stringify([])
    },

    // --- DELHI ---
    {
      name: 'be11 Delhi Winter Soccer Cup',
      description: 'The major 5v5 soccer challenge on Skyline Turf Delhi. 16 teams face off in direct knockout slots.',
      sport: 'Football',
      status: 'UPCOMING',
      startDate: '2026-09-01',
      endDate: '2026-09-07',
      registrationDeadline: '2026-08-28',
      teamsLimit: 16,
      entryFee: 800.0,
      prizePool: 25000.0,
      organizerId: admin.id,
      groundId: groundsMap['Delhi'][1].id,
      city: 'Delhi',
      rules: 'Knockout matches, penalty shootouts on tie.',
      sponsors: JSON.stringify(['RedBull']),
      gallery: JSON.stringify([])
    },
    {
      name: 'Delhi Capital Cricket Cup',
      description: 'High-voltage ongoing T20 league featuring academies across the National Capital Region.',
      sport: 'Cricket',
      status: 'ONGOING',
      startDate: '2026-07-20',
      endDate: '2026-08-05',
      registrationDeadline: '2026-07-18',
      teamsLimit: 10,
      entryFee: 0.0, // Free entry filter test
      prizePool: 40000.0,
      organizerId: admin.id,
      groundId: groundsMap['Delhi'][0].id,
      city: 'Delhi',
      rules: 'Red leather ball, ICC standard parameters.',
      sponsors: JSON.stringify(['Jio']),
      gallery: JSON.stringify([])
    },
    {
      name: 'Connaught Place Futsal Fiesta',
      description: 'Completed indoor-style futsal league attracting top amateur clubs.',
      sport: 'Football',
      status: 'COMPLETED',
      startDate: '2026-07-05',
      endDate: '2026-07-08',
      registrationDeadline: '2026-07-03',
      teamsLimit: 8,
      entryFee: 500.0,
      prizePool: 12000.0,
      organizerId: admin.id,
      groundId: groundsMap['Delhi'][1].id,
      city: 'Delhi',
      rules: 'Standard futsal rules.',
      sponsors: JSON.stringify([]),
      gallery: JSON.stringify([])
    },

    // --- PUNE ---
    {
      name: 'Deccan Gymkhana Cricket League',
      description: 'Elite corporate cricket tournament held at Pune Pavilion Arena.',
      sport: 'Cricket',
      status: 'UPCOMING',
      startDate: '2026-08-20',
      endDate: '2026-08-26',
      registrationDeadline: '2026-08-18',
      teamsLimit: 12,
      entryFee: 1200.0,
      prizePool: 35000.0,
      organizerId: admin.id,
      groundId: groundsMap['Pune'][0].id,
      city: 'Pune',
      rules: 'T15 format with semi-leather balls.',
      sponsors: JSON.stringify(['Serum Institute']),
      gallery: JSON.stringify([])
    },
    {
      name: 'Hinjawadi IT Soccer Cup',
      description: 'The ultimate soccer clash for IT professionals in Pune. Free entry for tech companies.',
      sport: 'Football',
      status: 'ONGOING',
      startDate: '2026-07-29',
      endDate: '2026-08-04',
      registrationDeadline: '2026-07-27',
      teamsLimit: 16,
      entryFee: 0.0,
      prizePool: 20000.0,
      organizerId: admin.id,
      groundId: groundsMap['Pune'][1].id,
      city: 'Pune',
      rules: '5v5 matches. Only company employees allowed.',
      sponsors: JSON.stringify(['Infosys Sport Club']),
      gallery: JSON.stringify([])
    },

    // --- BENGALURU ---
    {
      name: 'Silicon Valley Cricket League',
      description: 'The largest amateur cricket cup in Bengaluru. High-end match streaming and live scores.',
      sport: 'Cricket',
      status: 'UPCOMING',
      startDate: '2026-08-22',
      endDate: '2026-09-05',
      registrationDeadline: '2026-08-19',
      teamsLimit: 10,
      entryFee: 2500.0,
      prizePool: 100000.0,
      organizerId: admin.id,
      groundId: groundsMap['Bengaluru'][0].id,
      city: 'Bengaluru',
      rules: 'T20 league with white leather ball.',
      sponsors: JSON.stringify(['Zomato', 'Cred']),
      gallery: JSON.stringify([])
    },
    {
      name: 'Koramangala Football Faceoff',
      description: 'High energy 7v7 soccer league at Koramangala Skyline Turf.',
      sport: 'Football',
      status: 'ONGOING',
      startDate: '2026-07-24',
      endDate: '2026-08-02',
      registrationDeadline: '2026-07-22',
      teamsLimit: 12,
      entryFee: 1000.0,
      prizePool: 30000.0,
      organizerId: admin.id,
      groundId: groundsMap['Bengaluru'][1].id,
      city: 'Bengaluru',
      rules: '7v7 match layout, 25-min halves.',
      sponsors: JSON.stringify(['Decathlon']),
      gallery: JSON.stringify([])
    },

    // --- HYDERABAD ---
    {
      name: 'Charminar Cricket Championship',
      description: 'Completed premier T20 tournament in the heart of Hyderabad.',
      sport: 'Cricket',
      status: 'COMPLETED',
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      registrationDeadline: '2026-06-28',
      teamsLimit: 12,
      entryFee: 1500.0,
      prizePool: 75000.0,
      organizerId: admin.id,
      groundId: groundsMap['Hyderabad'][0].id,
      city: 'Hyderabad',
      rules: 'Standard ICC T20 rules.',
      sponsors: JSON.stringify(['Hyderabad Biryani Club']),
      gallery: JSON.stringify([])
    },

    // --- RANCHI ---
    {
      name: 'M.S. Dhoni Fan Club Cricket Trophy',
      description: 'Upcoming cricket tournament celebrating Jharkhand cricket spirit. Cash awards for best wicket-keeper.',
      sport: 'Cricket',
      status: 'UPCOMING',
      startDate: '2026-08-18',
      endDate: '2026-08-22',
      registrationDeadline: '2026-08-15',
      teamsLimit: 8,
      entryFee: 500.0,
      prizePool: 30000.0,
      organizerId: admin.id,
      groundId: groundsMap['Ranchi'][0].id,
      city: 'Ranchi',
      rules: 'T20 matches, leather ball format.',
      sponsors: JSON.stringify(['JSCA Associate']),
      gallery: JSON.stringify([])
    },

    // --- DEOGHAR ---
    {
      name: 'Deoghar Shivratri Cricket Cup',
      description: 'Ongoing cricket tournament attracting players from across Santhal Pargana region.',
      sport: 'Cricket',
      status: 'ONGOING',
      startDate: '2026-07-29',
      endDate: '2026-08-05',
      registrationDeadline: '2026-07-26',
      teamsLimit: 10,
      entryFee: 0.0,
      prizePool: 20000.0,
      organizerId: admin.id,
      groundId: groundsMap['Deoghar'][0].id,
      city: 'Deoghar',
      rules: 'Tennis ball tournament.',
      sponsors: JSON.stringify(['Baba Dham Trust']),
      gallery: JSON.stringify([])
    },

    // --- DHANBAD ---
    {
      name: 'Coal Capital Soccer Cup',
      description: 'Completed 5v5 soccer league at Dhanbad Skyline Turf.',
      sport: 'Football',
      status: 'COMPLETED',
      startDate: '2026-07-12',
      endDate: '2026-07-16',
      registrationDeadline: '2026-07-09',
      teamsLimit: 12,
      entryFee: 600.0,
      prizePool: 18000.0,
      organizerId: admin.id,
      groundId: groundsMap['Dhanbad'][1].id,
      city: 'Dhanbad',
      rules: 'Knockout matches.',
      sponsors: JSON.stringify([]),
      gallery: JSON.stringify([])
    },

    // --- PATNA ---
    {
      name: 'Patliputra Football League',
      description: 'Knockout soccer tourney in Patna for amateur clubs and schools.',
      sport: 'Football',
      status: 'UPCOMING',
      startDate: '2026-09-02',
      endDate: '2026-09-08',
      registrationDeadline: '2026-08-30',
      teamsLimit: 16,
      entryFee: 400.0,
      prizePool: 15000.0,
      organizerId: admin.id,
      groundId: groundsMap['Patna'][1].id,
      city: 'Patna',
      rules: 'Standard knockout soccer.',
      sponsors: JSON.stringify(['Bihar Sports Authority']),
      gallery: JSON.stringify([])
    }
  ];

  // Insert all tournaments
  for (const seed of tournamentSeeds) {
    const t = await prisma.tournament.create({
      data: seed
    });

    // Generate random registrations for upcoming/ongoing ones
    if (t.status === 'UPCOMING' || t.status === 'ONGOING') {
      await prisma.tournamentRegistration.create({
        data: {
          tournamentId: t.id,
          teamName: 'Patna Kings',
          captainName: 'Vivek Singh',
          contactPhone: '+919999900001',
          playersList: JSON.stringify(['Vivek Singh', 'Abhishek Jha', 'Niranjan Roy', 'Manish Lal']),
          status: 'APPROVED'
        }
      });
      await prisma.tournamentRegistration.create({
        data: {
          tournamentId: t.id,
          teamName: 'Ganga Gladiators',
          captainName: 'Aman Raj',
          contactPhone: '+919999900002',
          playersList: JSON.stringify(['Aman Raj', 'Rishav Verma', 'Piyush Sahay', 'Sunny Sinha']),
          status: 'APPROVED'
        }
      });
    }

    // Generate live match scoreboards for ongoing tournaments
    if (t.status === 'ONGOING') {
      await prisma.tournamentMatch.create({
        data: {
          tournamentId: t.id,
          homeTeam: 'Team Saffron',
          awayTeam: 'Team Green',
          date: '2026-07-31',
          time: '19:00',
          status: 'LIVE',
          score: t.sport === 'Cricket' ? '124/2 (11.2 overs) vs 180' : '2 - 1',
          overs: t.sport === 'Cricket' ? '11.2 overs' : null,
          result: t.sport === 'Cricket' ? 'Need 57 runs in 52 balls' : 'Second half ongoing'
        }
      });
    }

    // Generate completed match details for completed tournaments
    if (t.status === 'COMPLETED') {
      await prisma.tournamentMatch.create({
        data: {
          tournamentId: t.id,
          homeTeam: 'Challengers XI',
          awayTeam: 'Royals FC',
          date: '2026-07-15',
          time: '21:00',
          status: 'COMPLETED',
          score: t.sport === 'Cricket' ? '165/4 vs 164/8' : '3 - 2',
          result: t.sport === 'Cricket' ? 'Challengers XI won by 6 wickets' : 'Challengers XI won by penalty shootout'
        }
      });
    }
  }

  // Create the specific grounds in Delhi as required for Live Matches
  const powerPlayArena = await prisma.ground.create({
    data: {
      name: 'PowerPlay Arena',
      description: 'Delhi’s premium sports arena with international-grade pitches and spectator galleries.',
      location: 'Sector 10, Rohini, Delhi',
      city: 'Delhi',
      pricePerHour: 1500.0,
      sport: 'Cricket',
      amenities: ['Floodlights', 'Cafe', 'Showers', 'Parking'],
      images: [
        'https://images.unsplash.com/photo-1540747737956-37872f84a62f?auto=format&fit=crop&w=600&q=80'
      ],
      ownerId: owner.id,
      rating: 4.8,
      reviewsCount: 1,
      latitude: 28.6139 + 0.002,
      longitude: 77.2090 + 0.002,
    }
  });

  const victoryFootballTurf = await prisma.ground.create({
    data: {
      name: 'Victory Football Turf',
      description: 'FIFA approved 5-a-side and 7-a-side artificial turf with professional turf mesh and high quality grass.',
      location: 'Khel Gaon Marg, Delhi',
      city: 'Delhi',
      pricePerHour: 1200.0,
      sport: 'Football',
      amenities: ['Open Air', 'Showers', 'Parking'],
      images: [
        'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=600&q=80'
      ],
      ownerId: owner.id,
      rating: 4.6,
      reviewsCount: 1,
      latitude: 28.6139 - 0.002,
      longitude: 77.2090 - 0.002,
    }
  });

  const eliteCricketTurf = await prisma.ground.create({
    data: {
      name: 'Elite Cricket Turf',
      description: 'Elite net practices and cricket training ground with professional bowling machines and pitches.',
      location: 'Dwarka Sector 21, Delhi',
      city: 'Delhi',
      pricePerHour: 1000.0,
      sport: 'Cricket',
      amenities: ['Bowling Machine', 'Nets', 'Showers'],
      images: [
        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80'
      ],
      ownerId: owner.id,
      rating: 4.7,
      reviewsCount: 1,
      latitude: 28.6139 + 0.004,
      longitude: 77.2090 + 0.004,
    }
  });

  // Seed public matches
  // 1. Sunday Morning Cricket XI
  await prisma.match.create({
    data: {
      groundId: powerPlayArena.id,
      sport: 'Cricket',
      date: 'Sunday',
      startTime: '07:00 AM',
      entryFee: 299.0,
      playersJoined: 18,
      totalPlayers: 22,
      skillLevel: 'Intermediate',
      hostId: customer.id,
      hostName: 'Ayush Raj',
      verifiedHost: true,
      status: 'Filling Fast',
      teamA: JSON.stringify(Array.from({ length: 9 }).map((_, i) => ({ id: `p-a-${i}`, firstName: `PlayerA-${i}`, lastName: `G` }))),
      teamB: JSON.stringify(Array.from({ length: 9 }).map((_, i) => ({ id: `p-b-${i}`, firstName: `PlayerB-${i}`, lastName: `G` }))),
    }
  });

  // 2. Evening Football Turf
  await prisma.match.create({
    data: {
      groundId: victoryFootballTurf.id,
      sport: 'Football',
      date: 'Sunday',
      startTime: '05:00 PM',
      entryFee: 199.0,
      playersJoined: 8,
      totalPlayers: 10,
      skillLevel: 'Beginner',
      hostId: customer.id,
      hostName: 'Vikram Singh',
      verifiedHost: true,
      status: 'Almost Full',
      teamA: JSON.stringify(Array.from({ length: 4 }).map((_, i) => ({ id: `f-a-${i}`, firstName: `StrikerA-${i}`, lastName: `F` }))),
      teamB: JSON.stringify(Array.from({ length: 4 }).map((_, i) => ({ id: `f-b-${i}`, firstName: `MidfielderB-${i}`, lastName: `F` }))),
    }
  });

  // 3. Turf Practice Session
  await prisma.match.create({
    data: {
      groundId: eliteCricketTurf.id,
      sport: 'Cricket',
      date: 'Sunday',
      startTime: '09:00 AM',
      entryFee: 99.0,
      playersJoined: 6,
      totalPlayers: 10,
      skillLevel: 'Open',
      hostId: customer.id,
      hostName: 'Coach Pro',
      verifiedHost: true,
      status: 'Open',
      teamA: JSON.stringify(Array.from({ length: 3 }).map((_, i) => ({ id: `c-a-${i}`, firstName: `NetsA-${i}`, lastName: `C` }))),
      teamB: JSON.stringify(Array.from({ length: 3 }).map((_, i) => ({ id: `c-b-${i}`, firstName: `NetsB-${i}`, lastName: `C` }))),
    }
  });

  console.log(`✅ ${tournamentSeeds.length} Indian tournaments seeded successfully across various cities!`);

  // --- SEED COACHES MARKETPLACE ---
  console.log('🌱 Seeding Coaches Marketplace data...');

  // 1. Create Academies
  const academy1 = await prisma.academy.create({
    data: {
      name: 'be11 Elite Cricket Academy',
      logo: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=150&q=80',
      city: 'Mumbai',
      sports: JSON.stringify(['Cricket']),
      rating: 4.9,
    },
  });

  const academy2 = await prisma.academy.create({
    data: {
      name: 'Mumbai Football School',
      logo: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=150&q=80',
      city: 'Mumbai',
      sports: JSON.stringify(['Football']),
      rating: 4.7,
    },
  });

  const academy3 = await prisma.academy.create({
    data: {
      name: 'National Sports & Badminton Club',
      logo: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=150&q=80',
      city: 'Delhi',
      sports: JSON.stringify(['Badminton', 'Basketball']),
      rating: 4.8,
    },
  });

  console.log('✅ Academies seeded successfully!');

  // 2. Create Coach Users
  const coachPasswordHash = await bcrypt.hash('Coach@123', 10);

  const coachUser1 = await prisma.user.create({
    data: {
      email: 'coach@be11.com',
      passwordHash: coachPasswordHash,
      firstName: 'Suresh',
      lastName: 'Raina',
      phone: '+919876543220',
      role: 'COACH',
      walletBalance: 0.0,
    },
  });

  const coachUser2 = await prisma.user.create({
    data: {
      email: 'coach2@be11.com',
      passwordHash: coachPasswordHash,
      firstName: 'Sunil',
      lastName: 'Chhetri',
      phone: '+919876543221',
      role: 'COACH',
      walletBalance: 0.0,
    },
  });

  const coachUser3 = await prisma.user.create({
    data: {
      email: 'coach3@be11.com',
      passwordHash: coachPasswordHash,
      firstName: 'Pullela',
      lastName: 'Gopichand',
      phone: '+919876543222',
      role: 'COACH',
      walletBalance: 0.0,
    },
  });

  console.log('✅ Coach users created successfully!');

  // 3. Create Coach Profiles
  const coach1 = await prisma.coach.create({
    data: {
      userId: coachUser1.id,
      academyId: academy1.id,
      experienceYears: 12,
      certifications: JSON.stringify(['BCCI Level 3 Certified Coach', 'ICC High Performance Coach Certificate']),
      sports: JSON.stringify(['Cricket']),
      languages: JSON.stringify(['English', 'Hindi', 'Gujarati']),
      city: 'Mumbai',
      about: 'Former Indian national team player specializing in batting technique, aggressive middle-overs strategy, and athletic fielding drills.',
      achievements: JSON.stringify(['Won IPL Trophy 4 times', 'Represented India in 226 ODIs', 'Known as Mr. IPL for batting stability']),
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1544045560-723f63933a3e?auto=format&fit=crop&w=400&q=80'
      ]),
      videos: JSON.stringify(['https://www.w3schools.com/html/mov_bbb.mp4']),
      trainingStyle: 'Focuses heavily on footwork, middle-overs stroke-play, and high-intensity match scenario simulations.',
      hourlyRate: 2500.0,
      status: 'APPROVED',
    },
  });

  const coach2 = await prisma.coach.create({
    data: {
      userId: coachUser2.id,
      academyId: academy2.id,
      experienceYears: 15,
      certifications: JSON.stringify(['AFC Pro Coaching License', 'UEFA A Coaching Certificate']),
      sports: JSON.stringify(['Football']),
      languages: JSON.stringify(['English', 'Hindi', 'Bengali', 'Nepali']),
      city: 'Mumbai',
      about: 'Legendary Indian national football team captain focusing on forward positioning, striking precision, penalty execution, and mindset coaching.',
      achievements: JSON.stringify(['Most capped Indian international football player', 'AIFF Player of the Year 6 times', 'Padma Shri Awardee']),
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
      ]),
      videos: JSON.stringify(['https://www.w3schools.com/html/mov_bbb.mp4']),
      trainingStyle: 'Emphasis on positional attack tactics, target shooting, sprint mechanics, and off-the-ball runs.',
      hourlyRate: 3000.0,
      status: 'APPROVED',
    },
  });

  const coach3 = await prisma.coach.create({
    data: {
      userId: coachUser3.id,
      academyId: academy3.id,
      experienceYears: 20,
      certifications: JSON.stringify(['BWF Level 3 Coach License', 'Dronacharya Award for Sports Coaching']),
      sports: JSON.stringify(['Badminton']),
      languages: JSON.stringify(['English', 'Hindi', 'Telugu']),
      city: 'Delhi',
      about: 'Mastermind badminton coach who mentored multiple Olympic medalists. Specializes in singles tactics, court coverage, and psychological focus.',
      achievements: JSON.stringify(['Mentored Saina Nehwal to Olympic Bronze', 'Mentored PV Sindhu to Olympic Silver/Gold', 'All England Open Champion']),
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80'
      ]),
      videos: JSON.stringify(['https://www.w3schools.com/html/mov_bbb.mp4']),
      trainingStyle: 'Rigorous physical training, footwork agility drills, drop-shot precision, and strategic court placement.',
      hourlyRate: 4000.0,
      status: 'APPROVED',
    },
  });

  console.log('✅ Coach profiles seeded successfully!');

  // 4. Create Availability Slots for Coaches
  // Sunday (0), Tuesday (2), Thursday (4) availability
  const days = [0, 2, 4];
  const slots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' }
  ];

  for (const c of [coach1, coach2, coach3]) {
    for (const day of days) {
      for (const slot of slots) {
        await prisma.availability.create({
          data: {
            coachId: c.id,
            dayOfWeek: day,
            startTime: slot.start,
            endTime: slot.end,
            isBooked: false,
          },
        });
      }
    }
  }

  console.log('✅ Coach availability slots seeded successfully!');

  // 5. Create Training Camps
  const mumbaiNet = await prisma.ground.findFirst({ where: { city: 'Mumbai', sport: 'Cricket' } });
  const mumbaiTurf = await prisma.ground.findFirst({ where: { city: 'Mumbai', sport: 'Football' } });

  await prisma.camp.create({
    data: {
      coachId: coach1.id,
      academyId: academy1.id,
      name: 'Monsoon Cricket Boot Camp',
      description: 'Comprehensive 4-week indoor & outdoor camp focusing on spin batting technique, power-hitting in death overs, and dynamic fielding drills.',
      sport: 'Cricket',
      venue: mumbaiNet ? mumbaiNet.name : 'Sector 3 Pavilion nets',
      city: 'Mumbai',
      startDate: '2026-08-15',
      durationWeeks: 4,
      skillLevel: 'Intermediate',
      seatsLimit: 20,
      seatsLeft: 18, // Seeded with 2 enrolled slots
      fee: 4999.0,
      timings: 'Weekend 08:00 - 10:00',
      banner: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
    },
  });

  await prisma.camp.create({
    data: {
      coachId: coach2.id,
      academyId: academy2.id,
      name: 'Elite Football Striker Camp',
      description: 'Masterclass camp targeting offensive players who want to build elite goalscoring instincts, sprint mechanics, and set-piece headers.',
      sport: 'Football',
      venue: mumbaiTurf ? mumbaiTurf.name : 'Mumbai Skyline Turf',
      city: 'Mumbai',
      startDate: '2026-08-20',
      durationWeeks: 6,
      skillLevel: 'Advanced',
      seatsLimit: 15,
      seatsLeft: 15,
      fee: 5999.0,
      timings: 'Weekdays 17:00 - 19:00',
      banner: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    },
  });

  await prisma.camp.create({
    data: {
      coachId: coach3.id,
      academyId: academy3.id,
      name: 'Olympic Path Badminton Clinic',
      description: 'High intensity drills targeting court speed footwork, wrist placement drops, backhand clears, and match tactics.',
      sport: 'Badminton',
      venue: 'National Sports Club Indoor Courts',
      city: 'Delhi',
      startDate: '2026-08-22',
      durationWeeks: 3,
      skillLevel: 'Professional',
      seatsLimit: 10,
      seatsLeft: 10,
      fee: 7999.0,
      timings: 'Weekend 10:00 - 12:00',
      banner: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    },
  });

  console.log('✅ Training camps seeded successfully!');

  // Seed reviews for coaches
  await prisma.review.create({
    data: {
      coachId: coach1.id,
      userId: customer.id,
      rating: 5,
      comment: 'Suresh Raina’s sessions are incredibly engaging! His tips on middle-overs stroke-play completely changed my game.',
    },
  });

  await prisma.review.create({
    data: {
      coachId: coach2.id,
      userId: customer.id,
      rating: 5,
      comment: 'Excellent striker training. Sunil’s instructions on positioning and footwork when receiving long balls are world-class.',
    },
  });

  console.log('✅ Coach reviews seeded successfully!');

  // --- SEED JERSEY TEMPLATES ---
  console.log('🌱 Seeding default Jersey templates...');
  await prisma.jerseyTemplate.create({
    data: {
      name: 'National Pride India Blue',
      sport: 'Cricket',
      popularity: 120,
      config: JSON.stringify({
        primaryColor: '#004F98',
        secondaryColor: '#FF9933',
        accentColor: '#138808',
        pattern: 'Gradient',
        collar: 'V Neck',
        sleeves: 'Half',
        font: 'Modern',
        numberStyle: 'Bold',
        fabric: 'Professional Match Fabric',
      }),
    },
  });

  await prisma.jerseyTemplate.create({
    data: {
      name: 'Neon Strike Lightning',
      sport: 'Football',
      popularity: 95,
      config: JSON.stringify({
        primaryColor: '#0F172A',
        secondaryColor: '#38BDF8',
        accentColor: '#FACC15',
        pattern: 'Lightning',
        collar: 'Round Neck',
        sleeves: 'Half',
        font: 'Bold',
        numberStyle: 'Shadow',
        fabric: 'Premium Dry Fit',
      }),
    },
  });

  await prisma.jerseyTemplate.create({
    data: {
      name: 'Vintage Stripe Classic',
      sport: 'Cricket',
      popularity: 78,
      config: JSON.stringify({
        primaryColor: '#FFFFFF',
        secondaryColor: '#0A2E6E',
        accentColor: '#E11D48',
        pattern: 'Stripes',
        collar: 'Polo',
        sleeves: 'Half',
        font: 'Classic',
        numberStyle: 'Outline',
        fabric: 'Standard',
      }),
    },
  });

  console.log('✅ Jersey templates seeded successfully!');
  console.log('🌱 Seeding process complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
