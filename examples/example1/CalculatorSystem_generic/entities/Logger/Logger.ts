import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { EventEmitter } from 'events';
// CalculatorSystem/entities/Logger/Logger.js

import { AuditAtom } from "./functionalities/Audit/Audit.js";
export class LoggerEntity {
  constructor(owner) {
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