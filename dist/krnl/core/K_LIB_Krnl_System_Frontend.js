export class KrnlFrontend {
    system;
    options;
    interactionsHistory = [];
    constructor(system, options = {}) {
        this.system = system;
        this.options = {
            title: system.entityName,
            theme: 'dark',
            enableMonitoringApi: true,
            ...options
        };
    }
    async handleRequest(req, res, subpath) {
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
            }
            else if (req.method === 'GET') {
                const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
                body = Object.fromEntries(url.searchParams.entries());
            }
            try {
                const result = await this.system.call(fid, body, {
                    unwrap: false,
                    callerPort: req.socket?.remotePort,
                    accessKey: req.headers['x-krnl-access-key'],
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            }
            catch (e) {
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
            const unsubscribe = stateEmitter?.subscribe((msg) => {
                res.write(`data: ${JSON.stringify(msg.data || msg)}\n\n`);
            });
            const interval = setInterval(() => {
                if (res.writable) {
                    res.write(': keepalive\n\n');
                }
            }, 15000);
            req.on('close', () => {
                if (unsubscribe)
                    unsubscribe();
                clearInterval(interval);
                res.end();
            });
            return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Route not found' }));
    }
    _readJsonBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                if (!body)
                    return resolve({});
                try {
                    resolve(JSON.parse(body));
                }
                catch (e) {
                    reject(new Error("Invalid JSON body"));
                }
            });
        });
    }
    _generatePageHtml() {
        const title = this.options.title || this.system.entityName;
        const theme = this.options.theme || 'dark';
        const customCss = this.options.customCss || '';
        return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} Control Panel</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-sans: 'Outfit', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --bg-base: #0a0e17;
      --bg-surface: rgba(22, 28, 45, 0.6);
      --bg-surface-hover: rgba(30, 38, 58, 0.8);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-color-focus: rgba(59, 130, 246, 0.5);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      --accent: #10b981;
      --accent-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
      --card-blur: blur(12px);
    }
    [data-theme="light"] {
      --bg-base: #f1f5f9;
      --bg-surface: rgba(255, 255, 255, 0.8);
      --bg-surface-hover: rgba(241, 245, 249, 0.9);
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      background-color: var(--bg-base);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-image: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.04) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 40%);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      border-bottom: 1px solid var(--border-color);
      background-color: rgba(10, 14, 23, 0.5);
      backdrop-filter: blur(10px);
      z-index: 50;
    }
    .brand { display: flex; align-items: center; gap: 1rem; }
    .brand-logo {
      width: 36px; height: 36px;
      background: var(--primary-gradient);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; color: white;
    }
    .brand-title {
      font-size: 1.25rem; font-weight: 700;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .theme-toggle {
      background: none; border: 1px solid var(--border-color);
      color: var(--text-main); padding: 0.5rem;
      border-radius: 8px; cursor: pointer;
    }
    .theme-toggle:hover { background: var(--border-color); }
    .app-container { display: flex; flex: 1; height: calc(100vh - 65px); overflow: hidden; }
    aside.left-sidebar {
      width: 280px; border-right: 1px solid var(--border-color);
      background-color: rgba(10, 14, 23, 0.25);
      display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
    }
    aside.right-sidebar {
      width: 340px; border-left: 1px solid var(--border-color);
      background-color: rgba(10, 14, 23, 0.25);
      display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
      padding: 1.25rem; gap: 1.25rem;
    }
    .sidebar-section { padding: 1.25rem; border-bottom: 1px solid var(--border-color); }
    .sidebar-section-title {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      color: var(--text-muted); letter-spacing: 0.08em;
      margin-bottom: 0.75rem; display: flex; justify-content: space-between;
      align-items: center; cursor: pointer;
    }
    .nav-list { list-style: none; display: flex; flex-direction: column; gap: 0.25rem; }
    .nav-item button {
      width: 100%; text-align: left; background: none; border: none;
      padding: 0.6rem 0.8rem; border-radius: 8px; color: var(--text-muted);
      font-family: var(--font-sans); font-size: 0.95rem; font-weight: 500;
      cursor: pointer; display: flex; align-items: center; justify-content: space-between;
    }
    .nav-item button:hover { color: var(--text-main); background: rgba(255,255,255,0.05); }
    .nav-item.active button { color: white; background: var(--primary-gradient); }
    .nav-item .method-badge {
      font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.35rem;
      border-radius: 4px; background: rgba(0, 0, 0, 0.2); color: #93c5fd;
    }
    .nav-item.active .method-badge { background: rgba(255, 255, 255, 0.2); color: white; }
    main { flex: 1; padding: 2rem; overflow-y: auto; background-color: rgba(10, 14, 23, 0.1); }
    .main-grid { display: flex; flex-direction: column; gap: 2rem; max-width: 1000px; margin: 0 auto; }
    .detail-card {
      background: var(--bg-surface); backdrop-filter: var(--card-blur);
      border: 1px solid var(--border-color); border-radius: 16px;
      padding: 2rem; box-shadow: var(--glass-shadow);
    }
    .endpoint-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 1px solid var(--border-color); padding-bottom: 1.25rem; margin-bottom: 1.5rem;
    }
    .endpoint-title h2 { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; }
    .category-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 6px; text-transform: uppercase; font-weight: bold; }
    .badge-app { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .badge-system { background: rgba(139, 92, 246, 0.2); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.4); }
    .tab-bar { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem; }
    .tab-btn {
      background: none; border: none; color: var(--text-muted);
      font-family: var(--font-sans); font-size: 1rem; font-weight: 600;
      padding: 0.6rem 1.2rem; cursor: pointer; border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: var(--text-main); }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
    .form-group { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .form-label { font-size: 0.85rem; font-weight: 600; color: var(--text-main); }
    .form-input {
      background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color);
      color: var(--text-main); padding: 0.75rem; border-radius: 8px;
      font-family: var(--font-sans); font-size: 0.95rem; width: 100%;
    }
    .form-textarea { font-family: var(--font-mono); min-height: 100px; resize: vertical; }
    .btn {
      background: var(--primary-gradient); color: white; border: none;
      padding: 0.75rem 1.5rem; border-radius: 8px; font-family: var(--font-sans);
      font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;
    }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text-main); border: 1px solid var(--border-color); }
    .response-box { margin-top: 1.5rem; background: #040711; border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; }
    .response-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; font-size: 0.8rem; font-weight: bold; color: var(--text-muted); }
    .response-content { font-family: var(--font-mono); font-size: 0.9rem; white-space: pre-wrap; overflow-x: auto; max-height: 400px; }
    .slider-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; margin-top: 1rem; }
    .slider-item { display: flex; flex-direction: column; gap: 0.35rem; background: rgba(255, 255, 255, 0.02); padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; }
    .slider-header { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: bold; }
    .sse-panel { margin-top: 1.5rem; border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
    .sse-header { background: rgba(16, 185, 129, 0.1); border-bottom: 1px solid var(--border-color); padding: 0.75rem 1.25rem; display: flex; justify-content: space-between; align-items: center; }
    .sse-log { background: #040711; padding: 1rem; font-family: var(--font-mono); font-size: 0.85rem; height: 200px; overflow-y: auto; white-space: pre-wrap; }
    .telemetry-log-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }
    .telemetry-log-table th, .telemetry-log-table td { padding: 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    .telemetry-log-table th { color: var(--text-muted); font-weight: 600; }

    /* Access Policy Card */
    .policy-card { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; font-size: 0.85rem; }
    .policy-tag { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: bold; margin-right: 0.4rem; font-size: 0.75rem; }
    .tag-allow { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .tag-forbid { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .tag-key { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

    /* Right Sidebar / Orchestrator Box */
    .orch-box { display: flex; flex-direction: column; height: 100%; gap: 1rem; }
    .orch-chat-history { flex: 1; min-height: 250px; max-height: 380px; background: #040711; border: 1px solid var(--border-color); border-radius: 12px; padding: 0.75rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem; }
    .orch-msg { padding: 0.6rem 0.8rem; border-radius: 8px; max-width: 90%; word-break: break-word; }
    .orch-msg-user { background: var(--primary-gradient); color: white; align-self: flex-end; }
    .orch-msg-agent { background: rgba(255, 255, 255, 0.06); border: 1px solid var(--border-color); color: var(--text-main); align-self: flex-start; }
    .task-runner-panel { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 0.75rem; font-size: 0.8rem; }
    .task-item { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); }
    .task-status { font-weight: bold; text-transform: uppercase; font-size: 0.7rem; padding: 0.1rem 0.3rem; border-radius: 3px; }
    .status-running { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .status-done { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .status-pending { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

    ${customCss}
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">🔷</div>
      <div><h1 class="brand-title">${title} Control Panel</h1></div>
    </div>
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button class="btn btn-secondary" onclick="loadTelemetryLog()">📊 Telemetry Logs</button>
      <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle Theme">🌓</button>
    </div>
  </header>
  <div class="app-container">
    <aside class="left-sidebar">
      <div class="sidebar-section">
        <div class="sidebar-section-title">🔌 App Endpoints</div>
        <ul class="nav-list" id="app-endpoints-list"><li style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">Loading endpoints...</li></ul>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title" onclick="toggleSystemSection()"><span>⚙️ System Endpoints</span><span id="system-toggle-arrow">▼</span></div>
        <ul class="nav-list" id="system-endpoints-list" style="display: block;"></ul>
      </div>
    </aside>
    <main>
      <div class="main-grid" id="main-content">
        <div id="welcome-panel" class="detail-card" style="text-align: center; padding: 4rem 2rem;">
          <h2 style="font-size: 2.25rem; margin-bottom: 1rem;">Welcome to ${title}</h2>
          <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem;">Select an endpoint in the sidebar to call it, view schemas, listen to event streams, or talk to the application orchestrator.</p>
          <button class="btn" onclick="refreshDefinitions()">🔄 Refresh Endpoints</button>
        </div>
        <div id="telemetry-panel" class="detail-card" style="display: none;">
          <div class="endpoint-header"><div class="endpoint-title"><h2>Historical Telemetry logs</h2></div><button class="btn btn-secondary" onclick="closeTelemetryPanel()">Close</button></div>
          <div style="overflow-x: auto;"><table class="telemetry-log-table"><thead><tr><th>Time</th><th>Type</th><th>Endpoint</th><th>Latency</th><th>Success</th></tr></thead><tbody id="telemetry-log-body"><tr><td colspan="5" style="color: var(--text-muted); text-align: center;">No logs fetched yet.</td></tr></tbody></table></div>
        </div>
        <div id="endpoint-panel" class="detail-card" style="display: none;"></div>
      </div>
    </main>
    <aside class="right-sidebar">
      <div class="sidebar-section-title">🤖 Application Orchestrator</div>
      <div class="orch-box">
        <div class="orch-chat-history" id="orch-chat-box">
          <div class="orch-msg orch-msg-agent">Hello! I am the Application Orchestrator. Type a natural language request to run workflows across system endpoints.</div>
        </div>
        <form onsubmit="handleOrchestratorSubmit(event)" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <textarea class="form-input" id="orch-prompt-input" placeholder="e.g. Process order #123 and notify user" style="height: 70px; resize: none; font-size: 0.85rem;"></textarea>
          <button type="submit" class="btn" style="justify-content: center; padding: 0.5rem; font-size: 0.85rem;">💬 Prompt Orchestrator</button>
        </form>
        <div class="task-runner-panel">
          <div class="sidebar-section-title" style="margin-bottom: 0.5rem;">📋 Autonomous Task Runner</div>
          <div id="task-list-box" style="color: var(--text-muted); font-size: 0.75rem;">No tasks running.</div>
        </div>
      </div>
    </aside>
  </div>
  <script>
    let definitions = [];
    let activeFid = null;
    let activeTab = 'call';
    let sseSource = null;

    const themeBtn = document.getElementById('theme-toggle-btn');
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    });

    function toggleSystemSection() {
      const list = document.getElementById('system-endpoints-list');
      const arrow = document.getElementById('system-toggle-arrow');
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
      arrow.innerText = list.style.display === 'none' ? '►' : '▼';
    }

    async function refreshDefinitions() {
      try {
        const res = await fetch('api/getEndpointDefinitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const data = await res.json();
        definitions = data.payload || data;
        renderSidebar();
        if (activeFid) {
          const updated = definitions.find(d => d.id === activeFid);
          if (updated) renderEndpoint(updated);
        }
      } catch (err) { console.error("Failed to load endpoint definitions:", err); }
    }

    async function pollTaskList() {
      try {
        const res = await fetch('api/getTaskList', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const data = await res.json();
        const payload = data.payload || data;
        const box = document.getElementById('task-list-box');
        if (!payload || !payload.tasks || payload.tasks.length === 0) {
          box.innerHTML = '<div style="color: var(--text-muted);">No active task list.</div>';
          return;
        }
        let html = '';
        payload.tasks.forEach(t => {
          const sClass = t.status === 'running' ? 'status-running' : (t.status === 'done' ? 'status-done' : 'status-pending');
          html += \`<div class="task-item"><span>\${t.endpointId || t.prompt.slice(0, 20)}</span><span class="task-status \${sClass}">\${t.status}</span></div>\`;
        });
        box.innerHTML = html;
      } catch(e) {}
    }

    function renderSidebar() {
      const appList = document.getElementById('app-endpoints-list');
      const sysList = document.getElementById('system-endpoints-list');
      appList.innerHTML = ''; sysList.innerHTML = '';
      let appCount = 0;
      definitions.sort((a, b) => a.id.localeCompare(b.id)).forEach(def => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.id = 'nav-item-' + def.id;
        if (activeFid === def.id) li.classList.add('active');
        li.innerHTML = \`<button onclick="selectEndpoint('\${def.id}')"><span>\${def.id}</span><span class="method-badge">\${def.method}</span></button>\`;
        if (def.category === 'krnl_system') sysList.appendChild(li); else { appList.appendChild(li); appCount++; }
      });
      if (appCount === 0) appList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">No app endpoints</li>';
    }

    function selectEndpoint(fid) {
      document.getElementById('welcome-panel').style.display = 'none';
      document.getElementById('telemetry-panel').style.display = 'none';
      document.getElementById('endpoint-panel').style.display = 'block';
      if (activeFid) {
        const prevLi = document.getElementById('nav-item-' + activeFid);
        if (prevLi) prevLi.classList.remove('active');
      }
      activeFid = fid;
      const activeLi = document.getElementById('nav-item-' + fid);
      if (activeLi) activeLi.classList.add('active');
      const def = definitions.find(d => d.id === fid);
      if (def) renderEndpoint(def);
    }

    function switchTab(tab) {
      activeTab = tab;
      const def = definitions.find(d => d.id === activeFid);
      if (def) renderEndpoint(def);
    }

    function renderEndpoint(def) {
      const panel = document.getElementById('endpoint-panel');
      const badgeClass = def.category === 'krnl_system' ? 'badge-system' : 'badge-app';
      const isApp = def.category === 'app';
      let tabsHtml = isApp ? \`<div class="tab-bar">
        <button class="tab-btn \${activeTab === 'call' ? 'active' : ''}" onclick="switchTab('call')">Call Endpoint</button>
        <button class="tab-btn \${activeTab === 'schema' ? 'active' : ''}" onclick="switchTab('schema')">Schema</button>
        <button class="tab-btn \${activeTab === 'edit' ? 'active' : ''}" onclick="switchTab('edit')">Edit Definition</button>
      </div>\` : '';
      if (!isApp && activeTab !== 'call') activeTab = 'call';
      let contentHtml = '';
      if (activeTab === 'call') contentHtml = renderCallTab(def);
      else if (activeTab === 'schema') contentHtml = renderSchemaTab(def);
      else contentHtml = renderEditTab(def);

      panel.innerHTML = \`<div class="endpoint-header"><div class="endpoint-title"><h2>\${def.id} <span class="category-badge \${badgeClass}">\${def.category}</span></h2><div style="color: var(--text-muted); font-size: 0.95rem;">\${def.description || ''}</div></div></div>\${tabsHtml}\${contentHtml}\`;
      if (activeTab === 'call' && def.examplePayload) loadExamplePayload(def.examplePayload);
    }

    function renderSchemaTab(def) {
      const inSchema = JSON.stringify(def.inputSchema || {}, null, 2);
      const outSchema = JSON.stringify(def.outputSchema || {}, null, 2);
      return \`
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div>
            <h3 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--primary);">Input Schema</h3>
            <pre class="response-content" style="background: #040711; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">\${inSchema}</pre>
          </div>
          <div>
            <h3 style="font-size: 1rem; margin-bottom: 0.5rem; color: #10b981;">Output Schema</h3>
            <pre class="response-content" style="background: #040711; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">\${outSchema}</pre>
          </div>
        </div>
      \`;
    }

    function renderCallTab(def) {
      let policyHtml = '';
      if (def.accessPolicy) {
        const p = def.accessPolicy;
        const allows = (p.allow || []).map(port => \`<span class="policy-tag tag-allow">Allow:\${port}</span>\`).join(' ');
        const forbids = (p.forbid || []).map(port => \`<span class="policy-tag tag-forbid">Forbid:\${port}</span>\`).join(' ');
        const keys = (p.allow_with_key || []).map(port => \`<span class="policy-tag tag-key">KeyReq:\${port}</span>\`).join(' ');
        policyHtml = \`<div class="policy-card">
          <div style="font-weight: bold; margin-bottom: 0.4rem;">Access Policy Control</div>
          <div>Default: <strong>\${p.default_connection_behaviour || 'allow_unlisted'}</strong></div>
          <div style="margin-top: 0.4rem;">\${allows} \${forbids} \${keys}</div>
        </div>\`;
      }

      let inputsHtml = '';
      if (def.method === 'POST') {
        if (def.inputSchema?.properties) {
          inputsHtml = '<div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">';
          for (const [key, prop] of Object.entries(def.inputSchema.properties)) {
            const desc = prop.description || '';
            const req = (def.inputSchema.required || []).includes(key) ? 'required' : '';
            inputsHtml += \`<div class="form-group"><label class="form-label" for="call-input-\${key}">\${key}</label>\`;
            if (prop.type === 'boolean') inputsHtml += \`<div style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="call-input-\${key}"> <span>\${desc}</span></div>\`;
            else if (['number', 'integer'].includes(prop.type)) inputsHtml += \`<input type="number" class="form-input" id="call-input-\${key}" placeholder="\${desc}" \${req}>\`;
            else if (prop.type === 'string') inputsHtml += \`<input type="text" class="form-input" id="call-input-\${key}" placeholder="\${desc}" \${req}>\`;
            else inputsHtml += \`<textarea class="form-input form-textarea" id="call-input-\${key}" placeholder="\${desc}" \${req}></textarea>\`;
            inputsHtml += '</div>';
          }
          inputsHtml += '</div>';
        } else {
          inputsHtml = '<div class="form-group"><label class="form-label" for="call-raw-json">Payload (JSON)</label><textarea class="form-input form-textarea" id="call-raw-json" placeholder="{\\n}"></textarea></div>';
        }
      } else {
        inputsHtml = '<p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">GET requests take query parameters via URL, or no parameters.</p>';
      }

      const sseHtml = (def.emitters && def.emitters.length > 0) ? \`
        <div class="sse-panel">
          <div class="sse-header"><span style="font-weight: bold; color:#10b981;">Live Event Stream</span><button class="btn btn-secondary" style="padding:0.35rem 0.75rem; font-size:0.75rem;" id="sse-btn" onclick="toggleSse('\${def.id}')">🔴 Listen</button></div>
          <div class="sse-log" id="sse-log-box">Not listening.</div>
        </div>\` : '';

      return \`
        \${policyHtml}
        <form onsubmit="handleCallSubmit(event)">
          \${def.examplePayload ? \`<button type="button" class="btn btn-secondary" style="margin-bottom: 1.5rem; padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="fillExamplePayload()">📋 Load Example Payload</button>\` : ''}
          \${inputsHtml}
          <button type="submit" class="btn">🚀 Call Endpoint</button>
        </form>
        <div class="response-box" id="response-box" style="display: none;"><div class="response-header"><span>RESPONSE</span><button class="btn btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="copyResponse()">Copy</button></div><pre class="response-content" id="response-text"></pre></div>
        \${sseHtml}
      \`;
    }

    function fillExamplePayload() {
      const def = definitions.find(d => d.id === activeFid);
      if (def && def.examplePayload) loadExamplePayload(def.examplePayload);
    }

    function loadExamplePayload(payload) {
      const def = definitions.find(d => d.id === activeFid);
      if (!def) return;
      const hasProps = def.inputSchema && def.inputSchema.properties;
      if (def.method === 'POST') {
        if (hasProps) {
          for (const key of Object.keys(def.inputSchema.properties)) {
            const el = document.getElementById('call-input-' + key);
            if (!el) continue;
            const val = payload[key];
            if (val === undefined) { if (el.type === 'checkbox') el.checked = false; else el.value = ''; }
            else if (el.type === 'checkbox') el.checked = !!val;
            else el.value = typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
          }
        } else {
          const el = document.getElementById('call-raw-json');
          if (el) el.value = JSON.stringify(payload, null, 2);
        }
      }
    }

    async function handleCallSubmit(event) {
      event.preventDefault();
      const def = definitions.find(d => d.id === activeFid);
      if (!def) return;
      let body = {};
      const hasProps = def.inputSchema && def.inputSchema.properties;
      if (def.method === 'POST') {
        if (hasProps) {
          for (const key of Object.keys(def.inputSchema.properties)) {
            const el = document.getElementById('call-input-' + key);
            if (!el) continue;
            if (el.type === 'checkbox') body[key] = el.checked;
            else {
              const val = el.value.trim();
              if (val.startsWith('{') || val.startsWith('[')) { try { body[key] = JSON.parse(val); } catch(e) { body[key] = val; } }
              else body[key] = isNaN(Number(val)) || val === '' ? val : Number(val);
            }
          }
        } else {
          const el = document.getElementById('call-raw-json');
          if (el && el.value.trim() !== '') { try { body = JSON.parse(el.value); } catch(e) { alert("Invalid JSON"); return; } }
        }
      }
      const resBox = document.getElementById('response-box');
      const resText = document.getElementById('response-text');
      resText.innerText = "Calling..."; resBox.style.display = 'block';
      try {
        const res = await fetch('api/' + def.id, { method: def.method, headers: { 'Content-Type': 'application/json' }, body: def.method === 'POST' ? JSON.stringify(body) : undefined });
        const data = await res.json();
        resText.innerText = JSON.stringify(data, null, 2);
      } catch (err) { resText.innerText = "Error: " + err.message; }
    }

    async function handleOrchestratorSubmit(event) {
      event.preventDefault();
      const inputEl = document.getElementById('orch-prompt-input');
      const promptText = inputEl.value.trim();
      if (!promptText) return;
      inputEl.value = '';

      const chatBox = document.getElementById('orch-chat-box');
      const userMsg = document.createElement('div');
      userMsg.className = 'orch-msg orch-msg-user';
      userMsg.innerText = promptText;
      chatBox.appendChild(userMsg);

      const agentMsg = document.createElement('div');
      agentMsg.className = 'orch-msg orch-msg-agent';
      agentMsg.innerText = 'Orchestrating request...';
      chatBox.appendChild(agentMsg);
      chatBox.scrollTop = chatBox.scrollHeight;

      try {
        const res = await fetch('api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: promptText })
        });
        const data = await res.json();
        agentMsg.innerText = JSON.stringify(data, null, 2);
      } catch(err) {
        agentMsg.innerText = 'Error: ' + err.message;
      }
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    function toggleSse(fid) {
      const log = document.getElementById('sse-log-box');
      const btn = document.getElementById('sse-btn');
      if (sseSource) {
        sseSource.close(); sseSource = null;
        btn.innerText = '🔴 Listen'; btn.style.background = '';
        log.innerText = 'Disconnected.'; return;
      }
      btn.innerText = '🟢 Active'; btn.style.background = '#10b981';
      log.innerText = 'Listening...\\n';
      sseSource = new EventSource('sse/' + fid);
      sseSource.onmessage = (e) => { log.innerText += \`[\${new Date().toLocaleTimeString()}] \${e.data}\\n\`; log.scrollTop = log.scrollHeight; };
      sseSource.onerror = () => { log.innerText += 'Error.\\n'; sseSource.close(); sseSource = null; btn.innerText = '🔴 Listen'; btn.style.background = ''; };
    }

    function renderEditTab(def) {
      const toolsVal = (def.agentTools || []).join(', ');
      const dynVal = (def.dynamicWatchVars || []).join(', ');
      const statVal = (def.staticWatchVars || []).join(', ');
      const spec = def.intelligenceSpec || {};
      const specNames = ['reasoning', 'planning', 'toolUsage', 'structuredOutput', 'jsonStrictness', 'coding', 'extraction', 'classification', 'summarization', 'creativity', 'determinism', 'context', 'vision', 'multimodal', 'outputComplexity'];
      let slidersHtml = '<div class="slider-container">';
      specNames.forEach(name => {
        const val = spec[name] !== undefined ? spec[name] : 3;
        slidersHtml += \`<div class="slider-item"><div class="slider-header"><span>\${name}</span><span id="spec-val-\${name}">\${val}</span></div><input type="range" class="slider-input" min="0" max="10" value="\${val}" id="edit-spec-\${name}" oninput="document.getElementById('spec-val-\${name}').innerText = this.value"></div>\`;
      });
      slidersHtml += '</div>';

      return \`
        <form onsubmit="handleEditSubmit(event)">
          <div class="form-group"><label class="form-label">Description</label><input type="text" class="form-input" id="edit-desc" value="\${def.description || ''}"></div>
          <div class="form-group"><label class="form-label">System Instructions Prompt</label><textarea class="form-input form-textarea" id="edit-system-inst">\${def.systemInstructions || ''}</textarea></div>
          <div class="form-group"><label class="form-label">Example Payload (JSON)</label><textarea class="form-input form-textarea" id="edit-example-payload">\${def.examplePayload ? JSON.stringify(def.examplePayload, null, 2) : ''}</textarea></div>
          <div class="form-group"><label class="form-label">Agent Tools</label><input type="text" class="form-input" id="edit-agent-tools" value="\${toolsVal}"></div>
          <div class="form-group"><label class="form-label">Dynamic Watch Variables</label><input type="text" class="form-input" id="edit-dynamic-vars" value="\${dynVal}"></div>
          <div class="form-group"><label class="form-label">Static Watch Variables</label><input type="text" class="form-input" id="edit-static-vars" value="\${statVal}"></div>
          <div class="form-group"><label class="form-label">Intelligence Specification Requirement Levels</label>\${slidersHtml}</div>
          <div class="form-group"><label class="form-label">Endpoint Persistent Memory (Learnings)</label><textarea class="form-input form-textarea" style="background: rgba(0,0,0,0.3);" readonly>\${def.memory || 'No learnings recorded yet.'}</textarea></div>
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;"><button type="submit" class="btn">💾 Save Definition</button><span id="save-status-msg" style="align-self: center; font-weight: bold;"></span></div>
        </form>
      \`;
    }

    async function handleEditSubmit(event) {
      event.preventDefault();
      const statusSpan = document.getElementById('save-status-msg');
      statusSpan.innerText = 'Saving...'; statusSpan.style.color = 'var(--text-muted)';
      const specNames = ['reasoning', 'planning', 'toolUsage', 'structuredOutput', 'jsonStrictness', 'coding', 'extraction', 'classification', 'summarization', 'creativity', 'determinism', 'context', 'vision', 'multimodal', 'outputComplexity'];
      const intelligenceSpec = {};
      specNames.forEach(name => { intelligenceSpec[name] = Number(document.getElementById('edit-spec-' + name).value); });
      let examplePayload = null;
      const rawEx = document.getElementById('edit-example-payload').value.trim();
      if (rawEx !== '') { try { examplePayload = JSON.parse(rawEx); } catch(e) { alert("Invalid JSON"); return; } }
      const override = {
        description: document.getElementById('edit-desc').value.trim(),
        systemInstructions: document.getElementById('edit-system-inst').value.trim(),
        examplePayload,
        agentTools: document.getElementById('edit-agent-tools').value.split(',').map(s => s.trim()).filter(Boolean),
        dynamicWatchVars: document.getElementById('edit-dynamic-vars').value.split(',').map(s => s.trim()).filter(Boolean),
        staticWatchVars: document.getElementById('edit-static-vars').value.split(',').map(s => s.trim()).filter(Boolean),
        intelligenceSpec
      };
      try {
        const res = await fetch('api/setEndpointDefinition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeFid, override }) });
        const data = await res.json();
        if (data.status === 'success' || data.payload) { statusSpan.innerText = '✓ Spec Saved!'; statusSpan.style.color = '#10b981'; await refreshDefinitions(); }
        else { statusSpan.innerText = 'Error: ' + data.message; statusSpan.style.color = '#ef4444'; }
      } catch (err) { statusSpan.innerText = 'Save failed.'; statusSpan.style.color = '#ef4444'; }
      setTimeout(() => { statusSpan.innerText = ''; }, 3000);
    }

    async function loadTelemetryLog() {
      document.getElementById('welcome-panel').style.display = 'none';
      document.getElementById('endpoint-panel').style.display = 'none';
      document.getElementById('telemetry-panel').style.display = 'block';
      const tbody = document.getElementById('telemetry-log-body');
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Fetching...</td></tr>';
      try {
        const res = await fetch('api/getTelemetryLog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 100 }) });
        const data = await res.json();
        const logs = data.payload || data || [];
        tbody.innerHTML = '';
        if (logs.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);text-align:center;">No logs.</td></tr>'; return; }
        logs.forEach(log => {
          const row = document.createElement('tr');
          const time = new Date(log.timestamp).toLocaleTimeString();
          const latencyVal = log.latencyMs || log.durationMs || 0;
          row.innerHTML = \`<td>\${time}</td><td>\${log.type === 'ai_trace' ? '🤖 AI' : '📞 Call'}</td><td style="font-family:var(--font-mono);font-weight:bold;">\${log.endpointId}</td><td>\${latencyVal.toFixed(1)} ms</td><td style="color:\${log.success ? '#10b981' : '#ef4444'};font-weight:bold;">\${log.success ? 'Success' : 'Failed'}</td>\`;
          tbody.appendChild(row);
        });
      } catch (err) { tbody.innerHTML = \`<tr><td colspan="5" style="color:#ef4444;text-align:center;">Error: \${err.message}</td></tr>\`; }
    }

    function closeTelemetryPanel() { document.getElementById('telemetry-panel').style.display = 'none'; document.getElementById('welcome-panel').style.display = 'block'; }
    function copyResponse() { navigator.clipboard.writeText(document.getElementById('response-text').innerText).then(() => { alert("Copied."); }); }
    function disconnectSse() { if (sseSource) { sseSource.close(); sseSource = null; } }

    window.addEventListener('DOMContentLoaded', async () => {
      await refreshDefinitions();
      setInterval(refreshDefinitions, 5000);
      await pollTaskList();
      setInterval(pollTaskList, 3000);
    });
  </script>
</body>
</html>`;
    }
}
//# sourceMappingURL=K_LIB_Krnl_System_Frontend.js.map