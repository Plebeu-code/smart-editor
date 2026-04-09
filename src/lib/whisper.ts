/**
 * Whisper transcription via native Node.js https (no OpenAI SDK, no node-fetch).
 *
 * The OpenAI SDK bundles node-fetch through webpack and produces ECONNRESET errors
 * on Windows when uploading large multipart files. Native https bypasses this entirely.
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function buildMultipartBody(audioPath: string): { body: Buffer; boundary: string } {
  const boundary = `----WhisperBoundary${crypto.randomBytes(12).toString('hex')}`;
  const filename = path.basename(audioPath);
  const fileBuffer = fs.readFileSync(audioPath);

  const parts: Buffer[] = [
    // model
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`),
    // response_format
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nsrt\r\n`),
    // language
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\npt\r\n`),
    // file header
    Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: audio/mpeg\r\n\r\n`
    ),
    // file data
    fileBuffer,
    // closing boundary
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ];

  return { body: Buffer.concat(parts), boundary };
}

function doRequest(audioPath: string, apiKey: string): Promise<string> {
  const { body, boundary } = buildMultipartBody(audioPath);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
        timeout: 5 * 60 * 1000, // 5 min
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (d: Buffer) => chunks.push(d));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode === 200) {
            resolve(text);
          } else {
            reject(new Error(`OpenAI ${res.statusCode}: ${text}`));
          }
        });
        res.on('error', reject);
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Whisper request timed out after 5 minutes'));
    });

    // Write body in chunks to avoid blocking the event loop on large files
    const CHUNK = 64 * 1024;
    let offset = 0;
    function writeNext() {
      while (offset < body.length) {
        const slice = body.slice(offset, offset + CHUNK);
        offset += slice.length;
        if (!req.write(slice)) {
          req.once('drain', writeNext);
          return;
        }
      }
      req.end();
    }
    writeNext();
  });
}

export async function transcribeVideo(audioPath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const fileSizeMB = (fs.statSync(audioPath).size / 1024 / 1024).toFixed(1);
  console.log(`[whisper] transcribing: ${audioPath} (${fileSizeMB} MB)`);

  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[whisper] attempt ${attempt}/3`);
      const srt = await doRequest(audioPath, apiKey);
      console.log(`[whisper] done (${srt.split('\n\n').length} entries)`);
      return srt;
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[whisper] attempt ${attempt} failed: ${msg}`);

      const isTransient =
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('timed out') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('socket hang up');

      if (isTransient && attempt < 3) {
        const delay = attempt * 6000;
        console.log(`[whisper] retrying in ${delay / 1000}s…`);
        await sleep(delay);
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}
