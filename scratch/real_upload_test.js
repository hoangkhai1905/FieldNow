const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../BE/.env') });

async function uploadTestImage() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'field-images';

  console.log(`Uploading to: ${supabaseUrl}`);
  console.log(`Bucket: ${bucket}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  const imagePath = 'C:\\Users\\nhoan\\.gemini\\antigravity\\brain\\c7e72d11-b1d1-456f-8bf4-e824f7c0b9ae\\test_field_image_1777785981061.png';
  const fileBuffer = fs.readFileSync(imagePath);
  
  const filename = `test-upload-${Date.now()}.png`;
  const storagePath = `tests/${filename}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error('Error uploading:', error);
    process.exit(1);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  console.log('Upload successful!');
  console.log('Public URL:', urlData.publicUrl);
}

uploadTestImage();
