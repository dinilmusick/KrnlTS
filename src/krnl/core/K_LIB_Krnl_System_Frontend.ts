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
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this._generatePageHtml());
      return;
    }

    if (normalized === '/manifest.json' && req.method === 'GET') {
      const manifest = this.system.getManifest();
      const payload = {
        ...manifest,
        ingressMembers: this.system._ingressNetwork ? Array.from(this.system._ingressNetwork.members.keys()) : [],
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

        // Broadcast monitoring interaction event
        const stateEmitter = functionality.emitters?.get('state:changed');
        const interactionEvent = {
          type: 'frontend:interaction',
          fid,
          timestamp: Date.now(),
          input: body,
          output: result
        };
        stateEmitter?.pushDataStreamToEmitter(interactionEvent);

        this.interactionsHistory.push(interactionEvent);
        if (this.interactionsHistory.length > 50) {
          this.interactionsHistory.shift();
        }

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

    ${customCss}
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="brand-logo">🔷</div>
      <div>
        <h1 class="brand-title">${title}</h1>
        <div style="font-size: 0.75rem; color: var(--text-muted);">KrnlTS Self-Hosted Control Panel</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div class="meta-badges">
        <span class="badge badge-primary" id="system-type-badge">System</span>
        <span class="badge" id="port-badge">Port: ...</span>
      </div>
      <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle Theme">🌓</button>
    </div>
  </header>

  <div class="app-container">
    <aside>
      <div class="sidebar-section">
        <div class="sidebar-section-title">Local Endpoints</div>
        <ul class="nav-list" id="local-endpoints-list">
          <li style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">Loading...</li>
        </ul>
      </div>
      
      <div class="sidebar-section" id="remote-section" style="display: none;">
        <div class="sidebar-section-title">Remote Endpoints</div>
        <ul class="nav-list" id="remote-endpoints-list"></ul>
      </div>
    </aside>

    <main>
      <div class="main-grid" id="main-content">
        <!-- Sub-Apps (Ingress network) Section if any -->
        <div id="ingress-section" style="display: none; margin-bottom: 2rem;">
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">Sub-App Network Topology</h3>
          <div class="ingress-topology" id="ingress-container"></div>
        </div>

        <div id="welcome-panel" class="detail-card" style="text-align: center; padding: 4rem 2rem;">
          <h2 style="font-size: 2.25rem; margin-bottom: 1rem;">Welcome to the Control Panel</h2>
          <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem;">
            This dynamic user interface is served on-the-fly and reflects the configuration of your KrnlTS System Entity in real time. Select an endpoint in the sidebar to call it or monitor its events.
          </p>
          <div class="meta-badges" style="justify-content: center;">
            <span class="badge" id="welcome-details">Initialising...</span>
          </div>
        </div>

        <div id="endpoint-panel" class="detail-card" style="display: none;">
          <!-- Loaded dynamically -->
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
        const res = await fetch('./frontend/manifest.json');
        manifestData = await res.json();
        renderSidebar();
        renderIngressTopology();
        updateHeaderBadges();
      } catch (err) {
        console.error("Failed to fetch manifest:", err);
        document.getElementById('welcome-details').innerText = "Failed to load manifest.json";
      }
    });

    function updateHeaderBadges() {
      if (!manifestData) return;
      document.getElementById('system-type-badge').innerText = manifestData.systemType || 'SystemOrchestrator';
      const port = window.location.port || 'default';
      document.getElementById('port-badge').innerText = 'Port: ' + port;
      document.getElementById('welcome-details').innerText = 'Entity: ' + manifestData.entityName + ' | Type: ' + (manifestData.systemType || 'System');
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
          card.href = './' + member + '/frontend';
          card.innerHTML = '<div class="ingress-card-title">🔷 ' + member.toUpperCase() + '</div>' +
            '<div class="ingress-card-link">Open Sub-App Panel →</div>';
          container.appendChild(card);
        });
      } else {
        ingressSection.style.display = 'none';
      }
    }

    function selectEndpoint(fid) {
      if (activeFid) {
        const prevItem = document.getElementById('nav-item-' + activeFid);
        if (prevItem) prevItem.classList.remove('active');
      }

      activeFid = fid;
      const nextItem = document.getElementById('nav-item-' + fid);
      if (nextItem) nextItem.classList.add('active');

      document.getElementById('welcome-panel').style.display = 'none';
      
      const panel = document.getElementById('endpoint-panel');
      panel.style.display = 'block';

      // Disconnect previous SSE stream
      disconnectSse();

      const api = manifestData.inputs.api[fid];
      const method = api.method || 'POST';
      const inputSchema = api.schema && api.schema.input;
      
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

      panel.innerHTML = '<div class="card-header">' +
        '<div class="card-title-area">' +
        '<h2>' + fid + '</h2>' +
        '<div class="card-desc">' + (api.sourcePath || 'KrnlTS Built-in Functionality') + '</div>' +
        '</div>' +
        '<span class="badge badge-primary">' + method + '</span>' +
        '</div>' +
        '<form id="endpoint-call-form" onsubmit="handleCall(event, \\'' + fid + '\\', \\'' + method + '\\')">' +
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
        let fetchUrl = './frontend/api/' + fid;
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
      
      const unwrap = data.unwrap !== undefined ? data.unwrap : (data.data !== undefined ? data.data : data);
      
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
      code.innerText = JSON.stringify(data, null, 2);
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

        sseSource = new EventSource('./frontend/sse/' + fid);
        
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
  </script>

</body>
</html>
`;
  }
}
