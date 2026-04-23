# Route Verification Example

Description: Verifies that the Krnl Unified HTTP Adapter correctly handles unknown routes by returning a 404 instead of hanging.

## API List
- /call/:fid (REST)
- /sse/:fid (SSE)
- /mcp (MCP)
- /acp (ACP)
- /manifest (Manifest)
- /any-other-route (Should return 404)

## Examples
- `curl -i http://localhost:10099/invalid-route` -> Expected: 404 Not Found
- `curl -i http://localhost:10099/manifest` -> Expected: 200 OK
