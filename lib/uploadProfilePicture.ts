import { supabase } from './supabase';

export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  // Validate file size (3MB max)
  const maxSize = 3 * 1024 * 1024; // 3MB in bytes
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 3MB');
  }

  // Delete old profile picture if exists
  const oldPath = `${userId}/profile.jpg`;
  await supabase.storage
    .from('profile-pictures')
    .remove([oldPath]);

  // Upload new profile picture
  const { data, error } = await supabase.storage
    .from('profile-pictures')
    .upload(oldPath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(oldPath);

  return publicUrl;
}