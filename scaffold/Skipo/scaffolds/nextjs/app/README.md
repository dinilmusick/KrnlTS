# Next.js App Router (`app/`)

## Architectural Role
Contains Next.js App Router entry points, layout wrappers, and API route handlers.
- `layout.tsx`: Root HTML shell and design token theme provider.
- `page.tsx`: Authenticated root view delegating to `MainApp`.
- `login/`: Dedicated authentication portal delegating to `UserAuthPage`.
- `api/`: Route handlers delegating directly to `src/backend/AppBackend`.
