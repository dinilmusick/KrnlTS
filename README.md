# KrnlJS Core Library (v1.2.0)

KrnlJS is a senior-level orchestration library for building reactive, distributed JavaScript systems using an **Atomic Entity Model**. It treats software components like physical hardware with isolated logic, state, and messaging ports.

## 🏗️ Core Principles

- **Atomic Scaffolding**: Strict directory-based logic isolation.
- **Descriptor Purity**: Assembly-only descriptors; no loose runtime logic.
- **Implicit Reactivity**: Proxy-based state observability with automatic change events.
- **Transport Agnosticism**: Distributed RPC via `TransportAdapters` (WS, Memory, etc.).
- **Recursive Bubbling**: Component logic automatically promotes to owner interfaces.

## 🚀 Quick Start

### Installation

```bash
npm install git+https://github.com/dinilmusick/KrnlJS.git
```

### Basic Entity Usage

```javascript
import { krnlEntityBase, krnlRemoteFunctionality } from "krnljs";
import { mathAtom } from "./functionalities/Math/Math.js";

// 1. Local Logic
const calc = new krnlEntityBase("Calculator");
calc.addLocal(mathAtom);

// 2. Remote Proxy (In-Memory)
const gateway = new krnlEntityBase("Gateway");
gateway.addRemote({
  id: "CalcProxy",
  targetEntity: calc,
  targetFunction: "Math"
});

// 3. Trigger Logic
const result = await gateway.call("CalcProxy", { a: 10, b: 5, op: "add" });
console.log(result); // 15
```

## 📖 Documentation

For detailed guides on architectural patterns, networking, and advanced features, see:

- [**Main Guide**](src/krnl/docs/Guide.md): The canonical manual for building with KrnlJS.
- [**Changelog**](src/krnl/docs/changelog.md): Version history and migration guides.
- [**Examples & Storybook**](examples/doc.md): Interactive grimoire of runnable exhibits.

## 🛠️ Multi-System Discovery (P2P)

To create a networked system:

```javascript
import { krnlSystemEntityBase } from "krnljs";

export class MySystem extends krnlSystemEntityBase {
    constructor(port = 10091) {
        super("MySystem", null, port);
        
        this.startDiscovery().then(() => {
            console.log("System discovered on the network.");
        });
    }
}
```

## 📜 License
MIT
