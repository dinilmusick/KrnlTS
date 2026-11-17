# FrnlWP runtime bridge

FrnlWP keeps the same split as FrnlTS:

- PHP defines semantic component contracts, states, events, themes and flows.
- Browser JavaScript owns interactive runtime state.
- Zustand is the concrete state engine in the browser bundle.
- WordPress only enqueues the generated runtime asset.

Build the browser asset with:

`npm install`
`npm run build`

Do not duplicate state machinery inside Elementor widgets; widgets emit Frnl semantic attributes and consume the shared runtime.
