# lib/storage

Server-only object-storage abstraction (`ObjectStorage` in `types.ts`). The
application depends on the interface, not on a provider, so the driver can be
swapped without touching domain code.

- `supabase-driver.ts` — Supabase Storage implementation using the
  service-role key. Creates the private bucket lazily and keeps it private.
- `index.ts` — exports the configured `storage` instance.

## Configuration

| Env var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for private-bucket access |
| `SUPABASE_STORAGE_BUCKET` | Bucket name (default `mentoring-documents`) |

## Security

The service-role key bypasses row-level security, so this module must only ever
run on the server. PDFs are retrieved through an admin-guarded route; no public
or signed URLs are generated.
