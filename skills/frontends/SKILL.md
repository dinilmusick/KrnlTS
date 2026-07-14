---
name: krnlts-frontends
description: Reference for the default dynamic admin frontend driven by getEndpointDefinitions, and custom Vite/Next.js frontend adapter registration.
---

# KrnlTS Frontend & UI Integration

KrnlTS incorporates an automatic developer control panel and a proxy-routing module for custom web applications (Vite, React, Next.js, etc.).

## 1. The Default Developer Control Panel
By default, each KrnlTS system entity serves a reactive admin control panel dashboard. 

> [!IMPORTANT]
> The admin dashboard is **fully dynamic**. It does NOT read a static `manifest.json`. Instead, it retrieves state details by calling the `/api/getEndpointDefinitions` API and polls this route every 5 seconds to support hot-reloaded code adjustments.

### Key Features of the Control Panel:
*   **Endpoint Segregation**: Automatically groups endpoints in the sidebar:
    *   **App Endpoints**: Actual API functions of the sub-app. These can be customized during runtime.
    *   **System Endpoints**: Core KrnlTS management functions (collapsible, read-only).
*   **Runtime Definition Editor**: Allows developers or orchestrator agents to live-update app endpoints. Edits to descriptions, custom system instructions prompts, watch variables, and intelligence spec requirement levels are stored inside the runtime database via `POST /api/setEndpointDefinition`.
*   **Interactive Call Forms**: Auto-generates form controls matching the endpoint's input schema structure, allowing instant testing.
*   **Telemetry log Reader**: Fetches and lists latency, success status, and AI execution traces via `POST /api/getTelemetryLog`.

---

## 2. Custom Frontends Registration
To serve bespoke UIs (Vite, Next.js, or static HTML layouts) alongside your backend endpoints without starting separate servers or running into CORS issues:
1.  Place the frontend package folder inside the `frontends/` directory at the root of the app.
2.  Name the subdirectory using the routing path prefix you want to expose (e.g. `frontends/dashboard/` will route to `/frontend/dashboard/`).
3.  Each custom frontend adapter extends `KrnlFrontendAdapter` or `KrnlBlockContainerAdapter` inside a descriptor configuration file.
4.  At boot, `KrnlMagneticLoader` automatically detects the frontend folder, spawns its dev server (if running in dev mode) or registers its build assets path, and reverse-proxies all incoming requests under `/frontend/{name}/*` through the main gateway process.

### Custom Frontend Configuration Example:
```typescript
import { KrnlFrontendAdapter } from "krnlts";

export class DashboardFrontend extends KrnlFrontendAdapter {
  constructor() {
    super({
      name: "dashboard",
      targetDevUrl: "http://localhost:5173", // Vite dev server URL
      productionBuildPath: "./dist/client"    // Production assets location
    });
  }
}
```
Inside the custom UI script, proxy API calls back to the KrnlTS endpoints by simply referencing the parent relative path `/api/{endpointId}` (or `/auth/api/{endpointId}` if hosted under a Gateway Ingress Network member).
