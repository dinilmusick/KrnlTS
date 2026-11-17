# Floks
This will be the counterpart Kloks but for the frontend components. This will store the canonical frontend elements that we will use in our Skipo projects. 

## FrnlTS architecture

Floks is the canonical concrete frontend element library built on FrnlTS. FrnlTS provides the semantic UI runtime; Floks provides concrete reusable elements and their visual behavior.

- UI Primitive: use for atomic elements such as a simple Button.
- UI Composite: use when an element requires multiple semantic children, Slots, coordinated state, or Flows. Complex Button variants may therefore be composites.
- Shared runtime: Floks UI assets use the canonical FrnlTS Zustand store and Frnl semantic boundaries.

FrnlTS is consumed as the published @dinilmusick/frnlts package. Floks owns the concrete UI vocabulary; FrnlTS owns the semantic model.


## Canonical Luth authentication

Floks authentication is integrated with the public Kloks client facade. Applications configure their Luth ecosystem and application identity; Luth remains the sole identity and session authority.

```tsx
import { LuthAuthPage, LuthProtectedRoute } from '@ultrst-armada/floks/auth';

export function App() {
  return (
    <LuthProtectedRoute
      ecosystemId="your-ecosystem"
      applicationId="your-application"
      appName="Your Application"
      appSubtitle="Sign in to continue"
    >
      {({ user, signOut }) => (
        <main>
          <p>Signed in as {user?.email}</p>
          <button onClick={() => void signOut()}>Sign out</button>
        </main>
      )}
    </LuthProtectedRoute>
  );
}

// For a standalone sign-in page:
export function SignInPage() {
  return (
    <LuthAuthPage
      ecosystemId="your-ecosystem"
      applicationId="your-application"
      appName="Your Application"
    />
  );
}
```

The integrated API provides email login, registration, Google sign-in, session hydration and restoration, focus/online revalidation, logout, error handling, and protected-route gating. Consumers do not receive or persist bearer tokens. The runtime dependency is `@ultrst-armada/kloks`; GutTS is consumed transitively through Kloks.
