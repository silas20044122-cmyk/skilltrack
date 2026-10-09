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

export interface ObjectStorage {
  /** Store an object. Throws if the write fails. */
  putObject(key: string, data: Buffer, contentType: string): Promise<void>;
  /** Retrieve an object, or `null` if it does not exist. */
  getObject(key: string): Promise<StoredObject | null>;
  /** Best-effort delete. Never throws for a missing object. */
  deleteObject(key: string): Promise<void>;
}
