const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password123';
const DEMO_FIELD_COUNT_PER_TYPE = 20;

const toTimeDate = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
};

const demoUsers = [
  {
    email: 'user@fieldnow.dev',
    full_name: 'Demo User',
    role: 'USER',
  },
  {
    email: 'owner@fieldnow.dev',
    full_name: 'Demo Field Owner',
    role: 'OWNER',
  },
  {
    email: 'admin@fieldnow.dev',
    full_name: 'Demo Admin',
    role: 'ADMIN',
  },
];

const demoFieldTypes = [
  {
    type: 'FUTSAL',
    label: 'Futsal',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80',
    basePrice: 50000,
  },
  {
    type: 'BADMINTON',
    label: 'Cầu lông',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=80',
    basePrice: 40000,
  },
  {
    type: 'BASKETBALL',
    label: 'Bóng rổ',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=80',
    basePrice: 50000,
  },
  {
    type: 'VOLLEYBALL',
    label: 'Bóng chuyền',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1400&q=80',
    basePrice: 50000,
  },
  {
    type: 'TENNIS',
    label: 'Tennis',
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80',
    basePrice: 50000,
  },
];

const demoLocations = [
  'Quận 1, Hồ Chí Minh',
  'Quận 3, Hồ Chí Minh',
  'Quận 7, Hồ Chí Minh',
  'Bình Thạnh, Hồ Chí Minh',
  'Thủ Đức, Hồ Chí Minh',
  'Gò Vấp, Hồ Chí Minh',
  'Tân Bình, Hồ Chí Minh',
  'Hà Đông, Hà Nội',
  'Cầu Giấy, Hà Nội',
  'Hải Châu, Đà Nẵng',
];

const baseFields = [
  {
    name: 'Central Stadium',
    location: '123 Main St, Hồ Chí Minh City',
    description: 'Sân futsal trung tâm dùng cho demo đặt sân và quản lý booking.',
    images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80'],
    price_per_hour: 10000,
    type: 'FUTSAL',
    open_time: toTimeDate('05:00'),
    close_time: toTimeDate('23:00'),
    is_active: true,
  },
  {
    name: 'Seed Field',
    location: 'Hồ Chí Minh',
    description: 'Sân giá rẻ dùng để test thanh toán SePay với số tiền nhỏ.',
    images: ['https://images.unsplash.com/photo-1529900948638-196987144599?auto=format&fit=crop&w=1400&q=80'],
    price_per_hour: 5000,
    type: 'FUTSAL',
    open_time: toTimeDate('08:00'),
    close_time: toTimeDate('22:00'),
    is_active: true,
  },
];

const upsertUserByEmail = async (userData, password) => {
  return prisma.user.upsert({
    where: { email: userData.email },
    update: {
      password,
      full_name: userData.full_name,
      role: userData.role,
      is_active: true,
      deactivated_at: null,
      is_email_verified: true,
    },
    create: {
      ...userData,
      password,
      is_email_verified: true,
    },
  });
};

const upsertFieldByName = async (name, data) => {
  const existing = await prisma.field.findFirst({ where: { name } });

  if (existing) {
    await prisma.field.update({
      where: { id: existing.id },
      data,
    });
    return 'updated';
  }

  await prisma.field.create({ data });
  return 'created';
};

const buildDemoField = (ownerId, config, index) => {
  const sequence = String(index).padStart(2, '0');
  const location = demoLocations[(index - 1) % demoLocations.length];

  return {
    name: `FieldNow Demo ${config.label} ${sequence}`,
    data: {
      owner_id: ownerId,
      name: `FieldNow Demo ${config.label} ${sequence}`,
      location,
      description: `${config.label} demo field ${sequence} for FieldNow search, booking, and pagination testing.`,
      images: [config.image],
      price_per_hour: config.basePrice + (index % 5) * 25000,
      type: config.type,
      open_time: toTimeDate(index % 3 === 0 ? '06:00' : '05:30'),
      close_time: toTimeDate(index % 4 === 0 ? '23:00' : '22:00'),
      is_active: true,
    },
  };
};

/**
 * Seed baseline demo data.
 *
 * Run with:
 *   npm run prisma:seed
 *
 * This script intentionally does not seed FieldSlot records. Availability is
 * calculated from field opening hours and existing bookings in the demo flow.
 */
async function main() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('Seeding demo users...');
  const seededUsers = [];
  for (const userData of demoUsers) {
    const user = await upsertUserByEmail(userData, password);
    seededUsers.push(user);
    console.log(`  - ${user.role}: ${user.email}`);
  }

  const owner = seededUsers.find((user) => user.role === 'OWNER');
  if (!owner) {
    throw new Error('Owner user was not seeded.');
  }

  console.log('Seeding base demo fields...');
  for (const field of baseFields) {
    const result = await upsertFieldByName(field.name, {
      ...field,
      owner_id: owner.id,
    });
    console.log(`  - ${result}: ${field.name}`);
  }

  console.log(`Seeding ${demoFieldTypes.length * DEMO_FIELD_COUNT_PER_TYPE} searchable demo fields...`);
  const summary = { created: 0, updated: 0 };

  for (const config of demoFieldTypes) {
    for (let index = 1; index <= DEMO_FIELD_COUNT_PER_TYPE; index++) {
      const field = buildDemoField(owner.id, config, index);
      const result = await upsertFieldByName(field.name, field.data);
      summary[result]++;
    }
  }

  console.log(`Demo fields done: ${summary.created} created, ${summary.updated} updated.`);
  console.log('FieldSlot seeding skipped by design.');
}

main()
  .then(() => {
    console.log('\nSeed completed successfully.');
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
