#!/usr/bin/env python3
"""
scaffold_app_structure.py - Scaffolds the extreme-minimal Skipo application composition structure.
Consumes @kloks/* and @floks/* via package.json (node_modules/) with ZERO package source duplication.
"""

from pathlib import Path
from typing import List, Tuple
import argparse
import json
import subprocess
import sys

HERE = Path(__file__).resolve().parent
SKIPO_ROOT = HERE.parent
if str(SKIPO_ROOT) not in sys.path:
    sys.path.insert(0, str(SKIPO_ROOT))
from scripts.generate_provider_packaging import generate_provider_packaging

def scaffold_structure(target_root: Path, app_name: str) -> List[Path]:
    """Generates the minimal Skipo composition tree consuming @kloks/* and @floks/* packages."""
    pascal = app_name[:1].upper() + app_name[1:]
    camel = app_name[:1].lower() + app_name[1:]
    created: List[Path] = []

    planes = [
        ("src/frontend", "Application UI composition entrypoint importing @floks/* packages."),
        ("src/backend", "Application backend facade importing @kloks/* services and orchestrators."),
        ("src/libraries", "Application-specific custom code ONLY (never copy @kloks/* or @floks/* source)."),
    ]

    for rel_path, desc in planes:
        dir_path = target_root / rel_path
        dir_path.mkdir(parents=True, exist_ok=True)
        readme_file = dir_path / "README.md"
        if not readme_file.exists():
            readme_file.write_text(f"# {dir_path.name}\n\n{desc}\n", encoding="utf-8")
            created.append(readme_file)

    # Canonical embedded-module discovery root. Complete applications remain standalone.
    modules_dir = target_root / "src" / "modules"
    modules_dir.mkdir(parents=True, exist_ok=True)
    modules_readme = modules_dir / "README.md"
    if not modules_readme.exists():
        modules_readme.write_text(
            "# Embedded Skipo modules\\n\\n"
            "A Skipo module is a standalone-capable application declared by skipo.module.json, "
            "not a Floks UI module or a folder of components. Skipo owns discovery, validation, "
            "capability authorization, backend adaptation, UI contributions, and lifecycle.\\n\\n"
            "One module may combine multiple related product domains and workflows; do not split "
            "a cohesive module by page or historical feature name. The parent application retains "
            "authentication and workspace selection. Modules receive approved resources through "
            "ModuleRuntimeContext.\\n\\n"
            "Place complete module-capable Skipo applications in immediate child directories.\\n",
            encoding="utf-8",
        )
        created.append(modules_readme)

    # 1. package.json declaring unified @ultrst-armada/kloks, @ultrst-armada/floks
    pkg_json_file = target_root / "package.json"
    if not pkg_json_file.exists():
        pkg_data = {
            "name": app_name.lower(),
            "version": "1.0.0",
            "private": True,
            "type": "module",
            "skipo": {"deploy": "fullstack"},
            "dependencies": {
                "@aws-sdk/client-s3": "^3.1130.0",
                "@aws-sdk/s3-request-presigner": "^3.1132.0",
                "@dinilmusick/gutts": "^2.1.1",
                "@neondatabase/serverless": "^1.1.0",
                "@ultrst-armada/floks": "^2.0.0",
                "@ultrst-armada/frnlts": "^0.5.23",
                "@ultrst-armada/kloks": "^2.0.4",
                "@ultrst-armada/krnl": "^1.0.25",
                "react": "^19.0.1",
                "react-dom": "^19.0.1",
                "lucide-react": "^0.553.0",
                "@xyflow/react": "^12.11.1",
                "d3-force": "^3.0.0",
                "zustand": "^5.0.15"
            },
            "devDependencies": {
                "tailwindcss": "^4.3.4",
                "@tailwindcss/vite": "^4.3.4",
                "typescript": "^5.7.0",
                "@types/node": "^22.0.0",
                "@types/react": "^19.0.0",
                "@types/react-dom": "^19.0.0"
            }
        }
        pkg_json_file.write_text(json.dumps(pkg_data, indent=2) + "\n", encoding="utf-8")
        created.append(pkg_json_file)

    # 1a. Canonical Floks workspace creation gate. Apps supply only their API callbacks.
    workspace_gate_dir = target_root / "src" / "frontend" / "components" / "gates"
    workspace_gate_dir.mkdir(parents=True, exist_ok=True)
    workspace_gate_file = workspace_gate_dir / "WorkspaceGate.tsx"
    if not workspace_gate_file.exists():
        workspace_gate_content = """import React from 'react';
import {
  WorkspaceTilesMenu,
  type WorkspaceCreateInput,
  type WorkspaceRecord,
  type WorkspaceStorageOption,
} from '@ultrst-armada/floks/ui';

export interface WorkspaceGateProps {
  workspaces: WorkspaceRecord[];
  userId?: string;
  currentUser?: { id: string; email?: string; name?: string; username?: string } | null;
  storageOptions?: WorkspaceStorageOption[];
  onManageStorage?: () => void;
  activeWorkspaceId?: string | null;
  onSelectWorkspace: (workspace: WorkspaceRecord) => void;
  onCreateWorkspace: (input: WorkspaceCreateInput) => Promise<void> | void;
  onDeleteWorkspace?: (workspaceId: string) => Promise<void> | void;
  onLogout?: () => void;
  appName?: string;
}

export function WorkspaceGate(props: WorkspaceGateProps) {
  return <WorkspaceTilesMenu
    workspaces={props.workspaces}
    userId={props.userId || props.currentUser?.id}
    currentUser={props.currentUser}
    storageOptions={props.storageOptions}
    onManageStorage={props.onManageStorage}
    activeWorkspaceId={props.activeWorkspaceId}
    onSelectWorkspace={props.onSelectWorkspace}
    onCreateWorkspace={props.onCreateWorkspace}
    onDeleteWorkspace={props.onDeleteWorkspace}
    onLogout={props.onLogout}
    appName={props.appName || 'SKIPO APP'}
    mode="working-workspace"
  />;
}
"""
        workspace_gate_file.write_text(workspace_gate_content, encoding="utf-8")
        created.append(workspace_gate_file)

    # 1b. tsconfig.json
    tsconfig_file = target_root / "tsconfig.json"
    if not tsconfig_file.exists():
        tsconfig_data = {
            "compilerOptions": {
                "target": "ES2022",
                "lib": ["ES2022", "DOM"],
                "module": "ESNext",
                "moduleResolution": "bundler",
                "jsx": "react-jsx",
                "strict": False,
                "skipLibCheck": True,
                "noEmit": True
            },
            "include": ["src/**/*"]
        }
        tsconfig_file.write_text(json.dumps(tsconfig_data, indent=2) + "\n", encoding="utf-8")
        created.append(tsconfig_file)

    # 1c. Luth-backed server-side session validation for protected application routes
    auth_guard_file = target_root / "src" / "backend" / "auth" / "luthSession.ts"
    if not auth_guard_file.exists():
        auth_guard_file.parent.mkdir(parents=True, exist_ok=True)
        auth_guard_file.write_text("""import { DEFAULT_LUTH_URL } from '@ultrst-armada/kloks/auth';

export async function getLuthSession(request: Request) {
  const headers = new Headers({ 'x-app-id': request.headers.get('x-app-id') || new URL(request.url).hostname });
  for (const name of ['authorization', 'cookie', 'origin']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let response: Response;
  try {
    response = await fetch(DEFAULT_LUTH_URL + '/api/session', {
      method: 'GET', headers, cache: 'no-store', redirect: 'manual',
    });
  } catch { return null; }
  if (!response.ok) return null;
  const session = await response.json().catch(() => null) as any;
  if (session?.authenticated !== true || typeof session?.user?.id !== 'string' ||
      typeof session?.session?.id !== 'string') return null;
  return session;
}

/** Proxy Luth login/session endpoints without embedding provider-specific auth logic. */
export async function proxyLuthAuthRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const appOwned = url.pathname === '/api/auth/workspaces' || url.pathname.startsWith('/api/auth/storage/');
  if (!url.pathname.startsWith('/api/auth/') || appOwned) return null;
  if (url.pathname === '/api/auth/admin/login') {
    return Response.json({ success: false, error: 'Administrative login is not provided by Luth user authentication.' }, { status: 403 });
  }
  const headers = new Headers({ 'x-app-id': request.headers.get('x-app-id') || url.hostname });
  for (const name of ['authorization', 'cookie', 'content-type', 'origin', 'user-agent']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(`${DEFAULT_LUTH_URL}${url.pathname}${url.search}`, {
      method: request.method, headers,
      ...(request.method === 'GET' || request.method === 'HEAD' ? {} : { body: await request.arrayBuffer() }),
      redirect: 'manual', cache: 'no-store',
    });
    const responseHeaders = new Headers();
    for (const name of ['content-type', 'set-cookie', 'set-auth-token', 'location', 'cache-control']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ success: false, error: 'Canonical Luth authentication service unavailable.' }, { status: 503 });
  }
}

/** Attach verified identity to a Web Request; caller-supplied identity headers are never trusted. */
export async function authenticateLuthRequest(request: Request): Promise<{ request?: Request; status?: number; error?: string }> {
  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith('/api/') || request.method === 'OPTIONS' ||
      pathname === '/health' || pathname === '/api/health' ||
      pathname === '/api/public/routes' || pathname.startsWith('/api/public/routes/')) return { request };
  if (!request.headers.get('authorization') && !request.headers.get('cookie')) {
    return { status: 401, error: 'A verified Luth session is required.' };
  }
  const session = await getLuthSession(request);
  if (!session?.user?.id) return { status: 401, error: 'Luth session is invalid or expired.' };
  const headers = new Headers(request.headers);
  headers.set('x-user-id', session.user.id);
  if (session.user.email) headers.set('x-user-email', String(session.user.email));
  if (session.session?.id) headers.set('x-session-id', session.session.id);
  headers.set('x-user-role', 'user');
  return { request: new Request(request, { headers }) };
}

export async function requireLuthSession(request: Request) {
  const session = await getLuthSession(request);
  if (session) return session;
  throw new Response(JSON.stringify({ error: 'Unauthenticated' }), {
    status: 401, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
""", encoding="utf-8")
        created.append(auth_guard_file)

    # 2b. Canonical Google Drive storage adapter, backed by Kloks.
    google_drive_storage_dir = target_root / "src" / "backend" / "storage"
    google_drive_storage_dir.mkdir(parents=True, exist_ok=True)
    google_drive_storage_file = google_drive_storage_dir / "googleDriveWorkspaceStorage.ts"
    if not google_drive_storage_file.exists():
        google_drive_storage_content = """import {
  GoogleDriveWorkspaceService,
  type GoogleDriveWorkspaceTokens,
} from '@ultrst-armada/kloks/backend/storage-workspace';

export interface GoogleDriveOAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}

export interface GoogleDriveEnvironment {
  GOOGLE_DRIVE_CLIENT_ID?: unknown;
  GOOGLE_DRIVE_CLIENT_SECRET?: unknown;
  GOOGLE_DRIVE_REDIRECT_URI?: unknown;
}

export interface GoogleDriveWorkspaceConnection {
  id: string;
  provider: 'google_drive';
  googleAccessToken?: string;
  googleAccessTokenExpiresAt?: number;
  googleRefreshToken?: string;
  googleRootFolderId?: string;
}

export interface GoogleDriveWorkspaceStorageHandle {
  storage: GoogleDriveWorkspaceService;
  connection: GoogleDriveWorkspaceConnection;
}

export function getGoogleDriveOAuthConfig(env: GoogleDriveEnvironment): GoogleDriveOAuthConfig {
  const clientId = String(env.GOOGLE_DRIVE_CLIENT_ID ?? '').trim();
  const clientSecret = String(env.GOOGLE_DRIVE_CLIENT_SECRET ?? '').trim();
  const redirectUri = String(env.GOOGLE_DRIVE_REDIRECT_URI ?? '').trim();
  if (!clientId) throw new Error('GOOGLE_DRIVE_CLIENT_ID must be configured in the server secret store.');
  if (!redirectUri) throw new Error('GOOGLE_DRIVE_REDIRECT_URI must be configured in the server environment.');
  return { clientId, clientSecret: clientSecret || undefined, redirectUri };
}

export function createGoogleDriveAuthorizationUrl(
  oauth: GoogleDriveOAuthConfig,
  state: string,
  scopes?: string[],
): string {
  return GoogleDriveWorkspaceService.createAuthorizationUrl(oauth, state, scopes);
}

export function exchangeGoogleDriveAuthorizationCode(
  oauth: GoogleDriveOAuthConfig,
  code: string,
  existingRefreshToken?: string,
  codeVerifier?: string,
): Promise<GoogleDriveWorkspaceTokens> {
  return GoogleDriveWorkspaceService.exchangeAuthorizationCode(
    oauth,
    code,
    existingRefreshToken,
    codeVerifier,
  );
}

export async function createGoogleDriveWorkspaceStorage(
  source: GoogleDriveWorkspaceConnection,
  oauth: GoogleDriveOAuthConfig,
): Promise<GoogleDriveWorkspaceStorageHandle> {
  if (source.provider !== 'google_drive') {
    throw new Error('A Google Drive workspace connection is required.');
  }
  if (!oauth.clientId || !oauth.redirectUri) {
    throw new Error('Google Drive OAuth client ID and redirect URI are required.');
  }

  const connection = { ...source };
  const tokens: GoogleDriveWorkspaceTokens = {
    accessToken: connection.googleAccessToken || '',
    ...(connection.googleRefreshToken ? { refreshToken: connection.googleRefreshToken } : {}),
    ...(connection.googleAccessTokenExpiresAt
      ? { expiresAt: connection.googleAccessTokenExpiresAt }
      : {}),
  };

  const storage = new GoogleDriveWorkspaceService({
    clientId: oauth.clientId,
    clientSecret: oauth.clientSecret,
    redirectUri: oauth.redirectUri,
    tokens,
    rootFolderId: connection.googleRootFolderId || 'root',
    persistTokens: async (updated) => {
      connection.googleAccessToken = updated.accessToken;
      connection.googleRefreshToken = updated.refreshToken;
      connection.googleAccessTokenExpiresAt = updated.expiresAt;
    },
  });

  return { storage, connection };
}"""
        google_drive_storage_file.write_text(google_drive_storage_content, encoding="utf-8")
        created.append(google_drive_storage_file)

    # 2c. src/backend/<AppName>Backend.ts
    backend_file = target_root / "src" / "backend" / f"{pascal}Backend.ts"
    if not backend_file.exists():
        backend_content = f"""/**
 * @file {pascal}Backend.ts
 * @description Provider-independent backend using Web-standard application contracts.
 */

import {{ ServiceAFacade, ServiceBFacade }} from '@ultrst-armada/kloks/services';
import {{ BackendFacade }} from './BackendFacade.js';
import {{ createAppExternalInterfaces }} from './externalInterfaces.js';
import {{ LuthAuthServiceFacade }} from './LuthAuthServiceFacade.js';

export const bugReportService = {{
  report: async (input: any, options?: any) => {{
    const userId = options?.session?.userId ?? options?.auth?.user?.id ?? 'authenticated_user';
    return {{
      success: true,
      id: 'bug-' + Date.now().toString(36),
      report: {{
        ...input,
        reporterId: userId,
        context: {{
          applicationId: '{camel}-app',
          applicationType: 'skipo' as const,
          applicationVersion: '1.0.0',
          ...input?.context,
        }},
      }},
    }};
  }},
}};

export const backendFacade = new BackendFacade();
backendFacade.registerService(ServiceAFacade);
backendFacade.registerService(ServiceBFacade);

export const externalInterfaces = createAppExternalInterfaces(backendFacade);

export const {pascal}Backend = {{
  services: {{
    auth: LuthAuthServiceFacade,
    serviceA: ServiceAFacade,
    serviceB: ServiceBFacade,
    bugReport: bugReportService,
  }},
  backendFacade,
  externalInterfaces,
}};

export default {pascal}Backend;
"""
        backend_file.write_text(backend_content, encoding="utf-8")
        created.append(backend_file)

    # 2c. Canonical public backend barrel (Aspect 22 compliance)
    backend_barrel = target_root / "src" / "backend" / "index.ts"
    if not backend_barrel.exists():
        backend_barrel_content = f"""/**
 * @file index.ts
 * @description Canonical public backend barrel.
 */

export * from './{pascal}Backend.js';
export {{ default }} from './{pascal}Backend.js';
"""
        backend_barrel.write_text(backend_barrel_content, encoding="utf-8")
        created.append(backend_barrel)

    # 2d. Canonical server-side Luth session boundary for generated API handlers.
    auth_dir = target_root / "src" / "backend" / "auth"
    auth_dir.mkdir(parents=True, exist_ok=True)
    luth_session_file = auth_dir / "luthSession.ts"
    if not luth_session_file.exists():
        luth_session_source = SKIPO_ROOT / "src" / "backend" / "auth" / "luthSession.ts"
        if not luth_session_source.is_file():
            raise FileNotFoundError(f"Canonical Luth session adapter not found: {luth_session_source}")
        luth_session_file.write_text(luth_session_source.read_text(encoding="utf-8"), encoding="utf-8")
        created.append(luth_session_file)

    luth_auth_facade_file = target_root / "src" / "backend" / "LuthAuthServiceFacade.ts"
    if not luth_auth_facade_file.exists():
        luth_auth_facade_source = SKIPO_ROOT / "src" / "backend" / "LuthAuthServiceFacade.ts"
        if luth_auth_facade_source.is_file():
            luth_auth_facade_file.write_text(luth_auth_facade_source.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            luth_auth_facade_file.write_text(
                "import { getLuthSession, proxyLuthAuthRequest } from './auth/luthSession.js';\\n"
                "export const LuthAuthServiceFacade = { id: 'auth', name: 'Luth Authentication', version: '1.0.0', "
                "getSession: getLuthSession, getCurrentUser: async (request: Request) => (await getLuthSession(request))?.user ?? null, "
                "proxyRequest: proxyLuthAuthRequest };\\n"
                "export default LuthAuthServiceFacade;\\n",
                encoding="utf-8",
            )
        created.append(luth_auth_facade_file)

    # 3. Canonical Skipo frontend page contract + component facade
    frontend_components = target_root / "src" / "frontend" / "components"
    pages_root = target_root / "src" / "frontend" / "pages"
    required_page_dirs = [
        pages_root / "auth",
        pages_root / "menus" / "workspaces",
        pages_root / "main" / "tabs",
        pages_root / "settings" / "tabs" / "themes",
        pages_root / "settings" / "tabs" / "accounts",
    ]
    frontend_components.mkdir(parents=True, exist_ok=True)
    # Copy generic module/runtime infrastructure from the canonical Skipo framework.
    module_ui_source = SKIPO_ROOT / "src" / "frontend" / "components" / "module-ui"
    module_ui_target = frontend_components / "module-ui"
    module_ui_target.mkdir(parents=True, exist_ok=True)
    for source in module_ui_source.glob("*.ts*"):
        target = module_ui_target / source.name
        if not target.exists():
            target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
            created.append(target)

    for page_dir in required_page_dirs:
        page_dir.mkdir(parents=True, exist_ok=True)

    components_file = frontend_components / "components.ts"
    if not components_file.exists():
        components_file.write_text(
            "export * from '@ultrst-armada/floks/ui';\n"
            "export { InfiniteCanvas, DockBar, FrnlEditableNodeGraph } from '@ultrst-armada/floks/canvas-ui';\n"
            "export { ModuleUIHost, registerSkipoModuleUI } from './module-ui/index.js';\n"
            "export type { ModuleUIExport, ModuleSurfaceProps, ModuleSurfaceType, SkipoModuleUIContribution } from './module-ui/index.js';\n",
            encoding="utf-8",
        )
        created.append(components_file)

    # Generic backend/module framework files are copied verbatim from the canonical framework.
    for relative_dir in ("module-contract", "modules/runtime", "backend/external"):
        source_dir = SKIPO_ROOT / "src" / relative_dir
        target_dir = target_root / "src" / relative_dir
        if source_dir.is_dir():
            for source in source_dir.rglob("*"):
                if source.is_file():
                    target = target_dir / source.relative_to(source_dir)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    if not target.exists():
                        target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
                        created.append(target)
    for relative_file in (
        "schemas/skipo.module.schema.json",
        "src/backend/BackendFacade.ts", "src/backend/BackendFacadeTypes.ts",
        "src/backend/BackendCapabilityCatalog.ts", "src/backend/ModuleBackendAdapter.ts",
        "src/backend/ModuleBackendAdapterTypes.ts", "src/backend/externalInterfaces.ts",
    ):
        source = SKIPO_ROOT / relative_file
        target = target_root / relative_file
        if source.is_file() and not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
            created.append(target)

    page_templates = {
        pages_root / "auth" / "LuthAuthPage.tsx": """'use client';

import React from 'react';
import { LuthAuthPage as FloksLuthAuthPage } from '@ultrst-armada/floks/auth';

export function LuthAuthPage({ applicationId, appName, onAuthenticated, authenticatedContent, onContinueAsGuest }: {
  applicationId: string;
  appName: string;
  onAuthenticated?: (user: unknown) => void;
  authenticatedContent?: React.ReactNode | ((auth: any) => React.ReactNode);
  onContinueAsGuest?: () => void;
}) {
  return <FloksLuthAuthPage ecosystemId="ultrst-armada"
    applicationId={applicationId} appName={appName}
    onAuthenticated={onAuthenticated as any}
    authenticatedContent={authenticatedContent as any}
    onContinueAsGuest={onContinueAsGuest} />;
}

export default LuthAuthPage;
""",
        pages_root / "auth" / "luthFetch.ts": """'use client';

import { createLuthAuthClient } from '@ultrst-armada/kloks/auth';

const luthClient = createLuthAuthClient({
  ecosystemId: 'ultrst-armada',
  applicationId: "__SKIPO_APPLICATION_ID__",
  autoRegister: true,
});

/** Attach the canonical Luth bearer token to protected application API requests. */
export async function luthFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  new Headers(luthClient.getAuthHeaders()).forEach((value, key) => headers.set(key, value));
  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
    cache: init.cache ?? 'no-store',
  });
}
""",
        pages_root / "auth" / "page.tsx": (
            "import React from 'react';\n"
            "import { LuthAuthPage } from './LuthAuthPage.js';\n\n"
            f"export function AuthPage(props: {{ onAuthenticated?: (user: unknown) => void; authenticatedContent?: React.ReactNode | ((auth: any) => React.ReactNode); onContinueAsGuest?: () => void }}) {{\n"
            f"  return <LuthAuthPage applicationId=\"{app_name.lower().replace(' ', '-')}\" appName=\"{pascal}\" onAuthenticated={{props.onAuthenticated}} authenticatedContent={{props.authenticatedContent}} onContinueAsGuest={{props.onContinueAsGuest}} />;\n"
            "}\n\n"
            "export default AuthPage;\n"
        ),
        pages_root / "menus" / "workspaces" / "page.tsx": (
            "export { WorkspaceTilesMenu } from '@ultrst-armada/floks/ui';\n"
        ),
        pages_root / "main" / "page.tsx": """import React, { useState } from 'react';
import { frnlPage as FrnlPage } from '../../components/components.js';
import { ModuleUIHost } from '../../components/module-ui/ModuleUIHost.js';

export function MainPage({ children }: { children?: React.ReactNode }) {
  const [immersive, setImmersive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div data-skipo-main-page="true" data-immersive={immersive}>
      <nav>
        <button type="button" onClick={() => setSettingsOpen((value) => !value)}>Settings</button>
        <button type="button" data-skipo-immersive-toggle="true" onClick={() => setImmersive((value) => !value)}>
          {immersive ? 'Exit immersive' : 'Immersive'}
        </button>
      </nav>
      <FrnlPage showTopBar={!immersive} showBottomBar={!immersive}>
        {settingsOpen ? <div>Settings</div> : children}
      </FrnlPage>
      <ModuleUIHost />
    </div>
  );
}

export default MainPage;
""",
        pages_root / "main" / "tabs" / "README.md": (
            "# Main Tabs\\n\\nApplication-specific working UI belongs in additional tab directories under this folder.\\n"
        ),
        pages_root / "settings" / "page.tsx": (
            "import React, { useState } from 'react';\n"
            "import ThemesTab from './tabs/themes/page.js';\n"
            "import AccountsTab from './tabs/accounts/page.js';\n\n"
            "export default function SettingsPage() {\n"
            "  const [tab, setTab] = useState<'themes' | 'accounts'>('themes');\n"
            "  return <div><nav><button onClick={() => setTab('themes')}>Themes</button><button onClick={() => setTab('accounts')}>Accounts</button></nav>{tab === 'themes' ? <ThemesTab /> : <AccountsTab />}</div>;\n"
            "}\n"
        ),
        pages_root / "settings" / "tabs" / "themes" / "page.tsx": (
            "export default function ThemesTab() { return null; }\n"
        ),
        pages_root / "settings" / "tabs" / "accounts" / "page.tsx": (
            "export default function AccountsTab() { return <section aria-label=\"Account connections\" />; }\n"
        ),
    }
    # app tab directory is created lazily so the template file has a parent.
    for page_file, content in page_templates.items():
        page_file.parent.mkdir(parents=True, exist_ok=True)
        if page_file.name == "luthFetch.ts":
            content = content.replace("__SKIPO_APPLICATION_ID__", app_name.lower().replace(" ", "-"))
        if not page_file.exists():
            page_file.write_text(content, encoding="utf-8")
            created.append(page_file)

    app_tsx = target_root / "src" / "frontend" / "App.tsx"
    if not app_tsx.exists():
        app_tsx.write_text(
            """import { useState } from 'react';
import { SkipoThemeProvider } from '@ultrst-armada/floks/ui';
import MainPage from './pages/main/page.js';
import AuthPage from './pages/auth/page.js';
import { WorkspaceGate } from './components/gates/WorkspaceGate.js';
import { FrnlSemanticInputProvider } from '@ultrst-armada/frnlts';
import type { WorkspaceRecord } from '@ultrst-armada/floks/ui';

export function App() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceRecord | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const storageOptions = [{ id: 'memory', provider: 'memory', label: 'In-memory (ephemeral)' }];

  const handleContinueAsGuest = () => {
    const guestWs: WorkspaceRecord = {
      id: 'ws-guest',
      title: 'Guest Session',
      name: 'Guest Session',
      storageProvider: 'memory',
    };
    setWorkspaces([guestWs]);
    setActiveWorkspace(guestWs);
    setIsGuest(true);
  };

  if (isGuest && activeWorkspace) {
    return <SkipoThemeProvider defaultTheme="dark">
      <FrnlSemanticInputProvider value={{ workspace: activeWorkspace.id }}>
        <MainPage>
          <div data-skipo-active-workspace={activeWorkspace.id} />
        </MainPage>
      </FrnlSemanticInputProvider>
    </SkipoThemeProvider>;
  }

  return <SkipoThemeProvider defaultTheme="dark">
    <AuthPage onContinueAsGuest={handleContinueAsGuest} authenticatedContent={(auth: any) => {
    if (!activeWorkspace) {
      return <WorkspaceGate
        workspaces={workspaces}
        userId={auth.user?.id}
        currentUser={auth.user}
        storageOptions={storageOptions}
        visibility={{ storagePolicy: { providers: ['memory'] } }}
        activeWorkspaceId={null}
        onSelectWorkspace={setActiveWorkspace}
        onCreateWorkspace={async (input) => {
          const workspace: WorkspaceRecord = {
            id: `ws-${Date.now()}`,
            title: input.name.trim(),
            name: input.name.trim(),
            description: input.description,
            storageProvider: input.storageProvider || input.storage?.provider || 'memory',
            storageConnectionId: input.storageConnectionId || input.storage?.connectionId,
          };
          setWorkspaces((current) => [...current, workspace]);
          setActiveWorkspace(workspace);
        }}
        onLogout={() => {
          setActiveWorkspace(null);
          setIsGuest(false);
          void auth.signOut();
        }}
        appName="__SKIPO_APP_NAME__"
      />;
    }

    return <FrnlSemanticInputProvider value={{ workspace: activeWorkspace.id }}>
      <MainPage>
        <div data-skipo-active-workspace={activeWorkspace.id} />
      </MainPage>
    </FrnlSemanticInputProvider>;
  }} />
  </SkipoThemeProvider>;
}

export default App;
""".replace("__SKIPO_APP_NAME__", pascal),
            encoding="utf-8",
        )
        created.append(app_tsx)

    # 3a. Minimal Vite browser entrypoint. UI code stays provider-independent.
    index_html = target_root / "index.html"
    if not index_html.exists():
        index_html.write_text("""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skipo Application</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/frontend/main.tsx"></script>
  </body>
</html>
""", encoding="utf-8")
        created.append(index_html)

    frontend_css = target_root / "src" / "index.css"
    if not frontend_css.exists():
        frontend_css.write_text("""@import "tailwindcss";
@source "./frontend";
@source "../node_modules/@ultrst-armada/floks";
@import "@xyflow/react/dist/style.css";
@import "@ultrst-armada/floks/ui/dist/index.css";
@import "@ultrst-armada/floks/ui/theme/tokens.css";

html, body, #root {
  margin: 0;
  min-height: 100%;
  width: 100%;
  background: var(--skipo-bg);
  color: var(--skipo-text);
  font-family: var(--skipo-font);
}

*, *::before, *::after { box-sizing: border-box; }
""", encoding="utf-8")
        created.append(frontend_css)

    vite_config = target_root / "vite.config.ts"
    if not vite_config.exists():
        vite_config.write_text("""import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: '.',
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
});
""", encoding="utf-8")
        created.append(vite_config)

    frontend_main = target_root / "src" / "frontend" / "main.tsx"
    if not frontend_main.exists():
        frontend_main.write_text("""import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import App from './App.js';

const container = document.getElementById('root');
if (!container) throw new Error('Skipo application root element is missing.');
createRoot(container).render(<React.StrictMode><App /></React.StrictMode>);
""", encoding="utf-8")
        created.append(frontend_main)

    # 4. src/libraries/index.ts (Skipo-specific custom code only)
    lib_index = target_root / "src" / "libraries" / "index.ts"
    if not lib_index.exists():
        lib_index.write_text("// Application-specific custom libraries only (never duplicate @ultrst-armada/kloks or @ultrst-armada/floks)\nexport {};\n", encoding="utf-8")
        created.append(lib_index)

    created.extend(generate_provider_packaging(target_root, app_name))
    return created

def run_validators(target_root: Path) -> Tuple[bool, str]:
    errors: List[str] = []
    val_01 = SKIPO_ROOT / "checklists" / "01_structure_governance.py"
    if val_01.exists():
        res = subprocess.run(["python3", str(val_01), str(target_root)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"[ASPECT 01 VIOLATION]\n{res.stdout or res.stderr}")

    val_19 = SKIPO_ROOT / "checklists" / "19_skipo_frontend_structure.py"
    if val_19.exists():
        res = subprocess.run(["python3", str(val_19), str(target_root)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"[ASPECT 19 VIOLATION]\n{res.stdout or res.stderr}")

    val_15 = SKIPO_ROOT / "checklists" / "15_contract_boundary_enforcement.py"
    if val_15.exists():
        res = subprocess.run(["python3", str(val_15), str(target_root)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"[ASPECT 15 VIOLATION]\n{res.stdout or res.stderr}")

    val_22 = SKIPO_ROOT / "checklists" / "22_import_direction_governance.py"
    if val_22.exists():
        res = subprocess.run(["python3", str(val_22), str(target_root)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"[ASPECT 22 VIOLATION]\n{res.stdout or res.stderr}")

    val_25 = SKIPO_ROOT / "checklists" / "25_skipo_ui_style_pipeline.py"
    if val_25.exists():
        res = subprocess.run(["python3", str(val_25), str(target_root)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"[ASPECT 25 VIOLATION]\n{res.stdout or res.stderr}")

    val_23 = SKIPO_ROOT / "checklists" / "23_graph_application_contract.py"
    if val_23.exists():
        res = subprocess.run(["python3", str(val_23), str(target_root)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"[ASPECT 23 VIOLATION]\n{res.stdout or res.stderr}")

    val_26 = SKIPO_ROOT / "checklists" / "26_skipo_runtime_environment_governance.py"
    if val_26.exists():
        # Environment deviations are governance warnings, so this validator never
        # blocks scaffold generation; its output remains visible to the caller.
        subprocess.run(["python3", str(val_26), str(target_root)], capture_output=False, text=True)

    # If tsconfig.json and node_modules exist, run TypeScript typecheck
    tsconfig = target_root / "tsconfig.json"
    if tsconfig.exists() and (target_root / "node_modules").exists():
        cmd = ["npx", "tsc", "--noEmit"] if (target_root / "package-lock.json").exists() else ["pnpm", "exec", "tsc", "--noEmit"]
        res = subprocess.run(cmd, cwd=str(target_root), capture_output=True, text=True)
        if res.returncode != 0 and cmd[0] == "pnpm":
            res = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(target_root), capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"[TYPECHECK VIOLATION]\n{res.stdout or res.stderr}")

    return len(errors) == 0, "\n\n".join(errors)

def main():
    parser = argparse.ArgumentParser(description="Scaffold minimal Skipo app composition structure")
    parser.add_argument("target", nargs="?", default="", help="Target root directory")
    parser.add_argument("--name", "-n", default="", help="Application name")
    parser.add_argument("--no-delete-on-fail", action="store_true", help="Do not delete on validation failure")
    args = parser.parse_args()

    target_root = Path(args.target).resolve() if args.target else Path.cwd().resolve()
    app_name = args.name or target_root.name.replace("-", " ").title().replace(" ", "") or "SkipoApp"

    print("=" * 80)
    print(f"  SKIPO MINIMAL PACKAGE-COMPOSITION SCAFFOLD")
    print(f"  Target Root:  {target_root}")
    print(f"  App Name:     {app_name}")
    print("=" * 80)

    created = scaffold_structure(target_root, app_name)
    print(f"  ✔ Created {len(created)} minimal composition files consuming @kloks/* and @floks/*")

    passed, error_output = run_validators(target_root)
    if passed:
        print("  🎉 VALIDATION PASSED: 100% compliant with Skipo Package Composition Architecture!")
        print("=" * 80 + "\n")
        sys.exit(0)
    else:
        print(error_output)
        if not args.no_delete_on_fail:
            for f in created:
                if f.exists():
                    f.unlink()
        sys.exit(1)

if __name__ == "__main__":
    main()
