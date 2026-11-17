# Floks service UI surfaces

The service UI is split into independent reusable surfaces exported from `@ultrst-armada/floks/ui/services` (or the `@floks/ui/services` workspace subpath).

## Clock

`ClockServicePanel` receives a clock snapshot and explicit lifecycle/tempo callbacks. It renders running/paused/stopped state, musical bar/beat, tick/subdivision, elapsed time and tempo configuration. It does not instantiate or own the clock.

## MIDI

`MidiServicePanel` receives discovered device metadata and send/receive callbacks. It labels physical devices separately from logical in-process endpoints. Logical endpoint creation does not claim to create OS virtual MIDI ports. Runtime capability flags determine which controls are available.

## OSC

`OscServicePanel` receives client/server endpoint lists, message history and lifecycle/send callbacks. Client configuration and server lifecycle are separate; message argument input is JSON-validated before dispatch.

## Composition

All panels use injected props/callbacks. Floks does not import Kloks backend service implementations, open device handles, bind UDP sockets or create application-specific service state. Skipo applications connect panel callbacks to their own service instances.

The panel contracts intentionally remain transport-agnostic: browser, Node, WebContainer and desktop adapters are composed by the application and passed as callbacks/state. The panels never infer that an endpoint is reachable merely because it is configured.
