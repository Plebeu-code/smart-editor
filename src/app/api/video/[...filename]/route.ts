import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Serves video files with HTTP Range Request support.
 * Catch-all route [...filename] handles:
 *   /api/video/[projectId]/normalized  → uploads/[projectId]/normalized.mp4
 *   /api/video/[projectId]/raw         → uploads/[projectId]/raw.*
 *   /api/video/[projectId]/render      → renders/[projectId].mp4
 *   /api/video/[projectId]/dubbed      → uploads/[projectId]/dubbed.mp4
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  const [projectId, fileType = 'normalized'] = params.filename;

  let filePath: string;

  if (fileType === 'render') {
    filePath = path.join(process.cwd(), 'renders', `${projectId}.mp4`);
  } else if (fileType === 'normalized') {
    filePath = path.join(process.cwd(), 'uploads', projectId, 'normalized.mp4');
  } else if (fileType === 'dubbed') {
    filePath = path.join(process.cwd(), 'uploads', projectId, 'dubbed.mp4');
  } else {
    // raw — find the file
    const dir = path.join(process.cwd(), 'uploads', projectId);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.startsWith('raw')) : [];
    if (files.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    filePath = path.join(dir, files[0]);
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get('range');

  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.mp4' ? 'video/mp4' : ext === '.mp3' ? 'audio/mpeg' : 'application/octet-stream';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(filePath, { start, end });
    const nodeReadable = stream as unknown as ReadableStream;

    return new NextResponse(nodeReadable, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  const stream = fs.createReadStream(filePath);
  const nodeReadable = stream as unknown as ReadableStream;

  return new NextResponse(nodeReadable, {
    status: 200,
    headers: {
      'Content-Length': fileSize.toString(),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
