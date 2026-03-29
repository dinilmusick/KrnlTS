# Example Architecture: Calculator + Logger

This guide demonstrates building a system where a **Calculator** component automatically promotes its logic to the **MainSystem** owner.

## 1. Define the Calculator Component

```javascript
import { krnlEntityBase } from "krnl/core";

const Calc = new krnlEntityBase("Calculator");

// This logic is PUBLIC and will bubble up to the owner
Calc.addLocal({
  id: "add",
  visibility: "public",
  api: (data) => data.a + data.b
});

// This logic is PRIVATE and stays internal to Calculator
Calc.addLocal({
  id: "internalLog",
  visibility: "private",
  api: (msg) => console.log(`[Calc Internal]: ${msg}`)
});
```

## 2. Define the Main System

```javascript
import { krnlEntityBase } from "krnl/core";

const App = new krnlEntityBase("MainApp");

// 1. Summon the component
const calc = App.hierarchyManager.createComponentEntity("Calculator");

// 2. The 'add' logic is now automatically promoted!
// You can call it directly on the App interface.
const result = await App.call("add", { a: 5, b: 10 });
console.log(result); // 15

// 3. The 'internalLog' is NOT promoted.
// This would throw an error:
// await App.call("internalLog", "hello"); 
```

## 3. Using Multi-State for Callers

```javascript
// Each caller name gets its own isolated state bucket
App.addLocal({
  id: "UserSession",
  stateModel: "multi",
  initialState: { points: 0 },
  api: (input, { state, caller }) => {
    state.points += input;
    return `${caller} has ${state.points} points.`;
  }
});

await App.call("UserSession", 10, { caller: "Alice" }); // Alice has 10 points.
await App.call("UserSession", 5, { caller: "Bob" });   // Bob has 5 points.
await App.call("UserSession", 10, { caller: "Alice" }); // Alice has 20 points.
```
