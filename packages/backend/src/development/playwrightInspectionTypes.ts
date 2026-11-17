export type InspectionErrorKind =
  | 'console'
  | 'pageerror'
  | 'requestfailed'
  | 'http'
  | 'navigation'
  | 'assertion'
  | 'crash'
  | 'dialog'
  | 'browser'
  | 'screenshot'
  | 'dom'
  | 'layout'
  | 'asset';

export interface InspectionError {
  kind: InspectionErrorKind;
  message: string;
  url?: string;
  status?: number;
  method?: string;
}

export interface InspectionLog {
  type: 'error' | 'warning' | 'log' | 'info' | 'debug' | 'dir' | 'trace' | 'assert' | 'other';
  message: string;
  url?: string;
  line?: number;
  column?: number;
}

export interface InspectionCheck {
  selector: string;
  visible?: boolean;
  text?: string;
  action?: { type: 'click' | 'fill'; value?: string };
}

export interface InspectionViewport {
  width: number;
  height: number;
}

export interface PlaywrightInspectionRequest {
  url: string;
  timeoutMs?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  viewports?: InspectionViewport[];
  checks?: InspectionCheck[];
  screenshotDirectory?: string;
  reportPath?: string;
  captureDom?: boolean;
  maxDomCharacters?: number;
  executablePath?: string;
}

export interface InspectionCheckResult {
  selector: string;
  passed: boolean;
  details?: string;
}

export interface PlaywrightInspectionResult {
  ok: boolean;
  url: string;
  title?: string;
  status?: number;
  durationMs: number;
  errors: InspectionError[];
  logs: InspectionLog[];
  checks: InspectionCheckResult[];
  screenshots: string[];
  reportPath?: string;
  domSnapshot?: string;
}
