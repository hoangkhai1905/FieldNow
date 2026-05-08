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
      user = await prisma.user.create({ 
        data: { 
          ...userData,
          is_email_verified: true 
        } 
      });
      console.log(`  ✅ Created ${userData.role}: ${userData.email}`);
    } else {
      // Ensure existing users are verified for testing
      await prisma.user.update({
        where: { id: user.id },
        data: { is_email_verified: true }
      });
      console.log(`  ⏭️  Skipped ${userData.role}: ${userData.email} (already exists, ensured verified)`);
    }
    
    if (user.role === 'OWNER') {
      ownerId = user.id;
    }
  }

  // --- Seed Fields and Slots ---
  if (ownerId) {
    let field = await prisma.field.findFirst({ where: { name: 'Central Stadium' } });
    
    if (!field) {
      field = await prisma.field.create({
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
    } else {
      console.log(`  ⏭️  Skipped Field: ${field.name} (already exists)`);
    }

    // Seed slots for the next 7 days
    console.log(`  ⏳ Seeding slots for the next 7 days...`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const toTimeDate = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
    };

    let slotsCreated = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Create 5 slots per day: 17:00 to 22:00
      const startHours = [17, 18, 19, 20, 21];
      for (const hour of startHours) {
        const startTimeStr = `${hour}:00`;
        const endTimeStr = `${hour + 1}:00`;
        
        try {
          await prisma.fieldSlot.create({
            data: {
              field_id: field.id,
              date: date,
              start_time: toTimeDate(startTimeStr),
              end_time: toTimeDate(endTimeStr),
              price_override: hour >= 19 ? 600000 : null, // Peak hour pricing
            }
          });
          slotsCreated++;
        } catch (error) {
          // Skip if slot already exists
        }
      }
    }
    
    if (slotsCreated > 0) {
      console.log(`  ✅ Created ${slotsCreated} new slots for Field: ${field.name}`);
    } else {
      console.log(`  ⏭️  No new slots needed for Field: ${field.name}`);
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
