import http from 'http';
import { KrnlFrontendOptions } from './types.js';

export class KrnlFrontend {
  system: any;
  options: KrnlFrontendOptions;
  interactionsHistory: any[] = [];

  constructor(system: any, options: KrnlFrontendOptions = {}) {
    this.system = system;
    this.options = {
      title: system.entityName,
      theme: 'dark',
      enableMonitoringApi: true,
      ...options
    };
  }

  async handleRequest(req: http.IncomingMessage, res: http.ServerResponse, subpath: string): Promise<void> {
    const normalized = subpath.replace(/\/$/, '') || '/';

    if (normalized === '/' && req.method === 'GET') {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      if (!url.pathname.endsWith('/')) {
        res.writeHead(302, { 'Location': url.pathname + '/' + url.search });
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this._generatePageHtml());
      return;
    }

    if (normalized === '/manifest.json' && req.method === 'GET') {
      const manifest = this.system.getManifest();
      const customFrontends = this.system._ingressNetwork
        ? Array.from(this.system._ingressNetwork.members.entries())
            .filter(([, entry]: any) => entry.memberType === 'frontend')
            .map(([key, entry]: any) => ({
              name: entry.config.name,
              path: '/' + key + '/',
              displayName: entry.config.options?.displayName || entry.config.name
            }))
        : [];
      const subApps = this.system._ingressNetwork
        ? Array.from(this.system._ingressNetwork.members.entries())
            .filter(([, entry]: any) => entry.memberType === 'subapp')
            .map(([prefix, entry]: any) => ({
              prefix,
              entityName: entry.entity?.entityName || prefix,
              defaultFrontendPath: '/' + prefix + '/frontend/default/'
            }))
        : [];
      const payload = {
        ...manifest,
        ingressMembers: this.system._ingressNetwork ? Array.from(this.system._ingressNetwork.members.keys()) : [],
        customFrontends,
        subApps,
        interactionsHistory: this.interactionsHistory
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }

    if (normalized === '/history' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.interactionsHistory));
      return;
    }

    if (normalized.startsWith('/api/')) {
      const parts = normalized.split('/');
      const fid = parts[2];
      if (!fid) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Missing functionality ID' }));
        return;
      }

      const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
      if (!functionality) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: `Functionality ${fid} not found` }));
        return;
      }

      let body = {};
      if (req.method === 'POST') {
        body = await this._readJsonBody(req);
      } else if (req.method === 'GET') {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        body = Object.fromEntries(url.searchParams.entries());
      }

      try {
        const result = await this.system.call(fid, body, {
          unwrap: false,
          callerPort: req.socket?.remotePort,
          accessKey: req.headers['x-krnl-access-key'] as string | undefined,
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e: any) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'error',
          message: e.message,
          errorDocumentation: e.errorDocumentation || null
        }));
      }
      return;
    }

    if (normalized.startsWith('/sse/')) {
      const parts = normalized.split('/');
      const fid = parts[2];
      if (!fid) {
        res.writeHead(400);
        res.end('Missing functionality ID');
        return;
      }

      const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
      if (!functionality) {
        res.writeHead(404);
        res.end('Functionality not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const stateEmitter = functionality.emitters?.get('state:changed');
      const unsubscribe = stateEmitter?.subscribe((msg: any) => {
        res.write(`data: ${JSON.stringify(msg.data || msg)}\n\n`);
      });

      const interval = setInterval(() => {
        if (res.writable) {
          res.write(': keepalive\n\n');
        }
      }, 15000);

      req.on('close', () => {
        if (unsubscribe) unsubscribe();
        clearInterval(interval);
        res.end();
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: 'Route not found' }));
  }

  _readJsonBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        if (!body) return resolve({});
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Invalid JSON body"));
        }
      });
    });
  }

  _generatePageHtml(): string {
    const title = this.options.title || this.system.entityName;
    const theme = this.options.theme || 'dark';
    const logoUrl = this.options.logoUrl || '';
    const customCss = this.options.customCss || '';

    return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — KrnlTS Control Panel</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-sans: 'Outfit', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      
      /* Dark Theme Default */
      --bg-base: #090d16;
      --bg-surface: rgba(22, 28, 45, 0.6);
      --bg-surface-hover: rgba(22, 28, 45, 0.8);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-color-focus: rgba(59, 130, 246, 0.5);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      --accent: #10b981;
      --accent-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      --card-blur: blur(12px);
    }

    [data-theme="light"] {
      --bg-base: #f1f5f9;
      --bg-surface: rgba(255, 255, 255, 0.7);
      --bg-surface-hover: rgba(255, 255, 255, 0.9);
      --border-color: rgba(0, 0, 0, 0.08);
      --border-color-focus: rgba(59, 130, 246, 0.5);
      --text-main: #0f172a;
      --text-muted: #64748b;
      --primary: #2563eb;
      --primary-gradient: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      --accent: #059669;
      --accent-gradient: linear-gradient(135deg, #059669 0%, #047857 100%);
      --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
      --card-blur: blur(8px);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-sans);
      background-color: var(--bg-base);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      background-image: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 40%);
    }

    /* Header */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      border-bottom: 1px solid var(--border-color);
      background-color: rgba(9, 13, 22, 0.4);
      backdrop-filter: blur(10px);
      z-index: 50;
      position: sticky;
      top: 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      background: var(--primary-gradient);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 1.2rem;
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .meta-badges {
      display: flex;
      gap: 0.5rem;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-weight: 600;
      text-transform: uppercase;
      border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.04);
    }

    .badge-primary {
      background: var(--primary-gradient);
      color: white;
      border: none;
    }

    .theme-toggle {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .theme-toggle:hover {
      background: var(--border-color);
    }

    /* Layout */
    .app-container {
      display: flex;
      flex: 1;
      height: calc(100vh - 65px);
      overflow: hidden;
    }

    aside {
      width: 280px;
      border-right: 1px solid var(--border-color);
      background-color: rgba(9, 13, 22, 0.2);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow-y: auto;
    }

    .sidebar-section {
      padding: 1.5rem;
    }

    .sidebar-section-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item button {
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
      color: var(--text-muted);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    }

    .nav-item button:hover {
      color: var(--text-main);
      background-color: var(--bg-surface-hover);
    }

    .nav-item.active button {
      color: white;
      background: var(--primary-gradient);
    }

    .nav-item .method-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.2);
      color: #93c5fd;
    }

    .nav-item.active .method-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    main {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      background-color: rgba(9, 13, 22, 0.1);
    }

    .main-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Sub-Apps Ingress topology */
    .ingress-topology {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .ingress-card {
      background: var(--bg-surface);
      backdrop-filter: var(--card-blur);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: var(--glass-shadow);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--text-main);
      transition: all 0.2s;
    }

    .ingress-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
      box-shadow: 0 12px 40px rgba(59, 130, 246, 0.15);
      background: var(--bg-surface-hover);
    }

    .ingress-card-title {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .ingress-card-link {
      font-size: 0.8rem;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Card Details */
    .detail-card {
      background: var(--bg-surface);
      backdrop-filter: var(--card-blur);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: var(--glass-shadow);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }

    .card-title-area h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .card-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    /* Form Styles */
    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-main);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--border-color-focus);
    }

    .form-textarea {
      min-height: 120px;
      resize: vertical;
      font-family: var(--font-mono);
      font-size: 0.85rem;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      color: white;
    }

    .btn-primary {
      background: var(--primary-gradient);
    }

    .btn-primary:hover {
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    /* Response / Output */
    .output-section {
      margin-top: 2rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1.5rem;
    }

    .output-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .output-container {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.25rem;
      max-height: 450px;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      line-height: 1.5;
      position: relative;
    }

    .response-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    .response-status-ok {
      color: #10b981;
      font-weight: bold;
    }

    .response-status-error {
      color: #ef4444;
      font-weight: bold;
    }

    /* SSE Monitor Panel */
    .sse-panel {
      margin-top: 2rem;
      background: rgba(16, 185, 129, 0.05);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .sse-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .sse-log {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      max-height: 250px;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sse-event-item {
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 0.5rem;
    }

    .sse-event-time {
      color: var(--text-muted);
      font-size: 0.7rem;
    }

    /* Tables in Output */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.5rem;
      font-family: var(--font-sans);
    }

    .data-table th, .data-table td {
      padding: 0.6rem 0.8rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table th {
      background: rgba(255, 255, 255, 0.04);
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.8rem;
      text-transform: uppercase;
    }

    .data-table td {
      font-size: 0.9rem;
    }

    /* Images */
    .image-preview {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-top: 0.5rem;
    }

    /* Tabs & Custom Frontends UI */
    .tab-bar {
      display: flex;
      gap: 1rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 2rem;
      padding-bottom: 0.5rem;
    }
    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-family: var(--font-sans);
      font-size: 1.1rem;
      font-weight: 600;
      padding: 0.5rem 1rem;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.03);
    }
    .tab-btn.active {
      color: white;
      background: var(--primary-gradient);
    }
    .custom-frontends-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .frontend-card {
      background: var(--bg-surface);
      backdrop-filter: var(--card-blur);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: var(--glass-shadow);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      transition: all 0.2s;
    }
    .frontend-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
      box-shadow: 0 12px 40px rgba(59, 130, 246, 0.15);
      background: var(--bg-surface-hover);
    }
    .frontend-card-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .frontend-card-path {
      font-size: 0.85rem;
      font-family: var(--font-mono);
      color: var(--text-muted);
    }
    .subapp-card {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
      backdrop-filter: var(--card-blur);
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: var(--glass-shadow);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      transition: all 0.2s;
    }
    .subapp-card:hover {
      transform: translateY(-2px);
      border-color: rgba(59, 130, 246, 0.55);
      box-shadow: 0 12px 40px rgba(59, 130, 246, 0.2);
    }
    .subapp-card-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 9999px;
      padding: 0.2rem 0.6rem;
      margin-bottom: 0.3rem;
      width: fit-content;
    }
    .section-divider {
      margin: 2rem 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .section-divider h4 {
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .section-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-color);
    }

    ${customCss}
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="brand-logo">🔷</div>
      <div>
        <h1 class="brand-title">${title}</h1>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div class="meta-badges">
        <span class="badge" id="aiko-status-badge" style="background-color: #ef4444; color: white;">AIKO: OFFLINE</span>
        <span class="badge badge-primary" id="system-type-badge">SYSTEM</span>
        <span class="badge" id="port-badge">PORT: ...</span>
      </div>
      <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle Theme">🌓</button>
    </div>
  </header>

  <div class="app-container">
    <aside>
      <div class="sidebar-section">
        <div class="sidebar-section-title">LOCAL ENDPOINTS</div>
        <ul class="nav-list" id="local-endpoints-list">
          <li style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">Loading...</li>
        </ul>
      </div>
      
      <div class="sidebar-section" id="remote-section" style="display: none;">
        <div class="sidebar-section-title">REMOTE ENDPOINTS</div>
        <ul class="nav-list" id="remote-endpoints-list"></ul>
      </div>
    </aside>

    <main>
      <div class="tab-bar">
        <button class="tab-btn active" id="tab-endpoints-btn" onclick="switchTab('endpoints')">Endpoints</button>
        <button class="tab-btn" id="tab-custom-btn" onclick="switchTab('custom')">Sub-Apps &amp; Frontends</button>
      </div>

      <div class="main-grid" id="main-content">
        <!-- Custom Frontends View Container -->
        <div id="custom-frontends-view" style="display: none; width: 100%;">
          <div id="subapps-section">
            <div class="section-divider"><h4>🔌 Sub-Apps</h4></div>
            <div class="custom-frontends-grid" id="subapps-container"></div>
          </div>
          <div id="frontends-section">
            <div class="section-divider"><h4>🎨 Custom Frontends</h4></div>
            <div class="custom-frontends-grid" id="custom-frontends-container"></div>
          </div>
        </div>

        <!-- Sub-Apps (Ingress network) Section if any -->
        <div id="ingress-section" style="display: none; margin-bottom: 2rem;">
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">Sub-App Network Topology</h3>
          <div class="ingress-topology" id="ingress-container"></div>
        </div>

        <div id="welcome-panel" class="detail-card" style="text-align: center; padding: 4rem 2rem;">
          <h2 style="font-size: 2.25rem; margin-bottom: 1rem;">Control Panel</h2>
          <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem;">
            Select an endpoint in the sidebar to call it or monitor its events.
          </p>
          <div class="meta-badges" style="justify-content: center;">
            <span class="badge" id="welcome-details">INITIALISING...</span>
          </div>
        </div>

        <div id="endpoint-panel" class="detail-card" style="display: none;">
          <!-- Loaded dynamically -->
        </div>

        <div id="ai-settings-panel" class="detail-card" style="display: none; margin-top: 2rem;">
          <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem;">
             <h3 style="font-size: 1.25rem; font-weight: 700;">🤖 Endpoint Agent AI Profile Settings</h3>
             <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="refreshAikoCatalog()">🔄 Refresh Catalog</button>
          </div>
          <form id="ai-settings-form" onsubmit="saveAiSettings(event)">
             <div class="form-group" style="margin-bottom: 1.25rem;">
                <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                   <input type="checkbox" id="ai-enabled-toggle"> <span>Enable Endpoint Agent</span>
                </label>
             </div>
             <div class="form-group" style="margin-bottom: 1.25rem;">
                <label class="form-label">Endpoint Agent Grade Profile</label>
                <select class="form-input" id="ai-grade-select" style="background: var(--bg-surface); color: var(--text-main);">
                   <option value="endpoint-grade-1">endpoint-grade-1 (Nano — simple CRUD)</option>
                   <option value="endpoint-grade-2">endpoint-grade-2 (Mini — standard ops)</option>
                   <option value="endpoint-grade-3">endpoint-grade-3 (Standard — moderate logic)</option>
                   <option value="endpoint-grade-4">endpoint-grade-4 (Large — complex reasoning)</option>
                   <option value="endpoint-grade-5">endpoint-grade-5 (Expert — escalation handler)</option>
                </select>
             </div>
             <div class="form-group" style="margin-bottom: 1.25rem;">
                <label class="form-label">Agent Natural Language Description</label>
                <input type="text" class="form-input" id="ai-desc-input" placeholder="e.g. Stores secret key vault values.">
             </div>
             <div class="form-group" style="margin-bottom: 1.25rem;">
                <label class="form-label">Dynamic Watch Variables (comma separated)</label>
                <input type="text" class="form-input" id="ai-dyn-vars" placeholder="e.g. vault, keys">
             </div>
             <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label">System Instructions (Prompts override)</label>
                <textarea class="form-input form-textarea" id="ai-system-instructions" placeholder="e.g. Ensure input is formatted strictly..."></textarea>
             </div>
             <button type="submit" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.5rem 1.25rem;">Save Settings</button>
             <span id="ai-save-status" style="margin-left: 1rem; font-size: 0.85rem; font-weight: 600;"></span>
          </form>
        </div>
      </div>
    </main>
  </div>

  <script>
    let manifestData = null;
    let activeFid = null;
    let sseSource = null;

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
    });

    // On Load
    window.addEventListener('DOMContentLoaded', async () => {
      try {
        const res = await fetch('manifest.json');
        manifestData = await res.json();
        renderSidebar();
        renderIngressTopology();
        updateHeaderBadges();
        await checkAikoHealth();
      } catch (err) {
        console.error("Failed to fetch manifest:", err);
        document.getElementById('welcome-details').innerText = "Failed to load manifest.json";
      }

      // Check for dynamic updates of endpoints (live code reload)
      setInterval(async () => {
        try {
          const res = await fetch('manifest.json');
          const newManifest = await res.json();
          
          const oldStr = JSON.stringify(manifestData ? manifestData.inputs.api : {});
          const newStr = JSON.stringify(newManifest.inputs.api);
          
          const oldIngress = JSON.stringify(manifestData ? manifestData.ingressMembers : []);
          const newIngress = JSON.stringify(newManifest.ingressMembers);

          if (oldStr !== newStr || oldIngress !== newIngress) {
            console.log("[ControlPanel] Manifest changed, dynamically updating UI...");
            manifestData = newManifest;
            renderSidebar();
            renderIngressTopology();
            updateHeaderBadges();
            
            if (activeFid && !manifestData.inputs.api[activeFid]) {
              activeFid = null;
              disconnectSse();
              document.getElementById('endpoint-panel').style.display = 'none';
              document.getElementById('welcome-panel').style.display = 'block';
              document.getElementById('ai-settings-panel').style.display = 'none';
            } else if (activeFid) {
              selectEndpoint(activeFid);
            }
          }
          await checkAikoHealth();
        } catch (err) {
          console.warn("Failed to check manifest updates:", err);
        }
      }, 5000);
    });

    async function checkAikoHealth() {
      try {
        const res = await fetch('ai/manifest');
        const data = await res.json();
        const badge = document.getElementById('aiko-status-badge');
        if (data && data.aiEnabled && data.aikoAlive) {
          badge.innerText = 'Aiko: Online';
          badge.style.backgroundColor = '#10b981';
        } else {
          badge.innerText = 'Aiko: Offline';
          badge.style.backgroundColor = '#ef4444';
        }
      } catch (e) {
        document.getElementById('aiko-status-badge').innerText = 'Aiko: Offline';
        document.getElementById('aiko-status-badge').style.backgroundColor = '#ef4444';
      }
    }

    async function refreshAikoCatalog() {
      const statusSpan = document.getElementById('ai-save-status');
      statusSpan.innerText = 'Refreshing catalog...';
      statusSpan.style.color = 'var(--text-muted)';
      try {
        const res = await fetch('api/getAikoCatalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (data.status === 'success') {
          statusSpan.innerText = 'Catalog refreshed!';
          statusSpan.style.color = '#10b981';
          
          // Re-populate grade dropdown options if catalog data exists
          const select = document.getElementById('ai-grade-select');
          if (data.catalog && Object.keys(data.catalog).length > 0) {
            select.innerHTML = '';
            for (const [key, val] of Object.entries(data.catalog)) {
              if (key.startsWith('endpoint-grade')) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.innerText = key + " (" + (val.description || "") + ")";
                select.appendChild(opt);
              }
            }
          }
        } else {
          statusSpan.innerText = 'Catalog refresh failed: ' + data.message;
          statusSpan.style.color = '#ef4444';
        }
      } catch (e) {
        statusSpan.innerText = 'Refresh failed.';
        statusSpan.style.color = '#ef4444';
      }
      setTimeout(() => { statusSpan.innerText = ''; }, 3000);
    }

    async function loadAiSettings(fid) {
      document.getElementById('ai-save-status').innerText = '';
      try {
        const res = await fetch('api/getEndpointAgentProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpointId: fid })
        });
        const data = await res.json();
        const profile = data.profile || {};
        
        document.getElementById('ai-enabled-toggle').checked = !!profile.enabled;
        document.getElementById('ai-grade-select').value = profile.grade || 'endpoint-grade-2';
        document.getElementById('ai-desc-input').value = profile.description || '';
        document.getElementById('ai-dyn-vars').value = (profile.dynamicWatchVars || []).join(', ');
        document.getElementById('ai-system-instructions').value = profile.systemInstructions || '';
      } catch (e) {
        console.error("Failed to load AI settings for", fid, e);
      }
    }

    async function saveAiSettings(event) {
      event.preventDefault();
      const statusSpan = document.getElementById('ai-save-status');
      statusSpan.innerText = 'Saving...';
      statusSpan.style.color = 'var(--text-muted)';
      
      const config = {
        enabled: document.getElementById('ai-enabled-toggle').checked,
        grade: document.getElementById('ai-grade-select').value,
        description: document.getElementById('ai-desc-input').value,
        dynamicWatchVars: document.getElementById('ai-dyn-vars').value.split(',').map(s => s.trim()).filter(Boolean),
        systemInstructions: document.getElementById('ai-system-instructions').value
      };

      try {
        const res = await fetch('api/setEndpointAgentProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpointId: activeFid, config })
        });
        const data = await res.json();
        if (data.status === 'success') {
          statusSpan.innerText = 'Settings saved and persisted!';
          statusSpan.style.color = '#10b981';
        } else {
          statusSpan.innerText = 'Error: ' + data.message;
          statusSpan.style.color = '#ef4444';
        }
      } catch (e) {
        statusSpan.innerText = 'Save failed.';
        statusSpan.style.color = '#ef4444';
      }
      setTimeout(() => { statusSpan.innerText = ''; }, 4000);
    }

    function updateHeaderBadges() {
      if (!manifestData) return;
      
      const sysType = document.getElementById('system-type-badge');
      if (sysType) {
        sysType.innerText = (manifestData.systemType || 'System').toUpperCase();
      }
      
      const portBadge = document.getElementById('port-badge');
      if (portBadge) {
        const port = window.location.port || 'default';
        portBadge.innerText = 'PORT: ' + port;
      }
      
      const welcomeDetails = document.getElementById('welcome-details');
      if (welcomeDetails) {
        welcomeDetails.innerText = (manifestData.systemType || 'System').toUpperCase();
      }
    }

    function renderSidebar() {
      const localList = document.getElementById('local-endpoints-list');
      const remoteList = document.getElementById('remote-endpoints-list');
      const remoteSection = document.getElementById('remote-section');

      localList.innerHTML = '';
      remoteList.innerHTML = '';

      let hasLocal = false;
      let hasRemote = false;

      if (manifestData && manifestData.inputs && manifestData.inputs.api) {
        const apis = Object.values(manifestData.inputs.api);
        
        // Sort by ID
        apis.sort((a, b) => a.id.localeCompare(b.id));

        apis.forEach(api => {
          const li = document.createElement('li');
          li.className = 'nav-item';
          li.id = 'nav-item-' + api.id;
          
          const method = api.method || 'POST';
          li.innerHTML = '<button onclick="selectEndpoint(\\'' + api.id + '\\')">' +
            '<span>' + api.id + '</span>' +
            '<span class="method-badge">' + method + '</span>' +
            '</button>';

          if (api.type === 'local') {
            localList.appendChild(li);
            hasLocal = true;
          } else {
            remoteList.appendChild(li);
            hasRemote = true;
          }
        });
      }

      if (!hasLocal) {
        localList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">No local endpoints</li>';
      }
      if (hasRemote) {
        remoteSection.style.display = 'block';
      }
    }

    function switchTab(tab) {
      const endpointsBtn = document.getElementById('tab-endpoints-btn');
      const customBtn = document.getElementById('tab-custom-btn');
      const customView = document.getElementById('custom-frontends-view');
      const welcomePanel = document.getElementById('welcome-panel');
      const endpointPanel = document.getElementById('endpoint-panel');
      const aiSettingsPanel = document.getElementById('ai-settings-panel');
      const ingressSection = document.getElementById('ingress-section');

      if (tab === 'endpoints') {
        endpointsBtn.classList.add('active');
        customBtn.classList.remove('active');
        customView.style.display = 'none';
        if (activeFid) {
          endpointPanel.style.display = 'block';
          // Only show AI settings if it is a local endpoint
          const api = manifestData.inputs.api[activeFid];
          if (api && api.type === 'local' && activeFid !== 'ai' && activeFid !== 'setEndpointAgentProfile' && activeFid !== 'getEndpointAgentProfile' && activeFid !== 'getAikoCatalog') {
            aiSettingsPanel.style.display = 'block';
          }
        } else {
          welcomePanel.style.display = 'block';
        }
        if (manifestData && manifestData.ingressMembers && manifestData.ingressMembers.length > 0) {
          ingressSection.style.display = 'block';
        }
      } else {
        customBtn.classList.add('active');
        endpointsBtn.classList.remove('active');
        customView.style.display = 'block';
        welcomePanel.style.display = 'none';
        endpointPanel.style.display = 'none';
        aiSettingsPanel.style.display = 'none';
        ingressSection.style.display = 'none';
        renderCustomFrontends();
      }
    }

    function renderCustomFrontends() {
      // --- Sub-Apps section ---
      const subappsContainer = document.getElementById('subapps-container');
      const subappsSection = document.getElementById('subapps-section');
      subappsContainer.innerHTML = '';
      if (manifestData && manifestData.subApps && manifestData.subApps.length > 0) {
        subappsSection.style.display = '';
        manifestData.subApps.forEach(sa => {
          const card = document.createElement('div');
          card.className = 'subapp-card';
          card.innerHTML = '<div>' +
            '<div class="subapp-card-badge">⚙️ Sub-App</div>' +
            '<div class="frontend-card-title">' + sa.entityName + '</div>' +
            '<div class="frontend-card-path">/' + sa.prefix + '/</div>' +
            '</div>' +
            '<a href="' + sa.defaultFrontendPath + '" class="btn btn-primary" style="align-self: flex-start; text-decoration: none;">Open Control Panel →</a>';
          subappsContainer.appendChild(card);
        });
      } else {
        subappsSection.style.display = 'none';
      }

      // --- Custom Frontends section ---
      const container = document.getElementById('custom-frontends-container');
      const frontendsSection = document.getElementById('frontends-section');
      container.innerHTML = '';
      if (manifestData && manifestData.customFrontends && manifestData.customFrontends.length > 0) {
        frontendsSection.style.display = '';
        manifestData.customFrontends.forEach(fe => {
          const card = document.createElement('div');
          card.className = 'frontend-card';
          card.innerHTML = '<div>' +
            '<div class="frontend-card-title">🔷 ' + fe.displayName + '</div>' +
            '<div class="frontend-card-path">' + fe.path + '</div>' +
            '</div>' +
            '<a href="../..' + fe.path + '" target="_blank" class="btn btn-primary" style="align-self: flex-start; text-decoration: none;">Launch Frontend →</a>';
          container.appendChild(card);
        });
      } else {
        frontendsSection.style.display = 'none';
      }

      // If both empty, show a placeholder
      if ((!manifestData?.subApps || manifestData.subApps.length === 0) &&
          (!manifestData?.customFrontends || manifestData.customFrontends.length === 0)) {
        subappsSection.style.display = '';
        subappsContainer.innerHTML = '<div style="color: var(--text-muted); font-style: italic; grid-column: 1/-1;">No sub-apps or custom frontends registered for this app.</div>';
      }
    }

    function renderIngressTopology() {
      const ingressSection = document.getElementById('ingress-section');
      const container = document.getElementById('ingress-container');
      container.innerHTML = '';

      if (manifestData && manifestData.ingressMembers && manifestData.ingressMembers.length > 0) {
        ingressSection.style.display = 'block';
        manifestData.ingressMembers.forEach(member => {
          const card = document.createElement('a');
          card.className = 'ingress-card';
          // Navigate to target subapp's frontend
          card.href = '../../' + member + '/frontend/default/';
          card.innerHTML = '<div class="ingress-card-title">🔷 ' + member.toUpperCase() + '</div>' +
            '<div class="ingress-card-link">Open Sub-App Panel →</div>';
          container.appendChild(card);
        });
      } else {
        ingressSection.style.display = 'none';
      }
      renderCustomFrontends();
    }

    function selectEndpoint(fid: string) {
      if (activeFid) {
        const prevItem = document.getElementById('nav-item-' + activeFid);
        if (prevItem) prevItem.classList.remove('active');
      }

      activeFid = fid;
      const nextItem = document.getElementById('nav-item-' + fid);
      if (nextItem) nextItem.classList.add('active');

      const welcomePanel = document.getElementById('welcome-panel');
      if (welcomePanel) welcomePanel.style.display = 'none';
      
      const panel = document.getElementById('endpoint-panel');
      if (panel) panel.style.display = 'block';

      const api = (manifestData as any).inputs.api[fid];
      const method = api.method || 'POST';
      const inputSchema = api.schema && api.schema.input;

      // Load and show AI profile settings panel for this local endpoint (if local and not disabled for Mer/Gemini apps)
      const isLocal = api && api.type === 'local';
      const isMerApp = (manifestData as any).entityName.toLowerCase().includes('mer') || (manifestData as any).entityName.toLowerCase().includes('gemini');
      const aiSettingsPanel = document.getElementById('ai-settings-panel');
      if (aiSettingsPanel) {
        if (isLocal && !isMerApp && fid !== 'ai' && fid !== 'setEndpointAgentProfile' && fid !== 'getEndpointAgentProfile' && fid !== 'getAikoCatalog') {
          aiSettingsPanel.style.display = 'block';
          loadAiSettings(fid);
        } else {
          aiSettingsPanel.style.display = 'none';
        }
      }

      // Disconnect previous SSE stream
      disconnectSse();

      let inputsHtml = '';
      if (method === 'POST') {
        if (inputSchema && inputSchema.properties) {
          inputsHtml = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
          for (const [key, value] of Object.entries(inputSchema.properties)) {
            const description = value.description || '';
            const required = (inputSchema.required || []).includes(key) ? 'required' : '';
            
            inputsHtml += '<div class="form-group">' +
              '<label class="form-label" for="input-' + key + '">' + key + (required ? ' *' : '') + '</label>';
            
            if (value.type === 'string') {
              inputsHtml += '<input type="text" class="form-input" id="input-' + key + '" placeholder="' + description + '" ' + required + '>';
            } else if (value.type === 'number' || value.type === 'integer') {
              inputsHtml += '<input type="number" class="form-input" id="input-' + key + '" placeholder="' + description + '" ' + required + '>';
            } else if (value.type === 'boolean') {
              inputsHtml += '<div class="checkbox-container"><input type="checkbox" id="input-' + key + '"> <span>' + description + '</span></div>';
            } else {
              // complex schema - object / array
              const hint = JSON.stringify(value, null, 2);
              inputsHtml += '<textarea class="form-input form-textarea" id="input-' + key + '" placeholder="Enter JSON here...\\nSchema hint:\\n' + hint.replace(/"/g, '&quot;') + '" ' + required + '></textarea>';
            }
            inputsHtml += '</div>';
          }
          inputsHtml += '</div>';
        } else {
          // POST but no structured schema
          inputsHtml = '<div class="form-group">' +
            '<label class="form-label" for="raw-json-input">Payload (JSON)</label>' +
            '<textarea class="form-input form-textarea" id="raw-json-input" placeholder="{\\n  \\n}"></textarea>' +
            '</div>';
        }
      } else {
        // GET endpoint
        if (inputSchema && inputSchema.properties) {
          inputsHtml = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
          for (const [key, value] of Object.entries(inputSchema.properties)) {
            inputsHtml += '<div class="form-group">' +
              '<label class="form-label" for="input-' + key + '">' + key + '</label>' +
              '<input type="text" class="form-input" id="input-' + key + '" placeholder="' + (value.description || '') + '">' +
              '</div>';
          }
          inputsHtml += '</div>';
        } else {
          inputsHtml = '<p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem;">This GET endpoint takes no parameters.</p>';
        }
      }

      const hasEvents = api.events && api.events.length > 0;
      let sseHtml = '';
      if (hasEvents) {
        sseHtml = '<div class="sse-panel">' +
          '<div class="sse-header">' +
          '<div>' +
          '<h4 style="font-weight: 600; color: #10b981;">Live Event Stream Bridge</h4>' +
          '<div style="font-size: 0.75rem; color: var(--text-muted);">Listen to server state changes in real-time</div>' +
          '</div>' +
          '<button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" id="sse-toggle-btn" onclick="toggleSse(\\'' + fid + '\\')">🔴 Subscribe</button>' +
          '</div>' +
          '<div class="sse-log" id="sse-log-container"><div style="color: var(--text-muted); font-style: italic;">Not subscribed. Click subscribe to listen.</div></div>' +
          '</div>';
      }

      let examplesHtml = '';
      const examples = api.examples || [];
      const mockExample = generateMockFromSchema(inputSchema);
      const showMock = mockExample && Object.keys(mockExample).length > 0;
      const apiExample = api.example;
      if (examples.length > 0 || showMock || apiExample) {
        examplesHtml = '<div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 8px;">' +
          '<div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; letter-spacing: 0.05em;">Load Example Payload:</div>' +
          '<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">';
        if (apiExample) {
          examplesHtml += '<button type="button" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="loadExample(' + JSON.stringify(apiExample).replace(/"/g, '&quot;') + ')">✨ Example Payload</button>';
        }
        if (showMock) {
          examplesHtml += '<button type="button" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="loadExample(' + JSON.stringify(mockExample).replace(/"/g, '&quot;') + ')">✨ Schema Mock</button>';
        }
        examples.forEach((ex, idx) => {
          const label = ex.label || ('Example ' + (idx + 1));
          examplesHtml += '<button type="button" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="loadExample(' + JSON.stringify(ex.input).replace(/"/g, '&quot;') + ')">📋 ' + label + '</button>';
        });
        examplesHtml += '</div></div>';
      }

      let curlHtml = '';
      curlHtml = '<div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color); border-radius: 8px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">' +
        '<span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">💻 cURL Command Preview:</span>' +
        '<button type="button" class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onclick="copyCurl()">📋 Copy</button>' +
        '</div>' +
        '<pre id="curl-preview-box" style="font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.4; color: #3b82f6; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">curl ...</pre>' +
        '</div>';

      panel.innerHTML = '<div class="card-header">' +
        '<div class="card-title-area">' +
        '<h2>' + fid + '</h2>' +
        '<div class="card-desc">' + (api.sourcePath || 'KrnlTS Built-in Functionality') + '</div>' +
        '</div>' +
        '<span class="badge badge-primary">' + method + '</span>' +
        '</div>' +
        '<form id="endpoint-call-form" onsubmit="handleCall(event, \\'' + fid + '\\', \\'' + method + '\\')">' +
        examplesHtml +
        curlHtml +
        inputsHtml +
        '<div style="margin-top: 1.5rem; display: flex; gap: 1rem;">' +
        '<button type="submit" class="btn btn-primary">⚡ Send Request</button>' +
        '</div>' +
        '</form>' +
        '<div class="output-section" id="output-wrapper" style="display: none;">' +
        '<div class="output-title">' +
        '<span>Response Details</span>' +
        '<button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="copyOutput()">📋 Copy</button>' +
        '</div>' +
        '<div class="response-meta" id="response-meta-area"></div>' +
        '<div class="output-container" id="response-output-pre"></div>' +
        '</div>' +
        sseHtml;

      // Real-time update script attached on client side
      const updateCurlBox = () => {
        const curlBox = document.getElementById('curl-preview-box');
        if (!curlBox) return;
        let currentPayload: any = {};
        if (method === 'POST') {
          if (inputSchema && inputSchema.properties) {
            for (const key of Object.keys(inputSchema.properties)) {
              const el = document.getElementById('input-' + key) as any;
              if (el) {
                if (el.type === 'checkbox') {
                  currentPayload[key] = el.checked;
                } else if (el.type === 'number') {
                  currentPayload[key] = el.value ? Number(el.value) : undefined;
                } else if (el.tagName === 'TEXTAREA') {
                  try { currentPayload[key] = el.value ? JSON.parse(el.value) : undefined; } catch (e) {}
                } else {
                  currentPayload[key] = el.value || undefined;
                }
              }
            }
          } else {
            const rawEl = document.getElementById('raw-json-input') as HTMLTextAreaElement;
            if (rawEl && rawEl.value) {
              try { currentPayload = JSON.parse(rawEl.value); } catch (e) {}
            }
          }
          curlBox.innerText = 'curl -X POST http://localhost:' + (window.location.port || 80) + '/api/' + fid + ' \\\n' +
            '  -H "Content-Type: application/json" \\\n' +
            '  -d \'' + JSON.stringify(currentPayload, null, 2).replace(/'/g, "'\\''") + '\'';
        } else {
          // GET
          let queryParams: any = {};
          if (inputSchema && inputSchema.properties) {
            for (const key of Object.keys(inputSchema.properties)) {
              const el = document.getElementById('input-' + key) as HTMLInputElement;
              if (el && el.value) queryParams[key] = el.value;
            }
          }
          const qs = new URLSearchParams(queryParams).toString();
          curlBox.innerText = 'curl http://localhost:' + (window.location.port || 80) + '/api/' + fid + (qs ? '?' + qs : '');
        }
      };

      const form = document.getElementById('endpoint-call-form');
      if (form) {
        form.querySelectorAll('input, textarea, select').forEach(input => {
          input.addEventListener('input', updateCurlBox);
          input.addEventListener('change', updateCurlBox);
        });
      }
      (window as any).activeCurlUpdater = updateCurlBox;
      updateCurlBox();
    }

    async function handleCall(event, fid, method) {
      event.preventDefault();
      const outputWrapper = document.getElementById('output-wrapper');
      const responseMeta = document.getElementById('response-meta-area');
      const outputPre = document.getElementById('response-output-pre');

      outputWrapper.style.display = 'block';
      responseMeta.innerHTML = 'Sending request...';
      outputPre.innerHTML = '';

      const api = manifestData.inputs.api[fid];
      let payload = {};
      
      const startTime = Date.now();

      if (method === 'POST') {
        if (api.schema && api.schema.input && api.schema.input.properties) {
          for (const key of Object.keys(api.schema.input.properties)) {
            const el = document.getElementById('input-' + key);
            if (el) {
              if (el.type === 'checkbox') {
                payload[key] = el.checked;
              } else if (el.type === 'number') {
                payload[key] = Number(el.value);
              } else if (el.tagName === 'TEXTAREA') {
                try {
                  payload[key] = el.value ? JSON.parse(el.value) : undefined;
                } catch (e) {
                  responseMeta.innerHTML = '<span class="response-status-error">Error: Invalid JSON input for key ' + key + '</span>';
                  return;
                }
              } else {
                payload[key] = el.value;
              }
            }
          }
        } else {
          const rawEl = document.getElementById('raw-json-input');
          if (rawEl && rawEl.value) {
            try {
              payload = JSON.parse(rawEl.value);
            } catch (e) {
              responseMeta.innerHTML = '<span class="response-status-error">Error: Invalid input JSON</span>';
              return;
            }
          }
        }
      } else {
        // GET params
        if (api.schema && api.schema.input && api.schema.input.properties) {
          for (const key of Object.keys(api.schema.input.properties)) {
            const el = document.getElementById('input-' + key);
            if (el && el.value) {
              payload[key] = el.value;
            }
          }
        }
      }

      try {
        let fetchUrl = 'api/' + fid;
        let fetchOpts = {
          headers: {
            'Content-Type': 'application/json'
          }
        };

        if (method === 'POST') {
          fetchOpts.method = 'POST';
          fetchOpts.body = JSON.stringify(payload);
        } else {
          fetchOpts.method = 'GET';
          const params = new URLSearchParams(payload).toString();
          if (params) fetchUrl += '?' + params;
        }

        const res = await fetch(fetchUrl, fetchOpts);
        const data = await res.json();
        const latency = Date.now() - startTime;

        const isOk = data.status !== 'error';
        responseMeta.innerHTML = '<span class="' + (isOk ? 'response-status-ok' : 'response-status-error') + '">' +
          (isOk ? 'SUCCESS' : 'FAILED') + '</span> | Latency: ' + latency + 'ms | Time: ' + new Date().toLocaleTimeString();

        renderResult(data, outputPre);
      } catch (err) {
        responseMeta.innerHTML = '<span class="response-status-error">CONNECTION ERROR</span>';
        outputPre.innerText = err.message;
      }
    }

    function renderResult(data, container) {
      container.innerHTML = '';
      
      // If error status, display the error message explicitly
      if (data && data.status === 'error' && data.message) {
        const errDiv = document.createElement('div');
        errDiv.className = 'response-status-error';
        errDiv.style.fontSize = '1.1rem';
        errDiv.style.marginBottom = '1rem';
        errDiv.innerText = '❌ Error: ' + data.message;
        container.appendChild(errDiv);
        
        if (data.errorDocumentation) {
          const docDiv = document.createElement('div');
          docDiv.style.color = 'var(--text-muted)';
          docDiv.style.fontSize = '0.9rem';
          docDiv.style.marginTop = '0.5rem';
          docDiv.innerText = 'Documentation: ' + data.errorDocumentation;
          container.appendChild(docDiv);
        }
      } else if (data && data.status === 'success' && data.message) {
        // If success status has a success message
        const msgDiv = document.createElement('div');
        msgDiv.className = 'response-status-ok';
        msgDiv.style.fontSize = '1.1rem';
        msgDiv.style.marginBottom = '1rem';
        msgDiv.innerText = '✓ ' + data.message;
        container.appendChild(msgDiv);
      }

      // Resolve actual payload
      let unwrap = data;
      if (data && typeof data === 'object') {
        if (data.payload !== undefined) {
          unwrap = data.payload;
        } else if (data.unwrap !== undefined) {
          unwrap = data.unwrap;
        } else if (data.data !== undefined) {
          unwrap = data.data;
        }
      }
      
      // If it looks like an image URL, show image preview
      if (typeof unwrap === 'string' && (unwrap.startsWith('http://') || unwrap.startsWith('https://') || unwrap.startsWith('data:image/')) && /\\.(jpeg|jpg|gif|png|svg)$/i.test(unwrap.split('?')[0])) {
        const img = document.createElement('img');
        img.src = unwrap;
        img.className = 'image-preview';
        container.appendChild(img);
        
        const link = document.createElement('div');
        link.style.marginTop = '0.5rem';
        link.innerHTML = '<a href="' + unwrap + '" target="_blank" style="color: var(--primary);">Open image in new tab</a>';
        container.appendChild(link);
        return;
      }

      // If it is an array of objects, show a table
      if (Array.isArray(unwrap) && unwrap.length > 0 && typeof unwrap[0] === 'object') {
        const table = document.createElement('table');
        table.className = 'data-table';
        
        const keys = Object.keys(unwrap[0]);
        const trHead = document.createElement('tr');
        keys.forEach(k => {
          const th = document.createElement('th');
          th.innerText = k;
          trHead.appendChild(th);
        });
        table.appendChild(trHead);

        unwrap.forEach(row => {
          const tr = document.createElement('tr');
          keys.forEach(k => {
            const td = document.createElement('td');
            const cellVal = row[k];
            td.innerText = typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal);
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });

        container.appendChild(table);
        return;
      }

      // If it's a string, render clean text
      if (typeof unwrap === 'string') {
        const textWrapper = document.createElement('div');
        textWrapper.style.whiteSpace = 'pre-wrap';
        textWrapper.innerText = unwrap;
        container.appendChild(textWrapper);
        return;
      }

      // Default JSON formatting
      const code = document.createElement('pre');
      code.innerText = JSON.stringify(unwrap !== undefined ? unwrap : data, null, 2);
      container.appendChild(code);
    }

    function copyOutput() {
      const container = document.getElementById('response-output-pre');
      const text = container.innerText;
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied response to clipboard!');
      });
    }

    function disconnectSse() {
      if (sseSource) {
        sseSource.close();
        sseSource = null;
      }
    }

    function toggleSse(fid) {
      const btn = document.getElementById('sse-toggle-btn');
      const log = document.getElementById('sse-log-container');

      if (sseSource) {
        disconnectSse();
        btn.innerText = '🔴 Subscribe';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        log.innerHTML = '<div style="color: var(--text-muted); font-style: italic;">Unsubscribed.</div>';
      } else {
        log.innerHTML = '<div style="color: #10b981;">Subscribing to stream...</div>';
        btn.innerText = '🟢 Active';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');

        sseSource = new EventSource('sse/' + fid);
        
        sseSource.onmessage = (event) => {
          let content = event.data;
          try {
            const parsed = JSON.parse(event.data);
            content = JSON.stringify(parsed, null, 2);
          } catch(e) {}

          const time = new Date().toLocaleTimeString();
          const item = document.createElement('div');
          item.className = 'sse-event-item';
          item.innerHTML = '<div class="sse-event-time">' + time + '</div><pre style="margin-top:0.25rem;">' + content + '</pre>';
          
          if (log.firstChild && log.firstChild.style && log.firstChild.style.fontStyle === 'italic') {
            log.innerHTML = '';
          }
          log.insertBefore(item, log.firstChild);
        };

        sseSource.onerror = (err) => {
          console.error("SSE Connection error:", err);
          const item = document.createElement('div');
          item.style.color = '#ef4444';
          item.innerText = 'SSE connection connection error or disconnected.';
          log.insertBefore(item, log.firstChild);
          disconnectSse();
          btn.innerText = '🔴 Subscribe';
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-secondary');
        };
      }
    }

    function generateMockFromSchema(schema) {
      if (!schema) return null;
      if (schema.type === 'object') {
        const obj = {};
        if (schema.properties) {
          for (const [key, prop] of Object.entries(schema.properties)) {
            obj[key] = generateMockFromSchema(prop);
          }
        }
        return obj;
      }
      if (schema.type === 'array') {
        return [generateMockFromSchema(schema.items || {})];
      }
      if (schema.type === 'string') {
        if (schema.enum && schema.enum.length > 0) return schema.enum[0];
        return "example_" + (schema.title || "string");
      }
      if (schema.type === 'number' || schema.type === 'integer') {
        return 1;
      }
      if (schema.type === 'boolean') {
        return true;
      }
      return null;
    }

    function loadExample(inputData) {
      if (!inputData) return;
      const api = manifestData.inputs.api[activeFid];
      const method = api.method || 'POST';
      const inputSchema = api.schema && api.schema.input;
      
      if (method === 'POST') {
        if (inputSchema && inputSchema.properties) {
          for (const key of Object.keys(inputSchema.properties)) {
            const el = document.getElementById('input-' + key);
            if (!el) continue;
            const val = inputData[key];
            if (val === undefined) {
              if (el.type === 'checkbox') el.checked = false;
              else el.value = '';
            } else if (el.type === 'checkbox') {
              el.checked = !!val;
            } else if (typeof val === 'object') {
              el.value = JSON.stringify(val, null, 2);
            } else {
              el.value = val;
            }
          }
        } else {
          const el = document.getElementById('raw-json-input');
          if (el) {
            el.value = JSON.stringify(inputData, null, 2);
          }
        }
      } else {
        if (inputSchema && inputSchema.properties) {
          for (const key of Object.keys(inputSchema.properties)) {
            const el = document.getElementById('input-' + key);
            if (el) {
              el.value = inputData[key] !== undefined ? inputData[key] : '';
            }
          }
        }
      }
    }
  </script>

</body>
</html>
`;
  }
}
