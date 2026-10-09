import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/guards';
import { getSourceDocument, getSourceDocumentFile } from '@/modules/documents/service';

/**
 * Streams a source PDF from private object storage.
 *
 * Authorization is enforced here: the storage bucket is private and there are
 * no public URLs, so this is the only path to the binary. It is deliberately
 * admin-only and never lists a document the caller may not access.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAdminUser();
  if (!actor) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const document = await getSourceDocument(id);
  if (!document) {
    return new NextResponse('Not found', { status: 404 });
  }

  const file = await getSourceDocumentFile(id);
  if (!file) {
    return new NextResponse('Not found', { status: 404 });
  }

  const body = new Uint8Array(file.data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': String(body.byteLength),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
