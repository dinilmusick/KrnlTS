export const descriptor = deepFreeze({
  "schema": "wasm-oj-v2/toolchain-package",
  "id": "rust",
  "version": "1.91.1-dev",
  "wasmOjContract": 2,
  "languages": [
    "rust"
  ],
  "profiles": [
    {
      "language": "rust",
      "target": "wasip1",
      "optimization": "debug"
    },
    {
      "language": "rust",
      "target": "wasip1",
      "optimization": "release"
    }
  ],
  "assets": [
    {
      "path": "/toolchains/rust-1.91.1-dev.manifest.json",
      "bytes": 5974,
      "sha256": "d5bbdca994e61888679c5738cb9420649c0854ed0eb5d65468bc67d5d550bce1",
      "exportPath": "./assets/rust-1.91.1-dev.manifest.json"
    },
    {
      "path": "/toolchains/rust-1.91.1-dev.webc.gz.bin",
      "bytes": 74138827,
      "sha256": "cfbdadc67be1315e735aa55bdf8a5a0d00171982a023fefcf7ba586127753887",
      "exportPath": "./assets/rust-1.91.1-dev.webc.gz.bin"
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
