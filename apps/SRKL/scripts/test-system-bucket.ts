import fs from 'fs';
import path from 'path';

function loadEnvFile(envPath: string) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    const val = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

import {
  getSystemBucketConfig,
  systemBucketUpload,
  systemBucketDownload,
  systemBucketList,
  systemBucketDelete,
} from '../src/server/system-bucket';

async function testSystemBucket() {
  console.log('================================================================');
  console.log('        SRKL SYSTEM BUCKET CONNECTIVITY VERIFICATION            ');
  console.log('================================================================\n');

  console.log('1. Resolving canonical system bucket configuration...');
  const config = await getSystemBucketConfig();

  console.log(`  Provider:         ${config.provider || '(unset)'}`);
  console.log(`  Bucket Name:      ${config.bucketName || '(unset)'}`);
  console.log(`  Endpoint:         ${config.endpoint || '(default)'}`);
  console.log(`  Region:           ${config.region || '(unset)'}`);
  console.log(`  Access Key ID:    ${config.accessKeyId ? `${config.accessKeyId.slice(0, 4)}****` : '(NOT CONFIGURED)'}`);
  console.log(`  Secret App Key:   ${config.secretAccessKey ? '********' : '(NOT CONFIGURED)'}\n`);

  if (!config.accessKeyId || !config.secretAccessKey) {
    console.error('✖ FAIL: Canonical system bucket credentials are not configured.');
    process.exit(1);
  }

  const canaryKey = `srkl/probes/canary-${Date.now()}.txt`;
  const canaryPayload = `Srkl canary probe executed at ${new Date().toISOString()}`;

  try {
    const t0 = Date.now();
    await systemBucketUpload({ key: canaryKey, body: canaryPayload, contentType: 'text/plain' });
    console.log(`  ✔ Canary write succeeded (${Date.now() - t0}ms) -> ${canaryKey}`);

    const t1 = Date.now();
    const downloaded = await systemBucketDownload(canaryKey);
    const bodyStr = Buffer.from(downloaded.body).toString('utf-8');
    if (bodyStr !== canaryPayload) throw new Error('Canary payload mismatch');
    console.log(`  ✔ Canary read verified with byte integrity (${Date.now() - t1}ms)`);

    await systemBucketDelete(canaryKey);
    console.log('  ✔ Canary probe cleaned up');

    const list = await systemBucketList({ prefix: 'srkl/', maxKeys: 10 });
    console.log(`  ✔ Listed ${list.keys.length} object(s) in srkl/ namespace`);

    console.log('\n================================================================');
    console.log('✔ SYSTEM BUCKET HEALTHY & FULLY OPERATIONAL FOR SRKL');
    console.log('================================================================');
  } catch (err: any) {
    console.error(`\n✖ S3/B2 OPERATION FAILED: ${err.message}`);
    if (err.name) console.error(`  Error Name: ${err.name}`);
    if (err.$metadata) console.error(`  HTTP Status: ${err.$metadata.httpStatusCode}`);
    process.exit(1);
  }
}

testSystemBucket().catch((err) => {
  console.error(err);
  process.exit(1);
});
