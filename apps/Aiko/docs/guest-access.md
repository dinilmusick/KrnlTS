# Aiko Guest Access

Aiko guest access is normal application access in a reduced state with no persistent workspace.

## Architecture

- **Reduced State**: Guest users access the normal application UI without requiring authentication or account creation.
- **No Persistent Workspace**: Ephemeral in-memory state is maintained for the session only; changes are not persisted to database or storage vaults.
- **Pure Client Transition**: Activated exclusively via the "Continue as Guest" action on the authentication screen.
- **No Separate UIs or Endpoints**: There are no separate guest UI pages, no Durable Objects, and no custom backend lease databases.
- **Environment Invariant**: Requires no extra deployment environment variables or custom bindings.

