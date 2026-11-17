import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import type {
  InspectionCheck,
  InspectionCheckResult,
  InspectionError,
} from './playwrightInspectionTypes.js';

export type PageLike = {
  on(event: string, handler: (...args: any[]) => void): void;
  goto(url: string, options: object): Promise<{ status(): number } | null>;
  waitForLoadState(state: string, options: object): Promise<void>;
  title(): Promise<string>;
  url(): string;
  content(): Promise<string>;
  evaluate<T>(fn: () => T): Promise<T>;
  locator(selector: string): {
    count(): Promise<number>;
    isVisible(): Promise<boolean>;
    innerText(): Promise<string>;
    click(): Promise<void>;
    fill(value: string): Promise<void>;
  };
  setViewportSize(viewport: { width: number; height: number }): Promise<void>;
  screenshot(options: { path: string; fullPage: boolean }): Promise<Buffer>;
  close(): Promise<void>;
};

export type BrowserLike = {
  newContext(options: object): Promise<{ newPage(): Promise<PageLike>; close(): Promise<void> }>;
  close(): Promise<void>;
};

type PlaywrightModule = { chromium: { launch(options: object): Promise<BrowserLike>; executablePath?: () => string } };
export function findSystemChromiumExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && existsSync(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  // When CI installs an isolated Playwright runtime, use the browser binary
  // installed for that exact module version instead of an unrelated system Chrome.
  const runtimeRoot = process.env.PLAYWRIGHT_RUNTIME_PATH;
  if (runtimeRoot) {
    try {
      const runtimeRequire = createRequire(`${runtimeRoot}/package.json`);
      const executable = (runtimeRequire('playwright') as PlaywrightModule).chromium.executablePath?.();
      if (typeof executable === 'string' && existsSync(executable)) return executable;
    } catch {
      // Fall back to known system browser locations when no managed binary exists.
    }
  }
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Arc.app/Contents/MacOS/Arc',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return undefined;
}

export function loadPlaywright(): PlaywrightModule {
  const runtimeRoot = process.env.PLAYWRIGHT_RUNTIME_PATH;
  const requireFromRuntime = runtimeRoot
    ? createRequire(`${runtimeRoot}/package.json`)
    : createRequire(import.meta.url);
  try { return requireFromRuntime('playwright') as PlaywrightModule; }
  catch { throw new Error('Playwright is required for browser inspection. Install the optional "playwright" package and Chromium browser.'); }
}

export function recordInspectionError(
  errors: InspectionError[],
  kind: InspectionError['kind'],
  message: string,
  url?: string,
  status?: number,
  method?: string,
) {
  errors.push({ kind, message, ...(url ? { url } : {}), ...(status ? { status } : {}), ...(method ? { method } : {}) });
}

export async function runInspectionCheck(page: PageLike, check: InspectionCheck): Promise<InspectionCheckResult> {
  try {
    const locator = page.locator(check.selector);
    if (await locator.count() === 0) throw new Error('Selector matched no elements');
    if (check.visible !== undefined && await locator.isVisible() !== check.visible) throw new Error(`Expected visible=${check.visible}`);
    if (check.text !== undefined && !(await locator.innerText()).includes(check.text)) throw new Error(`Expected text containing: ${check.text}`);
    if (check.action?.type === 'click') await locator.click();
    if (check.action?.type === 'fill') await locator.fill(check.action.value ?? '');
    return { selector: check.selector, passed: true };
  } catch (cause) {
    return { selector: check.selector, passed: false, details: cause instanceof Error ? cause.message : String(cause) };
  }
}
