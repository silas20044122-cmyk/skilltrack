import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ObjectStorage, StoredObject } from './types';

/**
 * Supabase Storage driver (private bucket).
 *
 * Uses the service-role key, so it must only ever run on the server. The
 * bucket is created lazily and kept private; documents are always retrieved
 * through an authorization-checked application route, never a public URL.
 */

let client: SupabaseClient | null = null;
let bucketReady: Promise<void> | null = null;

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'mentoring-documents';

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase Storage is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).'
    );
  }
  return { url, serviceRoleKey, bucket };
}

function getClient(): SupabaseClient {
  if (client) return client;
  const { url, serviceRoleKey } = getConfig();
  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

async function ensureBucket(): Promise<void> {
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    const { bucket } = getConfig();
    const supabase = getClient();
    const { error } = await supabase.storage.getBucket(bucket);
    if (!error) return;
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: false,
    });
    // A concurrent creator may have won the race; only surface real failures.
    if (createError && !/already exists/i.test(createError.message)) {
      bucketReady = null;
      throw new Error(`Unable to prepare storage bucket: ${createError.message}`);
    }
  })();
  return bucketReady;
}

export const supabaseStorage: ObjectStorage = {
  async putObject(key, data, contentType) {
    await ensureBucket();
    const { bucket } = getConfig();
    const { error } = await getClient()
      .storage.from(bucket)
      .upload(key, data, { contentType, upsert: false });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  },

  async getObject(key): Promise<StoredObject | null> {
    await ensureBucket();
    const { bucket } = getConfig();
    const { data, error } = await getClient().storage.from(bucket).download(key);
    if (error || !data) return null;
    return {
      data: Buffer.from(await data.arrayBuffer()),
      contentType: data.type || 'application/octet-stream',
    };
  },

  async deleteObject(key) {
    await ensureBucket();
    const { bucket } = getConfig();
    await getClient().storage.from(bucket).remove([key]);
  },
};
