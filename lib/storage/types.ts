/**
 * SkillTrack — Object storage abstraction.
 *
 * Source mentoring-tool PDFs are never stored in PostgreSQL. Only a storage
 * reference (`storageKey`) is persisted; the binary lives in object storage.
 * The interface keeps the rest of the application independent of the concrete
 * provider so it can be swapped without touching domain code.
 */

export interface StoredObject {
  data: Buffer;
  contentType: string;
}

/** A pre-authorised, short-lived target for a client-side direct upload. */
export interface UploadTarget {
  /** Storage key (path within the bucket) the client must upload to. */
  path: string;
  /** Opaque token that authorises writing to `path`. */
  token: string;
}

/** Lightweight metadata about an object, without downloading it. */
export interface ObjectInfo {
  size: number;
  contentType: string;
}

export interface ObjectStorage {
  /** Store an object. Throws if the write fails. */
  putObject(key: string, data: Buffer, contentType: string): Promise<void>;
  /** Retrieve an object, or `null` if it does not exist. */
  getObject(key: string): Promise<StoredObject | null>;
  /** Best-effort delete. Never throws for a missing object. */
  deleteObject(key: string): Promise<void>;
  /**
   * Create a signed upload target so a browser can upload a large object
   * directly to storage, bypassing serverless request-body size limits.
   */
  createUploadTarget(key: string): Promise<UploadTarget>;
  /** Return metadata for an object, or `null` if it does not exist. */
  getObjectInfo(key: string): Promise<ObjectInfo | null>;
}
