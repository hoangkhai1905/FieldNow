const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function seedPremiumField() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'field-images';

  const supabase = createClient(supabaseUrl, supabaseKey);

  const localImages = [
    'C:\\Users\\nhoan\\.gemini\\antigravity\\brain\\68796629-2bf9-44c1-b7b5-420405aba971\\soccer_field_sunset_1777904777237.png',
    'C:\\Users\\nhoan\\.gemini\\antigravity\\brain\\68796629-2bf9-44c1-b7b5-420405aba971\\soccer_field_aerial_1777904791880.png'
  ];

  const imageUrls = [];

  // Add the previously uploaded image
  imageUrls.push(`${supabaseUrl}/storage/v1/object/public/${bucket}/tests/singapore-test-1777904598501.png`);

  for (const imgPath of localImages) {
    if (fs.existsSync(imgPath)) {
      const fileBuffer = fs.readFileSync(imgPath);
      const filename = `field-seed-${Date.now()}-${path.basename(imgPath)}`;
      const storagePath = `fields/${filename}`;

      console.log(`Uploading ${imgPath} to ${storagePath}...`);
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (!error) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        imageUrls.push(urlData.publicUrl);
        console.log(`✅ Uploaded: ${urlData.publicUrl}`);
      } else {
        console.error(`❌ Upload failed for ${imgPath}:`, error.message);
      }
    }
  }

  // Now seed the database
  const owner = await prisma.user.findUnique({ where: { email: 'owner@fieldnow.dev' } });
  if (!owner) {
    console.error('❌ Owner user not found. Please run npm run prisma:seed first.');
    process.exit(1);
  }

  const field = await prisma.field.create({
    data: {
      owner_id: owner.id,
      name: 'Singapore Elite Turf',
      location: 'Marina Bay, Singapore',
      description: 'A world-class premium football field with panoramic views of the city. Equipped with FIFA-standard turf and professional-grade lighting.',
      images: imageUrls,
      price_per_hour: 850000,
      is_active: true,
    }
  });

  console.log(`\n✅ Created Premium Field: ${field.name}`);
  console.log(`📸 Images: ${field.images.length}`);
  
  // Add some slots
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const slots = [
    { field_id: field.id, date: today, start_time: '19:00', end_time: '20:00' },
    { field_id: field.id, date: today, start_time: '20:00', end_time: '21:00' },
    { field_id: field.id, date: today, start_time: '21:00', end_time: '22:00', price_override: 1000000 }
  ];

  await prisma.fieldSlot.createMany({ data: slots });
  console.log(`✅ Created ${slots.length} slots for ${field.name}`);
}

seedPremiumField()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
