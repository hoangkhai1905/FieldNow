const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function uploadTestImage() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'field-images';

  console.log(`Uploading to: ${supabaseUrl}`);
  console.log(`Bucket: ${bucket}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  const imagePath = 'C:\\Users\\nhoan\\.gemini\\antigravity\\brain\\68796629-2bf9-44c1-b7b5-420405aba971\\premium_soccer_field_night_1777904569291.png';
  
  if (!fs.existsSync(imagePath)) {
      console.error('Image file not found at:', imagePath);
      process.exit(1);
  }

  const fileBuffer = fs.readFileSync(imagePath);
  
  const filename = `singapore-test-${Date.now()}.png`;
  const storagePath = `tests/${filename}`;

  console.log(`Target path: ${storagePath}`);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error('Error uploading:', JSON.stringify(error, null, 2));
    // If bucket doesn't exist, try to create it? No, service role might not have permission or it might be better to just fail and ask user.
    process.exit(1);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  console.log('--- UPLOAD SUCCESSFUL ---');
  console.log('Public URL:', urlData.publicUrl);
}

uploadTestImage();
