import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper: Upload file buffer or disk file to Supabase Cloud Storage (Bucket: 'documents')
export const uploadToSupabaseStorage = async (fileBuffer, fileName, mimeType) => {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName);

    return { path: data.path, publicUrl: publicUrlData.publicUrl };
  } catch (error) {
    console.error('Supabase Storage Upload Error:', error.message);
    throw error;
  }
};

export default supabaseAdmin;
