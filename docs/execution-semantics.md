# Kone Execution Semantics

Kone separates four concerns:

1. **Graph definition** — persistent Performance/Song/Section node and edge topology.
2. **Execution runtime** — transient execution instances, branches, lifecycle, completion, failure, cancellation, and parent/child ownership.
3. **Transport** — Section-scoped musical progress and play/pause/stop semantics.
4. **Kloks services** — canonical Clock, MIDI, and OSC infrastructure.

## ExecutionFlow

An incoming `ExecutionFlow` edge means **execute this node now**. Entering a node does not automatically continue downstream execution.

The authoritative sequence is:

`incoming ExecutionFlow → node starts → node executes → node completes → outgoing ExecutionFlow`

A node that is temporal or externally acknowledged remains active until its completion promise resolves.

## Execution instances and branches

Every trigger creates a unique execution instance. Every activated path creates a branch. Branches are independent, so fan-out is concurrent rather than an implicit sequence.

An execution is complete only when no branch remains `RUNNING`, `PAUSED`, or `IDLE`. A failed branch produces `FAILED`; it never becomes successful completion.

Nested execution records parent ownership:

`Performance execution → Song execution → Section execution → action execution`

Child completion is awaited by the parent node before that node emits its downstream ExecutionFlow.

## Selector and Multiplexer

Selector uses the resolved integer `selection` and activates exactly one outgoing socket.

Multiplexer activates every outgoing ExecutionFlow edge. It is fan-out, not sequencing.

Selection is supplied through execution payload or the runtime's `selectionResolver`; the runtime does not decide whether the value came from MIDI, OSC, UI, or another node.

## Lifecycle

Executable instances use:

`IDLE → RUNNING → PAUSED → RUNNING → COMPLETED`

and:

`RUNNING/PAUSED → STOPPED → IDLE`

or:

`RUNNING/PAUSED → FAILED`

`PLAY` on a paused instance resumes. `STOP` cancels active children and temporal controllers, resets the associated transport, and never emits successful completion.

A new trigger creates a new execution instance. Re-triggering does not reuse node IDs as execution identity.

## Section transport

A Section execution may own a Kone transport backed by the canonical Kloks Clock. Child temporal nodes consume that transport.

The runtime owns **what** is executing. The Section transport owns **when musical time advances**.

Pause freezes the Section transport. Resume continues from its current musical position. Stop stops and resets the Section transport.

Songs and Performances do not create a global musical clock.

## Temporal nodes

`createMusicalDurationHandler()` measures musical duration from the Section transport's beat position.

`createClockDurationHandler()` measures elapsed Clock time and is suitable for temporal nodes such as Interlude.

Both expose the same pause/resume/stop controller contract and therefore do not create private timers or clocks.

MIDI Clip handlers can use the musical-duration helper while a separate Kloks MIDI action layer emits MIDI events. MIDI data is never confused with ExecutionFlow.

## External triggers

MIDI and OSC are adapters into one protocol-neutral `ExecutionTriggerBus`.

The runtime does not contain MIDI-device or OSC-transport implementations. Those remain owned by Kloks.

The same graph entry can therefore be triggered by:

- UI/Button
- MIDI input
- OSC input
- parent graph execution
- application/runtime code

## Direct launch

`ExecutionRuntime.trigger(graphId, [nodeId])` intentionally accepts any executable node as an entry point. A performer may launch Song 3 directly without executing earlier Song nodes.

Graph navigation is separate from execution. Opening a Song or Section graph does not trigger it.

## Parent completion

A parent node that launches a child graph stays active until the child execution completes. Successful child completion allows the parent node to complete and activate its outgoing ExecutionFlow.

If the child fails or is stopped, the parent does not silently treat that outcome as successful completion.

## Static duration versus actual completion

Graph definitions may contain derived duration estimates for UI/layout and planning. These estimates never complete execution.

Actual runtime completion is authoritative. Parallel branches overlap; the parent waits for all active branches.

For a Section, a serial chain of time-bearing MIDI nodes therefore has a cumulative estimated duration, while parallel chains overlap. Runtime completion still depends on the actual node lifecycle.

## Architectural invariant

`GRAPH DEFINITION ≠ EXECUTION STATE ≠ TRANSPORT ≠ MIDI/OSC SERVICE`

This boundary is intentional so future scheduling, quantization, looping, count-ins, live editing, audience control, and additional action types can be added without replacing graph execution semantics.
