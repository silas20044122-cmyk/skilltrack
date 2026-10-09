import type { ObjectStorage } from './types';
import { supabaseStorage } from './supabase-driver';

/**
 * The application's object storage. Swap the driver here to change providers
 * (e.g. S3) without touching domain services.
 */
export const storage: ObjectStorage = supabaseStorage;

export type { ObjectStorage, StoredObject } from './types';
