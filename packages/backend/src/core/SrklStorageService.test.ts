import { beforeEach, describe, expect, it, vi } from 'vitest';
import { S3Client, ListObjectsV2Command } from '@dinilmusick/gutts/storage/s3';
import { SrklStorageService } from './SrklStorageService.js';

vi.mock('@dinilmusick/gutts/storage/s3', () => {
  class MockListObjectsV2Command {
    constructor(readonly input: { Bucket: string; MaxKeys: number }) {}
  }
  class MockS3Client {
    static instances: MockS3Client[] = [];
    readonly commands: unknown[] = [];
    constructor(readonly options: Record<string, unknown>) { MockS3Client.instances.push(this); }
    async send(command: unknown): Promise<unknown> { this.commands.push(command); return {}; }
  }
  return { S3Client: MockS3Client, ListObjectsV2Command: MockListObjectsV2Command };
});

vi.mock('@dinilmusick/gutts/storage', () => {
  throw new Error('SRKL S3 storage must not load the aggregate GutTS storage entrypoint.');
});

type S3ClientTestHarness = typeof S3Client & {
  instances: Array<InstanceType<typeof S3Client> & {
    options: Record<string, unknown>;
    commands: unknown[];
  }>;
};
const TestS3Client = S3Client as S3ClientTestHarness;

const account = {
  id: 'live-b2-account',
  name: 'Live B2 account',
  keyId: 'b2-key-id',
  applicationKey: 'b2-application-key',
  endpoint: 's3.us-west-004.backblazeb2.com',
  region: 'us-west-004',
  bucketName: 'audio-vault',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('SRKL storage S3 dependency boundary', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VITEST', '');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ accounts: [account] })));
    TestS3Client.instances.length = 0;
  });

  it('loads S3 from the provider-specific GutTS entrypoint without the aggregate storage module', async () => {
    const service = new SrklStorageService('https://srkl.example.test');

    await expect(service.listBuckets(account.id)).resolves.toEqual(['audio-vault']);

    expect(TestS3Client.instances).toHaveLength(1);
    expect(TestS3Client.instances[0].options).toEqual({
      endpoint: 'https://s3.us-west-004.backblazeb2.com',
      region: 'us-west-004',
      credentials: {
        accessKeyId: 'b2-key-id',
        secretAccessKey: 'b2-application-key',
      },
      forcePathStyle: true,
    });
    expect(TestS3Client.instances[0].commands).toHaveLength(1);
    expect(TestS3Client.instances[0].commands[0]).toBeInstanceOf(ListObjectsV2Command);
    expect((TestS3Client.instances[0].commands[0] as ListObjectsV2Command).input).toEqual({
      Bucket: 'audio-vault',
      MaxKeys: 1,
    });
  });

  it('verifies access against the configured bucket using the isolated S3 client', async () => {
    const service = new SrklStorageService('https://srkl.example.test');

    await expect(service.verifyBucketAccess(account.id, 'audio-vault')).resolves.toBe(true);
    expect(TestS3Client.instances).toHaveLength(1);
    expect(TestS3Client.instances[0].commands[0]).toBeInstanceOf(ListObjectsV2Command);
  });

  it('retains the configured-bucket fallback when the S3 request fails', async () => {
    const service = new SrklStorageService('https://srkl.example.test');
    const client = TestS3Client.instances;
    vi.spyOn(S3Client.prototype, 'send').mockRejectedValueOnce(new Error('access denied'));

    await expect(service.verifyBucketAccess(account.id, 'audio-vault')).resolves.toBe(true);
    expect(client).toHaveLength(1);
  });
});
