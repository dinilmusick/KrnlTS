import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

export function resolvePreviewInspectionConfig(manifest) {
  const config = manifest?.browserInspection;
  if (!config || config.enabled === false) throw new Error('Browser inspection is disabled or missing in the Skipo manifest.');
  const routes = config.routes?.length ? config.routes : ['/'];
  const viewports = config.viewports?.length ? config.viewports : [{ width: 1440, height: 900 }];
  for (const route of routes) {
    if (typeof route !== 'string' || !route.startsWith('/')) throw new Error(`Inspection route must begin with "/": ${route}`);
  }
  for (const viewport of viewports) {
    if (!(viewport.width > 0 && viewport.height > 0)) throw new Error('Inspection viewport dimensions must be positive.');
  }
  return {
    routes, viewports, checks: config.checks ?? [], captureDom: config.captureDom !== false,
    timeoutMs: config.timeoutMs ?? 30000, waitUntil: config.waitUntil ?? 'domcontentloaded',
    maxDomCharacters: config.maxDomCharacters ?? 200000,
  };
}

export function buildPreviewTargets(baseUrl, config) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Preview URL must use HTTP or HTTPS.');
  for (const route of config.routes) {
    if (typeof route !== 'string' || !route.startsWith('/')) throw new Error(`Inspection route must begin with "/": ${route}`);
  }
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  return config.viewports.flatMap(viewport => config.routes.map(route => ({
    url: new URL(route.slice(1), base).toString(), viewport,
  })));
}

function messageOf(value) {
  return value instanceof Error ? value.message : String(value);
}

function safeName(value) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'root';
}

async function loadInspector() {
  const appRoot = resolve(process.env.SKIPO_APP_ROOT || process.cwd());
  const require = createRequire(join(appRoot, 'package.json'));
  const entry = require.resolve('@ultrst-armada/kloks/browser-inspection');
  const module = await import(pathToFileURL(entry).href);
  return new module.PlaywrightInspectionRuntime();
}

export async function runPreviewInspection({
  baseUrl, manifest, outputDirectory = 'artifacts/browser-inspection', inspector,
}) {
  const config = resolvePreviewInspectionConfig(manifest);
  const targets = buildPreviewTargets(baseUrl, config);
  const startedAt = Date.now();
  const results = [];
  const runtime = inspector ?? await loadInspector();

  for (const target of targets) {
    const routeName = safeName(new URL(target.url).pathname);
    const name = routeName + '-' + target.viewport.width + 'x' + target.viewport.height;
    const screenshotDirectory = join(outputDirectory, 'screenshots', name);
    const reportPath = join(outputDirectory, 'reports', name + '.json');
    try {
      const inspected = await runtime.inspect({
        url: target.url,
        timeoutMs: config.timeoutMs,
        waitUntil: config.waitUntil,
        viewports: [target.viewport],
        checks: config.checks,
        screenshotDirectory,
        reportPath,
        captureDom: config.captureDom,
        maxDomCharacters: config.maxDomCharacters,
      });
      results.push({ ...inspected, viewport: target.viewport, screenshot: inspected.screenshots[0] });
    } catch (cause) {
      results.push({
        ok: false, url: target.url, viewport: target.viewport,
        durationMs: 0, logs: [], checks: [], screenshots: [],
        errors: [{ kind: 'runtime', message: messageOf(cause) }],
        reportPath,
      });
    }
  }

  const report = {
    schemaVersion: 2, generatedAt: new Date().toISOString(), baseUrl,
    durationMs: Date.now() - startedAt, ok: results.every(result => result.ok),
    summary: {
      targets: results.length, passed: results.filter(result => result.ok).length,
      failed: results.filter(result => !result.ok).length,
      consoleLogs: results.reduce((count, result) => count + result.logs.length, 0),
      errors: results.reduce((count, result) => count + result.errors.length, 0),
    },
    results,
  };
  await mkdir(outputDirectory, { recursive: true });
  const reportPath = join(outputDirectory, 'report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  return { ...report, reportPath };
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, values) => {
    if (value.startsWith('--')) pairs.push([value.slice(2), values[index + 1]]);
    return pairs;
  }, []));
  const baseUrl = args.url || process.env.SKIPO_PREVIEW_URL;
  const manifestPath = args.manifest || process.env.SKIPO_INSPECTION_MANIFEST;
  if (!baseUrl || !manifestPath) throw new Error('Provide --url and --manifest (or SKIPO_PREVIEW_URL and SKIPO_INSPECTION_MANIFEST).');
  const manifest = JSON.parse(await readFile(resolve(manifestPath), 'utf8'));
  const result = await runPreviewInspection({ baseUrl, manifest, outputDirectory: args.output || 'artifacts/browser-inspection' });
  process.stdout.write(JSON.stringify({ ok: result.ok, summary: result.summary, reportPath: result.reportPath }, null, 2) + '\n');
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { process.stderr.write(messageOf(error) + '\n'); process.exitCode = 1; });
}
