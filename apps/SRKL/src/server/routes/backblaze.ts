/**
 * @file backblaze.ts
 * @description Backblaze B2 Storage API Router with Real-Time Event Stream & Permanent Deletion.
 * File size < 200 lines strictly.
 */

import { Router, Request, Response } from 'express';
import { BackblazeClient, B2AuthData } from '../backblazeClient';
import {
  broadcastB2Event,
  registerB2SseClient,
  unregisterB2SseClient,
  invalidateB2Cache,
  getOrAuthenticate,
} from './backblazeAuthHelper';

const router = Router();

router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  registerB2SseClient(res);
  res.write(`data: ${JSON.stringify({ type: 'b2:connected', timestamp: new Date().toISOString() })}\n\n`);
  req.on('close', () => { unregisterB2SseClient(res); });
});

router.post('/auth', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey } = req.body;
    if (!keyId || !applicationKey) return res.status(400).json({ error: 'keyId and applicationKey required' });
    const auth = await getOrAuthenticate(keyId, applicationKey);
    res.json({ success: true, auth: { accountId: auth.accountId, apiUrl: auth.apiUrl, downloadUrl: auth.downloadUrl, allowed: auth.allowed } });
  } catch (err: any) { res.status(500).json({ error: err.message || 'Authorization failed' }); }
});

router.post('/buckets', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey, bucketId } = req.body;
    if (!keyId || !applicationKey) return res.status(400).json({ error: 'Credentials required' });
    let auth = await getOrAuthenticate(keyId, applicationKey);
    try {
      const buckets = await BackblazeClient.listBuckets(auth, bucketId);
      return res.json({ success: true, buckets });
    } catch {
      invalidateB2Cache(keyId, applicationKey);
      auth = await BackblazeClient.authorize(keyId, applicationKey);
      const buckets = await BackblazeClient.listBuckets(auth, bucketId);
      return res.json({ success: true, buckets });
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/create-bucket', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey, bucketName, bucketType } = req.body;
    if (!keyId || !applicationKey || !bucketName) return res.status(400).json({ error: 'Parameters missing' });
    const auth = await getOrAuthenticate(keyId, applicationKey);
    const bucket = await BackblazeClient.createBucket(auth, bucketName, bucketType || 'allPrivate');
    broadcastB2Event({ type: 'b2:bucket:created', bucketId: bucket.bucketId, bucketName: bucket.bucketName });
    res.json({ success: true, bucket });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/delete-bucket', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey, bucketId } = req.body;
    if (!keyId || !applicationKey || !bucketId) return res.status(400).json({ error: 'Parameters missing' });
    const auth = await getOrAuthenticate(keyId, applicationKey);
    await BackblazeClient.deleteBucket(auth, bucketId);
    broadcastB2Event({ type: 'b2:bucket:deleted', bucketId });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/files', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey, bucketId, prefix, delimiter, maxFileCount } = req.body;
    if (!keyId || !applicationKey || !bucketId) return res.status(400).json({ error: 'bucketId and credentials required' });
    let auth = await getOrAuthenticate(keyId, applicationKey);
    let allFiles: any[] = [];
    const listBatch = async (authorization: B2AuthData) => {
      let filesAcc: any[] = [];
      let start: string | undefined = undefined;
      while (true) {
        const result = await BackblazeClient.listFileNames(authorization, bucketId, prefix, delimiter, maxFileCount || 1000, start);
        filesAcc = filesAcc.concat(result.files || []);
        if (!result.nextFileName || result.nextFileName === start) break;
        start = result.nextFileName;
      }
      return filesAcc;
    };
    try { allFiles = await listBatch(auth); } catch {
      invalidateB2Cache(keyId, applicationKey);
      auth = await BackblazeClient.authorize(keyId, applicationKey);
      allFiles = await listBatch(auth);
    }
    const downloadAuthToken = await BackblazeClient.getDownloadAuthorization(auth, bucketId);
    res.json({ success: true, files: allFiles, downloadUrl: auth.downloadUrl, downloadAuthToken });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/create-folder', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey, bucketId, folderPath } = req.body;
    if (!keyId || !applicationKey || !bucketId || !folderPath) return res.status(400).json({ error: 'Parameters missing' });
    const auth = await getOrAuthenticate(keyId, applicationKey);
    const barePath = folderPath.replace(/^\/+|\/+$/g, '');
    const placeholderName = `${barePath}/.bzEmpty`;
    const { uploadUrl, authorizationToken } = await BackblazeClient.getUploadUrl(auth, bucketId);
    const uploaded = await BackblazeClient.uploadFile(uploadUrl, authorizationToken, placeholderName, Buffer.alloc(0), 'b2/x-auto', 'da39a3ee5e6b4b0d3255bfef95601890afd80709');
    broadcastB2Event({ type: 'b2:object:created', bucketId, path: placeholderName, fileId: uploaded.fileId });
    res.json({ success: true, folderPath: barePath, file: uploaded });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey, bucketId, fileName, fileBase64, contentType, sha1 } = req.body;
    if (!keyId || !applicationKey || !bucketId || !fileName || !fileBase64) return res.status(400).json({ error: 'Missing upload fields' });
    const auth = await getOrAuthenticate(keyId, applicationKey);
    const { uploadUrl, authorizationToken } = await BackblazeClient.getUploadUrl(auth, bucketId);
    const buffer = Buffer.from(fileBase64, 'base64');
    const uploaded = await BackblazeClient.uploadFile(uploadUrl, authorizationToken, fileName, buffer, contentType, sha1);
    broadcastB2Event({ type: 'b2:object:created', bucketId, path: fileName, fileId: uploaded.fileId, sizeBytes: uploaded.contentLength });
    res.json({ success: true, file: uploaded });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/delete-file', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey, fileName, fileId, bucketId } = req.body;
    if (!keyId || !applicationKey || !fileName) return res.status(400).json({ error: 'Missing parameters' });
    const auth = await getOrAuthenticate(keyId, applicationKey);
    let deletedCount = 0;
    if (fileId) {
      try {
        await BackblazeClient.deleteFileVersion(auth, fileName, fileId);
        broadcastB2Event({ type: 'b2:object:deleted', bucketId, path: fileName, fileId });
        deletedCount++;
      } catch {}
    }
    if (bucketId) {
      const verResult = await BackblazeClient.listFileVersions(auth, bucketId, fileName, 1000);
      const matching = (verResult.files || []).filter((f) => f.fileName === fileName && f.fileId !== fileId);
      for (const v of matching) {
        if (v.fileId) {
          try {
            await BackblazeClient.deleteFileVersion(auth, v.fileName, v.fileId);
            broadcastB2Event({ type: 'b2:object:deleted', bucketId, path: v.fileName, fileId: v.fileId });
            deletedCount++;
          } catch {}
        }
      }
    }
    res.json({ success: true, deletedCount });
  } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to delete file' }); }
});

router.post('/delete-folder', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey, bucketId, folderPath } = req.body;
    if (!keyId || !applicationKey || !bucketId || !folderPath) return res.status(400).json({ error: 'Missing parameters' });
    const auth = await getOrAuthenticate(keyId, applicationKey);
    const barePrefix = folderPath.replace(/^\/+|\/+$/g, '');
    const folderPrefix = `${barePrefix}/`;
    let deletedCount = 0;
    const verResult = await BackblazeClient.listFileVersions(auth, bucketId, folderPrefix, 1000);
    const versions = (verResult.files || []).filter((v) => v.fileName.startsWith(folderPrefix));
    for (const v of versions) {
      if (v.fileId) {
        try {
          await BackblazeClient.deleteFileVersion(auth, v.fileName, v.fileId);
          broadcastB2Event({ type: 'b2:object:deleted', bucketId, path: v.fileName, fileId: v.fileId });
          deletedCount++;
        } catch {}
      }
    }
    res.json({ success: true, deletedCount });
  } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to delete folder' }); }
});

router.get('/proxy-file', async (req: Request, res: Response) => {
  try {
    const { keyId, applicationKey, bucketName, fileName } = req.query as Record<string, string>;
    if (!keyId || !applicationKey || !bucketName || !fileName) return res.status(400).send('Missing proxy parameters');
    const auth = await getOrAuthenticate(keyId, applicationKey);
    const encodedFileName = encodeURIComponent(fileName).replace(/%2F/g, '/');
    const targetUrl = `${auth.downloadUrl}/file/${bucketName}/${encodedFileName}`;
    const b2Res = await fetch(targetUrl, { headers: { Authorization: auth.authorizationToken } });
    if (!b2Res.ok) return res.status(b2Res.status).send(`Failed to stream from B2: ${b2Res.statusText}`);
    const ct = b2Res.headers.get('content-type');
    const cl = b2Res.headers.get('content-length');
    if (ct) res.setHeader('Content-Type', ct);
    if (cl) res.setHeader('Content-Length', cl);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const arrayBuffer = await b2Res.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) { res.status(500).send(err.message || 'Stream error'); }
});

export default router;
