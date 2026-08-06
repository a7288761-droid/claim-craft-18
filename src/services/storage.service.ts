import { supabase } from "@/integrations/supabase/client";

const BUCKET = "documents";

export const storageService = {
  bucket: BUCKET,

  async upload(userId: string, file: File, onProgress?: (percent: number) => void) {
    const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    onProgress?.(15);
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    onProgress?.(100);
    return path;
  },

  async signedUrl(path: string, expiresIn = 3600) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },

  async remove(path: string) {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
  },
};