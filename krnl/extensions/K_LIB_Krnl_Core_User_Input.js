//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Core_User_Input.js
 * @description A common library component for handling user inputs (keyboard, mouse)
 * and emitting them via the Krnl messaging system.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL USER INPUT COMPONENT //////////////////////////////////////
/**
 * A reusable component that translates browser-level input events into
 * Krnl emitter data streams.
 */
export class krnlUserInputComponent {
  /**
   * @param {object} ownerEntity - The Krnl entity this component is attached to.
   * @param {string} emitterName - The name of the emitter to create on the entity's interface.
   */
  constructor(ownerEntity, emitterName = "UserInputOut") {
    this.ownerEntity = ownerEntity;
    this.emitterName = emitterName;
    this.emitter = this.ownerEntity.interface.createEmitter(this.emitterName);
    this.isListening = false;

    // Bound handlers for easy addition/removal
    this._onKeyDown = (e) => this._emit("keydown", { key: e.key, code: e.code, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey });
    this._onKeyUp = (e) => this._emit("keyup", { key: e.key, code: e.code, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey });
    this._onMouseDown = (e) => this._emit("mousedown", { button: e.button, x: e.clientX, y: e.clientY });
    this._onMouseUp = (e) => this._emit("mouseup", { button: e.button, x: e.clientX, y: e.clientY });
    this._onMouseMove = (e) => this._emit("mousemove", { x: e.clientX, y: e.clientY });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// INPUT EMISSION ///////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Helper to push data to the emitter.
   */
  _emit(type, data) {
    if (!this.isListening) return;
    this.emitter.pushDataStreamToEmitter({ type, ...data });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// LISTENING OPERATIONS /////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Starts listening for window-level input events.
   */
  startListening() {
    if (this.isListening) return;
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mouseup", this._onMouseUp);
    window.addEventListener("mousemove", this._onMouseMove);
    this.isListening = true;
    console.log(`[${this.ownerEntity.entityName}] UserInputComponent: Listening started.`);
  }

  /**
   * Stops listening for window-level input events.
   */
  stopListening() {
    if (!this.isListening) return;
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("mouseup", this._onMouseUp);
    window.removeEventListener("mousemove", this._onMouseMove);
    this.isListening = false;
    console.log(`[${this.ownerEntity.entityName}] UserInputComponent: Listening stopped.`);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSAL /////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Cleans up resources.
   */
  dispose() {
    this.stopListening();
  }
}
