import { krnlSystemEntityBase } from "../../../dist/index.js";

/**
 * Exhibit 6:
 * Deterministic availability/discoverability test that avoids UDP-network dependence.
 */
export class AvailabilitySystem extends krnlSystemEntityBase {
  static Singleton = true;
}

// const supervisor = new AvailabilitySystem("SupervisorSystem", null, 10096, "127.0.0.1");
// ... removed embedded runner ...

