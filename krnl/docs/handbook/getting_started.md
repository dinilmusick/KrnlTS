# Krnl vNext Getting Started

## 1) Entity composition

An entity is now explicitly split into:

- `localFunctionalities: Map<FID, LocalFunctionality>`
- `remoteFunctionalities: Map<FID, RemoteFunctionality>`
- `collectors: Set<Collector>`

```js
import { krnlEntityBase, krnlLocalFunctionality } from "../../core/index.js";

const add = new krnlLocalFunctionality({
  id: "add",
  state: { calls: 0 },
  api: (input, ctx) => {
    ctx.state.calls += 1;
    return Number(input.a) + Number(input.b);
  },
});

const calculator = new krnlEntityBase({
  id: "Calculator",
  localFunctionalities: [add],
  remoteFunctionalities: [],
});
```

## 2) Local functionality

`LocalFunctionality` is the full definition:

- mutable `state`
- `api(input, context)`
- `helpers`
- `emitters`
- `collectors`
- lifecycle hooks (`onInit`, `onCall`, `onComplete`, `onError`)

## 3) Remote functionality

`RemoteFunctionality` is a proxy only:

- has `target: { entity, functionality }`
- has no local state/helpers/emitters
- forwards call to target local functionality

```js
import { krnlRemoteFunctionality } from "../../core/index.js";

const addRemote = new krnlRemoteFunctionality({
  id: "addRemote",
  target: {
    entity: () => calculator,
    functionality: "add",
  },
});
```

## 4) Calls

```js
await calculator.call("add", { a: 10, b: 20 });
await gateway.call("addRemote", { a: 1, b: 2 });
```

Resolution order:

1. if `fid` is local → call local API
2. else if `fid` is remote → call proxy API
3. else throw not found

## 5) Event forwarding

Remote functionality can subscribe to target local emitters using `bindEvents()` and route data to collectors.

## 6) Run the live storybook

```bash
python -m http.server 4173
# http://localhost:4173/krnl/examples/storybook/index.html
```

Use storybook as the main website to navigate and run all exhibits.
