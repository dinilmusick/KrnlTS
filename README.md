# Krnl JS Core Library

The foundational library for the Krnl ecosystem. It provides a uniform syntax and API for creating entities, managing state, and communicating across systems.

## Installation

You can install this package directly from GitHub:

```bash
npm install git+https://github.com/Krnl-JS/KrnlJS.git
```

*(Note: Replace the URL with your actual repository URL if it's different.)*

## Usage

### Importing Core Entities

```javascript
import { krnlEntityBase, krnlSystemEntityBase } from 'krnl-js';

const myEntity = new krnlEntityBase("MyEntity");
```

### Messaging & Communication

```javascript
const emitter = myEntity.interface.createEmitter("events");
const collector = myEntity.interface.createCollector("commands");

emitter.pushDataStreamToEmitter({ message: "Hello Krnl!" });
```

## Structure

- **`krnl/core`**: Essential building blocks (Entity, State, Messaging).
- **`krnl/extensions`**: Optional utilities (File system, Discovery, Networking).
- **`krnl/examples`**: Interactive exhibits and storybook (run in browser).

## Documentation

Detailed documentation can be found in `krnl/docs/`.
Explore the **Interactive Grimoire** in `krnl/examples/storybook/index.html`.
