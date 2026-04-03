# Krnl JS Core Library (vNext)

Krnl now supports a **locality-first entity model**:

- `LocalFunctionality` owns state, helpers, API logic, emitters, lifecycle hooks.
- `RemoteFunctionality` is a **pure proxy** that forwards calls to a target entity's local functionality.
- `Entity` composes `{ localFunctionalities ∪ remoteFunctionalities }`.

## Descriptor Purity Policy

- Entity files and functionality descriptor files are **assembly-only**.
- Runtime logic must live only in:
  - `main_function/`
  - `helper_functions/`
  - `events/`
  - library files
- Runtime data/state definitions must live only in:
  - `state_data/`
  - library files
- Each functionality has one state per entity instance (no multi-state functionality mode).
- Entity classes define `Singleton` (`true` default) to control whether an owner can create multiple instances.

## Install

```bash
npm install git+https://github.com/Krnl-JS/KrnlJS.git
```

## Quick start

```js
import {
  krnlEntityBase,
  krnlRemoteFunctionality,
} from "krnl-js";
import { timesTwoAtom } from "./functionalities/timesTwo/timesTwo.js"; // descriptor-only file

const mathEntityFactory = () => {
  const entity = new krnlEntityBase("MathEntity");
  entity.addLocal(timesTwoAtom);
  return entity;
};

const mathEntity = mathEntityFactory();
const gateway = new krnlEntityBase("GatewayEntity");
gateway.addRemote(new krnlRemoteFunctionality({
  id: "timesTwoRemote",
  targetEntity: mathEntity,
  targetFunction: "timesTwo",
}));

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

- `krnl/docs/Guide.md`
- `krnl/docs/doc.md`
- `krnl/docs/example_architecture.md`
- `examples/doc.md`
