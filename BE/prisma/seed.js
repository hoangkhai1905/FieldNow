const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Seed script — creates baseline users for development and testing.
 * Run with: npm run prisma:seed
 */
async function main() {
  const password = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'user@fieldnow.dev',
      password,
      full_name: 'Test User',
      role: 'USER',
    },
    {
      email: 'owner@fieldnow.dev',
      password,
      full_name: 'Field Owner',
      role: 'OWNER',
    },
    {
      email: 'admin@fieldnow.dev',
      password,
      full_name: 'Admin',
      role: 'ADMIN',
    },
  ];

  let ownerId = null;

  for (const userData of users) {
    let user = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!user) {
      user = await prisma.user.create({ data: userData });
      console.log(`  ✅ Created ${userData.role}: ${userData.email}`);
    } else {
      console.log(`  ⏭️  Skipped ${userData.role}: ${userData.email} (already exists)`);
    }
    
    if (user.role === 'OWNER') {
      ownerId = user.id;
    }
  }

  // --- Seed Fields and Slots ---
  if (ownerId) {
    const existingField = await prisma.field.findFirst({ where: { name: 'Central Stadium' } });
    
    if (!existingField) {
      const field = await prisma.field.create({
        data: {
          owner_id: ownerId,
          name: 'Central Stadium',
          location: '123 Main St, Ho Chi Minh City',
          description: 'A beautiful football field in the heart of the city.',
          images: ['https://example.com/field1.jpg'],
          price_per_hour: 500000,
          is_active: true, // Approved by default for testing
        }
      });
      console.log(`  ✅ Created Field: ${field.name}`);

      // Seed slots for the field (for today and tomorrow)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const slotsToCreate = [
        { field_id: field.id, date: today, start_time: '18:00', end_time: '19:00' },
        { field_id: field.id, date: today, start_time: '19:00', end_time: '20:00', price_override: 600000 },
        { field_id: field.id, date: tomorrow, start_time: '18:00', end_time: '19:00' },
      ];

      await prisma.fieldSlot.createMany({ data: slotsToCreate });
      console.log(`  ✅ Created ${slotsToCreate.length} Slots for Field: ${field.name}`);
    } else {
      console.log(`  ⏭️  Skipped Field: Central Stadium (already exists)`);
    }
  }
}

main()
  .then(() => {
    console.log('\n🌱 Seed completed successfully.');
  })
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
