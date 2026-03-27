//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Backend_Visual_Entity_Base.js
 * @description Shared backend-service entity base for all Krnl services that need
 * visual representation in Brnda and/or Wepr frontends.
 *
 * This class extends krnlEntityBase and adds:
 *  1) Standard Brnda + Wepr visual component state buckets.
 *  2) Uniform outbound visual update emitter.
 *  3) Uniform inbound frontend signal collector.
 *  4) Ready-made returned functionalities to link frontends and sync state over WS RPC.
 */

import { krnlEntityBase } from "../core/K_ENT_Krnl_Entity_Base.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// HELPER FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// LOAD WS CLIENT CTOR ////////////////////////////////////////
let _WsClientCtor = null;
async function loadWsClientCtor() {
  if (_WsClientCtor) return _WsClientCtor;

  // Browser path
  if (typeof WebSocket !== 'undefined') {
    _WsClientCtor = WebSocket;
    return _WsClientCtor;
  }

  // Node path (optional dependency)
  const wsMod = await import('ws');
  _WsClientCtor = wsMod.WebSocket;
  return _WsClientCtor;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// BACKEND VISUAL ENTITY BASE ////////////////////////////////////////
export class krnlBackendVisualEntityBase extends krnlEntityBase {
  /**
   * @param {string} name
   * @param {krnlEntityBase|null} owner
   */
  constructor(name, owner = null) {
    super(name, owner);

    this._realtimeChannels = {
      brnda: null,
      wepr: null,
    };

    this._setupVisualStates();
    this._setupVisualInterface();
    this._setupVisualFunctionalities();
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// VISUAL SETUP /////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  _setupVisualStates() {
    this.stateManager.createState('VisualCore');
    this.stateManager.createState('BrndaComponent');
    this.stateManager.createState('WeprComponent');

    this._setStateObject('VisualCore', {
      id: this.entityName,
      visible: true,
      tags: [],
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      metadata: {},
      lastInboundSignal: null,
      lastOutboundSyncTs: null,
    });

    this._setStateObject('BrndaComponent', {
      enabled: false,
      rpcAddress: null, // e.g. ws://localhost:10001/rpc or localhost:10001/rpc
      worldName: 'DefaultWorld',
      assetType: 'box',
      material: null,
      extra: {},
      spawned: false,
    });

    this._setStateObject('WeprComponent', {
      enabled: false,
      rpcAddress: null,
      sceneName: 'DefaultScene',
      primitiveType: 'card',
      props: {},
      extra: {},
      registered: false,
    });
  }

  _setupVisualInterface() {
    this.interface.createEmitter('VisualRepresentationOut');
    this.interface.createCollector('VisualRepresentationIn');

    const inboundCollector = this.interface.getCollector('VisualRepresentationIn');
    inboundCollector._directHandler = (msg) => {
      this._handleInboundVisualSignal(msg?.data || {});
    };
  }

  _setupVisualFunctionalities() {
    this.returnedFunctionalities.define('setBrndaComponent', (config = {}) => {
      const current = this._getStateObject('BrndaComponent');
      const next = { ...current, ...config };
      this._setStateObject('BrndaComponent', next);
      return next;
    });

    this.returnedFunctionalities.define('setWeprComponent', (config = {}) => {
      const current = this._getStateObject('WeprComponent');
      const next = { ...current, ...config };
      this._setStateObject('WeprComponent', next);
      return next;
    });

    this.returnedFunctionalities.define('setVisualCore', (patch = {}) => {
      const current = this._getStateObject('VisualCore');
      const next = { ...current, ...patch };
      this._setStateObject('VisualCore', next);
      this._emitVisualRepresentationOut();
      return next;
    });

    this.returnedFunctionalities.define('getVisualSnapshot', () => this.getVisualSnapshot());

    this.returnedFunctionalities.define('syncBrnda', async () => this._syncBrnda());
    this.returnedFunctionalities.define('syncWepr', async () => this._syncWepr());

    this.returnedFunctionalities.define('syncAllFrontends', async () => {
      const brnda = await this._syncBrnda();
      const wepr = await this._syncWepr();

      const core = this._getStateObject('VisualCore');
      this._setStateObject('VisualCore', {
        ...core,
        lastOutboundSyncTs: new Date().toISOString(),
      });
      this._emitVisualRepresentationOut();

      return { brnda, wepr };
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// SYNCHRONIZATION AND EMISSION /////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async _syncBrnda() {
    const brnda = this._getStateObject('BrndaComponent');
    if (!brnda.enabled || !brnda.rpcAddress) {
      return { status: 'skipped', reason: 'brnda_not_enabled' };
    }

    const core = this._getStateObject('VisualCore');

    if (!brnda.spawned) {
      await this._rpc(brnda.rpcAddress, 'spawn', {
        id: this.entityName,
        type: brnda.assetType,
        worldName: brnda.worldName,
        position: core.position,
        rotation: core.rotation,
        scale: core.scale,
        material: brnda.material,
        metadata: core.metadata,
        ...brnda.extra,
      });

      this._setStateObject('BrndaComponent', {
        ...brnda,
        spawned: true,
      });
      return { status: 'spawned' };
    }

    await this._rpc(brnda.rpcAddress, 'update', {
      id: this.entityName,
      position: core.position,
      rotation: core.rotation,
      scale: core.scale,
      metadata: core.metadata,
      ...brnda.extra,
    });

    return { status: 'updated' };
  }

  async _syncWepr() {
    const wepr = this._getStateObject('WeprComponent');
    if (!wepr.enabled || !wepr.rpcAddress) {
      return { status: 'skipped', reason: 'wepr_not_enabled' };
    }

    const core = this._getStateObject('VisualCore');

    // Contract for Wepr server-side adapter. When not implemented by server,
    // this returns a normal RPC error to caller.
    const result = await this._rpc(wepr.rpcAddress, 'upsertVisualEntity', {
      id: this.entityName,
      sceneName: wepr.sceneName,
      primitiveType: wepr.primitiveType,
      props: {
        ...wepr.props,
        visible: core.visible,
        position: core.position,
        rotation: core.rotation,
        scale: core.scale,
        metadata: core.metadata,
      },
      ...wepr.extra,
    });

    this._setStateObject('WeprComponent', {
      ...wepr,
      registered: true,
    });
    return result;
  }

  _emitVisualRepresentationOut() {
    const emitter = this.interface.getEmitter('VisualRepresentationOut');
    if (!emitter) return;

    emitter.pushDataStreamToEmitter({
      entityName: this.entityName,
      snapshot: this.getVisualSnapshot(),
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// SIGNAL HANDLING //////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  _handleInboundVisualSignal(signal) {
    const coreNow = this._getStateObject('VisualCore');
    this._setStateObject('VisualCore', {
      ...coreNow,
      lastInboundSignal: {
        at: new Date().toISOString(),
        signal,
      },
    });

    if (signal.corePatch && typeof signal.corePatch === 'object') {
      const current = this._getStateObject('VisualCore');
      this._setStateObject('VisualCore', {
        ...current,
        ...signal.corePatch,
      });
    }

    if (signal.brndaPatch && typeof signal.brndaPatch === 'object') {
      const current = this._getStateObject('BrndaComponent');
      this._setStateObject('BrndaComponent', {
        ...current,
        ...signal.brndaPatch,
      });
    }

    if (signal.weprPatch && typeof signal.weprPatch === 'object') {
      const current = this._getStateObject('WeprComponent');
      this._setStateObject('WeprComponent', {
        ...current,
        ...signal.weprPatch,
      });
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// RPC HELPERS //////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  _normalizeRpcAddress(address) {
    if (!address) throw new Error('RPC address is required');

    // host:port/rpc -> ws://host:port/rpc
    if (!address.startsWith('ws://') && !address.startsWith('wss://')) {
      return `ws://${address}`;
    }

    return address;
  }

  async _rpc(rpcAddress, method, params = {}, timeoutMs = 5000) {
    const url = this._normalizeRpcAddress(rpcAddress);
    const WebSocketCtor = await loadWsClientCtor();

    return new Promise((resolve, reject) => {
      const requestId = `${this.entityName}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const ws = new WebSocketCtor(url);

      const timeoutId = setTimeout(() => {
        try { ws.close(); } catch (_) { }
        reject(new Error(`RPC timeout (${method})`));
      }, timeoutMs);

      ws.onopen = () => {
        ws.send(JSON.stringify({ id: requestId, method, params }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data?.toString?.() ?? event.data);
          if (payload.id !== requestId) return;

          clearTimeout(timeoutId);
          try { ws.close(); } catch (_) { }

          if (payload.ok) resolve(payload.result);
          else reject(new Error(payload.error || `RPC error: ${method}`));
        } catch (e) {
          clearTimeout(timeoutId);
          try { ws.close(); } catch (_) { }
          reject(e);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeoutId);
        try { ws.close(); } catch (_) { }
        reject(new Error(`RPC socket error (${method})`));
      };
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// STATE HELPERS ////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  getVisualSnapshot() {
    return {
      core: this._getStateObject('VisualCore'),
      brnda: this._getStateObject('BrndaComponent'),
      wepr: this._getStateObject('WeprComponent'),
    };
  }

  _setStateObject(stateName, obj) {
    this.stateManager.setStateValue(stateName, 'value', obj);
  }

  _getStateObject(stateName) {
    return this.stateManager.getStateValue(stateName, 'value', {});
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSAL /////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  dispose() {
    for (const channel of Object.values(this._realtimeChannels)) {
      try { channel?.close?.(); } catch (_) { }
    }
    super.dispose();
  }
}
