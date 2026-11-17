import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticateLuthRequest, getLuthSession } from "./luthSession.js";

describe("Luth/guest authentication boundary", () => {
  afterEach(() => vi.restoreAllMocks());

  it("rejects a guest credential before protected-route Luth authentication", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = new Request("https://app.example/api/private", {
      headers: { "x-skipo-guest-lease": "opaque-guest-credential" },
    });

    await expect(authenticateLuthRequest(request)).resolves.toMatchObject({ status: 401 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never forwards the guest lease cookie to Luth", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ authenticated: false }), { status: 401 }),
    );
    const request = new Request("https://app.example/api/private", {
      headers: { cookie: "__Host-skipo_guest=opaque; session=real-session" },
    });

    await expect(getLuthSession(request)).resolves.toBeNull();
    const forwarded = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;
    expect(forwarded.get("cookie")).toBe("session=real-session");
    expect(forwarded.get("cookie")).not.toContain("__Host-skipo_guest");
  });

  it("does not let a guest cookie block a real Luth session cookie", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        authenticated: true,
        user: { id: "user-1" },
        session: { id: "session-1" },
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const request = new Request("https://app.example/api/private", {
      headers: { cookie: "__Host-skipo_guest=opaque; session=real-session" },
    });

    await expect(authenticateLuthRequest(request)).resolves.toMatchObject({ request: expect.any(Request) });
  });
});
