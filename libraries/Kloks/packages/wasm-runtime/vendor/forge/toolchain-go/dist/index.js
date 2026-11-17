export const descriptor = deepFreeze({
  "schema": "wasm-oj-v2/toolchain-package",
  "id": "go",
  "version": "1.26.5",
  "wasmOjContract": 2,
  "languages": [
    "go"
  ],
  "profiles": [
    {
      "language": "go",
      "target": "wasip1",
      "optimization": "debug"
    },
    {
      "language": "go",
      "target": "wasip1",
      "optimization": "release"
    }
  ],
  "assets": [
    {
      "path": "/toolchains/go-1.26.5-wasip1.manifest.json",
      "bytes": 67888,
      "sha256": "5d784e9ca640b9525e84b598c0beb97ca110ae908568ca45f6441a441d99a262",
      "exportPath": "./assets/go-1.26.5-wasip1.manifest.json"
    },
    {
      "path": "/toolchains/go-1.26.5-wasip1.stdlib.gz.bin",
      "bytes": 29300578,
      "sha256": "aeffc384fdc624544f174ba5fc3c22395717fdbc3c4387d677d20855b6be80d8",
      "exportPath": "./assets/go-1.26.5-wasip1.stdlib.gz.bin"
    },
    {
      "path": "/toolchains/go-1.26.5-wasip1.webc.gz.bin",
      "bytes": 12412445,
      "sha256": "70a7e359884b09b2e1a622d6ac5cd6e31c334aab519e6dd80dff5e040a9e09e4",
      "exportPath": "./assets/go-1.26.5-wasip1.webc.gz.bin"
    }
  ]
});

export function browserSource(baseUrl) {
  return Object.freeze({ kind: "browser", descriptor, baseUrl: normalizeBrowserBaseUrl(baseUrl) });
}

export function serverSource() {
  return Object.freeze({ kind: "server", descriptor, directory: new URL("../assets/", import.meta.url) });
}

function normalizeBrowserBaseUrl(value) {
  if (typeof value !== "string" || !value || value !== value.trim() || value.length > 4096 || value.startsWith("//") || value.includes("#")) {
    throw new TypeError("Toolchain baseUrl must be a non-empty absolute or root-relative URL without a fragment.");
  }
  let url;
  if (value.startsWith("/")) url = new URL(value, "https://wasm-oj.invalid/");
  else {
    try { url = new URL(value); } catch {
      throw new TypeError("Toolchain baseUrl must be absolute or root-relative.");
    }
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("Toolchain baseUrl must use HTTP or HTTPS.");
  }
  if (url.username || url.password) throw new TypeError("Toolchain baseUrl must not contain credentials.");
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  if (value.startsWith("/")) return `${url.pathname}${url.search}`;
  return url.href;
}

function deepFreeze(value) {
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
