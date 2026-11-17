import fs from 'fs';
import path from 'path';

function loadEnvFile(envPath: string) {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (match) {
        const key = match[1];
        const val = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

import { systemBucketUpload, getSystemBucketConfig } from '../src/server/system-bucket';

async function seedBinaries() {
  console.log('--- Seeding WebAssembly Binaries to System Bucket (srkl/) ---');
  const config = await getSystemBucketConfig();
  console.log(`Target Bucket: ${config.bucketName} (${config.endpoint || 'AWS S3'}, region: ${config.region})`);

  if (!config.accessKeyId || !config.secretAccessKey) {
    console.error('ERROR: Bucket credentials are not yet set in ultrst_credentials table!');
    process.exit(1);
  }

  const wasmPath = path.resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
  if (!fs.existsSync(wasmPath)) {
    console.error(`ERROR: File not found: ${wasmPath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(wasmPath);
  const key = 'srkl/binaries/sql-wasm.wasm';
  console.log(`Uploading sql-wasm.wasm (${(buffer.length / 1024).toFixed(1)} KB) -> ${key}...`);
  try {
    const res = await systemBucketUpload({
      key,
      body: buffer,
      contentType: 'application/wasm',
    });
    console.log(`  ✔ Uploaded successfully to ${res.bucket}/${res.key}`);
  } catch (err: any) {
    console.error(`  ✖ Failed to upload sql-wasm.wasm:`, err.message);
  }

  console.log('\nSeed process complete.');
}

seedBinaries().catch(console.error);
