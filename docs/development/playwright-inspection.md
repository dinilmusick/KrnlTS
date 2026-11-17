# Playwright browser inspection

The browser inspector is a Node.js engineering service. Keep it in the server, CI, or agent process; do not import it into a browser UI bundle.

## Install the optional browser engine

```sh
npm install --save-dev playwright
npx playwright install chromium
```

## Inspect a running preview

```ts
import { PlaywrightInspectionRuntime } from '@ultrst-armada/kloks/browser-inspection';

const inspector = new PlaywrightInspectionRuntime();
const report = await inspector.inspect({
  url: process.env.PREVIEW_URL!,
  waitUntil: 'networkidle',
  timeoutMs: 15000,
  viewports: [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ],
  checks: [
    { selector: '#app', visible: true },
    { selector: 'main', visible: true },
  ],
  captureDom: true,
});

if (!report.ok) {
  console.error(JSON.stringify(report.errors, null, 2));
  process.exitCode = 1;
}
```

## Captured evidence

Every inspection writes a JSON report and screenshots. By default they are stored under `artifacts/playwright/<inspection-start-time>/`. Set `reportPath` or `screenshotDirectory` to choose explicit locations.

The report includes:
- Browser console messages, including errors, warnings, logs and source locations.
- Uncaught page exceptions.
- Failed network requests and HTTP responses with status 400 or higher.
- Navigation failures, browser crashes and unexpected dialogs.
- Selector assertion and interaction failures.
- Broken image assets and horizontal overflow at each configured viewport.
- Page title, final URL, navigation status and elapsed time.
- Desktop/mobile screenshots and an optional bounded HTML DOM snapshot.

An inspection is successful only when no captured errors or failed checks remain. A clean build is not a substitute for this browser-level result.
