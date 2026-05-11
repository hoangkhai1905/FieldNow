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
          images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80'],
          price_per_hour: 500000,
          open_time: toTimeDate('05:00'),
          close_time: toTimeDate('23:00'),
          is_active: true,
        }
      });
      console.log(`  ✅ Created Field: ${field.name}`);
    } else {
      console.log(`  ⏭️  Skipped Field: ${field.name} (already exists)`);
    }

    let seedField = await prisma.field.findFirst({ where: { name: 'Seed Field' } });
    if (!seedField) {
      seedField = await prisma.field.create({
        data: {
          owner_id: ownerId,
          name: 'Seed Field',
          location: 'Ho Chi Minh',
          description: 'Sân bóng dùng để test đặt sân giá rẻ.',
          images: ['https://images.unsplash.com/photo-1529900948638-196987144599?auto=format&fit=crop&w=1400&q=80'],
          price_per_hour: 5000,
          open_time: toTimeDate('08:00'),
          close_time: toTimeDate('22:00'),
          is_active: true,
        }
      });
      console.log(`  ✅ Created Field: ${seedField.name}`);
    } else {
      seedField = await prisma.field.update({
        where: { id: seedField.id },
        data: { price_per_hour: 5000 }
      });
      console.log(`  ✅ Updated Field Price: ${seedField.name} to 5000`);
    }

    // Seed slots for the next 7 days
    console.log(`  ⏳ Seeding/Updating slots for the next 7 days...`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const toTimeDate = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
    };

    let slotsCreated = 0;
    let slotsUpdated = 0;
    const targetFields = [field, seedField].filter(Boolean);

    for (const f of targetFields) {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        const startHours = [17, 18, 19, 20, 21];
        for (const hour of startHours) {
          const startTimeStr = `${hour}:00`;
          const endTimeStr = `${hour + 1}:00`;
          const startTime = toTimeDate(startTimeStr);
          const endTime = toTimeDate(endTimeStr);
          
          const existingSlot = await prisma.fieldSlot.findFirst({
            where: {
              field_id: f.id,
              date: date,
              start_time: startTime,
              end_time: endTime
            }
          });

          const priceOverride = f.name === 'Seed Field' ? 5000 : (hour >= 19 ? 600000 : null);

          if (!existingSlot) {
            await prisma.fieldSlot.create({
              data: {
                field_id: f.id,
                date: date,
                start_time: startTime,
                end_time: endTime,
                price_override: priceOverride,
              }
            });
            slotsCreated++;
          } else {
            await prisma.fieldSlot.update({
              where: { id: existingSlot.id },
              data: { price_override: priceOverride }
            });
            slotsUpdated++;
          }
        }
      }
    }
    
    console.log(`  ✅ Done: ${slotsCreated} created, ${slotsUpdated} updated.`);
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
