import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { saveProject, getUploadPath } from '@/lib/store';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('video') as File | null;
    const prompt = (formData.get('prompt') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.mp4';
    const projectId = uuidv4();
    const rawFilename = `raw${ext}`;
    const uploadPath = getUploadPath(projectId, rawFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(uploadPath, buffer);

    const now = new Date().toISOString();
    const project = {
      id: projectId,
      status: 'uploaded' as const,
      originalFilename: file.name,
      rawFilename,
      prompt,
      createdAt: now,
      updatedAt: now,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    saveProject(project as any);

    return NextResponse.json({ projectId });
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
