# Decentralized Networking Guide

Networking in Krnl is designed to be **observable**, **decoupled**, and **uniform**. In the latest architecture, there is no central hub. Every system is a pluggable block that can find and wire itself to any other block on the network.

---

## 1. Peer-to-Peer Discovery

Every `krnlSystemEntityBase` has a built-in discovery mechanism using **UDP Beacons**.

### How it works:
1.  **Advertising**: When you call `startDiscovery()`, the system begins shouting its name and port to everyone on the local network (LAN).
2.  **Listening**: Simultaneously, it listens for shouts from other Krnl systems.
3.  **Peer Table**: It maintains a local list of all active systems it has heard from.

```javascript
// Start discovery on the default port (10101)
await mySystem.startDiscovery();

// See who else is out there
const peers = mySystem.listPeers(); 
// Returns [{ name: "OtherApp", address: "192.168.1.50:10099", lastSeen: ... }]
```

---

## 2. Introspection (The Manifest)

Before wiring systems, you can "look inside" a remote system to see its available ports. This is called the **Manifest**.

### Input Ports (Can receive data):
- **Collectors**: Continuous data streams.
- **One-Shots**: Request-Response endpoints (Returned Functionalities).

### Output Ports (Can send data):
- **Emitters**: Continuous data broadcasts.
- **Broadcasts**: Event-driven streams.

```javascript
// Ask a remote system for its manifest via RPC
const manifest = await mySystem.commComponent.callWsRpc(peer.address, 'get-manifest');
console.log(manifest.outputs.emitters); // e.g. ["audio-out", "midi-out"]
```

---

## 3. The Wiring Rite

Wiring is the act of connecting an **Output** from one system to an **Input** of another. The `wire()` method abstracts all the WebSocket and RPC logic.

### Mode A: Local Output -> Remote Input
Connect your system's data to a remote consumer.
```javascript
await mySystem.wire("RemoteApp", {
    localOutput: "my-data-out",
    remoteInput: "their-data-in"
});
```

### Mode B: Remote Output -> Local Input
Subscribe your system to a remote producer's data.
```javascript
await mySystem.wire("RemoteApp", {
    remoteOutput: "their-signal",
    localInput: "my-listener"
});
```

---

## 4. Implementation Rules

1.  **Inheritance**: Always extend `krnlSystemEntityBase` for your main system entry.
2.  **Discovery**: Call `startDiscovery()` immediately upon system startup.
3.  **No Raw Sockets**: Never use raw `ws` or `net` modules. Always use `this.commComponent` or `this.wire()`.
4.  **Uniform Ports**: By convention, use the `manifest` to discover port names rather than hardcoding them.

---

## 5. Network Transparency

Because the discovery mechanism uses IP addresses, the code is identical whether the systems are on the **same machine** or **different machines** on the same network. 

- **Local**: Discovery finds `127.0.0.1`.
- **Remote**: Discovery finds `192.168.x.x`.
- **Logic**: Stays exactly the same.
