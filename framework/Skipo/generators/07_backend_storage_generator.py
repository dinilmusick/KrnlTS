#!/usr/bin/env python3
"""
Aspect 07: Universal Backend & Storage Decoupling Suite Generator
Generates:
- Complete Universal Backend Storage Suite folder (storage/)
  - presigned.ts (Direct presigned URL generation eliminating /tmp proxying)
  - presigned.test.ts (Companion test suite)
  - types.ts (Storage contracts)
  - index.ts (Barrel re-export)
"""

from pathlib import Path
from typing import List, Dict, Any
import json
import sys
import time

try:
    from .common import (
        GeneratedFile, GeneratorResult, section_header,
        generate_ascii_flowchart, emit_directory, parse_generator_args,
        print_generator_report
    )
except ImportError:
    from common import (
        GeneratedFile, GeneratorResult, section_header,
        generate_ascii_flowchart, emit_directory, parse_generator_args,
        print_generator_report
    )

GENERATOR_ID = "07_backend_storage_generator"
GENERATOR_TITLE = "Universal Backend Storage Decoupling Suite Generator"

def generate_backend_storage(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    start_time = time.time()
    files: List[GeneratedFile] = []

    suite_name = params.get("name") or "WorkspaceStorage"
    custom = params.get("custom", {})
    provider = custom.get("provider", "b2-s3")

    # 1. types.ts
    types_content = f"""{section_header(f"{suite_name} Types & Contracts")}
// ══════════════════════════════════════════════════════════════════════════════

export interface PresignedUploadRequest {{
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  workspaceId: string;
}}

export interface PresignedUploadResponse {{
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
}}

export interface StorageCompletePayload {{
  objectKey: string;
  workspaceId: string;
  etag?: string;
  fileSizeBytes: number;
}}
"""
    files.append(GeneratedFile(
        relative_path="types.ts",
        content=types_content,
        description=f"Storage decoupling contracts for {suite_name}"
    ))

    # 2. presigned.ts
    flowchart = generate_ascii_flowchart("Decoupled Direct Presigned Transfer", [
        "Client Requests Presigned Upload URL from Control Plane",
        "Control Plane Issues Signed URL (Zero /tmp File Buffering)",
        "Client Uploads Direct to Data Plane (B2/S3)",
        "Client Commits Metadata to Control Plane via /api/complete"
    ])

    presigned_content = f"""import {{ S3Client, PutObjectCommand, GetObjectCommand }} from '@aws-sdk/client-s3';
import {{ getSignedUrl }} from '@aws-sdk/s3-request-presigner';
import {{ randomUUID }} from 'crypto';
import type {{ PresignedUploadRequest, PresignedUploadResponse, StorageCompletePayload }} from './types';

{flowchart}

{section_header(f"{suite_name} Direct Transfer Engine")}
// ══════════════════════════════════════════════════════════════════════════════

export class {suite_name}Engine {{
  private s3Client: S3Client;
  private bucketName: string;

  constructor(bucketName: string, endpointUrl?: string) {{
    this.bucketName = bucketName;
    this.s3Client = new S3Client({{
      region: process.env.STORAGE_REGION || 'auto',
      endpoint: endpointUrl || process.env.STORAGE_ENDPOINT,
      credentials: {{
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || ''
      }}
    }});
  }}

  async createPresignedUploadUrl(
    request: PresignedUploadRequest
  ): Promise<PresignedUploadResponse> {{
    const sanitizedFileName = request.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `workspaces/${{request.workspaceId}}/${{randomUUID()}}-${{sanitizedFileName}}`;
    const expiresInSeconds = 900; // 15 minutes window

    const command = new PutObjectCommand({{
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: request.mimeType
    }});

    const uploadUrl = await getSignedUrl(this.s3Client, command, {{ expiresIn: expiresInSeconds }});

    return {{
      uploadUrl,
      objectKey,
      expiresInSeconds,
      headers: {{
        'Content-Type': request.mimeType
      }}
    }};
  }}

  async commitUploadMetadata(payload: StorageCompletePayload): Promise<{{ success: boolean; id: string }}> {{
    // Verify object key belongs to workspace
    if (!payload.objectKey.startsWith(`workspaces/${{payload.workspaceId}}/`)) {{
      throw new Error('Unauthorized object key mutation for workspace');
    }}

    return {{
      success: true,
      id: payload.objectKey
    }};
  }}
}}
"""
    files.append(GeneratedFile(
        relative_path="presigned.ts",
        content=presigned_content,
        description="Presigned URL generator enforcing zero ephemeral /tmp proxying"
    ))

    # 3. presigned.test.ts
    test_content = f"""import {{ describe, it, expect }} from 'vitest';
import {{ {suite_name}Engine }} from './presigned';

{section_header(f"{suite_name} Verification Test Suite")}
// ══════════════════════════════════════════════════════════════════════════════

describe('{suite_name} Presigned Transfers', () => {{
  const engine = new {suite_name}Engine('test-bucket-vault');

  it('rejects cross-workspace commit metadata mutations', async () => {{
    await expect(engine.commitUploadMetadata({{
      objectKey: 'workspaces/alien-workspace/file.png',
      workspaceId: 'my-workspace',
      fileSizeBytes: 1024
    }})).rejects.toThrow('Unauthorized object key mutation for workspace');
  }});

  it('validates authorized workspace commit metadata successfully', async () => {{
    const result = await engine.commitUploadMetadata({{
      objectKey: 'workspaces/my-workspace/valid.png',
      workspaceId: 'my-workspace',
      fileSizeBytes: 2048
    }});

    expect(result.success).toBe(true);
    expect(result.id).toBe('workspaces/my-workspace/valid.png');
  }});
}});
"""
    files.append(GeneratedFile(
        relative_path="presigned.test.ts",
        content=test_content,
        description=f"Companion test suite for {suite_name}"
    ))

    # 4. index.ts
    index_content = f"""{section_header(f"{suite_name} Barrel Facade")}
// ══════════════════════════════════════════════════════════════════════════════

export * from './types';
export * from './presigned';
"""
    files.append(GeneratedFile(
        relative_path="index.ts",
        content=index_content,
        description=f"Barrel facade re-exporting {suite_name}"
    ))

    # Write files
    result = emit_directory(
        target_dir=target_dir,
        files=files,
        dry_run=params.get("dry_run", False),
        force=params.get("force", False)
    )
    result.generator_id = GENERATOR_ID
    result.generator_title = GENERATOR_TITLE
    result.duration_ms = (time.time() - start_time) * 1000
    return result

def main():
    args = parse_generator_args("Skipo Universal Backend Storage Decoupling Suite Generator")
    target_path = Path(args["target_path"] or "src/backend/storage").resolve()
    result = generate_backend_storage(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_generator_report(result)

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
