# Domain Module: Documents

Handles uploaded mentoring-tool PDFs and the Gemini extraction pipeline that
turns a document into a reviewable `EXTRACTION_DRAFT` template version.

## Storage

The PDF **binary is never stored in PostgreSQL**. `service.ts` writes the file
to private object storage (Supabase Storage, see `lib/storage`) and persists only
a `storageKey` plus metadata (name, hash, size, status). Downloads stream
through the authorization-checked route
`app/api/admin/documents/[id]/file/route.ts`; there are no public URLs.

## Extraction pipeline

`extraction/` contains:

- `prompt.ts` — the versioned contract prompt (`PROMPT_VERSION`). Generic: no
  department, section count or competency formula is hard-coded.
- `gemini.ts` — a thin Gemini SDK wrapper. The model comes from `GEMINI_MODEL`.
- `service.ts` — orchestration: fetch PDF → Gemini → persist raw response →
  JSON parse → schema validation (`lib/validation/extraction.ts`) → persist an
  `EXTRACTION_DRAFT` version with sections, items, rules and warnings.

Every attempt is recorded as an append-only `ExtractionRun` (raw response and
structured output kept), so any template value can be traced back to its source.
Extraction **never publishes**; an administrator must review and validate.

## Statuses

`SourceDocumentStatus`: `UPLOADED → PROCESSING → REVIEW_REQUIRED → VALIDATED`
(or `FAILED`).
