# Krnl JS Core Library (vNext)

Krnl now supports a **locality-first entity model**:

- `LocalFunctionality` owns state, helpers, API logic, emitters, lifecycle hooks.
- `RemoteFunctionality` is a **pure proxy** that forwards calls to a target entity's local functionality.
- `Entity` composes `{ localFunctionalities ∪ remoteFunctionalities }`.

## Install

```bash
npm install git+https://github.com/Krnl-JS/KrnlJS.git
```

## Quick start

```js
import {
  krnlEntityBase,
  krnlLocalFunctionality,
  krnlRemoteFunctionality,
  krnlEmitter,
} from "krnl-js";

const mathEntityFactory = () => {
  const timesTwo = new krnlLocalFunctionality({
    id: "timesTwo",
    state: { calls: 0 },
    emitters: { default: new krnlEmitter() },
    api: (input, ctx) => {
      ctx.state.calls += 1;
      const value = Number(input) * 2;
      ctx.emitters.get("default").pushDataStreamToEmitter({ value, calls: ctx.state.calls });
      return value;
    },
  });

  return new krnlEntityBase({
    id: "MathEntity",
    localFunctionalities: [timesTwo],
  });
};

const gateway = new krnlEntityBase({
  id: "GatewayEntity",
  remoteFunctionalities: [
    new krnlRemoteFunctionality({
      id: "timesTwoRemote",
      target: {
        entity: mathEntityFactory,
        functionality: "timesTwo",
      },
    }),
  ],
});

const result = await gateway.call("timesTwoRemote", 21);
console.log(result); // 42
```

## Storybook + exhibits

The examples are designed to run from an HTTP server (module imports will fail on raw `file://` URLs).

```bash
python -m http.server 4173
# then open http://localhost:4173/krnl/examples/storybook/index.html
```

The storybook now acts as the entry point for all exhibits and embeds each exhibit as a live runnable page.

## Docs

- `krnl/docs/handbook/getting_started.md`
- `krnl/docs/handbook/api_reference.md`
- `krnl/examples/doc.md`
