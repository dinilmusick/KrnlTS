import { Entity, krnlUnifiedHttpAdapter } from "../../../dist/index.js";

/**
 * Exhibit 6:
 * Deterministic availability/discoverability test with Gross Architecture Entity.
 */
export class AvailabilitySystem extends Entity {
  static Singleton = true;

  constructor(name = "AvailabilitySystem", owner = null, port = 10097, host = "127.0.0.1") {
    super(name, owner);
    this.attachAdapter(new krnlUnifiedHttpAdapter(this, port, host));
  }
}
