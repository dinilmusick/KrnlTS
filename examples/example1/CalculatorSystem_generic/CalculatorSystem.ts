import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { EventEmitter } from 'events';
// CalculatorSystem/CalculatorSystem.js

import { CalculatorAtom } from "./functionalities/Calculator/Calculator.js";
import { DisplayEntity } from "./entities/Display/Display.js";
import { LoggerEntity } from "./entities/Logger/Logger.js";
export class CalculatorSystem {
  constructor(port = 10091, options = {}) {
    this.app = express();
    this.emitter = new EventEmitter();
    this._server = null;
    this._port = 3000;
    this.interface = {
      getEmitter: id => ({
        id: id,
        subscribe: fn => this.emitter.on(id, fn),
        subscribeTo: (emitter, fn) => emitter.on(fn),
        on: fn => this.emitter.on(id, fn)
      }),
      getCollector: id => ({
        subscribeTo: (emitterObj, fn) => emitterObj.on(fn ?? (msg => this.call(id, msg)))
      })
    };
    this._port = port;
    this.app.post("/call/Calculator", async (req, res) => {
      try {
        const result = await CalculatorAtom.api(req.body, {
          state: this._state_Calculator,
          emitters: this.emitter,
          functionality: {
            id: "Calculator"
          }
        });
        res.json({
          status: "success",
          payload: result
        });
      } catch (err) {
        res.status(500).json({
          status: "error",
          message: err.message
        });
      }
    });
    const display = new DisplayEntity();
    const logger = new LoggerEntity();
    // 3. LOCAL WIRING (Same System)
    // Here, multiple entities subscribe to the same output
    const calcEmitter = this.interface.getEmitter("Calculator:onCalculated");

    // Wire Display component
    display.interface.getCollector("show").subscribeTo(calcEmitter, msg => {
      if (msg.data.status === "complete") {
        display.call("show", msg.data.formatted);
      }
    });

    // Wire Logger component
    logger.interface.getCollector("Audit").subscribeTo(calcEmitter);

    // 4. DEMONSTRATE PROXIED STATE OBSERVABILITY
    // Whenever 'state.lastResult' is changed in Calculator logic, 
    // a 'state:changed' event is automatically emitted.
    const stateEmitter = this.interface.getEmitter("Calculator:state:changed");
    stateEmitter.subscribe(msg => {
      console.log(`[STATE_OBSERVER] Property '${msg.data.prop}' changed to: ${msg.data.value}`);
    });

    // this.startDiscovery().then(() => {
    //     console.log(`[CalculatorSystem] Ready. Local components (Display, Logger) wired.`);
    // });
  }
  async start(port?) {
    const p = port ?? this._port;
    this.app.use(express.json());
    this._server = createServer(this.app);
    await new Promise(resolve => this._server.listen(p, resolve));
    console.log(`[GenericServer] Listening on port ${p}`);
  }
  stop() {
    return new Promise((resolve, reject) => {
      if (!this._server) {
        resolve(undefined);
      }
      this._server.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  }
  async call(fid, data) {
    if (typeof this[fid] === "function") {
      return this[fid](data);
    }
    return undefined;
  }
  [key: string]: any;
  app: any;
  emitter: any;
  _server: any;
  _port: any;
  interface: any;
  static Singleton = true;
}

// new CalculatorSystem();