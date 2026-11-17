import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import type {
  InspectionCheckResult,
  InspectionError,
  InspectionLog,
  PlaywrightInspectionRequest,
  PlaywrightInspectionResult,
} from './playwrightInspectionTypes.js';
import {
  findSystemChromiumExecutable,
  loadPlaywright,
  recordInspectionError,
  runInspectionCheck,
  type BrowserLike,
} from './playwrightInspectionSupport.js';

export class PlaywrightInspectionRuntime {
  async inspect(request: PlaywrightInspectionRequest): Promise<PlaywrightInspectionResult> {
    const started = Date.now();
    const errors: InspectionError[] = [];
    const logs: InspectionLog[] = [];
    const checks: InspectionCheckResult[] = [];
    const screenshots: string[] = [];
    const screenshotDirectory = request.screenshotDirectory ?? join(process.cwd(), 'artifacts/playwright', randomUUID());
    const reportPath = request.reportPath ?? join(screenshotDirectory, 'report.json');
    const timeout = request.timeoutMs ?? 15000;
    let browser: BrowserLike;
    try {
      const executablePath = request.executablePath ?? findSystemChromiumExecutable();
      const chromiumArgs = typeof process.getuid === 'function' && process.getuid() === 0
        ? ['--no-sandbox', '--disable-dev-shm-usage']
        : [];
      browser = await loadPlaywright().chromium.launch({
        headless: true,
        ...(chromiumArgs.length ? { args: chromiumArgs } : {}),
        ...(executablePath ? { executablePath } : {}),
      });
    }
    catch (cause) {
      recordInspectionError(errors, 'browser', cause instanceof Error ? cause.message : String(cause), request.url);
      const result: PlaywrightInspectionResult = {
        ok: false, url: request.url, durationMs: Date.now() - started,
        errors, logs, checks, screenshots, reportPath,
      };
      await mkdir(dirname(reportPath), { recursive: true });
      await writeFile(reportPath, JSON.stringify(result, null, 2), 'utf8');
      return result;
    }
    const context = await browser.newContext({ ignoreHTTPSErrors: false });
    const page = await context.newPage();
    let status: number | undefined;
    let title: string | undefined;
    let domSnapshot: string | undefined;

    page.on('console', message => {
      const location = message.location();
      const type = message.type() as InspectionLog['type'];
      logs.push({ type, message: message.text(), url: page.url(), ...(location.lineNumber ? { line: location.lineNumber } : {}), ...(location.columnNumber ? { column: location.columnNumber } : {}) });
      if (type === 'error') recordInspectionError(errors, 'console', message.text(), page.url());
    });
    page.on('pageerror', cause => recordInspectionError(errors, 'pageerror', cause instanceof Error ? cause.stack ?? cause.message : String(cause), page.url()));
    page.on('requestfailed', requestInfo => recordInspectionError(errors, 'requestfailed', requestInfo.failure()?.errorText ?? 'Request failed', requestInfo.url(), undefined, requestInfo.method()));
    page.on('response', response => {
      if (response.status() >= 400) recordInspectionError(errors, 'http', `HTTP ${response.status()} ${response.statusText()}`, response.url(), response.status(), response.request().method());
    });
    page.on('crash', () => recordInspectionError(errors, 'crash', 'Browser page crashed', page.url()));
    page.on('dialog', async dialog => {
      recordInspectionError(errors, 'dialog', `Unexpected ${dialog.type()} dialog: ${dialog.message()}`, page.url());
      await dialog.dismiss();
    });

    try {
      try {
        const response = await page.goto(request.url, { waitUntil: request.waitUntil ?? 'networkidle', timeout });
        status = response?.status();
      } catch (cause) {
        recordInspectionError(errors, 'navigation', cause instanceof Error ? cause.message : String(cause), request.url);
      }
      try { await page.waitForLoadState('domcontentloaded', { timeout }); } catch {}
      try { title = await page.title(); } catch {}
      for (const check of request.checks ?? []) checks.push(await runInspectionCheck(page, check));
      for (const viewport of request.viewports ?? [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
        try {
          await page.setViewportSize(viewport);
          const layout = await page.evaluate(() => ({
            viewportWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            brokenImages: Array.from(document.images).filter(image => image.complete && image.naturalWidth === 0).map(image => image.src),
          }));
          if (layout.documentWidth > layout.viewportWidth + 1) {
            recordInspectionError(errors, 'layout', `Horizontal overflow: document width ${layout.documentWidth}px exceeds viewport ${layout.viewportWidth}px`, request.url);
          }
          for (const imageUrl of layout.brokenImages) recordInspectionError(errors, 'asset', 'Image failed to render', imageUrl);
          {
            await mkdir(screenshotDirectory, { recursive: true });
            const path = join(screenshotDirectory, `inspection-${viewport.width}x${viewport.height}.png`);
            await page.screenshot({ path, fullPage: true });
            screenshots.push(path);
          }
        } catch (cause) { recordInspectionError(errors, 'screenshot', cause instanceof Error ? cause.message : String(cause), request.url); }
      }
      if (request.captureDom) {
        try {
          const html = await page.content();
          domSnapshot = html.slice(0, request.maxDomCharacters ?? 40000);
        } catch (cause) { recordInspectionError(errors, 'dom', cause instanceof Error ? cause.message : String(cause), request.url); }
      }
    } finally {
      await page.close().catch(() => undefined);
      await context.close().catch(() => undefined);
      await browser.close().catch(() => undefined);
    }
    for (const check of checks) if (!check.passed) recordInspectionError(errors, 'assertion', check.details ?? 'Inspection assertion failed', request.url);
    const result: PlaywrightInspectionResult = {
      ok: errors.length === 0,
      url: request.url,
      ...(title ? { title } : {}),
      ...(status !== undefined ? { status } : {}),
      durationMs: Date.now() - started,
      errors,
      logs,
      checks,
      screenshots,
      reportPath,
      ...(domSnapshot ? { domSnapshot } : {}),
    };
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, JSON.stringify(result, null, 2), 'utf8');
    return result;
  }
}

const runtime = new PlaywrightInspectionRuntime();
export const PlaywrightInspectionServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.playwrightInspection',
  name: 'PlaywrightInspectionService',
  version: '1.0.0',
  operations: {
    inspect: {
      id: 'PlaywrightInspectionService.inspect',
      name: 'inspect',
      handler: async (input: PlaywrightInspectionRequest) => runtime.inspect(input),
    },
  },
});

export const PlaywrightInspectionServiceFacade = {
  id: PlaywrightInspectionServiceDefinition.id,
  name: PlaywrightInspectionServiceDefinition.name,
  version: PlaywrightInspectionServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: PlaywrightInspectionServiceDefinition,
  createInstance: () => createService(PlaywrightInspectionServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    const instance: IService = createService(PlaywrightInspectionServiceDefinition);
    await instance.start();
    return instance.call<TIn, TOut>(op, input);
  },
};
