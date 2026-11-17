var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@neondatabase/serverless/index.mjs
function ha(r) {
  return 0;
}
function Yt(r, e = false) {
  let { protocol: t } = new URL(r), n = "http:" + r.substring(
    t.length
  ), { username: i, password: s, host: o, hostname: u, port: c, pathname: l, search: f, searchParams: y, hash: g } = new URL(
    n
  );
  s = decodeURIComponent(s), i = decodeURIComponent(i), l = decodeURIComponent(l);
  let A = i + ":" + s, C = e ? Object.fromEntries(y.entries()) : f;
  return {
    href: r,
    protocol: t,
    auth: A,
    username: i,
    password: s,
    host: o,
    hostname: u,
    port: c,
    pathname: l,
    search: f,
    query: C,
    hash: g
  };
}
function Xe(r) {
  let e = 1779033703, t = 3144134277, n = 1013904242, i = 2773480762, s = 1359893119, o = 2600822924, u = 528734635, c = 1541459225, l = 0, f = 0, y = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ], g = a((I, w) => I >>> w | I << 32 - w, "rrot"), A = new Uint32Array(64), C = new Uint8Array(64), D = a(() => {
    for (let B = 0, j = 0; B < 16; B++, j += 4) A[B] = C[j] << 24 | C[j + 1] << 16 | C[j + 2] << 8 | C[j + 3];
    for (let B = 16; B < 64; B++) {
      let j = g(A[B - 15], 7) ^ g(A[B - 15], 18) ^ A[B - 15] >>> 3, le = g(
        A[B - 2],
        17
      ) ^ g(A[B - 2], 19) ^ A[B - 2] >>> 10;
      A[B] = A[B - 16] + j + A[B - 7] + le | 0;
    }
    let I = e, w = t, Z = n, W = i, J = s, X = o, se = u, oe = c;
    for (let B = 0; B < 64; B++) {
      let j = g(J, 6) ^ g(J, 11) ^ g(J, 25), le = J & X ^ ~J & se, de = oe + j + le + y[B] + A[B] | 0, We = g(I, 2) ^ g(
        I,
        13
      ) ^ g(I, 22), fe = I & w ^ I & Z ^ w & Z, _e = We + fe | 0;
      oe = se, se = X, X = J, J = W + de | 0, W = Z, Z = w, w = I, I = de + _e | 0;
    }
    e = e + I | 0, t = t + w | 0, n = n + Z | 0, i = i + W | 0, s = s + J | 0, o = o + X | 0, u = u + se | 0, c = c + oe | 0, f = 0;
  }, "process"), Y = a((I) => {
    typeof I == "string" && (I = new TextEncoder().encode(I));
    for (let w = 0; w < I.length; w++) C[f++] = I[w], f === 64 && D();
    l += I.length;
  }, "add"), P = a(() => {
    if (C[f++] = 128, f == 64 && D(), f + 8 > 64) {
      for (; f < 64; ) C[f++] = 0;
      D();
    }
    for (; f < 58; ) C[f++] = 0;
    let I = l * 8;
    C[f++] = I / 1099511627776 & 255, C[f++] = I / 4294967296 & 255, C[f++] = I >>> 24, C[f++] = I >>> 16 & 255, C[f++] = I >>> 8 & 255, C[f++] = I & 255, D();
    let w = new Uint8Array(
      32
    );
    return w[0] = e >>> 24, w[1] = e >>> 16 & 255, w[2] = e >>> 8 & 255, w[3] = e & 255, w[4] = t >>> 24, w[5] = t >>> 16 & 255, w[6] = t >>> 8 & 255, w[7] = t & 255, w[8] = n >>> 24, w[9] = n >>> 16 & 255, w[10] = n >>> 8 & 255, w[11] = n & 255, w[12] = i >>> 24, w[13] = i >>> 16 & 255, w[14] = i >>> 8 & 255, w[15] = i & 255, w[16] = s >>> 24, w[17] = s >>> 16 & 255, w[18] = s >>> 8 & 255, w[19] = s & 255, w[20] = o >>> 24, w[21] = o >>> 16 & 255, w[22] = o >>> 8 & 255, w[23] = o & 255, w[24] = u >>> 24, w[25] = u >>> 16 & 255, w[26] = u >>> 8 & 255, w[27] = u & 255, w[28] = c >>> 24, w[29] = c >>> 16 & 255, w[30] = c >>> 8 & 255, w[31] = c & 255, w;
  }, "digest");
  return r === void 0 ? { add: Y, digest: P } : (Y(r), P());
}
function gu(r) {
  return crypto.getRandomValues(d.alloc(r));
}
function bu(r) {
  if (r === "sha256") return { update: a(function(e) {
    return { digest: a(
      function() {
        return d.from(Xe(e));
      },
      "digest"
    ) };
  }, "update") };
  if (r === "md5") return { update: a(function(e) {
    return {
      digest: a(function() {
        return typeof e == "string" ? et.hashStr(e) : et.hashByteArray(e);
      }, "digest")
    };
  }, "update") };
  throw new Error(`Hash type '${r}' not supported`);
}
function vu(r, e) {
  if (r !== "sha256") throw new Error(`Only sha256 is supported (requested: '${r}')`);
  return { update: a(function(t) {
    return { digest: a(
      function() {
        typeof e == "string" && (e = new TextEncoder().encode(e)), typeof t == "string" && (t = new TextEncoder().encode(
          t
        ));
        let n = e.length;
        if (n > 64) e = Xe(e);
        else if (n < 64) {
          let c = new Uint8Array(64);
          c.set(e), e = c;
        }
        let i = new Uint8Array(
          64
        ), s = new Uint8Array(64);
        for (let c = 0; c < 64; c++) i[c] = 54 ^ e[c], s[c] = 92 ^ e[c];
        let o = new Uint8Array(t.length + 64);
        o.set(i, 0), o.set(t, 64);
        let u = new Uint8Array(96);
        return u.set(s, 0), u.set(Xe(o), 64), d.from(Xe(u));
      },
      "digest"
    ) };
  }, "update") };
}
function ju(...r) {
  return r.join("/");
}
function Hu(r, e) {
  e(new Error("No filesystem"));
}
function $c({ socket: r, servername: e }) {
  return r.startTls(e), r;
}
function Ea(r, { alphabet: e, scratchArr: t } = {}) {
  if (!He) if (He = new Uint16Array(256), wt = new Uint16Array(256), xi) for (let C = 0; C < 256; C++) He[C] = yt[C & 15] << 8 | yt[C >>> 4], wt[C] = mt[C & 15] << 8 | mt[C >>> 4];
  else for (let C = 0; C < 256; C++) He[C] = yt[C & 15] | yt[C >>> 4] << 8, wt[C] = mt[C & 15] | mt[C >>> 4] << 8;
  r.byteOffset % 4 !== 0 && (r = new Uint8Array(r));
  let n = r.length, i = n >>> 1, s = n >>> 2, o = t || new Uint16Array(n), u = new Uint32Array(
    r.buffer,
    r.byteOffset,
    s
  ), c = new Uint32Array(o.buffer, o.byteOffset, i), l = e === "upper" ? wt : He, f = 0, y = 0, g;
  if (xi)
    for (; f < s; ) g = u[f++], c[y++] = l[g >>> 8 & 255] << 16 | l[g & 255], c[y++] = l[g >>> 24] << 16 | l[g >>> 16 & 255];
  else for (; f < s; )
    g = u[f++], c[y++] = l[g >>> 24] << 16 | l[g >>> 16 & 255], c[y++] = l[g >>> 8 & 255] << 16 | l[g & 255];
  for (f <<= 2; f < n; ) o[f] = l[r[f++]];
  return xa.decode(o.subarray(0, n));
}
function Aa(r, e = {}) {
  let t = "", n = r.length, i = va >>> 1, s = Math.ceil(n / i), o = new Uint16Array(s > 1 ? i : n);
  for (let u = 0; u < s; u++) {
    let c = u * i, l = c + i;
    t += Ea(r.subarray(c, l), ba(ga(
      {},
      e
    ), { scratchArr: o }));
  }
  return t;
}
function Ei(r, e = {}) {
  return e.alphabet !== "upper" && typeof r.toHex == "function" ? r.toHex() : Aa(r, e);
}
function bt() {
  typeof window < "u" && typeof document < "u" && typeof console < "u" && typeof console.warn == "function" && console.warn(`          
        ************************************************************
        *                                                          *
        *  WARNING: Running SQL directly from the browser can have *
        *  security implications. Even if your database is         *
        *  protected by Row-Level Security (RLS), use it at your   *
        *  own risk. This approach is great for fast prototyping,  *
        *  but ensure proper safeguards are in place to prevent    *
        *  misuse or execution of expensive SQL queries by your    *
        *  end users.                                              *
        *                                                          *
        *  If you've assessed the risks, suppress this message     *
        *  using the disableWarningInBrowsers configuration        *
        *  parameter.                                              *
        *                                                          *
        ************************************************************`);
}
function Lu(r) {
  return r instanceof d ? "\\x" + Ei(r) : r;
}
function ss(r) {
  let { query: e, params: t } = r instanceof $e ? r.toParameterizedQuery() : r;
  return { query: e, params: t.map((n) => Lu((0, us.prepareValue)(n))) };
}
function cs(r, {
  arrayMode: e,
  fullResults: t,
  fetchOptions: n,
  isolationLevel: i,
  readOnly: s,
  deferrable: o,
  authToken: u,
  disableWarningInBrowsers: c
} = {}) {
  if (!r) throw new Error("No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?");
  let l;
  try {
    l = Yt(r);
  } catch {
    throw new Error(
      "Database connection string provided to `neon()` is not a valid URL. Connection string: " + String(r)
    );
  }
  let { protocol: f, username: y, hostname: g, port: A, pathname: C } = l;
  if (f !== "postgres:" && f !== "postgresql:" || !y || !g || !C) throw new Error("Database connection string format for `neon()` should be: postgresql://user:password@host.tld/dbname?option=value");
  function D(P, ...I) {
    if (!(Array.isArray(P) && Array.isArray(P.raw) && Array.isArray(I))) throw new Error('This function can now be called only as a tagged-template function: sql`SELECT ${value}`, not sql("SELECT $1", [value], options). For a conventional function call with value placeholders ($1, $2, etc.), use sql.query("SELECT $1", [value], options).');
    return new Ce(
      Y,
      new $e(P, I)
    );
  }
  a(D, "templateFn"), D.query = (P, I, w) => new Ce(Y, { query: P, params: I ?? [] }, w), D.unsafe = (P) => new Ge(
    P
  ), D.transaction = async (P, I) => {
    if (typeof P == "function" && (P = P(D)), !Array.isArray(P)) throw new Error(is);
    P.forEach((W) => {
      if (!(W instanceof Ce)) throw new Error(is);
    });
    let w = P.map((W) => W.queryData), Z = P.map((W) => W.opts ?? {});
    return Y(w, Z, I);
  };
  async function Y(P, I, w) {
    let { fetchEndpoint: Z, fetchFunction: W } = ce, J = Array.isArray(
      P
    ) ? { queries: P.map((ee) => ss(ee)) } : ss(P), X = n ?? {}, se = e ?? false, oe = t ?? false, B = i, j = s, le = o;
    w !== void 0 && (w.fetchOptions !== void 0 && (X = { ...X, ...w.fetchOptions }), w.arrayMode !== void 0 && (se = w.arrayMode), w.fullResults !== void 0 && (oe = w.fullResults), w.isolationLevel !== void 0 && (B = w.isolationLevel), w.readOnly !== void 0 && (j = w.readOnly), w.deferrable !== void 0 && (le = w.deferrable)), I !== void 0 && !Array.isArray(I) && I.fetchOptions !== void 0 && (X = { ...X, ...I.fetchOptions });
    let de = u;
    !Array.isArray(I) && I?.authToken !== void 0 && (de = I.authToken);
    let We = typeof Z == "function" ? Z(g, A, { jwtAuth: de !== void 0 }) : Z, fe = { "Neon-Connection-String": r, "Neon-Raw-Text-Output": "true", "Neon-Array-Mode": "true" }, _e = await Fu(de);
    _e && (fe.Authorization = `Bearer ${_e}`), Array.isArray(P) && (B !== void 0 && (fe["Neon-Batch-Isolation-Level"] = B), j !== void 0 && (fe["Neon-Batch-Read-Only"] = String(j)), le !== void 0 && (fe["Neon-Batch-Deferrable"] = String(le))), c || ce.disableWarningInBrowsers || bt();
    let ye;
    try {
      ye = await (W ?? fetch)(We, { method: "POST", body: JSON.stringify(J), headers: fe, ...X });
    } catch (ee) {
      let M = new be(
        `Error connecting to database: ${ee}`
      );
      throw M.sourceError = ee, M;
    }
    if (ye.ok) {
      let ee = await ye.json();
      if (Array.isArray(P)) {
        let M = ee.results;
        if (!Array.isArray(M)) throw new be("Neon internal error: unexpected result format");
        return M.map(($, me) => {
          let Ot = I[me] ?? {}, vo = Ot.arrayMode ?? se, xo = Ot.fullResults ?? oe;
          return os(
            $,
            { arrayMode: vo, fullResults: xo, types: Ot.types }
          );
        });
      } else {
        let M = I ?? {}, $ = M.arrayMode ?? se, me = M.fullResults ?? oe;
        return os(ee, { arrayMode: $, fullResults: me, types: M.types });
      }
    } else {
      let { status: ee } = ye;
      if (ee === 400) {
        let M = await ye.json(), $ = new be(M.message);
        for (let me of Bu) $[me] = M[me] ?? void 0;
        throw $;
      } else {
        let M = await ye.text();
        throw new be(
          `Server error (HTTP status ${ee}): ${M}`
        );
      }
    }
  }
  return a(Y, "execute"), D;
}
function os(r, {
  arrayMode: e,
  fullResults: t,
  types: n
}) {
  let i = new as.default(n), s = r.fields.map((c) => c.name), o = r.fields.map((c) => i.getTypeParser(
    c.dataTypeID
  )), u = e === true ? r.rows.map((c) => c.map((l, f) => l === null ? null : o[f](l))) : r.rows.map((c) => Object.fromEntries(
    c.map((l, f) => [s[f], l === null ? null : o[f](l)])
  ));
  return t ? (r.viaNeonFetch = true, r.rowAsArray = e, r.rows = u, r._parsers = o, r._types = i, r) : u;
}
async function Fu(r) {
  if (typeof r == "string") return r;
  if (typeof r == "function") try {
    return await Promise.resolve(r());
  } catch (e) {
    let t = new be("Error getting auth token.");
    throw e instanceof Error && (t = new be(`Error getting auth token: ${e.message}`)), t;
  }
}
function vl(r, e) {
  if (e) return { callback: e, result: void 0 };
  let t, n, i = a(function(o, u) {
    o ? t(o) : n(u);
  }, "cb"), s = new r(function(o, u) {
    n = o, t = u;
  });
  return { callback: i, result: s };
}
var So, Ie, Eo, Ao, Co, _o, Io, a, G, T, ie, Dn, Se, O, E, Qn, Nn, ii, b, v, x, d, m, p, ge, wi, mi, yi, S, ce, Fe, gi, Zt, tr, rr, Ti, Ri, Fi, Mi, Wi, Hi, Ki, Zi, Je, At, es, U, et, ts, lr, fr, tt, rt, nt, ku, it, ds, mr, wr, gr, br, vr, $u, xr, ys, Er, Sr, ms, vs, Es, Cs, _s, cc, Is, Ps, Rt, Ms, qs, ln, Qs, Ws, js, Gs, vn, Vs, zs, En, eo, io, so, ol, oo, ao, lo, yo, Ln, ot, pa, da, ya, bi, ma, wa, vi, ga, ba, va, xi, xa, Jt, yt, mt, Sa, Si, He, wt, gt, $e, Xt, Ge, as, us, _t, be, is, Bu, dr, Ce, go, wo, kn, ut, bo, Un, ct, export_DatabaseError, export_defaults, export_escapeIdentifier, export_escapeLiteral, export_types;
var init_serverless = __esm({
  "node_modules/@neondatabase/serverless/index.mjs"() {
    So = Object.create;
    Ie = Object.defineProperty;
    Eo = Object.getOwnPropertyDescriptor;
    Ao = Object.getOwnPropertyNames;
    Co = Object.getPrototypeOf;
    _o = Object.prototype.hasOwnProperty;
    Io = (r, e, t) => e in r ? Ie(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t;
    a = (r, e) => Ie(r, "name", { value: e, configurable: true });
    G = (r, e) => () => (r && (e = r(r = 0)), e);
    T = (r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports);
    ie = (r, e) => {
      for (var t in e) Ie(r, t, {
        get: e[t],
        enumerable: true
      });
    };
    Dn = (r, e, t, n) => {
      if (e && typeof e == "object" || typeof e == "function") for (let i of Ao(e)) !_o.call(r, i) && i !== t && Ie(r, i, { get: () => e[i], enumerable: !(n = Eo(e, i)) || n.enumerable });
      return r;
    };
    Se = (r, e, t) => (t = r != null ? So(Co(r)) : {}, Dn(e || !r || !r.__esModule ? Ie(t, "default", { value: r, enumerable: true }) : t, r));
    O = (r) => Dn(Ie({}, "__esModule", { value: true }), r);
    E = (r, e, t) => Io(r, typeof e != "symbol" ? e + "" : e, t);
    Qn = T((lt) => {
      "use strict";
      p();
      lt.byteLength = Po;
      lt.toByteArray = Bo;
      lt.fromByteArray = ko;
      var ae = [], te = [], To = typeof Uint8Array < "u" ? Uint8Array : Array, qt = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      for (Ee = 0, On = qt.length; Ee < On; ++Ee) ae[Ee] = qt[Ee], te[qt.charCodeAt(Ee)] = Ee;
      var Ee, On;
      te[45] = 62;
      te[95] = 63;
      function qn(r) {
        var e = r.length;
        if (e % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
        var t = r.indexOf("=");
        t === -1 && (t = e);
        var n = t === e ? 0 : 4 - t % 4;
        return [t, n];
      }
      a(qn, "getLens");
      function Po(r) {
        var e = qn(r), t = e[0], n = e[1];
        return (t + n) * 3 / 4 - n;
      }
      a(Po, "byteLength");
      function Ro(r, e, t) {
        return (e + t) * 3 / 4 - t;
      }
      a(Ro, "_byteLength");
      function Bo(r) {
        var e, t = qn(r), n = t[0], i = t[1], s = new To(Ro(r, n, i)), o = 0, u = i > 0 ? n - 4 : n, c;
        for (c = 0; c < u; c += 4) e = te[r.charCodeAt(c)] << 18 | te[r.charCodeAt(c + 1)] << 12 | te[r.charCodeAt(c + 2)] << 6 | te[r.charCodeAt(c + 3)], s[o++] = e >> 16 & 255, s[o++] = e >> 8 & 255, s[o++] = e & 255;
        return i === 2 && (e = te[r.charCodeAt(
          c
        )] << 2 | te[r.charCodeAt(c + 1)] >> 4, s[o++] = e & 255), i === 1 && (e = te[r.charCodeAt(c)] << 10 | te[r.charCodeAt(c + 1)] << 4 | te[r.charCodeAt(c + 2)] >> 2, s[o++] = e >> 8 & 255, s[o++] = e & 255), s;
      }
      a(Bo, "toByteArray");
      function Lo(r) {
        return ae[r >> 18 & 63] + ae[r >> 12 & 63] + ae[r >> 6 & 63] + ae[r & 63];
      }
      a(Lo, "tripletToBase64");
      function Fo(r, e, t) {
        for (var n, i = [], s = e; s < t; s += 3) n = (r[s] << 16 & 16711680) + (r[s + 1] << 8 & 65280) + (r[s + 2] & 255), i.push(Lo(n));
        return i.join("");
      }
      a(Fo, "encodeChunk");
      function ko(r) {
        for (var e, t = r.length, n = t % 3, i = [], s = 16383, o = 0, u = t - n; o < u; o += s) i.push(Fo(
          r,
          o,
          o + s > u ? u : o + s
        ));
        return n === 1 ? (e = r[t - 1], i.push(ae[e >> 2] + ae[e << 4 & 63] + "==")) : n === 2 && (e = (r[t - 2] << 8) + r[t - 1], i.push(ae[e >> 10] + ae[e >> 4 & 63] + ae[e << 2 & 63] + "=")), i.join("");
      }
      a(ko, "fromByteArray");
    });
    Nn = T((Qt) => {
      p();
      Qt.read = function(r, e, t, n, i) {
        var s, o, u = i * 8 - n - 1, c = (1 << u) - 1, l = c >> 1, f = -7, y = t ? i - 1 : 0, g = t ? -1 : 1, A = r[e + y];
        for (y += g, s = A & (1 << -f) - 1, A >>= -f, f += u; f > 0; s = s * 256 + r[e + y], y += g, f -= 8) ;
        for (o = s & (1 << -f) - 1, s >>= -f, f += n; f > 0; o = o * 256 + r[e + y], y += g, f -= 8) ;
        if (s === 0) s = 1 - l;
        else {
          if (s === c) return o ? NaN : (A ? -1 : 1) * (1 / 0);
          o = o + Math.pow(2, n), s = s - l;
        }
        return (A ? -1 : 1) * o * Math.pow(2, s - n);
      };
      Qt.write = function(r, e, t, n, i, s) {
        var o, u, c, l = s * 8 - i - 1, f = (1 << l) - 1, y = f >> 1, g = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, A = n ? 0 : s - 1, C = n ? 1 : -1, D = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
        for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (u = isNaN(e) ? 1 : 0, o = f) : (o = Math.floor(Math.log(e) / Math.LN2), e * (c = Math.pow(2, -o)) < 1 && (o--, c *= 2), o + y >= 1 ? e += g / c : e += g * Math.pow(2, 1 - y), e * c >= 2 && (o++, c /= 2), o + y >= f ? (u = 0, o = f) : o + y >= 1 ? (u = (e * c - 1) * Math.pow(2, i), o = o + y) : (u = e * Math.pow(2, y - 1) * Math.pow(2, i), o = 0)); i >= 8; r[t + A] = u & 255, A += C, u /= 256, i -= 8) ;
        for (o = o << i | u, l += i; l > 0; r[t + A] = o & 255, A += C, o /= 256, l -= 8) ;
        r[t + A - C] |= D * 128;
      };
    });
    ii = T((Be) => {
      "use strict";
      p();
      var Nt = Qn(), Pe = Nn(), Wn = typeof Symbol == "function" && typeof Symbol.for == "function" ? /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom") : null;
      Be.Buffer = h;
      Be.SlowBuffer = Qo;
      Be.INSPECT_MAX_BYTES = 50;
      var ft = 2147483647;
      Be.kMaxLength = ft;
      h.TYPED_ARRAY_SUPPORT = Mo();
      !h.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
      function Mo() {
        try {
          let r = new Uint8Array(1), e = { foo: a(function() {
            return 42;
          }, "foo") };
          return Object.setPrototypeOf(e, Uint8Array.prototype), Object.setPrototypeOf(r, e), r.foo() === 42;
        } catch {
          return false;
        }
      }
      a(Mo, "typedArraySupport");
      Object.defineProperty(h.prototype, "parent", { enumerable: true, get: a(function() {
        if (h.isBuffer(this)) return this.buffer;
      }, "get") });
      Object.defineProperty(h.prototype, "offset", { enumerable: true, get: a(function() {
        if (h.isBuffer(
          this
        )) return this.byteOffset;
      }, "get") });
      function he(r) {
        if (r > ft) throw new RangeError('The value "' + r + '" is invalid for option "size"');
        let e = new Uint8Array(r);
        return Object.setPrototypeOf(e, h.prototype), e;
      }
      a(he, "createBuffer");
      function h(r, e, t) {
        if (typeof r == "number") {
          if (typeof e == "string") throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
          return $t(r);
        }
        return Gn(r, e, t);
      }
      a(h, "Buffer");
      h.poolSize = 8192;
      function Gn(r, e, t) {
        if (typeof r == "string") return Do(r, e);
        if (ArrayBuffer.isView(r)) return Oo(r);
        if (r == null) throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof r);
        if (ue(r, ArrayBuffer) || r && ue(r.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (ue(r, SharedArrayBuffer) || r && ue(
          r.buffer,
          SharedArrayBuffer
        ))) return jt(r, e, t);
        if (typeof r == "number") throw new TypeError('The "value" argument must not be of type number. Received type number');
        let n = r.valueOf && r.valueOf();
        if (n != null && n !== r) return h.from(n, e, t);
        let i = qo(r);
        if (i) return i;
        if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof r[Symbol.toPrimitive] == "function") return h.from(r[Symbol.toPrimitive]("string"), e, t);
        throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof r);
      }
      a(Gn, "from");
      h.from = function(r, e, t) {
        return Gn(r, e, t);
      };
      Object.setPrototypeOf(
        h.prototype,
        Uint8Array.prototype
      );
      Object.setPrototypeOf(h, Uint8Array);
      function Vn(r) {
        if (typeof r != "number") throw new TypeError(
          '"size" argument must be of type number'
        );
        if (r < 0) throw new RangeError('The value "' + r + '" is invalid for option "size"');
      }
      a(Vn, "assertSize");
      function Uo(r, e, t) {
        return Vn(r), r <= 0 ? he(r) : e !== void 0 ? typeof t == "string" ? he(r).fill(e, t) : he(r).fill(e) : he(r);
      }
      a(Uo, "alloc");
      h.alloc = function(r, e, t) {
        return Uo(r, e, t);
      };
      function $t(r) {
        return Vn(r), he(r < 0 ? 0 : Gt(r) | 0);
      }
      a($t, "allocUnsafe");
      h.allocUnsafe = function(r) {
        return $t(
          r
        );
      };
      h.allocUnsafeSlow = function(r) {
        return $t(r);
      };
      function Do(r, e) {
        if ((typeof e != "string" || e === "") && (e = "utf8"), !h.isEncoding(e)) throw new TypeError("Unknown encoding: " + e);
        let t = zn(r, e) | 0, n = he(t), i = n.write(
          r,
          e
        );
        return i !== t && (n = n.slice(0, i)), n;
      }
      a(Do, "fromString");
      function Wt(r) {
        let e = r.length < 0 ? 0 : Gt(r.length) | 0, t = he(e);
        for (let n = 0; n < e; n += 1) t[n] = r[n] & 255;
        return t;
      }
      a(Wt, "fromArrayLike");
      function Oo(r) {
        if (ue(r, Uint8Array)) {
          let e = new Uint8Array(r);
          return jt(e.buffer, e.byteOffset, e.byteLength);
        }
        return Wt(r);
      }
      a(Oo, "fromArrayView");
      function jt(r, e, t) {
        if (e < 0 || r.byteLength < e) throw new RangeError('"offset" is outside of buffer bounds');
        if (r.byteLength < e + (t || 0)) throw new RangeError('"length" is outside of buffer bounds');
        let n;
        return e === void 0 && t === void 0 ? n = new Uint8Array(r) : t === void 0 ? n = new Uint8Array(r, e) : n = new Uint8Array(
          r,
          e,
          t
        ), Object.setPrototypeOf(n, h.prototype), n;
      }
      a(jt, "fromArrayBuffer");
      function qo(r) {
        if (h.isBuffer(r)) {
          let e = Gt(r.length) | 0, t = he(e);
          return t.length === 0 || r.copy(t, 0, 0, e), t;
        }
        if (r.length !== void 0) return typeof r.length != "number" || zt(r.length) ? he(0) : Wt(r);
        if (r.type === "Buffer" && Array.isArray(r.data)) return Wt(r.data);
      }
      a(qo, "fromObject");
      function Gt(r) {
        if (r >= ft) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + ft.toString(16) + " bytes");
        return r | 0;
      }
      a(Gt, "checked");
      function Qo(r) {
        return +r != r && (r = 0), h.alloc(+r);
      }
      a(Qo, "SlowBuffer");
      h.isBuffer = a(function(e) {
        return e != null && e._isBuffer === true && e !== h.prototype;
      }, "isBuffer");
      h.compare = a(function(e, t) {
        if (ue(e, Uint8Array) && (e = h.from(e, e.offset, e.byteLength)), ue(t, Uint8Array) && (t = h.from(t, t.offset, t.byteLength)), !h.isBuffer(e) || !h.isBuffer(t)) throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
        if (e === t) return 0;
        let n = e.length, i = t.length;
        for (let s = 0, o = Math.min(n, i); s < o; ++s) if (e[s] !== t[s]) {
          n = e[s], i = t[s];
          break;
        }
        return n < i ? -1 : i < n ? 1 : 0;
      }, "compare");
      h.isEncoding = a(function(e) {
        switch (String(e).toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "latin1":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return true;
          default:
            return false;
        }
      }, "isEncoding");
      h.concat = a(function(e, t) {
        if (!Array.isArray(e)) throw new TypeError(
          '"list" argument must be an Array of Buffers'
        );
        if (e.length === 0) return h.alloc(0);
        let n;
        if (t === void 0)
          for (t = 0, n = 0; n < e.length; ++n) t += e[n].length;
        let i = h.allocUnsafe(t), s = 0;
        for (n = 0; n < e.length; ++n) {
          let o = e[n];
          if (ue(o, Uint8Array)) s + o.length > i.length ? (h.isBuffer(o) || (o = h.from(o)), o.copy(i, s)) : Uint8Array.prototype.set.call(i, o, s);
          else if (h.isBuffer(o)) o.copy(i, s);
          else throw new TypeError('"list" argument must be an Array of Buffers');
          s += o.length;
        }
        return i;
      }, "concat");
      function zn(r, e) {
        if (h.isBuffer(r)) return r.length;
        if (ArrayBuffer.isView(r) || ue(r, ArrayBuffer)) return r.byteLength;
        if (typeof r != "string") throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof r
        );
        let t = r.length, n = arguments.length > 2 && arguments[2] === true;
        if (!n && t === 0) return 0;
        let i = false;
        for (; ; ) switch (e) {
          case "ascii":
          case "latin1":
          case "binary":
            return t;
          case "utf8":
          case "utf-8":
            return Ht(r).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return t * 2;
          case "hex":
            return t >>> 1;
          case "base64":
            return ni(r).length;
          default:
            if (i) return n ? -1 : Ht(r).length;
            e = ("" + e).toLowerCase(), i = true;
        }
      }
      a(zn, "byteLength");
      h.byteLength = zn;
      function No(r, e, t) {
        let n = false;
        if ((e === void 0 || e < 0) && (e = 0), e > this.length || ((t === void 0 || t > this.length) && (t = this.length), t <= 0) || (t >>>= 0, e >>>= 0, t <= e)) return "";
        for (r || (r = "utf8"); ; ) switch (r) {
          case "hex":
            return Zo(this, e, t);
          case "utf8":
          case "utf-8":
            return Yn(this, e, t);
          case "ascii":
            return Ko(this, e, t);
          case "latin1":
          case "binary":
            return Yo(
              this,
              e,
              t
            );
          case "base64":
            return Vo(this, e, t);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return Jo(
              this,
              e,
              t
            );
          default:
            if (n) throw new TypeError("Unknown encoding: " + r);
            r = (r + "").toLowerCase(), n = true;
        }
      }
      a(
        No,
        "slowToString"
      );
      h.prototype._isBuffer = true;
      function Ae(r, e, t) {
        let n = r[e];
        r[e] = r[t], r[t] = n;
      }
      a(Ae, "swap");
      h.prototype.swap16 = a(function() {
        let e = this.length;
        if (e % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
        for (let t = 0; t < e; t += 2) Ae(this, t, t + 1);
        return this;
      }, "swap16");
      h.prototype.swap32 = a(function() {
        let e = this.length;
        if (e % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
        for (let t = 0; t < e; t += 4) Ae(this, t, t + 3), Ae(this, t + 1, t + 2);
        return this;
      }, "swap32");
      h.prototype.swap64 = a(
        function() {
          let e = this.length;
          if (e % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
          for (let t = 0; t < e; t += 8) Ae(this, t, t + 7), Ae(this, t + 1, t + 6), Ae(this, t + 2, t + 5), Ae(this, t + 3, t + 4);
          return this;
        },
        "swap64"
      );
      h.prototype.toString = a(function() {
        let e = this.length;
        return e === 0 ? "" : arguments.length === 0 ? Yn(
          this,
          0,
          e
        ) : No.apply(this, arguments);
      }, "toString");
      h.prototype.toLocaleString = h.prototype.toString;
      h.prototype.equals = a(function(e) {
        if (!h.isBuffer(e)) throw new TypeError("Argument must be a Buffer");
        return this === e ? true : h.compare(this, e) === 0;
      }, "equals");
      h.prototype.inspect = a(function() {
        let e = "", t = Be.INSPECT_MAX_BYTES;
        return e = this.toString("hex", 0, t).replace(/(.{2})/g, "$1 ").trim(), this.length > t && (e += " ... "), "<Buffer " + e + ">";
      }, "inspect");
      Wn && (h.prototype[Wn] = h.prototype.inspect);
      h.prototype.compare = a(function(e, t, n, i, s) {
        if (ue(e, Uint8Array) && (e = h.from(e, e.offset, e.byteLength)), !h.isBuffer(e)) throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof e);
        if (t === void 0 && (t = 0), n === void 0 && (n = e ? e.length : 0), i === void 0 && (i = 0), s === void 0 && (s = this.length), t < 0 || n > e.length || i < 0 || s > this.length) throw new RangeError("out of range index");
        if (i >= s && t >= n) return 0;
        if (i >= s) return -1;
        if (t >= n) return 1;
        if (t >>>= 0, n >>>= 0, i >>>= 0, s >>>= 0, this === e) return 0;
        let o = s - i, u = n - t, c = Math.min(o, u), l = this.slice(
          i,
          s
        ), f = e.slice(t, n);
        for (let y = 0; y < c; ++y) if (l[y] !== f[y]) {
          o = l[y], u = f[y];
          break;
        }
        return o < u ? -1 : u < o ? 1 : 0;
      }, "compare");
      function Kn(r, e, t, n, i) {
        if (r.length === 0) return -1;
        if (typeof t == "string" ? (n = t, t = 0) : t > 2147483647 ? t = 2147483647 : t < -2147483648 && (t = -2147483648), t = +t, zt(t) && (t = i ? 0 : r.length - 1), t < 0 && (t = r.length + t), t >= r.length) {
          if (i) return -1;
          t = r.length - 1;
        } else if (t < 0) if (i) t = 0;
        else return -1;
        if (typeof e == "string" && (e = h.from(
          e,
          n
        )), h.isBuffer(e)) return e.length === 0 ? -1 : jn(r, e, t, n, i);
        if (typeof e == "number") return e = e & 255, typeof Uint8Array.prototype.indexOf == "function" ? i ? Uint8Array.prototype.indexOf.call(r, e, t) : Uint8Array.prototype.lastIndexOf.call(r, e, t) : jn(r, [e], t, n, i);
        throw new TypeError("val must be string, number or Buffer");
      }
      a(Kn, "bidirectionalIndexOf");
      function jn(r, e, t, n, i) {
        let s = 1, o = r.length, u = e.length;
        if (n !== void 0 && (n = String(n).toLowerCase(), n === "ucs2" || n === "ucs-2" || n === "utf16le" || n === "utf-16le")) {
          if (r.length < 2 || e.length < 2) return -1;
          s = 2, o /= 2, u /= 2, t /= 2;
        }
        function c(f, y) {
          return s === 1 ? f[y] : f.readUInt16BE(y * s);
        }
        a(c, "read");
        let l;
        if (i) {
          let f = -1;
          for (l = t; l < o; l++) if (c(r, l) === c(e, f === -1 ? 0 : l - f)) {
            if (f === -1 && (f = l), l - f + 1 === u) return f * s;
          } else f !== -1 && (l -= l - f), f = -1;
        } else for (t + u > o && (t = o - u), l = t; l >= 0; l--) {
          let f = true;
          for (let y = 0; y < u; y++) if (c(r, l + y) !== c(e, y)) {
            f = false;
            break;
          }
          if (f) return l;
        }
        return -1;
      }
      a(jn, "arrayIndexOf");
      h.prototype.includes = a(function(e, t, n) {
        return this.indexOf(
          e,
          t,
          n
        ) !== -1;
      }, "includes");
      h.prototype.indexOf = a(function(e, t, n) {
        return Kn(this, e, t, n, true);
      }, "indexOf");
      h.prototype.lastIndexOf = a(function(e, t, n) {
        return Kn(this, e, t, n, false);
      }, "lastIndexOf");
      function Wo(r, e, t, n) {
        t = Number(t) || 0;
        let i = r.length - t;
        n ? (n = Number(n), n > i && (n = i)) : n = i;
        let s = e.length;
        n > s / 2 && (n = s / 2);
        let o;
        for (o = 0; o < n; ++o) {
          let u = parseInt(e.substr(o * 2, 2), 16);
          if (zt(u)) return o;
          r[t + o] = u;
        }
        return o;
      }
      a(Wo, "hexWrite");
      function jo(r, e, t, n) {
        return ht(Ht(e, r.length - t), r, t, n);
      }
      a(jo, "utf8Write");
      function Ho(r, e, t, n) {
        return ht(ra(e), r, t, n);
      }
      a(
        Ho,
        "asciiWrite"
      );
      function $o(r, e, t, n) {
        return ht(ni(e), r, t, n);
      }
      a($o, "base64Write");
      function Go(r, e, t, n) {
        return ht(
          na(e, r.length - t),
          r,
          t,
          n
        );
      }
      a(Go, "ucs2Write");
      h.prototype.write = a(function(e, t, n, i) {
        if (t === void 0) i = "utf8", n = this.length, t = 0;
        else if (n === void 0 && typeof t == "string") i = t, n = this.length, t = 0;
        else if (isFinite(t))
          t = t >>> 0, isFinite(n) ? (n = n >>> 0, i === void 0 && (i = "utf8")) : (i = n, n = void 0);
        else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
        let s = this.length - t;
        if ((n === void 0 || n > s) && (n = s), e.length > 0 && (n < 0 || t < 0) || t > this.length) throw new RangeError("Attempt to write outside buffer bounds");
        i || (i = "utf8");
        let o = false;
        for (; ; ) switch (i) {
          case "hex":
            return Wo(this, e, t, n);
          case "utf8":
          case "utf-8":
            return jo(this, e, t, n);
          case "ascii":
          case "latin1":
          case "binary":
            return Ho(this, e, t, n);
          case "base64":
            return $o(this, e, t, n);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return Go(this, e, t, n);
          default:
            if (o) throw new TypeError("Unknown encoding: " + i);
            i = ("" + i).toLowerCase(), o = true;
        }
      }, "write");
      h.prototype.toJSON = a(function() {
        return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
      }, "toJSON");
      function Vo(r, e, t) {
        return e === 0 && t === r.length ? Nt.fromByteArray(r) : Nt.fromByteArray(r.slice(e, t));
      }
      a(Vo, "base64Slice");
      function Yn(r, e, t) {
        t = Math.min(r.length, t);
        let n = [], i = e;
        for (; i < t; ) {
          let s = r[i], o = null, u = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1;
          if (i + u <= t) {
            let c, l, f, y;
            switch (u) {
              case 1:
                s < 128 && (o = s);
                break;
              case 2:
                c = r[i + 1], (c & 192) === 128 && (y = (s & 31) << 6 | c & 63, y > 127 && (o = y));
                break;
              case 3:
                c = r[i + 1], l = r[i + 2], (c & 192) === 128 && (l & 192) === 128 && (y = (s & 15) << 12 | (c & 63) << 6 | l & 63, y > 2047 && (y < 55296 || y > 57343) && (o = y));
                break;
              case 4:
                c = r[i + 1], l = r[i + 2], f = r[i + 3], (c & 192) === 128 && (l & 192) === 128 && (f & 192) === 128 && (y = (s & 15) << 18 | (c & 63) << 12 | (l & 63) << 6 | f & 63, y > 65535 && y < 1114112 && (o = y));
            }
          }
          o === null ? (o = 65533, u = 1) : o > 65535 && (o -= 65536, n.push(o >>> 10 & 1023 | 55296), o = 56320 | o & 1023), n.push(o), i += u;
        }
        return zo(n);
      }
      a(Yn, "utf8Slice");
      var Hn = 4096;
      function zo(r) {
        let e = r.length;
        if (e <= Hn) return String.fromCharCode.apply(String, r);
        let t = "", n = 0;
        for (; n < e; ) t += String.fromCharCode.apply(String, r.slice(n, n += Hn));
        return t;
      }
      a(zo, "decodeCodePointsArray");
      function Ko(r, e, t) {
        let n = "";
        t = Math.min(r.length, t);
        for (let i = e; i < t; ++i) n += String.fromCharCode(r[i] & 127);
        return n;
      }
      a(Ko, "asciiSlice");
      function Yo(r, e, t) {
        let n = "";
        t = Math.min(r.length, t);
        for (let i = e; i < t; ++i) n += String.fromCharCode(r[i]);
        return n;
      }
      a(Yo, "latin1Slice");
      function Zo(r, e, t) {
        let n = r.length;
        (!e || e < 0) && (e = 0), (!t || t < 0 || t > n) && (t = n);
        let i = "";
        for (let s = e; s < t; ++s) i += ia[r[s]];
        return i;
      }
      a(Zo, "hexSlice");
      function Jo(r, e, t) {
        let n = r.slice(e, t), i = "";
        for (let s = 0; s < n.length - 1; s += 2) i += String.fromCharCode(n[s] + n[s + 1] * 256);
        return i;
      }
      a(Jo, "utf16leSlice");
      h.prototype.slice = a(function(e, t) {
        let n = this.length;
        e = ~~e, t = t === void 0 ? n : ~~t, e < 0 ? (e += n, e < 0 && (e = 0)) : e > n && (e = n), t < 0 ? (t += n, t < 0 && (t = 0)) : t > n && (t = n), t < e && (t = e);
        let i = this.subarray(e, t);
        return Object.setPrototypeOf(i, h.prototype), i;
      }, "slice");
      function q(r, e, t) {
        if (r % 1 !== 0 || r < 0) throw new RangeError("offset is not uint");
        if (r + e > t) throw new RangeError("Trying to access beyond buffer length");
      }
      a(q, "checkOffset");
      h.prototype.readUintLE = h.prototype.readUIntLE = a(
        function(e, t, n) {
          e = e >>> 0, t = t >>> 0, n || q(e, t, this.length);
          let i = this[e], s = 1, o = 0;
          for (; ++o < t && (s *= 256); ) i += this[e + o] * s;
          return i;
        },
        "readUIntLE"
      );
      h.prototype.readUintBE = h.prototype.readUIntBE = a(function(e, t, n) {
        e = e >>> 0, t = t >>> 0, n || q(
          e,
          t,
          this.length
        );
        let i = this[e + --t], s = 1;
        for (; t > 0 && (s *= 256); ) i += this[e + --t] * s;
        return i;
      }, "readUIntBE");
      h.prototype.readUint8 = h.prototype.readUInt8 = a(
        function(e, t) {
          return e = e >>> 0, t || q(e, 1, this.length), this[e];
        },
        "readUInt8"
      );
      h.prototype.readUint16LE = h.prototype.readUInt16LE = a(function(e, t) {
        return e = e >>> 0, t || q(
          e,
          2,
          this.length
        ), this[e] | this[e + 1] << 8;
      }, "readUInt16LE");
      h.prototype.readUint16BE = h.prototype.readUInt16BE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 2, this.length), this[e] << 8 | this[e + 1];
      }, "readUInt16BE");
      h.prototype.readUint32LE = h.prototype.readUInt32LE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + this[e + 3] * 16777216;
      }, "readUInt32LE");
      h.prototype.readUint32BE = h.prototype.readUInt32BE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), this[e] * 16777216 + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]);
      }, "readUInt32BE");
      h.prototype.readBigUInt64LE = we(a(function(e) {
        e = e >>> 0, Re(e, "offset");
        let t = this[e], n = this[e + 7];
        (t === void 0 || n === void 0) && je(e, this.length - 8);
        let i = t + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24, s = this[++e] + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + n * 2 ** 24;
        return BigInt(i) + (BigInt(s) << BigInt(32));
      }, "readBigUInt64LE"));
      h.prototype.readBigUInt64BE = we(a(function(e) {
        e = e >>> 0, Re(e, "offset");
        let t = this[e], n = this[e + 7];
        (t === void 0 || n === void 0) && je(e, this.length - 8);
        let i = t * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e], s = this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + n;
        return (BigInt(i) << BigInt(
          32
        )) + BigInt(s);
      }, "readBigUInt64BE"));
      h.prototype.readIntLE = a(function(e, t, n) {
        e = e >>> 0, t = t >>> 0, n || q(
          e,
          t,
          this.length
        );
        let i = this[e], s = 1, o = 0;
        for (; ++o < t && (s *= 256); ) i += this[e + o] * s;
        return s *= 128, i >= s && (i -= Math.pow(2, 8 * t)), i;
      }, "readIntLE");
      h.prototype.readIntBE = a(function(e, t, n) {
        e = e >>> 0, t = t >>> 0, n || q(e, t, this.length);
        let i = t, s = 1, o = this[e + --i];
        for (; i > 0 && (s *= 256); ) o += this[e + --i] * s;
        return s *= 128, o >= s && (o -= Math.pow(2, 8 * t)), o;
      }, "readIntBE");
      h.prototype.readInt8 = a(function(e, t) {
        return e = e >>> 0, t || q(e, 1, this.length), this[e] & 128 ? (255 - this[e] + 1) * -1 : this[e];
      }, "readInt8");
      h.prototype.readInt16LE = a(function(e, t) {
        e = e >>> 0, t || q(
          e,
          2,
          this.length
        );
        let n = this[e] | this[e + 1] << 8;
        return n & 32768 ? n | 4294901760 : n;
      }, "readInt16LE");
      h.prototype.readInt16BE = a(function(e, t) {
        e = e >>> 0, t || q(e, 2, this.length);
        let n = this[e + 1] | this[e] << 8;
        return n & 32768 ? n | 4294901760 : n;
      }, "readInt16BE");
      h.prototype.readInt32LE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24;
      }, "readInt32LE");
      h.prototype.readInt32BE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3];
      }, "readInt32BE");
      h.prototype.readBigInt64LE = we(a(function(e) {
        e = e >>> 0, Re(e, "offset");
        let t = this[e], n = this[e + 7];
        (t === void 0 || n === void 0) && je(e, this.length - 8);
        let i = this[e + 4] + this[e + 5] * 2 ** 8 + this[e + 6] * 2 ** 16 + (n << 24);
        return (BigInt(i) << BigInt(
          32
        )) + BigInt(t + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24);
      }, "readBigInt64LE"));
      h.prototype.readBigInt64BE = we(a(function(e) {
        e = e >>> 0, Re(e, "offset");
        let t = this[e], n = this[e + 7];
        (t === void 0 || n === void 0) && je(e, this.length - 8);
        let i = (t << 24) + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e];
        return (BigInt(i) << BigInt(32)) + BigInt(
          this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + n
        );
      }, "readBigInt64BE"));
      h.prototype.readFloatLE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), Pe.read(this, e, true, 23, 4);
      }, "readFloatLE");
      h.prototype.readFloatBE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), Pe.read(this, e, false, 23, 4);
      }, "readFloatBE");
      h.prototype.readDoubleLE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 8, this.length), Pe.read(this, e, true, 52, 8);
      }, "readDoubleLE");
      h.prototype.readDoubleBE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 8, this.length), Pe.read(
          this,
          e,
          false,
          52,
          8
        );
      }, "readDoubleBE");
      function V(r, e, t, n, i, s) {
        if (!h.isBuffer(r)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (e > i || e < s) throw new RangeError('"value" argument is out of bounds');
        if (t + n > r.length) throw new RangeError("Index out of range");
      }
      a(V, "checkInt");
      h.prototype.writeUintLE = h.prototype.writeUIntLE = a(function(e, t, n, i) {
        if (e = +e, t = t >>> 0, n = n >>> 0, !i) {
          let u = Math.pow(2, 8 * n) - 1;
          V(
            this,
            e,
            t,
            n,
            u,
            0
          );
        }
        let s = 1, o = 0;
        for (this[t] = e & 255; ++o < n && (s *= 256); ) this[t + o] = e / s & 255;
        return t + n;
      }, "writeUIntLE");
      h.prototype.writeUintBE = h.prototype.writeUIntBE = a(function(e, t, n, i) {
        if (e = +e, t = t >>> 0, n = n >>> 0, !i) {
          let u = Math.pow(2, 8 * n) - 1;
          V(this, e, t, n, u, 0);
        }
        let s = n - 1, o = 1;
        for (this[t + s] = e & 255; --s >= 0 && (o *= 256); ) this[t + s] = e / o & 255;
        return t + n;
      }, "writeUIntBE");
      h.prototype.writeUint8 = h.prototype.writeUInt8 = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 1, 255, 0), this[t] = e & 255, t + 1;
      }, "writeUInt8");
      h.prototype.writeUint16LE = h.prototype.writeUInt16LE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 2, 65535, 0), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
      }, "writeUInt16LE");
      h.prototype.writeUint16BE = h.prototype.writeUInt16BE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 2, 65535, 0), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
      }, "writeUInt16BE");
      h.prototype.writeUint32LE = h.prototype.writeUInt32LE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(
          this,
          e,
          t,
          4,
          4294967295,
          0
        ), this[t + 3] = e >>> 24, this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = e & 255, t + 4;
      }, "writeUInt32LE");
      h.prototype.writeUint32BE = h.prototype.writeUInt32BE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(
          this,
          e,
          t,
          4,
          4294967295,
          0
        ), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
      }, "writeUInt32BE");
      function Zn(r, e, t, n, i) {
        ri(e, n, i, r, t, 7);
        let s = Number(e & BigInt(4294967295));
        r[t++] = s, s = s >> 8, r[t++] = s, s = s >> 8, r[t++] = s, s = s >> 8, r[t++] = s;
        let o = Number(e >> BigInt(32) & BigInt(4294967295));
        return r[t++] = o, o = o >> 8, r[t++] = o, o = o >> 8, r[t++] = o, o = o >> 8, r[t++] = o, t;
      }
      a(Zn, "wrtBigUInt64LE");
      function Jn(r, e, t, n, i) {
        ri(e, n, i, r, t, 7);
        let s = Number(e & BigInt(4294967295));
        r[t + 7] = s, s = s >> 8, r[t + 6] = s, s = s >> 8, r[t + 5] = s, s = s >> 8, r[t + 4] = s;
        let o = Number(e >> BigInt(32) & BigInt(4294967295));
        return r[t + 3] = o, o = o >> 8, r[t + 2] = o, o = o >> 8, r[t + 1] = o, o = o >> 8, r[t] = o, t + 8;
      }
      a(Jn, "wrtBigUInt64BE");
      h.prototype.writeBigUInt64LE = we(a(function(e, t = 0) {
        return Zn(this, e, t, BigInt(0), BigInt("0xffffffffffffffff"));
      }, "writeBigUInt64LE"));
      h.prototype.writeBigUInt64BE = we(a(function(e, t = 0) {
        return Jn(this, e, t, BigInt(0), BigInt(
          "0xffffffffffffffff"
        ));
      }, "writeBigUInt64BE"));
      h.prototype.writeIntLE = a(function(e, t, n, i) {
        if (e = +e, t = t >>> 0, !i) {
          let c = Math.pow(2, 8 * n - 1);
          V(this, e, t, n, c - 1, -c);
        }
        let s = 0, o = 1, u = 0;
        for (this[t] = e & 255; ++s < n && (o *= 256); )
          e < 0 && u === 0 && this[t + s - 1] !== 0 && (u = 1), this[t + s] = (e / o >> 0) - u & 255;
        return t + n;
      }, "writeIntLE");
      h.prototype.writeIntBE = a(function(e, t, n, i) {
        if (e = +e, t = t >>> 0, !i) {
          let c = Math.pow(2, 8 * n - 1);
          V(this, e, t, n, c - 1, -c);
        }
        let s = n - 1, o = 1, u = 0;
        for (this[t + s] = e & 255; --s >= 0 && (o *= 256); ) e < 0 && u === 0 && this[t + s + 1] !== 0 && (u = 1), this[t + s] = (e / o >> 0) - u & 255;
        return t + n;
      }, "writeIntBE");
      h.prototype.writeInt8 = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 1, 127, -128), e < 0 && (e = 255 + e + 1), this[t] = e & 255, t + 1;
      }, "writeInt8");
      h.prototype.writeInt16LE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 2, 32767, -32768), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
      }, "writeInt16LE");
      h.prototype.writeInt16BE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 2, 32767, -32768), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
      }, "writeInt16BE");
      h.prototype.writeInt32LE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(
          this,
          e,
          t,
          4,
          2147483647,
          -2147483648
        ), this[t] = e & 255, this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24, t + 4;
      }, "writeInt32LE");
      h.prototype.writeInt32BE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(
          this,
          e,
          t,
          4,
          2147483647,
          -2147483648
        ), e < 0 && (e = 4294967295 + e + 1), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
      }, "writeInt32BE");
      h.prototype.writeBigInt64LE = we(a(function(e, t = 0) {
        return Zn(this, e, t, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      }, "writeBigInt64LE"));
      h.prototype.writeBigInt64BE = we(
        a(function(e, t = 0) {
          return Jn(this, e, t, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
        }, "writeBigInt64BE")
      );
      function Xn(r, e, t, n, i, s) {
        if (t + n > r.length) throw new RangeError("Index out of range");
        if (t < 0) throw new RangeError("Index out of range");
      }
      a(Xn, "checkIEEE754");
      function ei(r, e, t, n, i) {
        return e = +e, t = t >>> 0, i || Xn(r, e, t, 4, 34028234663852886e22, -34028234663852886e22), Pe.write(r, e, t, n, 23, 4), t + 4;
      }
      a(
        ei,
        "writeFloat"
      );
      h.prototype.writeFloatLE = a(function(e, t, n) {
        return ei(this, e, t, true, n);
      }, "writeFloatLE");
      h.prototype.writeFloatBE = a(function(e, t, n) {
        return ei(this, e, t, false, n);
      }, "writeFloatBE");
      function ti(r, e, t, n, i) {
        return e = +e, t = t >>> 0, i || Xn(r, e, t, 8, 17976931348623157e292, -17976931348623157e292), Pe.write(
          r,
          e,
          t,
          n,
          52,
          8
        ), t + 8;
      }
      a(ti, "writeDouble");
      h.prototype.writeDoubleLE = a(function(e, t, n) {
        return ti(this, e, t, true, n);
      }, "writeDoubleLE");
      h.prototype.writeDoubleBE = a(function(e, t, n) {
        return ti(this, e, t, false, n);
      }, "writeDoubleBE");
      h.prototype.copy = a(function(e, t, n, i) {
        if (!h.isBuffer(e)) throw new TypeError("argument should be a Buffer");
        if (n || (n = 0), !i && i !== 0 && (i = this.length), t >= e.length && (t = e.length), t || (t = 0), i > 0 && i < n && (i = n), i === n || e.length === 0 || this.length === 0) return 0;
        if (t < 0) throw new RangeError("targetStart out of bounds");
        if (n < 0 || n >= this.length) throw new RangeError("Index out of range");
        if (i < 0) throw new RangeError("sourceEnd out of bounds");
        i > this.length && (i = this.length), e.length - t < i - n && (i = e.length - t + n);
        let s = i - n;
        return this === e && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(t, n, i) : Uint8Array.prototype.set.call(e, this.subarray(n, i), t), s;
      }, "copy");
      h.prototype.fill = a(function(e, t, n, i) {
        if (typeof e == "string") {
          if (typeof t == "string" ? (i = t, t = 0, n = this.length) : typeof n == "string" && (i = n, n = this.length), i !== void 0 && typeof i != "string") throw new TypeError("encoding must be a string");
          if (typeof i == "string" && !h.isEncoding(i)) throw new TypeError(
            "Unknown encoding: " + i
          );
          if (e.length === 1) {
            let o = e.charCodeAt(0);
            (i === "utf8" && o < 128 || i === "latin1") && (e = o);
          }
        } else typeof e == "number" ? e = e & 255 : typeof e == "boolean" && (e = Number(e));
        if (t < 0 || this.length < t || this.length < n) throw new RangeError("Out of range index");
        if (n <= t) return this;
        t = t >>> 0, n = n === void 0 ? this.length : n >>> 0, e || (e = 0);
        let s;
        if (typeof e == "number") for (s = t; s < n; ++s) this[s] = e;
        else {
          let o = h.isBuffer(e) ? e : h.from(
            e,
            i
          ), u = o.length;
          if (u === 0) throw new TypeError('The value "' + e + '" is invalid for argument "value"');
          for (s = 0; s < n - t; ++s) this[s + t] = o[s % u];
        }
        return this;
      }, "fill");
      var Te = {};
      function Vt(r, e, t) {
        var n;
        Te[r] = (n = class extends t {
          constructor() {
            super(), Object.defineProperty(this, "message", { value: e.apply(this, arguments), writable: true, configurable: true }), this.name = `${this.name} [${r}]`, this.stack, delete this.name;
          }
          get code() {
            return r;
          }
          set code(s) {
            Object.defineProperty(
              this,
              "code",
              { configurable: true, enumerable: true, value: s, writable: true }
            );
          }
          toString() {
            return `${this.name} [${r}]: ${this.message}`;
          }
        }, a(n, "NodeError"), n);
      }
      a(Vt, "E");
      Vt("ERR_BUFFER_OUT_OF_BOUNDS", function(r) {
        return r ? `${r} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
      }, RangeError);
      Vt(
        "ERR_INVALID_ARG_TYPE",
        function(r, e) {
          return `The "${r}" argument must be of type number. Received type ${typeof e}`;
        },
        TypeError
      );
      Vt("ERR_OUT_OF_RANGE", function(r, e, t) {
        let n = `The value of "${r}" is out of range.`, i = t;
        return Number.isInteger(t) && Math.abs(t) > 2 ** 32 ? i = $n(String(t)) : typeof t == "bigint" && (i = String(
          t
        ), (t > BigInt(2) ** BigInt(32) || t < -(BigInt(2) ** BigInt(32))) && (i = $n(i)), i += "n"), n += ` It must be ${e}. Received ${i}`, n;
      }, RangeError);
      function $n(r) {
        let e = "", t = r.length, n = r[0] === "-" ? 1 : 0;
        for (; t >= n + 4; t -= 3) e = `_${r.slice(t - 3, t)}${e}`;
        return `${r.slice(0, t)}${e}`;
      }
      a($n, "addNumericalSeparator");
      function Xo(r, e, t) {
        Re(e, "offset"), (r[e] === void 0 || r[e + t] === void 0) && je(e, r.length - (t + 1));
      }
      a(Xo, "checkBounds");
      function ri(r, e, t, n, i, s) {
        if (r > t || r < e) {
          let o = typeof e == "bigint" ? "n" : "", u;
          throw s > 3 ? e === 0 || e === BigInt(0) ? u = `>= 0${o} and < 2${o} ** ${(s + 1) * 8}${o}` : u = `>= -(2${o} ** ${(s + 1) * 8 - 1}${o}) and < 2 ** ${(s + 1) * 8 - 1}${o}` : u = `>= ${e}${o} and <= ${t}${o}`, new Te.ERR_OUT_OF_RANGE("value", u, r);
        }
        Xo(n, i, s);
      }
      a(ri, "checkIntBI");
      function Re(r, e) {
        if (typeof r != "number") throw new Te.ERR_INVALID_ARG_TYPE(e, "number", r);
      }
      a(Re, "validateNumber");
      function je(r, e, t) {
        throw Math.floor(r) !== r ? (Re(r, t), new Te.ERR_OUT_OF_RANGE(t || "offset", "an integer", r)) : e < 0 ? new Te.ERR_BUFFER_OUT_OF_BOUNDS() : new Te.ERR_OUT_OF_RANGE(t || "offset", `>= ${t ? 1 : 0} and <= ${e}`, r);
      }
      a(je, "boundsError");
      var ea = /[^+/0-9A-Za-z-_]/g;
      function ta(r) {
        if (r = r.split("=")[0], r = r.trim().replace(ea, ""), r.length < 2) return "";
        for (; r.length % 4 !== 0; ) r = r + "=";
        return r;
      }
      a(ta, "base64clean");
      function Ht(r, e) {
        e = e || 1 / 0;
        let t, n = r.length, i = null, s = [];
        for (let o = 0; o < n; ++o) {
          if (t = r.charCodeAt(o), t > 55295 && t < 57344) {
            if (!i) {
              if (t > 56319) {
                (e -= 3) > -1 && s.push(239, 191, 189);
                continue;
              } else if (o + 1 === n) {
                (e -= 3) > -1 && s.push(239, 191, 189);
                continue;
              }
              i = t;
              continue;
            }
            if (t < 56320) {
              (e -= 3) > -1 && s.push(239, 191, 189), i = t;
              continue;
            }
            t = (i - 55296 << 10 | t - 56320) + 65536;
          } else i && (e -= 3) > -1 && s.push(239, 191, 189);
          if (i = null, t < 128) {
            if ((e -= 1) < 0) break;
            s.push(t);
          } else if (t < 2048) {
            if ((e -= 2) < 0) break;
            s.push(t >> 6 | 192, t & 63 | 128);
          } else if (t < 65536) {
            if ((e -= 3) < 0) break;
            s.push(t >> 12 | 224, t >> 6 & 63 | 128, t & 63 | 128);
          } else if (t < 1114112) {
            if ((e -= 4) < 0) break;
            s.push(t >> 18 | 240, t >> 12 & 63 | 128, t >> 6 & 63 | 128, t & 63 | 128);
          } else throw new Error("Invalid code point");
        }
        return s;
      }
      a(Ht, "utf8ToBytes");
      function ra(r) {
        let e = [];
        for (let t = 0; t < r.length; ++t) e.push(r.charCodeAt(t) & 255);
        return e;
      }
      a(
        ra,
        "asciiToBytes"
      );
      function na(r, e) {
        let t, n, i, s = [];
        for (let o = 0; o < r.length && !((e -= 2) < 0); ++o) t = r.charCodeAt(
          o
        ), n = t >> 8, i = t % 256, s.push(i), s.push(n);
        return s;
      }
      a(na, "utf16leToBytes");
      function ni(r) {
        return Nt.toByteArray(
          ta(r)
        );
      }
      a(ni, "base64ToBytes");
      function ht(r, e, t, n) {
        let i;
        for (i = 0; i < n && !(i + t >= e.length || i >= r.length); ++i)
          e[i + t] = r[i];
        return i;
      }
      a(ht, "blitBuffer");
      function ue(r, e) {
        return r instanceof e || r != null && r.constructor != null && r.constructor.name != null && r.constructor.name === e.name;
      }
      a(ue, "isInstance");
      function zt(r) {
        return r !== r;
      }
      a(zt, "numberIsNaN");
      var ia = (function() {
        let r = "0123456789abcdef", e = new Array(256);
        for (let t = 0; t < 16; ++t) {
          let n = t * 16;
          for (let i = 0; i < 16; ++i) e[n + i] = r[t] + r[i];
        }
        return e;
      })();
      function we(r) {
        return typeof BigInt > "u" ? sa : r;
      }
      a(we, "defineBigIntMethod");
      function sa() {
        throw new Error("BigInt not supported");
      }
      a(sa, "BufferBigIntNotDefined");
    });
    p = G(() => {
      "use strict";
      b = globalThis, v = globalThis.setImmediate ?? ((r) => setTimeout(r, 0)), x = globalThis.clearImmediate ?? ((r) => clearTimeout(r)), d = typeof globalThis.Buffer == "function" && typeof globalThis.Buffer.allocUnsafe == "function" ? globalThis.Buffer : ii().Buffer, m = globalThis.process ?? {};
      m.env ?? (m.env = {});
      try {
        m.nextTick(() => {
        });
      } catch {
        let e = Promise.resolve();
        m.nextTick = e.then.bind(e);
      }
    });
    ge = T((Bl, Kt) => {
      "use strict";
      p();
      var Le = typeof Reflect == "object" ? Reflect : null, si = Le && typeof Le.apply == "function" ? Le.apply : a(function(e, t, n) {
        return Function.prototype.apply.call(e, t, n);
      }, "ReflectApply"), pt;
      Le && typeof Le.ownKeys == "function" ? pt = Le.ownKeys : Object.getOwnPropertySymbols ? pt = a(function(e) {
        return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
      }, "ReflectOwnKeys") : pt = a(function(e) {
        return Object.getOwnPropertyNames(e);
      }, "ReflectOwnKeys");
      function oa(r) {
        console && console.warn && console.warn(r);
      }
      a(
        oa,
        "ProcessEmitWarning"
      );
      var ai = Number.isNaN || a(function(e) {
        return e !== e;
      }, "NumberIsNaN");
      function R() {
        R.init.call(this);
      }
      a(R, "EventEmitter");
      Kt.exports = R;
      Kt.exports.once = la;
      R.EventEmitter = R;
      R.prototype._events = void 0;
      R.prototype._eventsCount = 0;
      R.prototype._maxListeners = void 0;
      var oi = 10;
      function dt(r) {
        if (typeof r != "function") throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof r);
      }
      a(dt, "checkListener");
      Object.defineProperty(R, "defaultMaxListeners", { enumerable: true, get: a(function() {
        return oi;
      }, "get"), set: a(
        function(r) {
          if (typeof r != "number" || r < 0 || ai(r)) throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + r + ".");
          oi = r;
        },
        "set"
      ) });
      R.init = function() {
        (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
      };
      R.prototype.setMaxListeners = a(function(e) {
        if (typeof e != "number" || e < 0 || ai(e)) throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
        return this._maxListeners = e, this;
      }, "setMaxListeners");
      function ui(r) {
        return r._maxListeners === void 0 ? R.defaultMaxListeners : r._maxListeners;
      }
      a(ui, "_getMaxListeners");
      R.prototype.getMaxListeners = a(function() {
        return ui(this);
      }, "getMaxListeners");
      R.prototype.emit = a(function(e) {
        for (var t = [], n = 1; n < arguments.length; n++) t.push(arguments[n]);
        var i = e === "error", s = this._events;
        if (s !== void 0) i = i && s.error === void 0;
        else if (!i) return false;
        if (i) {
          var o;
          if (t.length > 0 && (o = t[0]), o instanceof Error) throw o;
          var u = new Error("Unhandled error." + (o ? " (" + o.message + ")" : ""));
          throw u.context = o, u;
        }
        var c = s[e];
        if (c === void 0) return false;
        if (typeof c == "function") si(c, this, t);
        else for (var l = c.length, f = pi(c, l), n = 0; n < l; ++n) si(f[n], this, t);
        return true;
      }, "emit");
      function ci(r, e, t, n) {
        var i, s, o;
        if (dt(
          t
        ), s = r._events, s === void 0 ? (s = r._events = /* @__PURE__ */ Object.create(null), r._eventsCount = 0) : (s.newListener !== void 0 && (r.emit("newListener", e, t.listener ? t.listener : t), s = r._events), o = s[e]), o === void 0) o = s[e] = t, ++r._eventsCount;
        else if (typeof o == "function" ? o = s[e] = n ? [t, o] : [o, t] : n ? o.unshift(t) : o.push(t), i = ui(r), i > 0 && o.length > i && !o.warned) {
          o.warned = true;
          var u = new Error("Possible EventEmitter memory leak detected. " + o.length + " " + String(e) + " listeners added. Use emitter.setMaxListeners() to increase limit");
          u.name = "MaxListenersExceededWarning", u.emitter = r, u.type = e, u.count = o.length, oa(u);
        }
        return r;
      }
      a(ci, "_addListener");
      R.prototype.addListener = a(function(e, t) {
        return ci(this, e, t, false);
      }, "addListener");
      R.prototype.on = R.prototype.addListener;
      R.prototype.prependListener = a(function(e, t) {
        return ci(this, e, t, true);
      }, "prependListener");
      function aa() {
        if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
      }
      a(aa, "onceWrapper");
      function li(r, e, t) {
        var n = {
          fired: false,
          wrapFn: void 0,
          target: r,
          type: e,
          listener: t
        }, i = aa.bind(n);
        return i.listener = t, n.wrapFn = i, i;
      }
      a(li, "_onceWrap");
      R.prototype.once = a(function(e, t) {
        return dt(t), this.on(e, li(this, e, t)), this;
      }, "once");
      R.prototype.prependOnceListener = a(function(e, t) {
        return dt(t), this.prependListener(e, li(this, e, t)), this;
      }, "prependOnceListener");
      R.prototype.removeListener = a(function(e, t) {
        var n, i, s, o, u;
        if (dt(t), i = this._events, i === void 0) return this;
        if (n = i[e], n === void 0) return this;
        if (n === t || n.listener === t) --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete i[e], i.removeListener && this.emit("removeListener", e, n.listener || t));
        else if (typeof n != "function") {
          for (s = -1, o = n.length - 1; o >= 0; o--) if (n[o] === t || n[o].listener === t) {
            u = n[o].listener, s = o;
            break;
          }
          if (s < 0) return this;
          s === 0 ? n.shift() : ua(n, s), n.length === 1 && (i[e] = n[0]), i.removeListener !== void 0 && this.emit("removeListener", e, u || t);
        }
        return this;
      }, "removeListener");
      R.prototype.off = R.prototype.removeListener;
      R.prototype.removeAllListeners = a(function(e) {
        var t, n, i;
        if (n = this._events, n === void 0) return this;
        if (n.removeListener === void 0) return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : n[e] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete n[e]), this;
        if (arguments.length === 0) {
          var s = Object.keys(n), o;
          for (i = 0; i < s.length; ++i) o = s[i], o !== "removeListener" && this.removeAllListeners(
            o
          );
          return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
        }
        if (t = n[e], typeof t == "function") this.removeListener(e, t);
        else if (t !== void 0) for (i = t.length - 1; i >= 0; i--) this.removeListener(e, t[i]);
        return this;
      }, "removeAllListeners");
      function fi(r, e, t) {
        var n = r._events;
        if (n === void 0) return [];
        var i = n[e];
        return i === void 0 ? [] : typeof i == "function" ? t ? [i.listener || i] : [i] : t ? ca(i) : pi(i, i.length);
      }
      a(fi, "_listeners");
      R.prototype.listeners = a(function(e) {
        return fi(this, e, true);
      }, "listeners");
      R.prototype.rawListeners = a(function(e) {
        return fi(this, e, false);
      }, "rawListeners");
      R.listenerCount = function(r, e) {
        return typeof r.listenerCount == "function" ? r.listenerCount(e) : hi.call(r, e);
      };
      R.prototype.listenerCount = hi;
      function hi(r) {
        var e = this._events;
        if (e !== void 0) {
          var t = e[r];
          if (typeof t == "function")
            return 1;
          if (t !== void 0) return t.length;
        }
        return 0;
      }
      a(hi, "listenerCount");
      R.prototype.eventNames = a(function() {
        return this._eventsCount > 0 ? pt(this._events) : [];
      }, "eventNames");
      function pi(r, e) {
        for (var t = new Array(e), n = 0; n < e; ++n) t[n] = r[n];
        return t;
      }
      a(pi, "arrayClone");
      function ua(r, e) {
        for (; e + 1 < r.length; e++) r[e] = r[e + 1];
        r.pop();
      }
      a(ua, "spliceOne");
      function ca(r) {
        for (var e = new Array(r.length), t = 0; t < e.length; ++t) e[t] = r[t].listener || r[t];
        return e;
      }
      a(ca, "unwrapListeners");
      function la(r, e) {
        return new Promise(function(t, n) {
          function i(o) {
            r.removeListener(e, s), n(o);
          }
          a(i, "errorListener");
          function s() {
            typeof r.removeListener == "function" && r.removeListener("error", i), t([].slice.call(arguments));
          }
          a(s, "resolver"), di(r, e, s, { once: true }), e !== "error" && fa(r, i, { once: true });
        });
      }
      a(la, "once");
      function fa(r, e, t) {
        typeof r.on == "function" && di(r, "error", e, t);
      }
      a(
        fa,
        "addErrorHandlerIfEventEmitter"
      );
      function di(r, e, t, n) {
        if (typeof r.on == "function") n.once ? r.once(e, t) : r.on(e, t);
        else if (typeof r.addEventListener == "function") r.addEventListener(e, a(function i(s) {
          n.once && r.removeEventListener(e, i), t(s);
        }, "wrapListener"));
        else throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof r);
      }
      a(di, "eventTargetAgnosticAddListener");
    });
    wi = {};
    ie(wi, { Socket: () => ce, isIP: () => ha });
    Fe = G(() => {
      "use strict";
      p();
      mi = Se(ge(), 1);
      a(ha, "isIP");
      yi = /^[^.]+\./, S = class S2 extends mi.EventEmitter {
        constructor() {
          super(...arguments);
          E(this, "opts", {});
          E(this, "connecting", false);
          E(this, "pending", true);
          E(
            this,
            "writable",
            true
          );
          E(this, "encrypted", false);
          E(this, "authorized", false);
          E(this, "destroyed", false);
          E(this, "ws", null);
          E(this, "writeBuffer");
          E(this, "tlsState", 0);
          E(this, "tlsRead");
          E(this, "tlsWrite");
        }
        static get poolQueryViaFetch() {
          return S2.opts.poolQueryViaFetch ?? S2.defaults.poolQueryViaFetch;
        }
        static set poolQueryViaFetch(t) {
          S2.opts.poolQueryViaFetch = t;
        }
        static get fetchEndpoint() {
          return S2.opts.fetchEndpoint ?? S2.defaults.fetchEndpoint;
        }
        static set fetchEndpoint(t) {
          S2.opts.fetchEndpoint = t;
        }
        static get fetchConnectionCache() {
          return true;
        }
        static set fetchConnectionCache(t) {
          console.warn("The `fetchConnectionCache` option is deprecated (now always `true`)");
        }
        static get fetchFunction() {
          return S2.opts.fetchFunction ?? S2.defaults.fetchFunction;
        }
        static set fetchFunction(t) {
          S2.opts.fetchFunction = t;
        }
        static get webSocketConstructor() {
          return S2.opts.webSocketConstructor ?? S2.defaults.webSocketConstructor;
        }
        static set webSocketConstructor(t) {
          S2.opts.webSocketConstructor = t;
        }
        get webSocketConstructor() {
          return this.opts.webSocketConstructor ?? S2.webSocketConstructor;
        }
        set webSocketConstructor(t) {
          this.opts.webSocketConstructor = t;
        }
        static get wsProxy() {
          return S2.opts.wsProxy ?? S2.defaults.wsProxy;
        }
        static set wsProxy(t) {
          S2.opts.wsProxy = t;
        }
        get wsProxy() {
          return this.opts.wsProxy ?? S2.wsProxy;
        }
        set wsProxy(t) {
          this.opts.wsProxy = t;
        }
        static get coalesceWrites() {
          return S2.opts.coalesceWrites ?? S2.defaults.coalesceWrites;
        }
        static set coalesceWrites(t) {
          S2.opts.coalesceWrites = t;
        }
        get coalesceWrites() {
          return this.opts.coalesceWrites ?? S2.coalesceWrites;
        }
        set coalesceWrites(t) {
          this.opts.coalesceWrites = t;
        }
        static get useSecureWebSocket() {
          return S2.opts.useSecureWebSocket ?? S2.defaults.useSecureWebSocket;
        }
        static set useSecureWebSocket(t) {
          S2.opts.useSecureWebSocket = t;
        }
        get useSecureWebSocket() {
          return this.opts.useSecureWebSocket ?? S2.useSecureWebSocket;
        }
        set useSecureWebSocket(t) {
          this.opts.useSecureWebSocket = t;
        }
        static get forceDisablePgSSL() {
          return S2.opts.forceDisablePgSSL ?? S2.defaults.forceDisablePgSSL;
        }
        static set forceDisablePgSSL(t) {
          S2.opts.forceDisablePgSSL = t;
        }
        get forceDisablePgSSL() {
          return this.opts.forceDisablePgSSL ?? S2.forceDisablePgSSL;
        }
        set forceDisablePgSSL(t) {
          this.opts.forceDisablePgSSL = t;
        }
        static get disableSNI() {
          return S2.opts.disableSNI ?? S2.defaults.disableSNI;
        }
        static set disableSNI(t) {
          S2.opts.disableSNI = t;
        }
        get disableSNI() {
          return this.opts.disableSNI ?? S2.disableSNI;
        }
        set disableSNI(t) {
          this.opts.disableSNI = t;
        }
        static get disableWarningInBrowsers() {
          return S2.opts.disableWarningInBrowsers ?? S2.defaults.disableWarningInBrowsers;
        }
        static set disableWarningInBrowsers(t) {
          S2.opts.disableWarningInBrowsers = t;
        }
        get disableWarningInBrowsers() {
          return this.opts.disableWarningInBrowsers ?? S2.disableWarningInBrowsers;
        }
        set disableWarningInBrowsers(t) {
          this.opts.disableWarningInBrowsers = t;
        }
        static get pipelineConnect() {
          return S2.opts.pipelineConnect ?? S2.defaults.pipelineConnect;
        }
        static set pipelineConnect(t) {
          S2.opts.pipelineConnect = t;
        }
        get pipelineConnect() {
          return this.opts.pipelineConnect ?? S2.pipelineConnect;
        }
        set pipelineConnect(t) {
          this.opts.pipelineConnect = t;
        }
        static get subtls() {
          return S2.opts.subtls ?? S2.defaults.subtls;
        }
        static set subtls(t) {
          S2.opts.subtls = t;
        }
        get subtls() {
          return this.opts.subtls ?? S2.subtls;
        }
        set subtls(t) {
          this.opts.subtls = t;
        }
        static get pipelineTLS() {
          return S2.opts.pipelineTLS ?? S2.defaults.pipelineTLS;
        }
        static set pipelineTLS(t) {
          S2.opts.pipelineTLS = t;
        }
        get pipelineTLS() {
          return this.opts.pipelineTLS ?? S2.pipelineTLS;
        }
        set pipelineTLS(t) {
          this.opts.pipelineTLS = t;
        }
        static get rootCerts() {
          return S2.opts.rootCerts ?? S2.defaults.rootCerts;
        }
        static set rootCerts(t) {
          S2.opts.rootCerts = t;
        }
        get rootCerts() {
          return this.opts.rootCerts ?? S2.rootCerts;
        }
        set rootCerts(t) {
          this.opts.rootCerts = t;
        }
        wsProxyAddrForHost(t, n) {
          let i = this.wsProxy;
          if (i === void 0) throw new Error("No WebSocket proxy is configured. Please see https://github.com/neondatabase/serverless/blob/main/CONFIG.md#wsproxy-string--host-string-port-number--string--string");
          return typeof i == "function" ? i(t, n) : `${i}?address=${t}:${n}`;
        }
        setNoDelay() {
          return this;
        }
        setKeepAlive() {
          return this;
        }
        ref() {
          return this;
        }
        unref() {
          return this;
        }
        connect(t, n, i) {
          this.connecting = true, i && this.once("connect", i);
          let s = a(() => {
            this.connecting = false, this.pending = false, this.emit("connect"), this.emit("ready");
          }, "handleWebSocketOpen"), o = a((c, l = false) => {
            c.binaryType = "arraybuffer", c.addEventListener("error", (f) => {
              this.emit("error", f), this.emit("close");
            }), c.addEventListener("message", (f) => {
              if (this.tlsState === 0) {
                let y = d.from(f.data);
                this.emit("data", y);
              }
            }), c.addEventListener("close", () => {
              this.emit("close");
            }), l ? s() : c.addEventListener(
              "open",
              s
            );
          }, "configureWebSocket"), u;
          try {
            u = this.wsProxyAddrForHost(n, typeof t == "string" ? parseInt(t, 10) : t);
          } catch (c) {
            this.emit("error", c), this.emit("close");
            return;
          }
          try {
            let l = (this.useSecureWebSocket ? "wss:" : "ws:") + "//" + u;
            if (this.webSocketConstructor !== void 0) this.ws = new this.webSocketConstructor(l), o(this.ws);
            else try {
              this.ws = new WebSocket(l), o(this.ws);
            } catch {
              this.ws = new __unstable_WebSocket(l), o(this.ws);
            }
          } catch (c) {
            let f = (this.useSecureWebSocket ? "https:" : "http:") + "//" + u;
            fetch(f, { headers: { Upgrade: "websocket" } }).then(
              (y) => {
                if (this.ws = y.webSocket, this.ws == null) throw c;
                this.ws.accept(), o(this.ws, true);
              }
            ).catch((y) => {
              this.emit(
                "error",
                new Error(`All attempts to open a WebSocket to connect to the database failed. Please refer to https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined. Details: ${y}`)
              ), this.emit("close");
            });
          }
        }
        async startTls(t) {
          if (this.subtls === void 0) throw new Error(
            "For Postgres SSL connections, you must set `neonConfig.subtls` to the subtls library. See https://github.com/neondatabase/serverless/blob/main/CONFIG.md for more information."
          );
          this.tlsState = 1;
          let n = await this.subtls.TrustedCert.databaseFromPEM(this.rootCerts), i = new this.subtls.WebSocketReadQueue(this.ws), s = i.read.bind(i), o = this.rawWrite.bind(this), { read: u, write: c } = await this.subtls.startTls(t, n, s, o, { useSNI: !this.disableSNI, expectPreData: this.pipelineTLS ? new Uint8Array([83]) : void 0 });
          this.tlsRead = u, this.tlsWrite = c, this.tlsState = 2, this.encrypted = true, this.authorized = true, this.emit("secureConnection", this), this.tlsReadLoop();
        }
        async tlsReadLoop() {
          for (; ; ) {
            let t = await this.tlsRead();
            if (t === void 0) break;
            {
              let n = d.from(t);
              this.emit("data", n);
            }
          }
        }
        rawWrite(t) {
          if (!this.coalesceWrites) {
            this.ws && this.ws.send(t);
            return;
          }
          if (this.writeBuffer === void 0) this.writeBuffer = t, setTimeout(() => {
            this.ws && this.ws.send(this.writeBuffer), this.writeBuffer = void 0;
          }, 0);
          else {
            let n = new Uint8Array(
              this.writeBuffer.length + t.length
            );
            n.set(this.writeBuffer), n.set(t, this.writeBuffer.length), this.writeBuffer = n;
          }
        }
        write(t, n = "utf8", i = (s) => {
        }) {
          return t.length === 0 ? (i(), true) : (typeof t == "string" && (t = d.from(t, n)), this.tlsState === 0 ? (this.rawWrite(t), i()) : this.tlsState === 1 ? this.once("secureConnection", () => {
            this.write(
              t,
              n,
              i
            );
          }) : (this.tlsWrite(t), i()), true);
        }
        end(t = d.alloc(0), n = "utf8", i = () => {
        }) {
          return this.write(t, n, () => {
            this.ws.close(), i();
          }), this;
        }
        destroy() {
          return this.destroyed = true, this.end();
        }
      };
      a(S, "Socket"), E(S, "defaults", {
        poolQueryViaFetch: false,
        fetchEndpoint: a((t, n, i) => {
          let s;
          return i?.jwtAuth ? s = t.replace(yi, "apiauth.") : s = t.replace(yi, "api."), "https://" + s + "/sql";
        }, "fetchEndpoint"),
        fetchConnectionCache: true,
        fetchFunction: void 0,
        webSocketConstructor: void 0,
        wsProxy: a((t) => t + "/v2", "wsProxy"),
        useSecureWebSocket: true,
        forceDisablePgSSL: true,
        coalesceWrites: true,
        pipelineConnect: "password",
        subtls: void 0,
        rootCerts: "",
        pipelineTLS: false,
        disableSNI: false,
        disableWarningInBrowsers: false
      }), E(S, "opts", {});
      ce = S;
    });
    gi = {};
    ie(gi, { parse: () => Yt });
    Zt = G(() => {
      "use strict";
      p();
      a(Yt, "parse");
    });
    tr = T((Ai) => {
      "use strict";
      p();
      Ai.parse = function(r, e) {
        return new er(r, e).parse();
      };
      var vt = class vt2 {
        constructor(e, t) {
          this.source = e, this.transform = t || Ca, this.position = 0, this.entries = [], this.recorded = [], this.dimension = 0;
        }
        isEof() {
          return this.position >= this.source.length;
        }
        nextCharacter() {
          var e = this.source[this.position++];
          return e === "\\" ? { value: this.source[this.position++], escaped: true } : { value: e, escaped: false };
        }
        record(e) {
          this.recorded.push(
            e
          );
        }
        newEntry(e) {
          var t;
          (this.recorded.length > 0 || e) && (t = this.recorded.join(""), t === "NULL" && !e && (t = null), t !== null && (t = this.transform(t)), this.entries.push(t), this.recorded = []);
        }
        consumeDimensions() {
          if (this.source[0] === "[") for (; !this.isEof(); ) {
            var e = this.nextCharacter();
            if (e.value === "=") break;
          }
        }
        parse(e) {
          var t, n, i;
          for (this.consumeDimensions(); !this.isEof(); ) if (t = this.nextCharacter(), t.value === "{" && !i) this.dimension++, this.dimension > 1 && (n = new vt2(this.source.substr(this.position - 1), this.transform), this.entries.push(n.parse(
            true
          )), this.position += n.position - 2);
          else if (t.value === "}" && !i) {
            if (this.dimension--, !this.dimension && (this.newEntry(), e)) return this.entries;
          } else t.value === '"' && !t.escaped ? (i && this.newEntry(true), i = !i) : t.value === "," && !i ? this.newEntry() : this.record(t.value);
          if (this.dimension !== 0) throw new Error("array dimension not balanced");
          return this.entries;
        }
      };
      a(vt, "ArrayParser");
      var er = vt;
      function Ca(r) {
        return r;
      }
      a(Ca, "identity");
    });
    rr = T((Zl, Ci) => {
      p();
      var _a = tr();
      Ci.exports = { create: a(function(r, e) {
        return { parse: a(function() {
          return _a.parse(r, e);
        }, "parse") };
      }, "create") };
    });
    Ti = T((ef, Ii) => {
      "use strict";
      p();
      var Ia = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/, Ta = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/, Pa = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/, Ra = /^-?infinity$/;
      Ii.exports = a(function(e) {
        if (Ra.test(e)) return Number(e.replace("i", "I"));
        var t = Ia.exec(e);
        if (!t) return Ba(
          e
        ) || null;
        var n = !!t[8], i = parseInt(t[1], 10);
        n && (i = _i(i));
        var s = parseInt(t[2], 10) - 1, o = t[3], u = parseInt(
          t[4],
          10
        ), c = parseInt(t[5], 10), l = parseInt(t[6], 10), f = t[7];
        f = f ? 1e3 * parseFloat(f) : 0;
        var y, g = La(e);
        return g != null ? (y = new Date(Date.UTC(i, s, o, u, c, l, f)), nr(i) && y.setUTCFullYear(i), g !== 0 && y.setTime(y.getTime() - g)) : (y = new Date(i, s, o, u, c, l, f), nr(i) && y.setFullYear(i)), y;
      }, "parseDate");
      function Ba(r) {
        var e = Ta.exec(r);
        if (e) {
          var t = parseInt(e[1], 10), n = !!e[4];
          n && (t = _i(t));
          var i = parseInt(e[2], 10) - 1, s = e[3], o = new Date(t, i, s);
          return nr(
            t
          ) && o.setFullYear(t), o;
        }
      }
      a(Ba, "getDate");
      function La(r) {
        if (r.endsWith("+00")) return 0;
        var e = Pa.exec(r.split(" ")[1]);
        if (e) {
          var t = e[1];
          if (t === "Z") return 0;
          var n = t === "-" ? -1 : 1, i = parseInt(e[2], 10) * 3600 + parseInt(
            e[3] || 0,
            10
          ) * 60 + parseInt(e[4] || 0, 10);
          return i * n * 1e3;
        }
      }
      a(La, "timeZoneOffset");
      function _i(r) {
        return -(r - 1);
      }
      a(_i, "bcYearToNegativeYear");
      function nr(r) {
        return r >= 0 && r < 100;
      }
      a(nr, "is0To99");
    });
    Ri = T((nf, Pi) => {
      p();
      Pi.exports = ka;
      var Fa = Object.prototype.hasOwnProperty;
      function ka(r) {
        for (var e = 1; e < arguments.length; e++) {
          var t = arguments[e];
          for (var n in t) Fa.call(t, n) && (r[n] = t[n]);
        }
        return r;
      }
      a(ka, "extend");
    });
    Fi = T((af, Li) => {
      "use strict";
      p();
      var Ma = Ri();
      Li.exports = ke;
      function ke(r) {
        if (!(this instanceof ke))
          return new ke(r);
        Ma(this, Va(r));
      }
      a(ke, "PostgresInterval");
      var Ua = [
        "seconds",
        "minutes",
        "hours",
        "days",
        "months",
        "years"
      ];
      ke.prototype.toPostgres = function() {
        var r = Ua.filter(this.hasOwnProperty, this);
        return this.milliseconds && r.indexOf("seconds") < 0 && r.push("seconds"), r.length === 0 ? "0" : r.map(function(e) {
          var t = this[e] || 0;
          return e === "seconds" && this.milliseconds && (t = (t + this.milliseconds / 1e3).toFixed(6).replace(
            /\.?0+$/,
            ""
          )), t + " " + e;
        }, this).join(" ");
      };
      var Da = { years: "Y", months: "M", days: "D", hours: "H", minutes: "M", seconds: "S" }, Oa = ["years", "months", "days"], qa = ["hours", "minutes", "seconds"];
      ke.prototype.toISOString = ke.prototype.toISO = function() {
        var r = Oa.map(t, this).join(""), e = qa.map(t, this).join("");
        return "P" + r + "T" + e;
        function t(n) {
          var i = this[n] || 0;
          return n === "seconds" && this.milliseconds && (i = (i + this.milliseconds / 1e3).toFixed(6).replace(
            /0+$/,
            ""
          )), i + Da[n];
        }
      };
      var ir = "([+-]?\\d+)", Qa = ir + "\\s+years?", Na = ir + "\\s+mons?", Wa = ir + "\\s+days?", ja = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?", Ha = new RegExp([Qa, Na, Wa, ja].map(function(r) {
        return "(" + r + ")?";
      }).join("\\s*")), Bi = { years: 2, months: 4, days: 6, hours: 9, minutes: 10, seconds: 11, milliseconds: 12 }, $a = ["hours", "minutes", "seconds", "milliseconds"];
      function Ga(r) {
        var e = r + "000000".slice(r.length);
        return parseInt(
          e,
          10
        ) / 1e3;
      }
      a(Ga, "parseMilliseconds");
      function Va(r) {
        if (!r) return {};
        var e = Ha.exec(r), t = e[8] === "-";
        return Object.keys(Bi).reduce(function(n, i) {
          var s = Bi[i], o = e[s];
          return !o || (o = i === "milliseconds" ? Ga(o) : parseInt(o, 10), !o) || (t && ~$a.indexOf(i) && (o *= -1), n[i] = o), n;
        }, {});
      }
      a(Va, "parse");
    });
    Mi = T((lf, ki) => {
      "use strict";
      p();
      ki.exports = a(function(e) {
        if (/^\\x/.test(e)) return new d(e.substr(
          2
        ), "hex");
        for (var t = "", n = 0; n < e.length; ) if (e[n] !== "\\") t += e[n], ++n;
        else if (/[0-7]{3}/.test(e.substr(n + 1, 3))) t += String.fromCharCode(parseInt(e.substr(n + 1, 3), 8)), n += 4;
        else {
          for (var i = 1; n + i < e.length && e[n + i] === "\\"; ) i++;
          for (var s = 0; s < Math.floor(i / 2); ++s) t += "\\";
          n += Math.floor(i / 2) * 2;
        }
        return new d(t, "binary");
      }, "parseBytea");
    });
    Wi = T((pf, Ni) => {
      p();
      var Ve = tr(), ze = rr(), xt = Ti(), Di = Fi(), Oi = Mi();
      function St(r) {
        return a(function(t) {
          return t === null ? t : r(t);
        }, "nullAllowed");
      }
      a(St, "allowNull");
      function qi(r) {
        return r === null ? r : r === "TRUE" || r === "t" || r === "true" || r === "y" || r === "yes" || r === "on" || r === "1";
      }
      a(qi, "parseBool");
      function za(r) {
        return r ? Ve.parse(r, qi) : null;
      }
      a(za, "parseBoolArray");
      function Ka(r) {
        return parseInt(r, 10);
      }
      a(Ka, "parseBaseTenInt");
      function sr(r) {
        return r ? Ve.parse(r, St(Ka)) : null;
      }
      a(sr, "parseIntegerArray");
      function Ya(r) {
        return r ? Ve.parse(r, St(function(e) {
          return Qi(e).trim();
        })) : null;
      }
      a(Ya, "parseBigIntegerArray");
      var Za = a(function(r) {
        if (!r) return null;
        var e = ze.create(r, function(t) {
          return t !== null && (t = cr(t)), t;
        });
        return e.parse();
      }, "parsePointArray"), or = a(function(r) {
        if (!r) return null;
        var e = ze.create(r, function(t) {
          return t !== null && (t = parseFloat(t)), t;
        });
        return e.parse();
      }, "parseFloatArray"), re = a(function(r) {
        if (!r) return null;
        var e = ze.create(r);
        return e.parse();
      }, "parseStringArray"), ar = a(function(r) {
        if (!r) return null;
        var e = ze.create(
          r,
          function(t) {
            return t !== null && (t = xt(t)), t;
          }
        );
        return e.parse();
      }, "parseDateArray"), Ja = a(function(r) {
        if (!r)
          return null;
        var e = ze.create(r, function(t) {
          return t !== null && (t = Di(t)), t;
        });
        return e.parse();
      }, "parseIntervalArray"), Xa = a(function(r) {
        return r ? Ve.parse(r, St(Oi)) : null;
      }, "parseByteAArray"), ur = a(function(r) {
        return parseInt(r, 10);
      }, "parseInteger"), Qi = a(function(r) {
        var e = String(r);
        return /^\d+$/.test(e) ? e : r;
      }, "parseBigInteger"), Ui = a(function(r) {
        return r ? Ve.parse(r, St(JSON.parse)) : null;
      }, "parseJsonArray"), cr = a(
        function(r) {
          return r[0] !== "(" ? null : (r = r.substring(1, r.length - 1).split(","), { x: parseFloat(r[0]), y: parseFloat(
            r[1]
          ) });
        },
        "parsePoint"
      ), eu = a(function(r) {
        if (r[0] !== "<" && r[1] !== "(") return null;
        for (var e = "(", t = "", n = false, i = 2; i < r.length - 1; i++) {
          if (n || (e += r[i]), r[i] === ")") {
            n = true;
            continue;
          } else if (!n) continue;
          r[i] !== "," && (t += r[i]);
        }
        var s = cr(e);
        return s.radius = parseFloat(t), s;
      }, "parseCircle"), tu = a(function(r) {
        r(20, Qi), r(21, ur), r(23, ur), r(26, ur), r(700, parseFloat), r(701, parseFloat), r(16, qi), r(1082, xt), r(1114, xt), r(1184, xt), r(
          600,
          cr
        ), r(651, re), r(718, eu), r(1e3, za), r(1001, Xa), r(1005, sr), r(1007, sr), r(1028, sr), r(1016, Ya), r(1017, Za), r(1021, or), r(1022, or), r(1231, or), r(1014, re), r(1015, re), r(1008, re), r(1009, re), r(1040, re), r(1041, re), r(
          1115,
          ar
        ), r(1182, ar), r(1185, ar), r(1186, Di), r(1187, Ja), r(17, Oi), r(114, JSON.parse.bind(JSON)), r(3802, JSON.parse.bind(JSON)), r(199, Ui), r(3807, Ui), r(3907, re), r(2951, re), r(791, re), r(1183, re), r(1270, re);
      }, "init");
      Ni.exports = { init: tu };
    });
    Hi = T((mf, ji) => {
      "use strict";
      p();
      var z = 1e6;
      function ru(r) {
        var e = r.readInt32BE(0), t = r.readUInt32BE(
          4
        ), n = "";
        e < 0 && (e = ~e + (t === 0), t = ~t + 1 >>> 0, n = "-");
        var i = "", s, o, u, c, l, f;
        {
          if (s = e % z, e = e / z >>> 0, o = 4294967296 * s + t, t = o / z >>> 0, u = "" + (o - z * t), t === 0 && e === 0) return n + u + i;
          for (c = "", l = 6 - u.length, f = 0; f < l; f++) c += "0";
          i = c + u + i;
        }
        {
          if (s = e % z, e = e / z >>> 0, o = 4294967296 * s + t, t = o / z >>> 0, u = "" + (o - z * t), t === 0 && e === 0) return n + u + i;
          for (c = "", l = 6 - u.length, f = 0; f < l; f++) c += "0";
          i = c + u + i;
        }
        {
          if (s = e % z, e = e / z >>> 0, o = 4294967296 * s + t, t = o / z >>> 0, u = "" + (o - z * t), t === 0 && e === 0) return n + u + i;
          for (c = "", l = 6 - u.length, f = 0; f < l; f++) c += "0";
          i = c + u + i;
        }
        return s = e % z, o = 4294967296 * s + t, u = "" + o % z, n + u + i;
      }
      a(ru, "readInt8");
      ji.exports = ru;
    });
    Ki = T((bf, zi) => {
      p();
      var nu = Hi(), L = a(function(r, e, t, n, i) {
        t = t || 0, n = n || false, i = i || function(A, C, D) {
          return A * Math.pow(2, D) + C;
        };
        var s = t >> 3, o = a(function(A) {
          return n ? ~A & 255 : A;
        }, "inv"), u = 255, c = 8 - t % 8;
        e < c && (u = 255 << 8 - e & 255, c = e), t && (u = u >> t % 8);
        var l = 0;
        t % 8 + e >= 8 && (l = i(0, o(r[s]) & u, c));
        for (var f = e + t >> 3, y = s + 1; y < f; y++) l = i(l, o(
          r[y]
        ), 8);
        var g = (e + t) % 8;
        return g > 0 && (l = i(l, o(r[f]) >> 8 - g, g)), l;
      }, "parseBits"), Vi = a(function(r, e, t) {
        var n = Math.pow(2, t - 1) - 1, i = L(r, 1), s = L(r, t, 1);
        if (s === 0) return 0;
        var o = 1, u = a(function(l, f, y) {
          l === 0 && (l = 1);
          for (var g = 1; g <= y; g++) o /= 2, (f & 1 << y - g) > 0 && (l += o);
          return l;
        }, "parsePrecisionBits"), c = L(r, e, t + 1, false, u);
        return s == Math.pow(
          2,
          t + 1
        ) - 1 ? c === 0 ? i === 0 ? 1 / 0 : -1 / 0 : NaN : (i === 0 ? 1 : -1) * Math.pow(2, s - n) * c;
      }, "parseFloatFromBits"), iu = a(function(r) {
        return L(r, 1) == 1 ? -1 * (L(r, 15, 1, true) + 1) : L(r, 15, 1);
      }, "parseInt16"), $i = a(function(r) {
        return L(r, 1) == 1 ? -1 * (L(
          r,
          31,
          1,
          true
        ) + 1) : L(r, 31, 1);
      }, "parseInt32"), su = a(function(r) {
        return Vi(r, 23, 8);
      }, "parseFloat32"), ou = a(function(r) {
        return Vi(r, 52, 11);
      }, "parseFloat64"), au = a(function(r) {
        var e = L(r, 16, 32);
        if (e == 49152) return NaN;
        for (var t = Math.pow(1e4, L(r, 16, 16)), n = 0, i = [], s = L(r, 16), o = 0; o < s; o++) n += L(r, 16, 64 + 16 * o) * t, t /= 1e4;
        var u = Math.pow(10, L(
          r,
          16,
          48
        ));
        return (e === 0 ? 1 : -1) * Math.round(n * u) / u;
      }, "parseNumeric"), Gi = a(function(r, e) {
        var t = L(e, 1), n = L(
          e,
          63,
          1
        ), i = new Date((t === 0 ? 1 : -1) * n / 1e3 + 9466848e5);
        return r || i.setTime(i.getTime() + i.getTimezoneOffset() * 6e4), i.usec = n % 1e3, i.getMicroSeconds = function() {
          return this.usec;
        }, i.setMicroSeconds = function(s) {
          this.usec = s;
        }, i.getUTCMicroSeconds = function() {
          return this.usec;
        }, i;
      }, "parseDate"), Ke = a(
        function(r) {
          for (var e = L(
            r,
            32
          ), t = L(r, 32, 32), n = L(r, 32, 64), i = 96, s = [], o = 0; o < e; o++) s[o] = L(r, 32, i), i += 32, i += 32;
          var u = a(function(l) {
            var f = L(r, 32, i);
            if (i += 32, f == 4294967295) return null;
            var y;
            if (l == 23 || l == 20) return y = L(r, f * 8, i), i += f * 8, y;
            if (l == 25) return y = r.toString(this.encoding, i >> 3, (i += f << 3) >> 3), y;
            console.log("ERROR: ElementType not implemented: " + l);
          }, "parseElement"), c = a(function(l, f) {
            var y = [], g;
            if (l.length > 1) {
              var A = l.shift();
              for (g = 0; g < A; g++) y[g] = c(l, f);
              l.unshift(A);
            } else for (g = 0; g < l[0]; g++) y[g] = u(f);
            return y;
          }, "parse");
          return c(s, n);
        },
        "parseArray"
      ), uu = a(function(r) {
        return r.toString("utf8");
      }, "parseText"), cu = a(function(r) {
        return r === null ? null : L(r, 8) > 0;
      }, "parseBool"), lu = a(function(r) {
        r(20, nu), r(21, iu), r(23, $i), r(26, $i), r(1700, au), r(700, su), r(701, ou), r(16, cu), r(1114, Gi.bind(null, false)), r(1184, Gi.bind(null, true)), r(1e3, Ke), r(1007, Ke), r(1016, Ke), r(1008, Ke), r(1009, Ke), r(25, uu);
      }, "init");
      zi.exports = { init: lu };
    });
    Zi = T((Sf, Yi) => {
      p();
      Yi.exports = {
        BOOL: 16,
        BYTEA: 17,
        CHAR: 18,
        INT8: 20,
        INT2: 21,
        INT4: 23,
        REGPROC: 24,
        TEXT: 25,
        OID: 26,
        TID: 27,
        XID: 28,
        CID: 29,
        JSON: 114,
        XML: 142,
        PG_NODE_TREE: 194,
        SMGR: 210,
        PATH: 602,
        POLYGON: 604,
        CIDR: 650,
        FLOAT4: 700,
        FLOAT8: 701,
        ABSTIME: 702,
        RELTIME: 703,
        TINTERVAL: 704,
        CIRCLE: 718,
        MACADDR8: 774,
        MONEY: 790,
        MACADDR: 829,
        INET: 869,
        ACLITEM: 1033,
        BPCHAR: 1042,
        VARCHAR: 1043,
        DATE: 1082,
        TIME: 1083,
        TIMESTAMP: 1114,
        TIMESTAMPTZ: 1184,
        INTERVAL: 1186,
        TIMETZ: 1266,
        BIT: 1560,
        VARBIT: 1562,
        NUMERIC: 1700,
        REFCURSOR: 1790,
        REGPROCEDURE: 2202,
        REGOPER: 2203,
        REGOPERATOR: 2204,
        REGCLASS: 2205,
        REGTYPE: 2206,
        UUID: 2950,
        TXID_SNAPSHOT: 2970,
        PG_LSN: 3220,
        PG_NDISTINCT: 3361,
        PG_DEPENDENCIES: 3402,
        TSVECTOR: 3614,
        TSQUERY: 3615,
        GTSVECTOR: 3642,
        REGCONFIG: 3734,
        REGDICTIONARY: 3769,
        JSONB: 3802,
        REGNAMESPACE: 4089,
        REGROLE: 4096
      };
    });
    Je = T((Ze) => {
      p();
      var fu = Wi(), hu = Ki(), pu = rr(), du = Zi();
      Ze.getTypeParser = yu;
      Ze.setTypeParser = mu;
      Ze.arrayParser = pu;
      Ze.builtins = du;
      var Ye = { text: {}, binary: {} };
      function Ji(r) {
        return String(r);
      }
      a(Ji, "noParse");
      function yu(r, e) {
        return e = e || "text", Ye[e] && Ye[e][r] || Ji;
      }
      a(yu, "getTypeParser");
      function mu(r, e, t) {
        typeof e == "function" && (t = e, e = "text"), Ye[e][r] = t;
      }
      a(mu, "setTypeParser");
      fu.init(function(r, e) {
        Ye.text[r] = e;
      });
      hu.init(function(r, e) {
        Ye.binary[r] = e;
      });
    });
    At = T((If, Xi) => {
      "use strict";
      p();
      var wu = Je();
      function Et(r) {
        this._types = r || wu, this.text = {}, this.binary = {};
      }
      a(Et, "TypeOverrides");
      Et.prototype.getOverrides = function(r) {
        switch (r) {
          case "text":
            return this.text;
          case "binary":
            return this.binary;
          default:
            return {};
        }
      };
      Et.prototype.setTypeParser = function(r, e, t) {
        typeof e == "function" && (t = e, e = "text"), this.getOverrides(e)[r] = t;
      };
      Et.prototype.getTypeParser = function(r, e) {
        return e = e || "text", this.getOverrides(e)[r] || this._types.getTypeParser(r, e);
      };
      Xi.exports = Et;
    });
    es = G(() => {
      "use strict";
      p();
      a(Xe, "sha256");
    });
    ts = G(() => {
      "use strict";
      p();
      U = class U2 {
        constructor() {
          E(this, "_dataLength", 0);
          E(this, "_bufferLength", 0);
          E(this, "_state", new Int32Array(4));
          E(this, "_buffer", new ArrayBuffer(68));
          E(this, "_buffer8");
          E(this, "_buffer32");
          this._buffer8 = new Uint8Array(this._buffer, 0, 68), this._buffer32 = new Uint32Array(this._buffer, 0, 17), this.start();
        }
        static hashByteArray(e, t = false) {
          return this.onePassHasher.start().appendByteArray(
            e
          ).end(t);
        }
        static hashStr(e, t = false) {
          return this.onePassHasher.start().appendStr(e).end(t);
        }
        static hashAsciiStr(e, t = false) {
          return this.onePassHasher.start().appendAsciiStr(e).end(t);
        }
        static _hex(e) {
          let t = U2.hexChars, n = U2.hexOut, i, s, o, u;
          for (u = 0; u < 4; u += 1) for (s = u * 8, i = e[u], o = 0; o < 8; o += 2) n[s + 1 + o] = t.charAt(i & 15), i >>>= 4, n[s + 0 + o] = t.charAt(
            i & 15
          ), i >>>= 4;
          return n.join("");
        }
        static _md5cycle(e, t) {
          let n = e[0], i = e[1], s = e[2], o = e[3];
          n += (i & s | ~i & o) + t[0] - 680876936 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[1] - 389564586 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[2] + 606105819 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[3] - 1044525330 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[4] - 176418897 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[5] + 1200080426 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[6] - 1473231341 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[7] - 45705983 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[8] + 1770035416 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[9] - 1958414417 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[10] - 42063 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[11] - 1990404162 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[12] + 1804603682 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[13] - 40341101 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[14] - 1502002290 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[15] + 1236535329 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & o | s & ~o) + t[1] - 165796510 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[6] - 1069501632 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[11] + 643717713 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[0] - 373897302 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[5] - 701558691 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[10] + 38016083 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[15] - 660478335 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[4] - 405537848 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[9] + 568446438 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[14] - 1019803690 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[3] - 187363961 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[8] + 1163531501 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[13] - 1444681467 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[2] - 51403784 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[7] + 1735328473 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[12] - 1926607734 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i ^ s ^ o) + t[5] - 378558 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[8] - 2022574463 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[11] + 1839030562 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[14] - 35309556 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[1] - 1530992060 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[4] + 1272893353 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[7] - 155497632 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[10] - 1094730640 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[13] + 681279174 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[0] - 358537222 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[3] - 722521979 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[6] + 76029189 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[9] - 640364487 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[12] - 421815835 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[15] + 530742520 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[2] - 995338651 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (s ^ (i | ~o)) + t[0] - 198630844 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[7] + 1126891415 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[14] - 1416354905 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[5] - 57434055 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[12] + 1700485571 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[3] - 1894986606 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[10] - 1051523 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[1] - 2054922799 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[8] + 1873313359 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[15] - 30611744 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[6] - 1560198380 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[13] + 1309151649 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[4] - 145523070 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[11] - 1120210379 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[2] + 718787259 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[9] - 343485551 | 0, i = (i << 21 | i >>> 11) + s | 0, e[0] = n + e[0] | 0, e[1] = i + e[1] | 0, e[2] = s + e[2] | 0, e[3] = o + e[3] | 0;
        }
        start() {
          return this._dataLength = 0, this._bufferLength = 0, this._state.set(U2.stateIdentity), this;
        }
        appendStr(e) {
          let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o;
          for (o = 0; o < e.length; o += 1) {
            if (s = e.charCodeAt(o), s < 128) t[i++] = s;
            else if (s < 2048) t[i++] = (s >>> 6) + 192, t[i++] = s & 63 | 128;
            else if (s < 55296 || s > 56319) t[i++] = (s >>> 12) + 224, t[i++] = s >>> 6 & 63 | 128, t[i++] = s & 63 | 128;
            else {
              if (s = (s - 55296) * 1024 + (e.charCodeAt(++o) - 56320) + 65536, s > 1114111) throw new Error(
                "Unicode standard supports code points up to U+10FFFF"
              );
              t[i++] = (s >>> 18) + 240, t[i++] = s >>> 12 & 63 | 128, t[i++] = s >>> 6 & 63 | 128, t[i++] = s & 63 | 128;
            }
            i >= 64 && (this._dataLength += 64, U2._md5cycle(this._state, n), i -= 64, n[0] = n[16]);
          }
          return this._bufferLength = i, this;
        }
        appendAsciiStr(e) {
          let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o = 0;
          for (; ; ) {
            for (s = Math.min(e.length - o, 64 - i); s--; ) t[i++] = e.charCodeAt(o++);
            if (i < 64) break;
            this._dataLength += 64, U2._md5cycle(this._state, n), i = 0;
          }
          return this._bufferLength = i, this;
        }
        appendByteArray(e) {
          let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o = 0;
          for (; ; ) {
            for (s = Math.min(e.length - o, 64 - i); s--; ) t[i++] = e[o++];
            if (i < 64) break;
            this._dataLength += 64, U2._md5cycle(this._state, n), i = 0;
          }
          return this._bufferLength = i, this;
        }
        getState() {
          let e = this._state;
          return { buffer: String.fromCharCode.apply(null, Array.from(this._buffer8)), buflen: this._bufferLength, length: this._dataLength, state: [e[0], e[1], e[2], e[3]] };
        }
        setState(e) {
          let t = e.buffer, n = e.state, i = this._state, s;
          for (this._dataLength = e.length, this._bufferLength = e.buflen, i[0] = n[0], i[1] = n[1], i[2] = n[2], i[3] = n[3], s = 0; s < t.length; s += 1) this._buffer8[s] = t.charCodeAt(s);
        }
        end(e = false) {
          let t = this._bufferLength, n = this._buffer8, i = this._buffer32, s = (t >> 2) + 1;
          this._dataLength += t;
          let o = this._dataLength * 8;
          if (n[t] = 128, n[t + 1] = n[t + 2] = n[t + 3] = 0, i.set(U2.buffer32Identity.subarray(s), s), t > 55 && (U2._md5cycle(this._state, i), i.set(U2.buffer32Identity)), o <= 4294967295) i[14] = o;
          else {
            let u = o.toString(16).match(/(.*?)(.{0,8})$/);
            if (u === null) return;
            let c = parseInt(
              u[2],
              16
            ), l = parseInt(u[1], 16) || 0;
            i[14] = c, i[15] = l;
          }
          return U2._md5cycle(this._state, i), e ? this._state : U2._hex(
            this._state
          );
        }
      };
      a(U, "Md5"), E(U, "stateIdentity", new Int32Array([1732584193, -271733879, -1732584194, 271733878])), E(U, "buffer32Identity", new Int32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])), E(U, "hexChars", "0123456789abcdef"), E(U, "hexOut", []), E(U, "onePassHasher", new U());
      et = U;
    });
    lr = {};
    ie(lr, { createHash: () => bu, createHmac: () => vu, randomBytes: () => gu });
    fr = G(() => {
      "use strict";
      p();
      es();
      ts();
      a(gu, "randomBytes");
      a(bu, "createHash");
      a(vu, "createHmac");
    });
    tt = T((Qf, hr) => {
      "use strict";
      p();
      hr.exports = {
        host: "localhost",
        user: m.platform === "win32" ? m.env.USERNAME : m.env.USER,
        database: void 0,
        password: null,
        connectionString: void 0,
        port: 5432,
        rows: 0,
        binary: false,
        max: 10,
        idleTimeoutMillis: 3e4,
        client_encoding: "",
        ssl: false,
        application_name: void 0,
        fallback_application_name: void 0,
        options: void 0,
        parseInputDatesAsUTC: false,
        statement_timeout: false,
        lock_timeout: false,
        idle_in_transaction_session_timeout: false,
        query_timeout: false,
        connect_timeout: 0,
        keepalives: 1,
        keepalives_idle: 0
      };
      var Me = Je(), xu = Me.getTypeParser(20, "text"), Su = Me.getTypeParser(
        1016,
        "text"
      );
      hr.exports.__defineSetter__("parseInt8", function(r) {
        Me.setTypeParser(20, "text", r ? Me.getTypeParser(
          23,
          "text"
        ) : xu), Me.setTypeParser(1016, "text", r ? Me.getTypeParser(1007, "text") : Su);
      });
    });
    rt = T((Wf, ns) => {
      "use strict";
      p();
      var Eu = (fr(), O(lr)), Au = tt();
      function Cu(r) {
        var e = r.replace(
          /\\/g,
          "\\\\"
        ).replace(/"/g, '\\"');
        return '"' + e + '"';
      }
      a(Cu, "escapeElement");
      function rs(r) {
        for (var e = "{", t = 0; t < r.length; t++) t > 0 && (e = e + ","), r[t] === null || typeof r[t] > "u" ? e = e + "NULL" : Array.isArray(r[t]) ? e = e + rs(r[t]) : r[t] instanceof d ? e += "\\\\x" + r[t].toString("hex") : e += Cu(Ct(r[t]));
        return e = e + "}", e;
      }
      a(rs, "arrayString");
      var Ct = a(function(r, e) {
        if (r == null) return null;
        if (r instanceof d) return r;
        if (ArrayBuffer.isView(r)) {
          var t = d.from(r.buffer, r.byteOffset, r.byteLength);
          return t.length === r.byteLength ? t : t.slice(r.byteOffset, r.byteOffset + r.byteLength);
        }
        return r instanceof Date ? Au.parseInputDatesAsUTC ? Tu(r) : Iu(r) : Array.isArray(r) ? rs(r) : typeof r == "object" ? _u(r, e) : r.toString();
      }, "prepareValue");
      function _u(r, e) {
        if (r && typeof r.toPostgres == "function") {
          if (e = e || [], e.indexOf(r) !== -1) throw new Error('circular reference detected while preparing "' + r + '" for query');
          return e.push(r), Ct(r.toPostgres(Ct), e);
        }
        return JSON.stringify(r);
      }
      a(_u, "prepareObject");
      function N(r, e) {
        for (r = "" + r; r.length < e; ) r = "0" + r;
        return r;
      }
      a(N, "pad");
      function Iu(r) {
        var e = -r.getTimezoneOffset(), t = r.getFullYear(), n = t < 1;
        n && (t = Math.abs(t) + 1);
        var i = N(t, 4) + "-" + N(r.getMonth() + 1, 2) + "-" + N(r.getDate(), 2) + "T" + N(
          r.getHours(),
          2
        ) + ":" + N(r.getMinutes(), 2) + ":" + N(r.getSeconds(), 2) + "." + N(r.getMilliseconds(), 3);
        return e < 0 ? (i += "-", e *= -1) : i += "+", i += N(Math.floor(e / 60), 2) + ":" + N(e % 60, 2), n && (i += " BC"), i;
      }
      a(Iu, "dateToString");
      function Tu(r) {
        var e = r.getUTCFullYear(), t = e < 1;
        t && (e = Math.abs(e) + 1);
        var n = N(e, 4) + "-" + N(r.getUTCMonth() + 1, 2) + "-" + N(r.getUTCDate(), 2) + "T" + N(r.getUTCHours(), 2) + ":" + N(r.getUTCMinutes(), 2) + ":" + N(r.getUTCSeconds(), 2) + "." + N(
          r.getUTCMilliseconds(),
          3
        );
        return n += "+00:00", t && (n += " BC"), n;
      }
      a(Tu, "dateToStringUTC");
      function Pu(r, e, t) {
        return r = typeof r == "string" ? { text: r } : r, e && (typeof e == "function" ? r.callback = e : r.values = e), t && (r.callback = t), r;
      }
      a(Pu, "normalizeQueryConfig");
      var pr = a(function(r) {
        return Eu.createHash("md5").update(r, "utf-8").digest("hex");
      }, "md5"), Ru = a(
        function(r, e, t) {
          var n = pr(e + r), i = pr(d.concat([d.from(n), t]));
          return "md5" + i;
        },
        "postgresMd5PasswordHash"
      );
      ns.exports = {
        prepareValue: a(function(e) {
          return Ct(e);
        }, "prepareValueWrapper"),
        normalizeQueryConfig: Pu,
        postgresMd5PasswordHash: Ru,
        md5: pr
      };
    });
    nt = {};
    ie(nt, { default: () => ku });
    it = G(() => {
      "use strict";
      p();
      ku = {};
    });
    ds = T((th, ps) => {
      "use strict";
      p();
      var yr = (fr(), O(lr));
      function Mu(r) {
        if (r.indexOf("SCRAM-SHA-256") === -1) throw new Error("SASL: Only mechanism SCRAM-SHA-256 is currently supported");
        let e = yr.randomBytes(
          18
        ).toString("base64");
        return { mechanism: "SCRAM-SHA-256", clientNonce: e, response: "n,,n=*,r=" + e, message: "SASLInitialResponse" };
      }
      a(Mu, "startSession");
      function Uu(r, e, t) {
        if (r.message !== "SASLInitialResponse") throw new Error(
          "SASL: Last message was not SASLInitialResponse"
        );
        if (typeof e != "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
        if (typeof t != "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
        let n = qu(t);
        if (n.nonce.startsWith(r.clientNonce)) {
          if (n.nonce.length === r.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
        } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
        var i = d.from(n.salt, "base64"), s = Wu(e, i, n.iteration), o = Ue(s, "Client Key"), u = Nu(
          o
        ), c = "n=*,r=" + r.clientNonce, l = "r=" + n.nonce + ",s=" + n.salt + ",i=" + n.iteration, f = "c=biws,r=" + n.nonce, y = c + "," + l + "," + f, g = Ue(u, y), A = hs(o, g), C = A.toString("base64"), D = Ue(s, "Server Key"), Y = Ue(D, y);
        r.message = "SASLResponse", r.serverSignature = Y.toString("base64"), r.response = f + ",p=" + C;
      }
      a(Uu, "continueSession");
      function Du(r, e) {
        if (r.message !== "SASLResponse") throw new Error("SASL: Last message was not SASLResponse");
        if (typeof e != "string") throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
        let { serverSignature: t } = Qu(
          e
        );
        if (t !== r.serverSignature) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
      a(Du, "finalizeSession");
      function Ou(r) {
        if (typeof r != "string") throw new TypeError("SASL: text must be a string");
        return r.split("").map((e, t) => r.charCodeAt(t)).every((e) => e >= 33 && e <= 43 || e >= 45 && e <= 126);
      }
      a(Ou, "isPrintableChars");
      function ls(r) {
        return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(r);
      }
      a(ls, "isBase64");
      function fs(r) {
        if (typeof r != "string") throw new TypeError("SASL: attribute pairs text must be a string");
        return new Map(r.split(",").map((e) => {
          if (!/^.=/.test(e)) throw new Error("SASL: Invalid attribute pair entry");
          let t = e[0], n = e.substring(2);
          return [t, n];
        }));
      }
      a(fs, "parseAttributePairs");
      function qu(r) {
        let e = fs(r), t = e.get("r");
        if (t) {
          if (!Ou(t)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
        } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
        let n = e.get("s");
        if (n) {
          if (!ls(n)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
        } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
        let i = e.get("i");
        if (i) {
          if (!/^[1-9][0-9]*$/.test(i)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
        } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
        let s = parseInt(i, 10);
        return { nonce: t, salt: n, iteration: s };
      }
      a(qu, "parseServerFirstMessage");
      function Qu(r) {
        let t = fs(r).get("v");
        if (t) {
          if (!ls(t)) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
        } else throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
        return { serverSignature: t };
      }
      a(Qu, "parseServerFinalMessage");
      function hs(r, e) {
        if (!d.isBuffer(r)) throw new TypeError("first argument must be a Buffer");
        if (!d.isBuffer(e)) throw new TypeError(
          "second argument must be a Buffer"
        );
        if (r.length !== e.length) throw new Error("Buffer lengths must match");
        if (r.length === 0) throw new Error("Buffers cannot be empty");
        return d.from(r.map((t, n) => r[n] ^ e[n]));
      }
      a(hs, "xorBuffers");
      function Nu(r) {
        return yr.createHash("sha256").update(r).digest();
      }
      a(Nu, "sha256");
      function Ue(r, e) {
        return yr.createHmac("sha256", r).update(e).digest();
      }
      a(Ue, "hmacSha256");
      function Wu(r, e, t) {
        for (var n = Ue(
          r,
          d.concat([e, d.from([0, 0, 0, 1])])
        ), i = n, s = 0; s < t - 1; s++) n = Ue(r, n), i = hs(i, n);
        return i;
      }
      a(Wu, "Hi");
      ps.exports = { startSession: Mu, continueSession: Uu, finalizeSession: Du };
    });
    mr = {};
    ie(mr, { join: () => ju });
    wr = G(() => {
      "use strict";
      p();
      a(
        ju,
        "join"
      );
    });
    gr = {};
    ie(gr, { stat: () => Hu });
    br = G(() => {
      "use strict";
      p();
      a(Hu, "stat");
    });
    vr = {};
    ie(vr, { default: () => $u });
    xr = G(() => {
      "use strict";
      p();
      $u = {};
    });
    ys = {};
    ie(ys, { StringDecoder: () => Sr });
    ms = G(() => {
      "use strict";
      p();
      Er = class Er {
        constructor(e) {
          E(this, "td");
          this.td = new TextDecoder(e);
        }
        write(e) {
          return this.td.decode(e, { stream: true });
        }
        end(e) {
          return this.td.decode(e);
        }
      };
      a(Er, "StringDecoder");
      Sr = Er;
    });
    vs = T((fh, bs) => {
      "use strict";
      p();
      var { Transform: Gu } = (xr(), O(vr)), { StringDecoder: Vu } = (ms(), O(ys)), ve = /* @__PURE__ */ Symbol(
        "last"
      ), It = /* @__PURE__ */ Symbol("decoder");
      function zu(r, e, t) {
        let n;
        if (this.overflow) {
          if (n = this[It].write(r).split(
            this.matcher
          ), n.length === 1) return t();
          n.shift(), this.overflow = false;
        } else this[ve] += this[It].write(r), n = this[ve].split(this.matcher);
        this[ve] = n.pop();
        for (let i = 0; i < n.length; i++) try {
          gs(this, this.mapper(n[i]));
        } catch (s) {
          return t(s);
        }
        if (this.overflow = this[ve].length > this.maxLength, this.overflow && !this.skipOverflow) {
          t(new Error(
            "maximum buffer reached"
          ));
          return;
        }
        t();
      }
      a(zu, "transform");
      function Ku(r) {
        if (this[ve] += this[It].end(), this[ve])
          try {
            gs(this, this.mapper(this[ve]));
          } catch (e) {
            return r(e);
          }
        r();
      }
      a(Ku, "flush");
      function gs(r, e) {
        e !== void 0 && r.push(e);
      }
      a(gs, "push");
      function ws(r) {
        return r;
      }
      a(ws, "noop");
      function Yu(r, e, t) {
        switch (r = r || /\r?\n/, e = e || ws, t = t || {}, arguments.length) {
          case 1:
            typeof r == "function" ? (e = r, r = /\r?\n/) : typeof r == "object" && !(r instanceof RegExp) && !r[Symbol.split] && (t = r, r = /\r?\n/);
            break;
          case 2:
            typeof r == "function" ? (t = e, e = r, r = /\r?\n/) : typeof e == "object" && (t = e, e = ws);
        }
        t = Object.assign({}, t), t.autoDestroy = true, t.transform = zu, t.flush = Ku, t.readableObjectMode = true;
        let n = new Gu(t);
        return n[ve] = "", n[It] = new Vu("utf8"), n.matcher = r, n.mapper = e, n.maxLength = t.maxLength, n.skipOverflow = t.skipOverflow || false, n.overflow = false, n._destroy = function(i, s) {
          this._writableState.errorEmitted = false, s(i);
        }, n;
      }
      a(Yu, "split");
      bs.exports = Yu;
    });
    Es = T((dh, pe) => {
      "use strict";
      p();
      var xs = (wr(), O(mr)), Zu = (xr(), O(vr)).Stream, Ju = vs(), Ss = (it(), O(nt)), Xu = 5432, Tt = m.platform === "win32", st = m.stderr, ec = 56, tc = 7, rc = 61440, nc = 32768;
      function ic(r) {
        return (r & rc) == nc;
      }
      a(ic, "isRegFile");
      var De = ["host", "port", "database", "user", "password"], Ar = De.length, sc = De[Ar - 1];
      function Cr() {
        var r = st instanceof Zu && st.writable === true;
        if (r) {
          var e = Array.prototype.slice.call(arguments).concat(`
`);
          st.write(Ss.format.apply(Ss, e));
        }
      }
      a(Cr, "warn");
      Object.defineProperty(pe.exports, "isWin", { get: a(function() {
        return Tt;
      }, "get"), set: a(function(r) {
        Tt = r;
      }, "set") });
      pe.exports.warnTo = function(r) {
        var e = st;
        return st = r, e;
      };
      pe.exports.getFileName = function(r) {
        var e = r || m.env, t = e.PGPASSFILE || (Tt ? xs.join(e.APPDATA || "./", "postgresql", "pgpass.conf") : xs.join(e.HOME || "./", ".pgpass"));
        return t;
      };
      pe.exports.usePgPass = function(r, e) {
        return Object.prototype.hasOwnProperty.call(m.env, "PGPASSWORD") ? false : Tt ? true : (e = e || "<unkn>", ic(r.mode) ? r.mode & (ec | tc) ? (Cr('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', e), false) : true : (Cr('WARNING: password file "%s" is not a plain file', e), false));
      };
      var oc = pe.exports.match = function(r, e) {
        return De.slice(0, -1).reduce(function(t, n, i) {
          return i == 1 && Number(r[n] || Xu) === Number(
            e[n]
          ) ? t && true : t && (e[n] === "*" || e[n] === r[n]);
        }, true);
      };
      pe.exports.getPassword = function(r, e, t) {
        var n, i = e.pipe(
          Ju()
        );
        function s(c) {
          var l = ac(c);
          l && uc(l) && oc(r, l) && (n = l[sc], i.end());
        }
        a(s, "onLine");
        var o = a(function() {
          e.destroy(), t(n);
        }, "onEnd"), u = a(function(c) {
          e.destroy(), Cr("WARNING: error on reading file: %s", c), t(
            void 0
          );
        }, "onErr");
        e.on("error", u), i.on("data", s).on("end", o).on("error", u);
      };
      var ac = pe.exports.parseLine = function(r) {
        if (r.length < 11 || r.match(/^\s+#/)) return null;
        for (var e = "", t = "", n = 0, i = 0, s = 0, o = {}, u = false, c = a(
          function(f, y, g) {
            var A = r.substring(y, g);
            Object.hasOwnProperty.call(m.env, "PGPASS_NO_DEESCAPE") || (A = A.replace(/\\([:\\])/g, "$1")), o[De[f]] = A;
          },
          "addToObj"
        ), l = 0; l < r.length - 1; l += 1) {
          if (e = r.charAt(l + 1), t = r.charAt(
            l
          ), u = n == Ar - 1, u) {
            c(n, i);
            break;
          }
          l >= 0 && e == ":" && t !== "\\" && (c(n, i, l + 1), i = l + 2, n += 1);
        }
        return o = Object.keys(o).length === Ar ? o : null, o;
      }, uc = pe.exports.isValidEntry = function(r) {
        for (var e = { 0: function(o) {
          return o.length > 0;
        }, 1: function(o) {
          return o === "*" ? true : (o = Number(o), isFinite(o) && o > 0 && o < 9007199254740992 && Math.floor(o) === o);
        }, 2: function(o) {
          return o.length > 0;
        }, 3: function(o) {
          return o.length > 0;
        }, 4: function(o) {
          return o.length > 0;
        } }, t = 0; t < De.length; t += 1) {
          var n = e[t], i = r[De[t]] || "", s = n(i);
          if (!s) return false;
        }
        return true;
      };
    });
    Cs = T((gh, _r) => {
      "use strict";
      p();
      var wh = (wr(), O(mr)), As = (br(), O(gr)), Pt = Es();
      _r.exports = function(r, e) {
        var t = Pt.getFileName();
        As.stat(t, function(n, i) {
          if (n || !Pt.usePgPass(i, t)) return e(void 0);
          var s = As.createReadStream(
            t
          );
          Pt.getPassword(r, s, e);
        });
      };
      _r.exports.warnTo = Pt.warnTo;
    });
    _s = {};
    ie(_s, { default: () => cc });
    Is = G(() => {
      "use strict";
      p();
      cc = {};
    });
    Ps = T((xh, Ts) => {
      "use strict";
      p();
      var lc = (Zt(), O(gi)), Ir = (br(), O(gr));
      function Tr(r) {
        if (r.charAt(0) === "/") {
          var t = r.split(" ");
          return { host: t[0], database: t[1] };
        }
        var e = lc.parse(/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(r) ? encodeURI(r).replace(/\%25(\d\d)/g, "%$1") : r, true), t = e.query;
        for (var n in t) Array.isArray(t[n]) && (t[n] = t[n][t[n].length - 1]);
        var i = (e.auth || ":").split(":");
        if (t.user = i[0], t.password = i.splice(1).join(
          ":"
        ), t.port = e.port, e.protocol == "socket:") return t.host = decodeURI(e.pathname), t.database = e.query.db, t.client_encoding = e.query.encoding, t;
        t.host || (t.host = e.hostname);
        var s = e.pathname;
        if (!t.host && s && /^%2f/i.test(s)) {
          var o = s.split("/");
          t.host = decodeURIComponent(o[0]), s = o.splice(1).join("/");
        }
        switch (s && s.charAt(
          0
        ) === "/" && (s = s.slice(1) || null), t.database = s && decodeURI(s), (t.ssl === "true" || t.ssl === "1") && (t.ssl = true), t.ssl === "0" && (t.ssl = false), (t.sslcert || t.sslkey || t.sslrootcert || t.sslmode) && (t.ssl = {}), t.sslcert && (t.ssl.cert = Ir.readFileSync(t.sslcert).toString()), t.sslkey && (t.ssl.key = Ir.readFileSync(t.sslkey).toString()), t.sslrootcert && (t.ssl.ca = Ir.readFileSync(t.sslrootcert).toString()), t.sslmode) {
          case "disable": {
            t.ssl = false;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full":
            break;
          case "no-verify": {
            t.ssl.rejectUnauthorized = false;
            break;
          }
        }
        return t;
      }
      a(Tr, "parse");
      Ts.exports = Tr;
      Tr.parse = Tr;
    });
    Rt = T((Ah, Ls) => {
      "use strict";
      p();
      var fc = (Is(), O(_s)), Bs = tt(), Rs = Ps().parse, H = a(function(r, e, t) {
        return t === void 0 ? t = m.env["PG" + r.toUpperCase()] : t === false || (t = m.env[t]), e[r] || t || Bs[r];
      }, "val"), hc = a(function() {
        switch (m.env.PGSSLMODE) {
          case "disable":
            return false;
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full":
            return true;
          case "no-verify":
            return { rejectUnauthorized: false };
        }
        return Bs.ssl;
      }, "readSSLConfigFromEnvironment"), Oe = a(function(r) {
        return "'" + ("" + r).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
      }, "quoteParamValue"), ne = a(function(r, e, t) {
        var n = e[t];
        n != null && r.push(t + "=" + Oe(n));
      }, "add"), Rr = class Rr {
        constructor(e) {
          e = typeof e == "string" ? Rs(e) : e || {}, e.connectionString && (e = Object.assign({}, e, Rs(e.connectionString))), this.user = H("user", e), this.database = H("database", e), this.database === void 0 && (this.database = this.user), this.port = parseInt(H("port", e), 10), this.host = H("host", e), Object.defineProperty(this, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: H("password", e)
          }), this.binary = H("binary", e), this.options = H("options", e), this.ssl = typeof e.ssl > "u" ? hc() : e.ssl, typeof this.ssl == "string" && this.ssl === "true" && (this.ssl = true), this.ssl === "no-verify" && (this.ssl = { rejectUnauthorized: false }), this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }), this.client_encoding = H("client_encoding", e), this.replication = H("replication", e), this.isDomainSocket = !(this.host || "").indexOf("/"), this.application_name = H("application_name", e, "PGAPPNAME"), this.fallback_application_name = H("fallback_application_name", e, false), this.statement_timeout = H("statement_timeout", e, false), this.lock_timeout = H("lock_timeout", e, false), this.idle_in_transaction_session_timeout = H("idle_in_transaction_session_timeout", e, false), this.query_timeout = H("query_timeout", e, false), e.connectionTimeoutMillis === void 0 ? this.connect_timeout = m.env.PGCONNECT_TIMEOUT || 0 : this.connect_timeout = Math.floor(e.connectionTimeoutMillis / 1e3), e.keepAlive === false ? this.keepalives = 0 : e.keepAlive === true && (this.keepalives = 1), typeof e.keepAliveInitialDelayMillis == "number" && (this.keepalives_idle = Math.floor(e.keepAliveInitialDelayMillis / 1e3));
        }
        getLibpqConnectionString(e) {
          var t = [];
          ne(t, this, "user"), ne(t, this, "password"), ne(t, this, "port"), ne(t, this, "application_name"), ne(
            t,
            this,
            "fallback_application_name"
          ), ne(t, this, "connect_timeout"), ne(t, this, "options");
          var n = typeof this.ssl == "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
          if (ne(t, n, "sslmode"), ne(t, n, "sslca"), ne(t, n, "sslkey"), ne(t, n, "sslcert"), ne(t, n, "sslrootcert"), this.database && t.push("dbname=" + Oe(this.database)), this.replication && t.push("replication=" + Oe(this.replication)), this.host && t.push("host=" + Oe(this.host)), this.isDomainSocket) return e(null, t.join(" "));
          this.client_encoding && t.push("client_encoding=" + Oe(this.client_encoding)), fc.lookup(this.host, function(i, s) {
            return i ? e(i, null) : (t.push("hostaddr=" + Oe(s)), e(null, t.join(" ")));
          });
        }
      };
      a(Rr, "ConnectionParameters");
      var Pr = Rr;
      Ls.exports = Pr;
    });
    Ms = T((Ih, ks) => {
      "use strict";
      p();
      var pc = Je(), Fs = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/, Lr = class Lr {
        constructor(e, t) {
          this.command = null, this.rowCount = null, this.oid = null, this.rows = [], this.fields = [], this._parsers = void 0, this._types = t, this.RowCtor = null, this.rowAsArray = e === "array", this.rowAsArray && (this.parseRow = this._parseRowAsArray);
        }
        addCommandComplete(e) {
          var t;
          e.text ? t = Fs.exec(e.text) : t = Fs.exec(e.command), t && (this.command = t[1], t[3] ? (this.oid = parseInt(
            t[2],
            10
          ), this.rowCount = parseInt(t[3], 10)) : t[2] && (this.rowCount = parseInt(t[2], 10)));
        }
        _parseRowAsArray(e) {
          for (var t = new Array(
            e.length
          ), n = 0, i = e.length; n < i; n++) {
            var s = e[n];
            s !== null ? t[n] = this._parsers[n](s) : t[n] = null;
          }
          return t;
        }
        parseRow(e) {
          for (var t = {}, n = 0, i = e.length; n < i; n++) {
            var s = e[n], o = this.fields[n].name;
            s !== null ? t[o] = this._parsers[n](
              s
            ) : t[o] = null;
          }
          return t;
        }
        addRow(e) {
          this.rows.push(e);
        }
        addFields(e) {
          this.fields = e, this.fields.length && (this._parsers = new Array(e.length));
          for (var t = 0; t < e.length; t++) {
            var n = e[t];
            this._types ? this._parsers[t] = this._types.getTypeParser(n.dataTypeID, n.format || "text") : this._parsers[t] = pc.getTypeParser(n.dataTypeID, n.format || "text");
          }
        }
      };
      a(Lr, "Result");
      var Br = Lr;
      ks.exports = Br;
    });
    qs = T((Rh, Os) => {
      "use strict";
      p();
      var { EventEmitter: dc } = ge(), Us = Ms(), Ds = rt(), kr = class kr extends dc {
        constructor(e, t, n) {
          super(), e = Ds.normalizeQueryConfig(e, t, n), this.text = e.text, this.values = e.values, this.rows = e.rows, this.types = e.types, this.name = e.name, this.binary = e.binary, this.portal = e.portal || "", this.callback = e.callback, this._rowMode = e.rowMode, m.domain && e.callback && (this.callback = m.domain.bind(e.callback)), this._result = new Us(this._rowMode, this.types), this._results = this._result, this.isPreparedStatement = false, this._canceledDueToError = false, this._promise = null;
        }
        requiresPreparation() {
          return this.name || this.rows ? true : !this.text || !this.values ? false : this.values.length > 0;
        }
        _checkForMultirow() {
          this._result.command && (Array.isArray(this._results) || (this._results = [this._result]), this._result = new Us(this._rowMode, this.types), this._results.push(this._result));
        }
        handleRowDescription(e) {
          this._checkForMultirow(), this._result.addFields(e.fields), this._accumulateRows = this.callback || !this.listeners("row").length;
        }
        handleDataRow(e) {
          let t;
          if (!this._canceledDueToError) {
            try {
              t = this._result.parseRow(
                e.fields
              );
            } catch (n) {
              this._canceledDueToError = n;
              return;
            }
            this.emit("row", t, this._result), this._accumulateRows && this._result.addRow(t);
          }
        }
        handleCommandComplete(e, t) {
          this._checkForMultirow(), this._result.addCommandComplete(
            e
          ), this.rows && t.sync();
        }
        handleEmptyQuery(e) {
          this.rows && e.sync();
        }
        handleError(e, t) {
          if (this._canceledDueToError && (e = this._canceledDueToError, this._canceledDueToError = false), this.callback) return this.callback(e);
          this.emit("error", e);
        }
        handleReadyForQuery(e) {
          if (this._canceledDueToError) return this.handleError(
            this._canceledDueToError,
            e
          );
          if (this.callback) try {
            this.callback(null, this._results);
          } catch (t) {
            m.nextTick(() => {
              throw t;
            });
          }
          this.emit(
            "end",
            this._results
          );
        }
        submit(e) {
          if (typeof this.text != "string" && typeof this.name != "string") return new Error(
            "A query must have either text or a name. Supplying neither is unsupported."
          );
          let t = e.parsedStatements[this.name];
          return this.text && t && this.text !== t ? new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`) : this.values && !Array.isArray(this.values) ? new Error("Query values must be an array") : (this.requiresPreparation() ? this.prepare(e) : e.query(this.text), null);
        }
        hasBeenParsed(e) {
          return this.name && e.parsedStatements[this.name];
        }
        handlePortalSuspended(e) {
          this._getRows(e, this.rows);
        }
        _getRows(e, t) {
          e.execute({ portal: this.portal, rows: t }), t ? e.flush() : e.sync();
        }
        prepare(e) {
          this.isPreparedStatement = true, this.hasBeenParsed(e) || e.parse({ text: this.text, name: this.name, types: this.types });
          try {
            e.bind({ portal: this.portal, statement: this.name, values: this.values, binary: this.binary, valueMapper: Ds.prepareValue });
          } catch (t) {
            this.handleError(t, e);
            return;
          }
          e.describe({ type: "P", name: this.portal || "" }), this._getRows(e, this.rows);
        }
        handleCopyInResponse(e) {
          e.sendCopyFail("No source stream defined");
        }
        handleCopyData(e, t) {
        }
      };
      a(kr, "Query");
      var Fr = kr;
      Os.exports = Fr;
    });
    ln = T((_) => {
      "use strict";
      p();
      Object.defineProperty(_, "__esModule", { value: true });
      _.NoticeMessage = _.DataRowMessage = _.CommandCompleteMessage = _.ReadyForQueryMessage = _.NotificationResponseMessage = _.BackendKeyDataMessage = _.AuthenticationMD5Password = _.ParameterStatusMessage = _.ParameterDescriptionMessage = _.RowDescriptionMessage = _.Field = _.CopyResponse = _.CopyDataMessage = _.DatabaseError = _.copyDone = _.emptyQuery = _.replicationStart = _.portalSuspended = _.noData = _.closeComplete = _.bindComplete = _.parseComplete = void 0;
      _.parseComplete = { name: "parseComplete", length: 5 };
      _.bindComplete = { name: "bindComplete", length: 5 };
      _.closeComplete = { name: "closeComplete", length: 5 };
      _.noData = { name: "noData", length: 5 };
      _.portalSuspended = { name: "portalSuspended", length: 5 };
      _.replicationStart = { name: "replicationStart", length: 4 };
      _.emptyQuery = { name: "emptyQuery", length: 4 };
      _.copyDone = { name: "copyDone", length: 4 };
      var Kr = class Kr extends Error {
        constructor(e, t, n) {
          super(e), this.length = t, this.name = n;
        }
      };
      a(Kr, "DatabaseError");
      var Mr = Kr;
      _.DatabaseError = Mr;
      var Yr = class Yr {
        constructor(e, t) {
          this.length = e, this.chunk = t, this.name = "copyData";
        }
      };
      a(Yr, "CopyDataMessage");
      var Ur = Yr;
      _.CopyDataMessage = Ur;
      var Zr = class Zr {
        constructor(e, t, n, i) {
          this.length = e, this.name = t, this.binary = n, this.columnTypes = new Array(i);
        }
      };
      a(Zr, "CopyResponse");
      var Dr = Zr;
      _.CopyResponse = Dr;
      var Jr = class Jr {
        constructor(e, t, n, i, s, o, u) {
          this.name = e, this.tableID = t, this.columnID = n, this.dataTypeID = i, this.dataTypeSize = s, this.dataTypeModifier = o, this.format = u;
        }
      };
      a(Jr, "Field");
      var Or = Jr;
      _.Field = Or;
      var Xr = class Xr {
        constructor(e, t) {
          this.length = e, this.fieldCount = t, this.name = "rowDescription", this.fields = new Array(this.fieldCount);
        }
      };
      a(Xr, "RowDescriptionMessage");
      var qr = Xr;
      _.RowDescriptionMessage = qr;
      var en = class en {
        constructor(e, t) {
          this.length = e, this.parameterCount = t, this.name = "parameterDescription", this.dataTypeIDs = new Array(this.parameterCount);
        }
      };
      a(en, "ParameterDescriptionMessage");
      var Qr = en;
      _.ParameterDescriptionMessage = Qr;
      var tn = class tn {
        constructor(e, t, n) {
          this.length = e, this.parameterName = t, this.parameterValue = n, this.name = "parameterStatus";
        }
      };
      a(tn, "ParameterStatusMessage");
      var Nr = tn;
      _.ParameterStatusMessage = Nr;
      var rn = class rn {
        constructor(e, t) {
          this.length = e, this.salt = t, this.name = "authenticationMD5Password";
        }
      };
      a(rn, "AuthenticationMD5Password");
      var Wr = rn;
      _.AuthenticationMD5Password = Wr;
      var nn = class nn {
        constructor(e, t, n) {
          this.length = e, this.processID = t, this.secretKey = n, this.name = "backendKeyData";
        }
      };
      a(nn, "BackendKeyDataMessage");
      var jr = nn;
      _.BackendKeyDataMessage = jr;
      var sn = class sn {
        constructor(e, t, n, i) {
          this.length = e, this.processId = t, this.channel = n, this.payload = i, this.name = "notification";
        }
      };
      a(sn, "NotificationResponseMessage");
      var Hr = sn;
      _.NotificationResponseMessage = Hr;
      var on = class on {
        constructor(e, t) {
          this.length = e, this.status = t, this.name = "readyForQuery";
        }
      };
      a(on, "ReadyForQueryMessage");
      var $r = on;
      _.ReadyForQueryMessage = $r;
      var an = class an {
        constructor(e, t) {
          this.length = e, this.text = t, this.name = "commandComplete";
        }
      };
      a(an, "CommandCompleteMessage");
      var Gr = an;
      _.CommandCompleteMessage = Gr;
      var un = class un {
        constructor(e, t) {
          this.length = e, this.fields = t, this.name = "dataRow", this.fieldCount = t.length;
        }
      };
      a(un, "DataRowMessage");
      var Vr = un;
      _.DataRowMessage = Vr;
      var cn = class cn {
        constructor(e, t) {
          this.length = e, this.message = t, this.name = "notice";
        }
      };
      a(cn, "NoticeMessage");
      var zr = cn;
      _.NoticeMessage = zr;
    });
    Qs = T((Bt) => {
      "use strict";
      p();
      Object.defineProperty(Bt, "__esModule", { value: true });
      Bt.Writer = void 0;
      var hn = class hn {
        constructor(e = 256) {
          this.size = e, this.offset = 5, this.headerPosition = 0, this.buffer = d.allocUnsafe(e);
        }
        ensure(e) {
          if (this.buffer.length - this.offset < e) {
            let n = this.buffer, i = n.length + (n.length >> 1) + e;
            this.buffer = d.allocUnsafe(i), n.copy(
              this.buffer
            );
          }
        }
        addInt32(e) {
          return this.ensure(4), this.buffer[this.offset++] = e >>> 24 & 255, this.buffer[this.offset++] = e >>> 16 & 255, this.buffer[this.offset++] = e >>> 8 & 255, this.buffer[this.offset++] = e >>> 0 & 255, this;
        }
        addInt16(e) {
          return this.ensure(2), this.buffer[this.offset++] = e >>> 8 & 255, this.buffer[this.offset++] = e >>> 0 & 255, this;
        }
        addCString(e) {
          if (!e) this.ensure(1);
          else {
            let t = d.byteLength(e);
            this.ensure(t + 1), this.buffer.write(e, this.offset, "utf-8"), this.offset += t;
          }
          return this.buffer[this.offset++] = 0, this;
        }
        addString(e = "") {
          let t = d.byteLength(e);
          return this.ensure(t), this.buffer.write(e, this.offset), this.offset += t, this;
        }
        add(e) {
          return this.ensure(
            e.length
          ), e.copy(this.buffer, this.offset), this.offset += e.length, this;
        }
        join(e) {
          if (e) {
            this.buffer[this.headerPosition] = e;
            let t = this.offset - (this.headerPosition + 1);
            this.buffer.writeInt32BE(t, this.headerPosition + 1);
          }
          return this.buffer.slice(e ? 0 : 5, this.offset);
        }
        flush(e) {
          let t = this.join(e);
          return this.offset = 5, this.headerPosition = 0, this.buffer = d.allocUnsafe(this.size), t;
        }
      };
      a(hn, "Writer");
      var fn = hn;
      Bt.Writer = fn;
    });
    Ws = T((Ft) => {
      "use strict";
      p();
      Object.defineProperty(Ft, "__esModule", { value: true });
      Ft.serialize = void 0;
      var pn = Qs(), F = new pn.Writer(), yc = a((r) => {
        F.addInt16(3).addInt16(0);
        for (let n of Object.keys(r)) F.addCString(
          n
        ).addCString(r[n]);
        F.addCString("client_encoding").addCString("UTF8");
        let e = F.addCString("").flush(), t = e.length + 4;
        return new pn.Writer().addInt32(t).add(e).flush();
      }, "startup"), mc = a(() => {
        let r = d.allocUnsafe(
          8
        );
        return r.writeInt32BE(8, 0), r.writeInt32BE(80877103, 4), r;
      }, "requestSsl"), wc = a((r) => F.addCString(r).flush(
        112
      ), "password"), gc = a(function(r, e) {
        return F.addCString(r).addInt32(d.byteLength(e)).addString(e), F.flush(112);
      }, "sendSASLInitialResponseMessage"), bc = a(function(r) {
        return F.addString(r).flush(112);
      }, "sendSCRAMClientFinalMessage"), vc = a((r) => F.addCString(r).flush(81), "query"), Ns = [], xc = a((r) => {
        let e = r.name || "";
        e.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", e, e.length), console.error("This can cause conflicts and silent errors executing queries"));
        let t = r.types || Ns, n = t.length, i = F.addCString(e).addCString(r.text).addInt16(n);
        for (let s = 0; s < n; s++) i.addInt32(t[s]);
        return F.flush(80);
      }, "parse"), qe = new pn.Writer(), Sc = a(function(r, e) {
        for (let t = 0; t < r.length; t++) {
          let n = e ? e(r[t], t) : r[t];
          n == null ? (F.addInt16(0), qe.addInt32(-1)) : n instanceof d ? (F.addInt16(
            1
          ), qe.addInt32(n.length), qe.add(n)) : (F.addInt16(0), qe.addInt32(d.byteLength(n)), qe.addString(n));
        }
      }, "writeValues"), Ec = a((r = {}) => {
        let e = r.portal || "", t = r.statement || "", n = r.binary || false, i = r.values || Ns, s = i.length;
        return F.addCString(e).addCString(t), F.addInt16(s), Sc(i, r.valueMapper), F.addInt16(s), F.add(qe.flush()), F.addInt16(n ? 1 : 0), F.flush(66);
      }, "bind"), Ac = d.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]), Cc = a((r) => {
        if (!r || !r.portal && !r.rows) return Ac;
        let e = r.portal || "", t = r.rows || 0, n = d.byteLength(e), i = 4 + n + 1 + 4, s = d.allocUnsafe(1 + i);
        return s[0] = 69, s.writeInt32BE(i, 1), s.write(e, 5, "utf-8"), s[n + 5] = 0, s.writeUInt32BE(t, s.length - 4), s;
      }, "execute"), _c = a(
        (r, e) => {
          let t = d.allocUnsafe(16);
          return t.writeInt32BE(16, 0), t.writeInt16BE(1234, 4), t.writeInt16BE(
            5678,
            6
          ), t.writeInt32BE(r, 8), t.writeInt32BE(e, 12), t;
        },
        "cancel"
      ), dn = a((r, e) => {
        let n = 4 + d.byteLength(e) + 1, i = d.allocUnsafe(1 + n);
        return i[0] = r, i.writeInt32BE(n, 1), i.write(e, 5, "utf-8"), i[n] = 0, i;
      }, "cstringMessage"), Ic = F.addCString("P").flush(68), Tc = F.addCString("S").flush(68), Pc = a((r) => r.name ? dn(68, `${r.type}${r.name || ""}`) : r.type === "P" ? Ic : Tc, "describe"), Rc = a((r) => {
        let e = `${r.type}${r.name || ""}`;
        return dn(67, e);
      }, "close"), Bc = a((r) => F.add(r).flush(100), "copyData"), Lc = a((r) => dn(102, r), "copyFail"), Lt = a((r) => d.from([r, 0, 0, 0, 4]), "codeOnlyBuffer"), Fc = Lt(72), kc = Lt(83), Mc = Lt(88), Uc = Lt(99), Dc = {
        startup: yc,
        password: wc,
        requestSsl: mc,
        sendSASLInitialResponseMessage: gc,
        sendSCRAMClientFinalMessage: bc,
        query: vc,
        parse: xc,
        bind: Ec,
        execute: Cc,
        describe: Pc,
        close: Rc,
        flush: a(
          () => Fc,
          "flush"
        ),
        sync: a(() => kc, "sync"),
        end: a(() => Mc, "end"),
        copyData: Bc,
        copyDone: a(() => Uc, "copyDone"),
        copyFail: Lc,
        cancel: _c
      };
      Ft.serialize = Dc;
    });
    js = T((kt) => {
      "use strict";
      p();
      Object.defineProperty(kt, "__esModule", { value: true });
      kt.BufferReader = void 0;
      var Oc = d.allocUnsafe(0), mn = class mn {
        constructor(e = 0) {
          this.offset = e, this.buffer = Oc, this.encoding = "utf-8";
        }
        setBuffer(e, t) {
          this.offset = e, this.buffer = t;
        }
        int16() {
          let e = this.buffer.readInt16BE(this.offset);
          return this.offset += 2, e;
        }
        byte() {
          let e = this.buffer[this.offset];
          return this.offset++, e;
        }
        int32() {
          let e = this.buffer.readInt32BE(
            this.offset
          );
          return this.offset += 4, e;
        }
        uint32() {
          let e = this.buffer.readUInt32BE(this.offset);
          return this.offset += 4, e;
        }
        string(e) {
          let t = this.buffer.toString(this.encoding, this.offset, this.offset + e);
          return this.offset += e, t;
        }
        cstring() {
          let e = this.offset, t = e;
          for (; this.buffer[t++] !== 0; ) ;
          return this.offset = t, this.buffer.toString(this.encoding, e, t - 1);
        }
        bytes(e) {
          let t = this.buffer.slice(this.offset, this.offset + e);
          return this.offset += e, t;
        }
      };
      a(mn, "BufferReader");
      var yn = mn;
      kt.BufferReader = yn;
    });
    Gs = T((Mt) => {
      "use strict";
      p();
      Object.defineProperty(Mt, "__esModule", { value: true });
      Mt.Parser = void 0;
      var k = ln(), qc = js(), wn = 1, Qc = 4, Hs = wn + Qc, $s = d.allocUnsafe(0), bn = class bn {
        constructor(e) {
          if (this.buffer = $s, this.bufferLength = 0, this.bufferOffset = 0, this.reader = new qc.BufferReader(), e?.mode === "binary") throw new Error("Binary mode not supported yet");
          this.mode = e?.mode || "text";
        }
        parse(e, t) {
          this.mergeBuffer(e);
          let n = this.bufferOffset + this.bufferLength, i = this.bufferOffset;
          for (; i + Hs <= n; ) {
            let s = this.buffer[i], o = this.buffer.readUInt32BE(
              i + wn
            ), u = wn + o;
            if (u + i <= n) {
              let c = this.handlePacket(i + Hs, s, o, this.buffer);
              t(c), i += u;
            } else break;
          }
          i === n ? (this.buffer = $s, this.bufferLength = 0, this.bufferOffset = 0) : (this.bufferLength = n - i, this.bufferOffset = i);
        }
        mergeBuffer(e) {
          if (this.bufferLength > 0) {
            let t = this.bufferLength + e.byteLength;
            if (t + this.bufferOffset > this.buffer.byteLength) {
              let i;
              if (t <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) i = this.buffer;
              else {
                let s = this.buffer.byteLength * 2;
                for (; t >= s; ) s *= 2;
                i = d.allocUnsafe(s);
              }
              this.buffer.copy(i, 0, this.bufferOffset, this.bufferOffset + this.bufferLength), this.buffer = i, this.bufferOffset = 0;
            }
            e.copy(this.buffer, this.bufferOffset + this.bufferLength), this.bufferLength = t;
          } else this.buffer = e, this.bufferOffset = 0, this.bufferLength = e.byteLength;
        }
        handlePacket(e, t, n, i) {
          switch (t) {
            case 50:
              return k.bindComplete;
            case 49:
              return k.parseComplete;
            case 51:
              return k.closeComplete;
            case 110:
              return k.noData;
            case 115:
              return k.portalSuspended;
            case 99:
              return k.copyDone;
            case 87:
              return k.replicationStart;
            case 73:
              return k.emptyQuery;
            case 68:
              return this.parseDataRowMessage(e, n, i);
            case 67:
              return this.parseCommandCompleteMessage(
                e,
                n,
                i
              );
            case 90:
              return this.parseReadyForQueryMessage(e, n, i);
            case 65:
              return this.parseNotificationMessage(
                e,
                n,
                i
              );
            case 82:
              return this.parseAuthenticationResponse(e, n, i);
            case 83:
              return this.parseParameterStatusMessage(
                e,
                n,
                i
              );
            case 75:
              return this.parseBackendKeyData(e, n, i);
            case 69:
              return this.parseErrorMessage(e, n, i, "error");
            case 78:
              return this.parseErrorMessage(e, n, i, "notice");
            case 84:
              return this.parseRowDescriptionMessage(
                e,
                n,
                i
              );
            case 116:
              return this.parseParameterDescriptionMessage(e, n, i);
            case 71:
              return this.parseCopyInMessage(
                e,
                n,
                i
              );
            case 72:
              return this.parseCopyOutMessage(e, n, i);
            case 100:
              return this.parseCopyData(e, n, i);
            default:
              return new k.DatabaseError("received invalid response: " + t.toString(16), n, "error");
          }
        }
        parseReadyForQueryMessage(e, t, n) {
          this.reader.setBuffer(e, n);
          let i = this.reader.string(1);
          return new k.ReadyForQueryMessage(t, i);
        }
        parseCommandCompleteMessage(e, t, n) {
          this.reader.setBuffer(e, n);
          let i = this.reader.cstring();
          return new k.CommandCompleteMessage(t, i);
        }
        parseCopyData(e, t, n) {
          let i = n.slice(e, e + (t - 4));
          return new k.CopyDataMessage(t, i);
        }
        parseCopyInMessage(e, t, n) {
          return this.parseCopyMessage(
            e,
            t,
            n,
            "copyInResponse"
          );
        }
        parseCopyOutMessage(e, t, n) {
          return this.parseCopyMessage(e, t, n, "copyOutResponse");
        }
        parseCopyMessage(e, t, n, i) {
          this.reader.setBuffer(e, n);
          let s = this.reader.byte() !== 0, o = this.reader.int16(), u = new k.CopyResponse(t, i, s, o);
          for (let c = 0; c < o; c++) u.columnTypes[c] = this.reader.int16();
          return u;
        }
        parseNotificationMessage(e, t, n) {
          this.reader.setBuffer(e, n);
          let i = this.reader.int32(), s = this.reader.cstring(), o = this.reader.cstring();
          return new k.NotificationResponseMessage(t, i, s, o);
        }
        parseRowDescriptionMessage(e, t, n) {
          this.reader.setBuffer(
            e,
            n
          );
          let i = this.reader.int16(), s = new k.RowDescriptionMessage(t, i);
          for (let o = 0; o < i; o++) s.fields[o] = this.parseField();
          return s;
        }
        parseField() {
          let e = this.reader.cstring(), t = this.reader.uint32(), n = this.reader.int16(), i = this.reader.uint32(), s = this.reader.int16(), o = this.reader.int32(), u = this.reader.int16() === 0 ? "text" : "binary";
          return new k.Field(e, t, n, i, s, o, u);
        }
        parseParameterDescriptionMessage(e, t, n) {
          this.reader.setBuffer(e, n);
          let i = this.reader.int16(), s = new k.ParameterDescriptionMessage(t, i);
          for (let o = 0; o < i; o++)
            s.dataTypeIDs[o] = this.reader.int32();
          return s;
        }
        parseDataRowMessage(e, t, n) {
          this.reader.setBuffer(e, n);
          let i = this.reader.int16(), s = new Array(i);
          for (let o = 0; o < i; o++) {
            let u = this.reader.int32();
            s[o] = u === -1 ? null : this.reader.string(u);
          }
          return new k.DataRowMessage(t, s);
        }
        parseParameterStatusMessage(e, t, n) {
          this.reader.setBuffer(e, n);
          let i = this.reader.cstring(), s = this.reader.cstring();
          return new k.ParameterStatusMessage(
            t,
            i,
            s
          );
        }
        parseBackendKeyData(e, t, n) {
          this.reader.setBuffer(e, n);
          let i = this.reader.int32(), s = this.reader.int32();
          return new k.BackendKeyDataMessage(t, i, s);
        }
        parseAuthenticationResponse(e, t, n) {
          this.reader.setBuffer(
            e,
            n
          );
          let i = this.reader.int32(), s = { name: "authenticationOk", length: t };
          switch (i) {
            case 0:
              break;
            case 3:
              s.length === 8 && (s.name = "authenticationCleartextPassword");
              break;
            case 5:
              if (s.length === 12) {
                s.name = "authenticationMD5Password";
                let o = this.reader.bytes(4);
                return new k.AuthenticationMD5Password(t, o);
              }
              break;
            case 10:
              {
                s.name = "authenticationSASL", s.mechanisms = [];
                let o;
                do
                  o = this.reader.cstring(), o && s.mechanisms.push(o);
                while (o);
              }
              break;
            case 11:
              s.name = "authenticationSASLContinue", s.data = this.reader.string(t - 8);
              break;
            case 12:
              s.name = "authenticationSASLFinal", s.data = this.reader.string(t - 8);
              break;
            default:
              throw new Error("Unknown authenticationOk message type " + i);
          }
          return s;
        }
        parseErrorMessage(e, t, n, i) {
          this.reader.setBuffer(e, n);
          let s = {}, o = this.reader.string(1);
          for (; o !== "\0"; ) s[o] = this.reader.cstring(), o = this.reader.string(1);
          let u = s.M, c = i === "notice" ? new k.NoticeMessage(t, u) : new k.DatabaseError(u, t, i);
          return c.severity = s.S, c.code = s.C, c.detail = s.D, c.hint = s.H, c.position = s.P, c.internalPosition = s.p, c.internalQuery = s.q, c.where = s.W, c.schema = s.s, c.table = s.t, c.column = s.c, c.dataType = s.d, c.constraint = s.n, c.file = s.F, c.line = s.L, c.routine = s.R, c;
        }
      };
      a(bn, "Parser");
      var gn = bn;
      Mt.Parser = gn;
    });
    vn = T((xe) => {
      "use strict";
      p();
      Object.defineProperty(xe, "__esModule", { value: true });
      xe.DatabaseError = xe.serialize = xe.parse = void 0;
      var Nc = ln();
      Object.defineProperty(xe, "DatabaseError", { enumerable: true, get: a(
        function() {
          return Nc.DatabaseError;
        },
        "get"
      ) });
      var Wc = Ws();
      Object.defineProperty(xe, "serialize", {
        enumerable: true,
        get: a(function() {
          return Wc.serialize;
        }, "get")
      });
      var jc = Gs();
      function Hc(r, e) {
        let t = new jc.Parser();
        return r.on("data", (n) => t.parse(n, e)), new Promise((n) => r.on("end", () => n()));
      }
      a(Hc, "parse");
      xe.parse = Hc;
    });
    Vs = {};
    ie(Vs, { connect: () => $c });
    zs = G(
      () => {
        "use strict";
        p();
        a($c, "connect");
      }
    );
    En = T((Xh, Zs) => {
      "use strict";
      p();
      var Ks = (Fe(), O(wi)), Gc = ge().EventEmitter, { parse: Vc, serialize: Q } = vn(), Ys = Q.flush(), zc = Q.sync(), Kc = Q.end(), Sn = class Sn extends Gc {
        constructor(e) {
          super(), e = e || {}, this.stream = e.stream || new Ks.Socket(), this._keepAlive = e.keepAlive, this._keepAliveInitialDelayMillis = e.keepAliveInitialDelayMillis, this.lastBuffer = false, this.parsedStatements = {}, this.ssl = e.ssl || false, this._ending = false, this._emitMessage = false;
          var t = this;
          this.on("newListener", function(n) {
            n === "message" && (t._emitMessage = true);
          });
        }
        connect(e, t) {
          var n = this;
          this._connecting = true, this.stream.setNoDelay(true), this.stream.connect(e, t), this.stream.once("connect", function() {
            n._keepAlive && n.stream.setKeepAlive(true, n._keepAliveInitialDelayMillis), n.emit("connect");
          });
          let i = a(function(s) {
            n._ending && (s.code === "ECONNRESET" || s.code === "EPIPE") || n.emit("error", s);
          }, "reportStreamError");
          if (this.stream.on("error", i), this.stream.on("close", function() {
            n.emit("end");
          }), !this.ssl) return this.attachListeners(
            this.stream
          );
          this.stream.once("data", function(s) {
            var o = s.toString("utf8");
            switch (o) {
              case "S":
                break;
              case "N":
                return n.stream.end(), n.emit("error", new Error("The server does not support SSL connections"));
              default:
                return n.stream.end(), n.emit("error", new Error("There was an error establishing an SSL connection"));
            }
            var u = (zs(), O(Vs));
            let c = { socket: n.stream };
            n.ssl !== true && (Object.assign(c, n.ssl), "key" in n.ssl && (c.key = n.ssl.key)), Ks.isIP(t) === 0 && (c.servername = t);
            try {
              n.stream = u.connect(c);
            } catch (l) {
              return n.emit(
                "error",
                l
              );
            }
            n.attachListeners(n.stream), n.stream.on("error", i), n.emit("sslconnect");
          });
        }
        attachListeners(e) {
          e.on(
            "end",
            () => {
              this.emit("end");
            }
          ), Vc(e, (t) => {
            var n = t.name === "error" ? "errorMessage" : t.name;
            this._emitMessage && this.emit("message", t), this.emit(n, t);
          });
        }
        requestSsl() {
          this.stream.write(Q.requestSsl());
        }
        startup(e) {
          this.stream.write(Q.startup(e));
        }
        cancel(e, t) {
          this._send(Q.cancel(e, t));
        }
        password(e) {
          this._send(Q.password(e));
        }
        sendSASLInitialResponseMessage(e, t) {
          this._send(Q.sendSASLInitialResponseMessage(e, t));
        }
        sendSCRAMClientFinalMessage(e) {
          this._send(Q.sendSCRAMClientFinalMessage(
            e
          ));
        }
        _send(e) {
          return this.stream.writable ? this.stream.write(e) : false;
        }
        query(e) {
          this._send(Q.query(e));
        }
        parse(e) {
          this._send(Q.parse(e));
        }
        bind(e) {
          this._send(Q.bind(e));
        }
        execute(e) {
          this._send(Q.execute(e));
        }
        flush() {
          this.stream.writable && this.stream.write(Ys);
        }
        sync() {
          this._ending = true, this._send(Ys), this._send(zc);
        }
        ref() {
          this.stream.ref();
        }
        unref() {
          this.stream.unref();
        }
        end() {
          if (this._ending = true, !this._connecting || !this.stream.writable) {
            this.stream.end();
            return;
          }
          return this.stream.write(Kc, () => {
            this.stream.end();
          });
        }
        close(e) {
          this._send(Q.close(e));
        }
        describe(e) {
          this._send(Q.describe(e));
        }
        sendCopyFromChunk(e) {
          this._send(Q.copyData(e));
        }
        endCopyFrom() {
          this._send(Q.copyDone());
        }
        sendCopyFail(e) {
          this._send(Q.copyFail(e));
        }
      };
      a(Sn, "Connection");
      var xn = Sn;
      Zs.exports = xn;
    });
    eo = T((np, Xs) => {
      "use strict";
      p();
      var Yc = ge().EventEmitter, rp = (it(), O(nt)), Zc = rt(), An = ds(), Jc = Cs(), Xc = At(), el = Rt(), Js = qs(), tl = tt(), rl = En(), Cn = class Cn extends Yc {
        constructor(e) {
          super(), this.connectionParameters = new el(e), this.user = this.connectionParameters.user, this.database = this.connectionParameters.database, this.port = this.connectionParameters.port, this.host = this.connectionParameters.host, Object.defineProperty(
            this,
            "password",
            { configurable: true, enumerable: false, writable: true, value: this.connectionParameters.password }
          ), this.replication = this.connectionParameters.replication;
          var t = e || {};
          this._Promise = t.Promise || b.Promise, this._types = new Xc(t.types), this._ending = false, this._connecting = false, this._connected = false, this._connectionError = false, this._queryable = true, this.connection = t.connection || new rl({ stream: t.stream, ssl: this.connectionParameters.ssl, keepAlive: t.keepAlive || false, keepAliveInitialDelayMillis: t.keepAliveInitialDelayMillis || 0, encoding: this.connectionParameters.client_encoding || "utf8" }), this.queryQueue = [], this.binary = t.binary || tl.binary, this.processID = null, this.secretKey = null, this.ssl = this.connectionParameters.ssl || false, this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }), this._connectionTimeoutMillis = t.connectionTimeoutMillis || 0;
        }
        _errorAllQueries(e) {
          let t = a((n) => {
            m.nextTick(() => {
              n.handleError(e, this.connection);
            });
          }, "enqueueError");
          this.activeQuery && (t(this.activeQuery), this.activeQuery = null), this.queryQueue.forEach(t), this.queryQueue.length = 0;
        }
        _connect(e) {
          var t = this, n = this.connection;
          if (this._connectionCallback = e, this._connecting || this._connected) {
            let i = new Error("Client has already been connected. You cannot reuse a client.");
            m.nextTick(
              () => {
                e(i);
              }
            );
            return;
          }
          this._connecting = true, this.connectionTimeoutHandle, this._connectionTimeoutMillis > 0 && (this.connectionTimeoutHandle = setTimeout(() => {
            n._ending = true, n.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis)), this.host && this.host.indexOf("/") === 0 ? n.connect(this.host + "/.s.PGSQL." + this.port) : n.connect(this.port, this.host), n.on("connect", function() {
            t.ssl ? n.requestSsl() : n.startup(t.getStartupConf());
          }), n.on("sslconnect", function() {
            n.startup(t.getStartupConf());
          }), this._attachListeners(
            n
          ), n.once("end", () => {
            let i = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
            clearTimeout(this.connectionTimeoutHandle), this._errorAllQueries(i), this._ending || (this._connecting && !this._connectionError ? this._connectionCallback ? this._connectionCallback(i) : this._handleErrorEvent(i) : this._connectionError || this._handleErrorEvent(i)), m.nextTick(() => {
              this.emit("end");
            });
          });
        }
        connect(e) {
          if (e) {
            this._connect(e);
            return;
          }
          return new this._Promise((t, n) => {
            this._connect((i) => {
              i ? n(i) : t();
            });
          });
        }
        _attachListeners(e) {
          e.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this)), e.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this)), e.on("authenticationSASL", this._handleAuthSASL.bind(this)), e.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this)), e.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this)), e.on("backendKeyData", this._handleBackendKeyData.bind(this)), e.on("error", this._handleErrorEvent.bind(this)), e.on("errorMessage", this._handleErrorMessage.bind(this)), e.on("readyForQuery", this._handleReadyForQuery.bind(this)), e.on("notice", this._handleNotice.bind(this)), e.on("rowDescription", this._handleRowDescription.bind(this)), e.on("dataRow", this._handleDataRow.bind(this)), e.on("portalSuspended", this._handlePortalSuspended.bind(
            this
          )), e.on("emptyQuery", this._handleEmptyQuery.bind(this)), e.on("commandComplete", this._handleCommandComplete.bind(this)), e.on("parseComplete", this._handleParseComplete.bind(this)), e.on("copyInResponse", this._handleCopyInResponse.bind(this)), e.on("copyData", this._handleCopyData.bind(this)), e.on("notification", this._handleNotification.bind(this));
        }
        _checkPgPass(e) {
          let t = this.connection;
          typeof this.password == "function" ? this._Promise.resolve().then(() => this.password()).then((n) => {
            if (n !== void 0) {
              if (typeof n != "string") {
                t.emit("error", new TypeError(
                  "Password must be a string"
                ));
                return;
              }
              this.connectionParameters.password = this.password = n;
            } else this.connectionParameters.password = this.password = null;
            e();
          }).catch((n) => {
            t.emit("error", n);
          }) : this.password !== null ? e() : Jc(
            this.connectionParameters,
            (n) => {
              n !== void 0 && (this.connectionParameters.password = this.password = n), e();
            }
          );
        }
        _handleAuthCleartextPassword(e) {
          this._checkPgPass(() => {
            this.connection.password(this.password);
          });
        }
        _handleAuthMD5Password(e) {
          this._checkPgPass(
            () => {
              let t = Zc.postgresMd5PasswordHash(this.user, this.password, e.salt);
              this.connection.password(t);
            }
          );
        }
        _handleAuthSASL(e) {
          this._checkPgPass(() => {
            this.saslSession = An.startSession(e.mechanisms), this.connection.sendSASLInitialResponseMessage(
              this.saslSession.mechanism,
              this.saslSession.response
            );
          });
        }
        _handleAuthSASLContinue(e) {
          An.continueSession(
            this.saslSession,
            this.password,
            e.data
          ), this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        }
        _handleAuthSASLFinal(e) {
          An.finalizeSession(this.saslSession, e.data), this.saslSession = null;
        }
        _handleBackendKeyData(e) {
          this.processID = e.processID, this.secretKey = e.secretKey;
        }
        _handleReadyForQuery(e) {
          this._connecting && (this._connecting = false, this._connected = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback && (this._connectionCallback(null, this), this._connectionCallback = null), this.emit("connect"));
          let { activeQuery: t } = this;
          this.activeQuery = null, this.readyForQuery = true, t && t.handleReadyForQuery(this.connection), this._pulseQueryQueue();
        }
        _handleErrorWhileConnecting(e) {
          if (!this._connectionError) {
            if (this._connectionError = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback) return this._connectionCallback(e);
            this.emit("error", e);
          }
        }
        _handleErrorEvent(e) {
          if (this._connecting) return this._handleErrorWhileConnecting(e);
          this._queryable = false, this._errorAllQueries(e), this.emit("error", e);
        }
        _handleErrorMessage(e) {
          if (this._connecting) return this._handleErrorWhileConnecting(e);
          let t = this.activeQuery;
          if (!t) {
            this._handleErrorEvent(e);
            return;
          }
          this.activeQuery = null, t.handleError(
            e,
            this.connection
          );
        }
        _handleRowDescription(e) {
          this.activeQuery.handleRowDescription(e);
        }
        _handleDataRow(e) {
          this.activeQuery.handleDataRow(e);
        }
        _handlePortalSuspended(e) {
          this.activeQuery.handlePortalSuspended(this.connection);
        }
        _handleEmptyQuery(e) {
          this.activeQuery.handleEmptyQuery(this.connection);
        }
        _handleCommandComplete(e) {
          this.activeQuery.handleCommandComplete(e, this.connection);
        }
        _handleParseComplete(e) {
          this.activeQuery.name && (this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text);
        }
        _handleCopyInResponse(e) {
          this.activeQuery.handleCopyInResponse(this.connection);
        }
        _handleCopyData(e) {
          this.activeQuery.handleCopyData(
            e,
            this.connection
          );
        }
        _handleNotification(e) {
          this.emit("notification", e);
        }
        _handleNotice(e) {
          this.emit("notice", e);
        }
        getStartupConf() {
          var e = this.connectionParameters, t = { user: e.user, database: e.database }, n = e.application_name || e.fallback_application_name;
          return n && (t.application_name = n), e.replication && (t.replication = "" + e.replication), e.statement_timeout && (t.statement_timeout = String(parseInt(e.statement_timeout, 10))), e.lock_timeout && (t.lock_timeout = String(parseInt(e.lock_timeout, 10))), e.idle_in_transaction_session_timeout && (t.idle_in_transaction_session_timeout = String(parseInt(e.idle_in_transaction_session_timeout, 10))), e.options && (t.options = e.options), t;
        }
        cancel(e, t) {
          if (e.activeQuery === t) {
            var n = this.connection;
            this.host && this.host.indexOf("/") === 0 ? n.connect(this.host + "/.s.PGSQL." + this.port) : n.connect(this.port, this.host), n.on("connect", function() {
              n.cancel(
                e.processID,
                e.secretKey
              );
            });
          } else e.queryQueue.indexOf(t) !== -1 && e.queryQueue.splice(e.queryQueue.indexOf(t), 1);
        }
        setTypeParser(e, t, n) {
          return this._types.setTypeParser(e, t, n);
        }
        getTypeParser(e, t) {
          return this._types.getTypeParser(e, t);
        }
        escapeIdentifier(e) {
          return '"' + e.replace(/"/g, '""') + '"';
        }
        escapeLiteral(e) {
          for (var t = false, n = "'", i = 0; i < e.length; i++) {
            var s = e[i];
            s === "'" ? n += s + s : s === "\\" ? (n += s + s, t = true) : n += s;
          }
          return n += "'", t === true && (n = " E" + n), n;
        }
        _pulseQueryQueue() {
          if (this.readyForQuery === true) if (this.activeQuery = this.queryQueue.shift(), this.activeQuery) {
            this.readyForQuery = false, this.hasExecuted = true;
            let e = this.activeQuery.submit(this.connection);
            e && m.nextTick(() => {
              this.activeQuery.handleError(e, this.connection), this.readyForQuery = true, this._pulseQueryQueue();
            });
          } else this.hasExecuted && (this.activeQuery = null, this.emit("drain"));
        }
        query(e, t, n) {
          var i, s, o, u, c;
          if (e == null) throw new TypeError(
            "Client was passed a null or undefined query"
          );
          return typeof e.submit == "function" ? (o = e.query_timeout || this.connectionParameters.query_timeout, s = i = e, typeof t == "function" && (i.callback = i.callback || t)) : (o = this.connectionParameters.query_timeout, i = new Js(e, t, n), i.callback || (s = new this._Promise((l, f) => {
            i.callback = (y, g) => y ? f(y) : l(g);
          }))), o && (c = i.callback, u = setTimeout(() => {
            var l = new Error("Query read timeout");
            m.nextTick(
              () => {
                i.handleError(l, this.connection);
              }
            ), c(l), i.callback = () => {
            };
            var f = this.queryQueue.indexOf(i);
            f > -1 && this.queryQueue.splice(f, 1), this._pulseQueryQueue();
          }, o), i.callback = (l, f) => {
            clearTimeout(u), c(l, f);
          }), this.binary && !i.binary && (i.binary = true), i._result && !i._result._types && (i._result._types = this._types), this._queryable ? this._ending ? (m.nextTick(() => {
            i.handleError(new Error("Client was closed and is not queryable"), this.connection);
          }), s) : (this.queryQueue.push(i), this._pulseQueryQueue(), s) : (m.nextTick(() => {
            i.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          }), s);
        }
        ref() {
          this.connection.ref();
        }
        unref() {
          this.connection.unref();
        }
        end(e) {
          if (this._ending = true, !this.connection._connecting) if (e) e();
          else return this._Promise.resolve();
          if (this.activeQuery || !this._queryable ? this.connection.stream.destroy() : this.connection.end(), e) this.connection.once("end", e);
          else return new this._Promise((t) => {
            this.connection.once("end", t);
          });
        }
      };
      a(Cn, "Client");
      var Ut = Cn;
      Ut.Query = Js;
      Xs.exports = Ut;
    });
    io = T((op, no) => {
      "use strict";
      p();
      var nl = ge().EventEmitter, to = a(function() {
      }, "NOOP"), ro = a((r, e) => {
        let t = r.findIndex(e);
        return t === -1 ? void 0 : r.splice(t, 1)[0];
      }, "removeWhere"), Tn = class Tn {
        constructor(e, t, n) {
          this.client = e, this.idleListener = t, this.timeoutId = n;
        }
      };
      a(Tn, "IdleItem");
      var _n = Tn, Pn = class Pn {
        constructor(e) {
          this.callback = e;
        }
      };
      a(Pn, "PendingItem");
      var Qe = Pn;
      function il() {
        throw new Error("Release called on client which has already been released to the pool.");
      }
      a(il, "throwOnDoubleRelease");
      function Dt(r, e) {
        if (e)
          return { callback: e, result: void 0 };
        let t, n, i = a(function(o, u) {
          o ? t(o) : n(u);
        }, "cb"), s = new r(function(o, u) {
          n = o, t = u;
        }).catch((o) => {
          throw Error.captureStackTrace(o), o;
        });
        return { callback: i, result: s };
      }
      a(Dt, "promisify");
      function sl(r, e) {
        return a(function t(n) {
          n.client = e, e.removeListener("error", t), e.on("error", () => {
            r.log(
              "additional client error after disconnection due to error",
              n
            );
          }), r._remove(e), r.emit("error", n, e);
        }, "idleListener");
      }
      a(sl, "makeIdleListener");
      var Rn = class Rn extends nl {
        constructor(e, t) {
          super(), this.options = Object.assign({}, e), e != null && "password" in e && Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: e.password
          }), e != null && e.ssl && e.ssl.key && Object.defineProperty(this.options.ssl, "key", { enumerable: false }), this.options.max = this.options.max || this.options.poolSize || 10, this.options.min = this.options.min || 0, this.options.maxUses = this.options.maxUses || 1 / 0, this.options.allowExitOnIdle = this.options.allowExitOnIdle || false, this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0, this.log = this.options.log || function() {
          }, this.Client = this.options.Client || t || ot().Client, this.Promise = this.options.Promise || b.Promise, typeof this.options.idleTimeoutMillis > "u" && (this.options.idleTimeoutMillis = 1e4), this._clients = [], this._idle = [], this._expired = /* @__PURE__ */ new WeakSet(), this._pendingQueue = [], this._endCallback = void 0, this.ending = false, this.ended = false;
        }
        _isFull() {
          return this._clients.length >= this.options.max;
        }
        _isAboveMin() {
          return this._clients.length > this.options.min;
        }
        _pulseQueue() {
          if (this.log("pulse queue"), this.ended) {
            this.log("pulse queue ended");
            return;
          }
          if (this.ending) {
            this.log("pulse queue on ending"), this._idle.length && this._idle.slice().map((t) => {
              this._remove(t.client);
            }), this._clients.length || (this.ended = true, this._endCallback());
            return;
          }
          if (!this._pendingQueue.length) {
            this.log("no queued requests");
            return;
          }
          if (!this._idle.length && this._isFull()) return;
          let e = this._pendingQueue.shift();
          if (this._idle.length) {
            let t = this._idle.pop();
            clearTimeout(
              t.timeoutId
            );
            let n = t.client;
            n.ref && n.ref();
            let i = t.idleListener;
            return this._acquireClient(n, e, i, false);
          }
          if (!this._isFull()) return this.newClient(e);
          throw new Error("unexpected condition");
        }
        _remove(e) {
          let t = ro(
            this._idle,
            (n) => n.client === e
          );
          t !== void 0 && clearTimeout(t.timeoutId), this._clients = this._clients.filter(
            (n) => n !== e
          ), e.end(), this.emit("remove", e);
        }
        connect(e) {
          if (this.ending) {
            let i = new Error("Cannot use a pool after calling end on the pool");
            return e ? e(i) : this.Promise.reject(i);
          }
          let t = Dt(this.Promise, e), n = t.result;
          if (this._isFull() || this._idle.length) {
            if (this._idle.length && m.nextTick(() => this._pulseQueue()), !this.options.connectionTimeoutMillis) return this._pendingQueue.push(new Qe(t.callback)), n;
            let i = a((u, c, l) => {
              clearTimeout(o), t.callback(u, c, l);
            }, "queueCallback"), s = new Qe(i), o = setTimeout(() => {
              ro(
                this._pendingQueue,
                (u) => u.callback === i
              ), s.timedOut = true, t.callback(new Error("timeout exceeded when trying to connect"));
            }, this.options.connectionTimeoutMillis);
            return o.unref && o.unref(), this._pendingQueue.push(s), n;
          }
          return this.newClient(new Qe(t.callback)), n;
        }
        newClient(e) {
          let t = new this.Client(this.options);
          this._clients.push(
            t
          );
          let n = sl(this, t);
          this.log("checking client timeout");
          let i, s = false;
          this.options.connectionTimeoutMillis && (i = setTimeout(() => {
            this.log("ending client due to timeout"), s = true, t.connection ? t.connection.stream.destroy() : t.end();
          }, this.options.connectionTimeoutMillis)), this.log("connecting new client"), t.connect((o) => {
            if (i && clearTimeout(i), t.on("error", n), o) this.log("client failed to connect", o), this._clients = this._clients.filter((u) => u !== t), s && (o = new Error("Connection terminated due to connection timeout", { cause: o })), this._pulseQueue(), e.timedOut || e.callback(o, void 0, to);
            else {
              if (this.log("new client connected"), this.options.maxLifetimeSeconds !== 0) {
                let u = setTimeout(() => {
                  this.log("ending client due to expired lifetime"), this._expired.add(t), this._idle.findIndex((l) => l.client === t) !== -1 && this._acquireClient(
                    t,
                    new Qe((l, f, y) => y()),
                    n,
                    false
                  );
                }, this.options.maxLifetimeSeconds * 1e3);
                u.unref(), t.once("end", () => clearTimeout(u));
              }
              return this._acquireClient(t, e, n, true);
            }
          });
        }
        _acquireClient(e, t, n, i) {
          i && this.emit("connect", e), this.emit("acquire", e), e.release = this._releaseOnce(e, n), e.removeListener("error", n), t.timedOut ? i && this.options.verify ? this.options.verify(e, e.release) : e.release() : i && this.options.verify ? this.options.verify(e, (s) => {
            if (s) return e.release(s), t.callback(s, void 0, to);
            t.callback(void 0, e, e.release);
          }) : t.callback(void 0, e, e.release);
        }
        _releaseOnce(e, t) {
          let n = false;
          return (i) => {
            n && il(), n = true, this._release(e, t, i);
          };
        }
        _release(e, t, n) {
          if (e.on("error", t), e._poolUseCount = (e._poolUseCount || 0) + 1, this.emit("release", n, e), n || this.ending || !e._queryable || e._ending || e._poolUseCount >= this.options.maxUses) {
            e._poolUseCount >= this.options.maxUses && this.log("remove expended client"), this._remove(e), this._pulseQueue();
            return;
          }
          if (this._expired.has(e)) {
            this.log("remove expired client"), this._expired.delete(e), this._remove(e), this._pulseQueue();
            return;
          }
          let s;
          this.options.idleTimeoutMillis && this._isAboveMin() && (s = setTimeout(() => {
            this.log("remove idle client"), this._remove(e);
          }, this.options.idleTimeoutMillis), this.options.allowExitOnIdle && s.unref()), this.options.allowExitOnIdle && e.unref(), this._idle.push(new _n(
            e,
            t,
            s
          )), this._pulseQueue();
        }
        query(e, t, n) {
          if (typeof e == "function") {
            let s = Dt(this.Promise, e);
            return v(function() {
              return s.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
            }), s.result;
          }
          typeof t == "function" && (n = t, t = void 0);
          let i = Dt(this.Promise, n);
          return n = i.callback, this.connect((s, o) => {
            if (s) return n(s);
            let u = false, c = a((l) => {
              u || (u = true, o.release(l), n(l));
            }, "onError");
            o.once("error", c), this.log("dispatching query");
            try {
              o.query(e, t, (l, f) => {
                if (this.log("query dispatched"), o.removeListener(
                  "error",
                  c
                ), !u) return u = true, o.release(l), l ? n(l) : n(void 0, f);
              });
            } catch (l) {
              return o.release(l), n(l);
            }
          }), i.result;
        }
        end(e) {
          if (this.log("ending"), this.ending) {
            let n = new Error("Called end on pool more than once");
            return e ? e(n) : this.Promise.reject(n);
          }
          this.ending = true;
          let t = Dt(this.Promise, e);
          return this._endCallback = t.callback, this._pulseQueue(), t.result;
        }
        get waitingCount() {
          return this._pendingQueue.length;
        }
        get idleCount() {
          return this._idle.length;
        }
        get expiredCount() {
          return this._clients.reduce((e, t) => e + (this._expired.has(t) ? 1 : 0), 0);
        }
        get totalCount() {
          return this._clients.length;
        }
      };
      a(Rn, "Pool");
      var In = Rn;
      no.exports = In;
    });
    so = {};
    ie(so, { default: () => ol });
    oo = G(() => {
      "use strict";
      p();
      ol = {};
    });
    ao = T((lp, al) => {
      al.exports = { name: "pg", version: "8.8.0", description: "PostgreSQL client - pure javascript & libpq with the same API", keywords: [
        "database",
        "libpq",
        "pg",
        "postgre",
        "postgres",
        "postgresql",
        "rdbms"
      ], homepage: "https://github.com/brianc/node-postgres", repository: { type: "git", url: "git://github.com/brianc/node-postgres.git", directory: "packages/pg" }, author: "Brian Carlson <brian.m.carlson@gmail.com>", main: "./lib", dependencies: { "buffer-writer": "2.0.0", "packet-reader": "1.0.0", "pg-connection-string": "^2.5.0", "pg-pool": "^3.5.2", "pg-protocol": "^1.5.0", "pg-types": "^2.1.0", pgpass: "1.x" }, devDependencies: {
        async: "2.6.4",
        bluebird: "3.5.2",
        co: "4.6.0",
        "pg-copy-streams": "0.3.0"
      }, peerDependencies: { "pg-native": ">=3.0.1" }, peerDependenciesMeta: { "pg-native": { optional: true } }, scripts: { test: "make test-all" }, files: ["lib", "SPONSORS.md"], license: "MIT", engines: { node: ">= 8.0.0" }, gitHead: "c99fb2c127ddf8d712500db2c7b9a5491a178655" };
    });
    lo = T((fp, co) => {
      "use strict";
      p();
      var uo = ge().EventEmitter, ul = (it(), O(nt)), Bn = rt(), Ne = co.exports = function(r, e, t) {
        uo.call(this), r = Bn.normalizeQueryConfig(r, e, t), this.text = r.text, this.values = r.values, this.name = r.name, this.callback = r.callback, this.state = "new", this._arrayMode = r.rowMode === "array", this._emitRowEvents = false, this.on("newListener", function(n) {
          n === "row" && (this._emitRowEvents = true);
        }.bind(this));
      };
      ul.inherits(Ne, uo);
      var cl = { sqlState: "code", statementPosition: "position", messagePrimary: "message", context: "where", schemaName: "schema", tableName: "table", columnName: "column", dataTypeName: "dataType", constraintName: "constraint", sourceFile: "file", sourceLine: "line", sourceFunction: "routine" };
      Ne.prototype.handleError = function(r) {
        var e = this.native.pq.resultErrorFields();
        if (e) for (var t in e) {
          var n = cl[t] || t;
          r[n] = e[t];
        }
        this.callback ? this.callback(r) : this.emit("error", r), this.state = "error";
      };
      Ne.prototype.then = function(r, e) {
        return this._getPromise().then(
          r,
          e
        );
      };
      Ne.prototype.catch = function(r) {
        return this._getPromise().catch(r);
      };
      Ne.prototype._getPromise = function() {
        return this._promise ? this._promise : (this._promise = new Promise(function(r, e) {
          this._once("end", r), this._once("error", e);
        }.bind(this)), this._promise);
      };
      Ne.prototype.submit = function(r) {
        this.state = "running";
        var e = this;
        this.native = r.native, r.native.arrayMode = this._arrayMode;
        var t = a(function(s, o, u) {
          if (r.native.arrayMode = false, v(function() {
            e.emit("_done");
          }), s) return e.handleError(s);
          e._emitRowEvents && (u.length > 1 ? o.forEach(
            (c, l) => {
              c.forEach((f) => {
                e.emit("row", f, u[l]);
              });
            }
          ) : o.forEach(function(c) {
            e.emit("row", c, u);
          })), e.state = "end", e.emit("end", u), e.callback && e.callback(null, u);
        }, "after");
        if (m.domain && (t = m.domain.bind(t)), this.name) {
          this.name.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", this.name, this.name.length), console.error("This can cause conflicts and silent errors executing queries"));
          var n = (this.values || []).map(Bn.prepareValue);
          if (r.namedQueries[this.name]) {
            if (this.text && r.namedQueries[this.name] !== this.text) {
              let s = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
              return t(s);
            }
            return r.native.execute(this.name, n, t);
          }
          return r.native.prepare(this.name, this.text, n.length, function(s) {
            return s ? t(s) : (r.namedQueries[e.name] = e.text, e.native.execute(e.name, n, t));
          });
        } else if (this.values) {
          if (!Array.isArray(
            this.values
          )) {
            let s = new Error("Query values must be an array");
            return t(s);
          }
          var i = this.values.map(Bn.prepareValue);
          r.native.query(this.text, i, t);
        } else r.native.query(this.text, t);
      };
    });
    yo = T((yp, po) => {
      "use strict";
      p();
      var ll = (oo(), O(so)), fl = At(), dp = ao(), fo = ge().EventEmitter, hl = (it(), O(nt)), pl = Rt(), ho = lo(), K = po.exports = function(r) {
        fo.call(this), r = r || {}, this._Promise = r.Promise || b.Promise, this._types = new fl(r.types), this.native = new ll({ types: this._types }), this._queryQueue = [], this._ending = false, this._connecting = false, this._connected = false, this._queryable = true;
        var e = this.connectionParameters = new pl(r);
        this.user = e.user, Object.defineProperty(this, "password", { configurable: true, enumerable: false, writable: true, value: e.password }), this.database = e.database, this.host = e.host, this.port = e.port, this.namedQueries = {};
      };
      K.Query = ho;
      hl.inherits(K, fo);
      K.prototype._errorAllQueries = function(r) {
        let e = a((t) => {
          m.nextTick(() => {
            t.native = this.native, t.handleError(r);
          });
        }, "enqueueError");
        this._hasActiveQuery() && (e(this._activeQuery), this._activeQuery = null), this._queryQueue.forEach(e), this._queryQueue.length = 0;
      };
      K.prototype._connect = function(r) {
        var e = this;
        if (this._connecting) {
          m.nextTick(() => r(new Error("Client has already been connected. You cannot reuse a client.")));
          return;
        }
        this._connecting = true, this.connectionParameters.getLibpqConnectionString(function(t, n) {
          if (t) return r(t);
          e.native.connect(n, function(i) {
            if (i) return e.native.end(), r(i);
            e._connected = true, e.native.on("error", function(s) {
              e._queryable = false, e._errorAllQueries(s), e.emit("error", s);
            }), e.native.on("notification", function(s) {
              e.emit("notification", { channel: s.relname, payload: s.extra });
            }), e.emit("connect"), e._pulseQueryQueue(true), r();
          });
        });
      };
      K.prototype.connect = function(r) {
        if (r) {
          this._connect(r);
          return;
        }
        return new this._Promise((e, t) => {
          this._connect((n) => {
            n ? t(n) : e();
          });
        });
      };
      K.prototype.query = function(r, e, t) {
        var n, i, s, o, u;
        if (r == null) throw new TypeError("Client was passed a null or undefined query");
        if (typeof r.submit == "function") s = r.query_timeout || this.connectionParameters.query_timeout, i = n = r, typeof e == "function" && (r.callback = e);
        else if (s = this.connectionParameters.query_timeout, n = new ho(r, e, t), !n.callback) {
          let c, l;
          i = new this._Promise((f, y) => {
            c = f, l = y;
          }), n.callback = (f, y) => f ? l(f) : c(y);
        }
        return s && (u = n.callback, o = setTimeout(() => {
          var c = new Error(
            "Query read timeout"
          );
          m.nextTick(() => {
            n.handleError(c, this.connection);
          }), u(c), n.callback = () => {
          };
          var l = this._queryQueue.indexOf(n);
          l > -1 && this._queryQueue.splice(l, 1), this._pulseQueryQueue();
        }, s), n.callback = (c, l) => {
          clearTimeout(o), u(c, l);
        }), this._queryable ? this._ending ? (n.native = this.native, m.nextTick(() => {
          n.handleError(
            new Error("Client was closed and is not queryable")
          );
        }), i) : (this._queryQueue.push(n), this._pulseQueryQueue(), i) : (n.native = this.native, m.nextTick(() => {
          n.handleError(new Error("Client has encountered a connection error and is not queryable"));
        }), i);
      };
      K.prototype.end = function(r) {
        var e = this;
        this._ending = true, this._connected || this.once("connect", this.end.bind(this, r));
        var t;
        return r || (t = new this._Promise(function(n, i) {
          r = a((s) => s ? i(s) : n(), "cb");
        })), this.native.end(function() {
          e._errorAllQueries(new Error("Connection terminated")), m.nextTick(() => {
            e.emit("end"), r && r();
          });
        }), t;
      };
      K.prototype._hasActiveQuery = function() {
        return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
      };
      K.prototype._pulseQueryQueue = function(r) {
        if (this._connected && !this._hasActiveQuery()) {
          var e = this._queryQueue.shift();
          if (!e) {
            r || this.emit("drain");
            return;
          }
          this._activeQuery = e, e.submit(this);
          var t = this;
          e.once("_done", function() {
            t._pulseQueryQueue();
          });
        }
      };
      K.prototype.cancel = function(r) {
        this._activeQuery === r ? this.native.cancel(function() {
        }) : this._queryQueue.indexOf(r) !== -1 && this._queryQueue.splice(this._queryQueue.indexOf(r), 1);
      };
      K.prototype.ref = function() {
      };
      K.prototype.unref = function() {
      };
      K.prototype.setTypeParser = function(r, e, t) {
        return this._types.setTypeParser(
          r,
          e,
          t
        );
      };
      K.prototype.getTypeParser = function(r, e) {
        return this._types.getTypeParser(r, e);
      };
    });
    Ln = T((gp, mo) => {
      "use strict";
      p();
      mo.exports = yo();
    });
    ot = T((vp, at) => {
      "use strict";
      p();
      var dl = eo(), yl = tt(), ml = En(), wl = io(), { DatabaseError: gl } = vn(), bl = a(
        (r) => {
          var e;
          return e = class extends wl {
            constructor(n) {
              super(n, r);
            }
          }, a(e, "BoundPool"), e;
        },
        "poolFactory"
      ), Fn = a(
        function(r) {
          this.defaults = yl, this.Client = r, this.Query = this.Client.Query, this.Pool = bl(this.Client), this._pools = [], this.Connection = ml, this.types = Je(), this.DatabaseError = gl;
        },
        "PG"
      );
      typeof m.env.NODE_PG_FORCE_NATIVE < "u" ? at.exports = new Fn(Ln()) : (at.exports = new Fn(dl), Object.defineProperty(at.exports, "native", {
        configurable: true,
        enumerable: false,
        get() {
          var r = null;
          try {
            r = new Fn(Ln());
          } catch (e) {
            if (e.code !== "MODULE_NOT_FOUND") throw e;
          }
          return Object.defineProperty(at.exports, "native", { value: r }), r;
        }
      }));
    });
    p();
    p();
    Fe();
    Zt();
    p();
    pa = Object.defineProperty;
    da = Object.defineProperties;
    ya = Object.getOwnPropertyDescriptors;
    bi = Object.getOwnPropertySymbols;
    ma = Object.prototype.hasOwnProperty;
    wa = Object.prototype.propertyIsEnumerable;
    vi = a(
      (r, e, t) => e in r ? pa(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t,
      "__defNormalProp"
    );
    ga = a((r, e) => {
      for (var t in e || (e = {})) ma.call(e, t) && vi(r, t, e[t]);
      if (bi) for (var t of bi(e)) wa.call(e, t) && vi(r, t, e[t]);
      return r;
    }, "__spreadValues");
    ba = a((r, e) => da(r, ya(e)), "__spreadProps");
    va = 1008e3;
    xi = new Uint8Array(
      new Uint16Array([258]).buffer
    )[0] === 2;
    xa = new TextDecoder();
    Jt = new TextEncoder();
    yt = Jt.encode("0123456789abcdef");
    mt = Jt.encode("0123456789ABCDEF");
    Sa = Jt.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
    Si = Sa.slice();
    Si[62] = 45;
    Si[63] = 95;
    a(Ea, "_toHex");
    a(Aa, "_toHexChunked");
    a(Ei, "toHex");
    p();
    gt = class gt2 {
      constructor(e, t) {
        this.strings = e;
        this.values = t;
      }
      toParameterizedQuery(e = { query: "", params: [] }) {
        let { strings: t, values: n } = this;
        for (let i = 0, s = t.length; i < s; i++) if (e.query += t[i], i < n.length) {
          let o = n[i];
          if (o instanceof Ge) e.query += o.sql;
          else if (o instanceof Ce) if (o.queryData instanceof gt2) o.queryData.toParameterizedQuery(
            e
          );
          else {
            if (o.queryData.params?.length) throw new Error("This query is not composable");
            e.query += o.queryData.query;
          }
          else {
            let { params: u } = e;
            u.push(o), e.query += "$" + u.length, (o instanceof d || ArrayBuffer.isView(o)) && (e.query += "::bytea");
          }
        }
        return e;
      }
    };
    a(gt, "SqlTemplate");
    $e = gt;
    Xt = class Xt2 {
      constructor(e) {
        this.sql = e;
      }
    };
    a(Xt, "UnsafeRawSql");
    Ge = Xt;
    p();
    a(bt, "warnIfBrowser");
    Fe();
    as = Se(At());
    us = Se(rt());
    _t = class _t2 extends Error {
      constructor(t) {
        super(t);
        E(this, "name", "NeonDbError");
        E(this, "severity");
        E(this, "code");
        E(this, "detail");
        E(this, "hint");
        E(this, "position");
        E(this, "internalPosition");
        E(
          this,
          "internalQuery"
        );
        E(this, "where");
        E(this, "schema");
        E(this, "table");
        E(this, "column");
        E(this, "dataType");
        E(this, "constraint");
        E(this, "file");
        E(this, "line");
        E(this, "routine");
        E(this, "sourceError");
        "captureStackTrace" in Error && typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, _t2);
      }
    };
    a(
      _t,
      "NeonDbError"
    );
    be = _t;
    is = "transaction() expects an array of queries, or a function returning an array of queries";
    Bu = ["severity", "code", "detail", "hint", "position", "internalPosition", "internalQuery", "where", "schema", "table", "column", "dataType", "constraint", "file", "line", "routine"];
    a(Lu, "encodeBuffersAsBytea");
    a(ss, "prepareQuery");
    a(cs, "neon");
    dr = class dr2 {
      constructor(e, t, n) {
        this.execute = e;
        this.queryData = t;
        this.opts = n;
      }
      then(e, t) {
        return this.execute(this.queryData, this.opts).then(e, t);
      }
      catch(e) {
        return this.execute(this.queryData, this.opts).catch(e);
      }
      finally(e) {
        return this.execute(
          this.queryData,
          this.opts
        ).finally(e);
      }
    };
    a(dr, "NeonQueryPromise");
    Ce = dr;
    a(os, "processQueryResult");
    a(Fu, "getAuthToken");
    p();
    go = Se(ot());
    p();
    wo = Se(ot());
    kn = class kn2 extends wo.Client {
      constructor(t) {
        super(t);
        this.config = t;
      }
      get neonConfig() {
        return this.connection.stream;
      }
      connect(t) {
        let { neonConfig: n } = this;
        n.forceDisablePgSSL && (this.ssl = this.connection.ssl = false), this.ssl && n.useSecureWebSocket && console.warn("SSL is enabled for both Postgres (e.g. ?sslmode=require in the connection string + forceDisablePgSSL = false) and the WebSocket tunnel (useSecureWebSocket = true). Double encryption will increase latency and CPU usage. It may be appropriate to disable SSL in the Postgres connection parameters or set forceDisablePgSSL = true.");
        let i = typeof this.config != "string" && this.config?.host !== void 0 || typeof this.config != "string" && this.config?.connectionString !== void 0 || m.env.PGHOST !== void 0, s = m.env.USER ?? m.env.USERNAME;
        if (!i && this.host === "localhost" && this.user === s && this.database === s && this.password === null) throw new Error(`No database host or connection string was set, and key parameters have default values (host: localhost, user: ${s}, db: ${s}, password: null). Is an environment variable missing? Alternatively, if you intended to connect with these parameters, please set the host to 'localhost' explicitly.`);
        let o = super.connect(t), u = n.pipelineTLS && this.ssl, c = n.pipelineConnect === "password";
        if (!u && !n.pipelineConnect) return o;
        let l = this.connection;
        if (u && l.on(
          "connect",
          () => l.stream.emit("data", "S")
        ), c) {
          l.removeAllListeners("authenticationCleartextPassword"), l.removeAllListeners("readyForQuery"), l.once("readyForQuery", () => l.on("readyForQuery", this._handleReadyForQuery.bind(this)));
          let f = this.ssl ? "sslconnect" : "connect";
          l.on(f, () => {
            this.neonConfig.disableWarningInBrowsers || bt(), this._handleAuthCleartextPassword(), this._handleReadyForQuery();
          });
        }
        return o;
      }
      async _handleAuthSASLContinue(t) {
        if (typeof crypto > "u" || crypto.subtle === void 0 || crypto.subtle.importKey === void 0) throw new Error("Cannot use SASL auth when `crypto.subtle` is not defined");
        let n = crypto.subtle, i = this.saslSession, s = this.password, o = t.data;
        if (i.message !== "SASLInitialResponse" || typeof s != "string" || typeof o != "string") throw new Error(
          "SASL: protocol error"
        );
        let u = Object.fromEntries(o.split(",").map((M) => {
          if (!/^.=/.test(M)) throw new Error(
            "SASL: Invalid attribute pair entry"
          );
          let $ = M[0], me = M.substring(2);
          return [$, me];
        })), c = u.r, l = u.s, f = u.i;
        if (!c || !/^[!-+--~]+$/.test(c)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing/unprintable");
        if (!l || !/^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(l)) throw new Error(
          "SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing/not base64"
        );
        if (!f || !/^[1-9][0-9]*$/.test(f)) throw new Error(
          "SASL: SCRAM-SERVER-FIRST-MESSAGE: missing/invalid iteration count"
        );
        if (!c.startsWith(i.clientNonce))
          throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
        if (c.length === i.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
        let y = parseInt(f, 10), g = d.from(l, "base64"), A = new TextEncoder(), C = A.encode(s), D = await n.importKey(
          "raw",
          C,
          { name: "HMAC", hash: { name: "SHA-256" } },
          false,
          ["sign"]
        ), Y = new Uint8Array(await n.sign("HMAC", D, d.concat(
          [g, d.from([0, 0, 0, 1])]
        ))), P = Y;
        for (var I = 0; I < y - 1; I++) Y = new Uint8Array(await n.sign("HMAC", D, Y)), P = d.from(
          P.map((M, $) => P[$] ^ Y[$])
        );
        let w = P, Z = await n.importKey(
          "raw",
          w,
          { name: "HMAC", hash: { name: "SHA-256" } },
          false,
          ["sign"]
        ), W = new Uint8Array(await n.sign("HMAC", Z, A.encode("Client Key"))), J = await n.digest(
          "SHA-256",
          W
        ), X = "n=*,r=" + i.clientNonce, se = "r=" + c + ",s=" + l + ",i=" + y, oe = "c=biws,r=" + c, B = X + "," + se + "," + oe, j = await n.importKey(
          "raw",
          J,
          { name: "HMAC", hash: { name: "SHA-256" } },
          false,
          ["sign"]
        );
        var le = new Uint8Array(await n.sign(
          "HMAC",
          j,
          A.encode(B)
        )), de = d.from(W.map((M, $) => W[$] ^ le[$])), We = de.toString("base64");
        let fe = await n.importKey(
          "raw",
          w,
          { name: "HMAC", hash: { name: "SHA-256" } },
          false,
          ["sign"]
        ), _e = await n.sign("HMAC", fe, A.encode("Server Key")), ye = await n.importKey("raw", _e, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
        var ee = d.from(
          await n.sign("HMAC", ye, A.encode(B))
        );
        i.message = "SASLResponse", i.serverSignature = ee.toString("base64"), i.response = oe + ",p=" + We, this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
      }
    };
    a(
      kn,
      "NeonClient"
    );
    ut = kn;
    Fe();
    bo = Se(Rt());
    a(vl, "promisify");
    Un = class Un2 extends go.Pool {
      constructor() {
        super(...arguments);
        E(this, "Client", ut);
        E(this, "hasFetchUnsupportedListeners", false);
        E(this, "addListener", this.on);
      }
      on(t, n) {
        return t !== "error" && (this.hasFetchUnsupportedListeners = true), super.on(t, n);
      }
      query(t, n, i) {
        if (!ce.poolQueryViaFetch || this.hasFetchUnsupportedListeners || typeof t == "function") return super.query(
          t,
          n,
          i
        );
        typeof n == "function" && (i = n, n = void 0);
        let s = vl(this.Promise, i);
        i = s.callback;
        try {
          let o = new bo.default(
            this.options
          ), u = encodeURIComponent, c = encodeURI, l = `postgresql://${u(o.user)}:${u(o.password)}@${u(o.host)}/${c(o.database)}`, f = typeof t == "string" ? t : t.text, y = n ?? t.values ?? [];
          cs(l, { fullResults: true, arrayMode: t.rowMode === "array" }).query(f, y, { types: t.types ?? this.options?.types }).then((A) => i(void 0, A)).catch((A) => i(
            A
          ));
        } catch (o) {
          i(o);
        }
        return s.result;
      }
    };
    a(Un, "NeonPool");
    Fe();
    ct = Se(ot());
    export_DatabaseError = ct.DatabaseError;
    export_defaults = ct.defaults;
    export_escapeIdentifier = ct.escapeIdentifier;
    export_escapeLiteral = ct.escapeLiteral;
    export_types = ct.types;
  }
});

// src/backend/services/core/unifiedDb.ts
function cleanDbUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url.trim().replace(/^["']|["']$/g, "");
}
function getUnifiedDbUrls(env) {
  const source = env ?? (typeof process !== "undefined" ? process.env : {});
  const configured = [
    cleanDbUrl(source?.SYSTEM_DATABASE_URL),
    cleanDbUrl(source?.SYSTEM_DATABASE_URL_2),
    cleanDbUrl(source?.SYSTEM_DATABASE_URL_3)
  ];
  return configured.filter((url, index) => Boolean(url) && configured.indexOf(url) === index);
}
async function queryUnifiedDb(sqlText, params = [], env) {
  const urls = getUnifiedDbUrls(env);
  if (urls.length === 0) {
    throw new Error("[UnifiedDB] SYSTEM_DATABASE_URL is required; SYSTEM_DATABASE_URL_2 and SYSTEM_DATABASE_URL_3 are optional fallbacks.");
  }
  let lastError;
  for (const [index, dbUrl] of urls.entries()) {
    try {
      const rows = await cs(dbUrl).query(sqlText, params);
      return {
        rows: Array.isArray(rows) ? rows : [],
        rowCount: Array.isArray(rows) ? rows.length : 0
      };
    } catch (error) {
      lastError = error;
      if (index < urls.length - 1) {
        console.warn(`[UnifiedDB] System database ${index + 1} failed; attempting configured fallback.`);
      }
    }
  }
  throw lastError instanceof Error ? new Error(`[UnifiedDB] All configured system database endpoints failed. Last error: ${lastError.message}`) : new Error("[UnifiedDB] All configured system database endpoints failed.");
}
var init_unifiedDb = __esm({
  "src/backend/services/core/unifiedDb.ts"() {
    init_serverless();
  }
});

// node_modules/validator/lib/util/assertString.js
var require_assertString = __commonJS({
  "node_modules/validator/lib/util/assertString.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = assertString;
    function assertString(input) {
      if (input === void 0 || input === null) throw new TypeError("Expected a string but received a ".concat(input));
      if (input.constructor.name !== "String") throw new TypeError("Expected a string but received a ".concat(input.constructor.name));
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/toDate.js
var require_toDate = __commonJS({
  "node_modules/validator/lib/toDate.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = toDate;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function toDate(date) {
      (0, _assertString.default)(date);
      date = Date.parse(date);
      return !isNaN(date) ? new Date(date) : null;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/util/nullUndefinedCheck.js
var require_nullUndefinedCheck = __commonJS({
  "node_modules/validator/lib/util/nullUndefinedCheck.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isNullOrUndefined;
    function isNullOrUndefined(value) {
      return value === null || value === void 0;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/alpha.js
var require_alpha = __commonJS({
  "node_modules/validator/lib/alpha.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.farsiLocales = exports2.englishLocales = exports2.dotDecimal = exports2.decimal = exports2.commaDecimal = exports2.bengaliLocales = exports2.arabicLocales = exports2.alphanumeric = exports2.alpha = void 0;
    var alpha = exports2.alpha = {
      "en-US": /^[A-Z]+$/i,
      "az-AZ": /^[A-VXYZÇƏĞİıÖŞÜ]+$/i,
      "bg-BG": /^[А-Я]+$/i,
      "cs-CZ": /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$/i,
      "da-DK": /^[A-ZÆØÅ]+$/i,
      "de-DE": /^[A-ZÄÖÜß]+$/i,
      "el-GR": /^[Α-ώ]+$/i,
      "es-ES": /^[A-ZÁÉÍÑÓÚÜ]+$/i,
      "fa-IR": /^[ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+$/i,
      "fi-FI": /^[A-ZÅÄÖ]+$/i,
      "fr-FR": /^[A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
      "it-IT": /^[A-ZÀÉÈÌÎÓÒÙ]+$/i,
      "ja-JP": /^[ぁ-んァ-ヶｦ-ﾟ一-龠ー・。、]+$/i,
      "nb-NO": /^[A-ZÆØÅ]+$/i,
      "nl-NL": /^[A-ZÁÉËÏÓÖÜÚ]+$/i,
      "nn-NO": /^[A-ZÆØÅ]+$/i,
      "hu-HU": /^[A-ZÁÉÍÓÖŐÚÜŰ]+$/i,
      "pl-PL": /^[A-ZĄĆĘŚŁŃÓŻŹ]+$/i,
      "pt-PT": /^[A-ZÃÁÀÂÄÇÉÊËÍÏÕÓÔÖÚÜ]+$/i,
      "ru-RU": /^[А-ЯЁ]+$/i,
      "kk-KZ": /^[А-ЯЁ\u04D8\u04B0\u0406\u04A2\u0492\u04AE\u049A\u04E8\u04BA]+$/i,
      "sl-SI": /^[A-ZČĆĐŠŽ]+$/i,
      "sk-SK": /^[A-ZÁČĎÉÍŇÓŠŤÚÝŽĹŔĽÄÔ]+$/i,
      "sr-RS@latin": /^[A-ZČĆŽŠĐ]+$/i,
      "sr-RS": /^[А-ЯЂЈЉЊЋЏ]+$/i,
      "sv-SE": /^[A-ZÅÄÖ]+$/i,
      "th-TH": /^[ก-๐\s]+$/i,
      "tr-TR": /^[A-ZÇĞİıÖŞÜ]+$/i,
      "uk-UA": /^[А-ЩЬЮЯЄIЇҐі]+$/i,
      "vi-VN": /^[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴĐÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ]+$/i,
      "ko-KR": /^[ㄱ-ㅎㅏ-ㅣ가-힣]*$/,
      "ku-IQ": /^[ئابپتجچحخدرڕزژسشعغفڤقکگلڵمنوۆھەیێيطؤثآإأكضصةظذ]+$/i,
      ar: /^[ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيًٌٍَُِّْٰ]+$/,
      he: /^[א-ת]+$/,
      fa: /^['آاءأؤئبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهةی']+$/i,
      bn: /^['ঀঁংঃঅআইঈউঊঋঌএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ়ঽািীুূৃৄেৈোৌ্ৎৗড়ঢ়য়ৠৡৢৣৰৱ৲৳৴৵৶৷৸৹৺৻']+$/,
      eo: /^[ABCĈD-GĜHĤIJĴK-PRSŜTUŬVZ]+$/i,
      "hi-IN": /^[\u0900-\u0961]+[\u0972-\u097F]*$/i,
      "si-LK": /^[\u0D80-\u0DFF]+$/,
      "ta-IN": /^[\u0B80-\u0BFF]+$/i,
      "te-IN": /^[\u0C00-\u0C7F]+$/i,
      "kn-IN": /^[\u0C80-\u0CFF]+$/i,
      "ml-IN": /^[\u0D00-\u0D7F]+$/i,
      "gu-IN": /^[\u0A80-\u0AFF]+$/i,
      "pa-IN": /^[\u0A00-\u0A7F]+$/i,
      "or-IN": /^[\u0B00-\u0B7F]+$/i
    };
    var alphanumeric = exports2.alphanumeric = {
      "en-US": /^[0-9A-Z]+$/i,
      "az-AZ": /^[0-9A-VXYZÇƏĞİıÖŞÜ]+$/i,
      "bg-BG": /^[0-9А-Я]+$/i,
      "cs-CZ": /^[0-9A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$/i,
      "da-DK": /^[0-9A-ZÆØÅ]+$/i,
      "de-DE": /^[0-9A-ZÄÖÜß]+$/i,
      "el-GR": /^[0-9Α-ω]+$/i,
      "es-ES": /^[0-9A-ZÁÉÍÑÓÚÜ]+$/i,
      "fi-FI": /^[0-9A-ZÅÄÖ]+$/i,
      "fr-FR": /^[0-9A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
      "it-IT": /^[0-9A-ZÀÉÈÌÎÓÒÙ]+$/i,
      "ja-JP": /^[0-9０-９ぁ-んァ-ヶｦ-ﾟ一-龠ー・。、]+$/i,
      "hu-HU": /^[0-9A-ZÁÉÍÓÖŐÚÜŰ]+$/i,
      "nb-NO": /^[0-9A-ZÆØÅ]+$/i,
      "nl-NL": /^[0-9A-ZÁÉËÏÓÖÜÚ]+$/i,
      "nn-NO": /^[0-9A-ZÆØÅ]+$/i,
      "pl-PL": /^[0-9A-ZĄĆĘŚŁŃÓŻŹ]+$/i,
      "pt-PT": /^[0-9A-ZÃÁÀÂÄÇÉÊËÍÏÕÓÔÖÚÜ]+$/i,
      "ru-RU": /^[0-9А-ЯЁ]+$/i,
      "kk-KZ": /^[0-9А-ЯЁ\u04D8\u04B0\u0406\u04A2\u0492\u04AE\u049A\u04E8\u04BA]+$/i,
      "sl-SI": /^[0-9A-ZČĆĐŠŽ]+$/i,
      "sk-SK": /^[0-9A-ZÁČĎÉÍŇÓŠŤÚÝŽĹŔĽÄÔ]+$/i,
      "sr-RS@latin": /^[0-9A-ZČĆŽŠĐ]+$/i,
      "sr-RS": /^[0-9А-ЯЂЈЉЊЋЏ]+$/i,
      "sv-SE": /^[0-9A-ZÅÄÖ]+$/i,
      "th-TH": /^[ก-๙\s]+$/i,
      "tr-TR": /^[0-9A-ZÇĞİıÖŞÜ]+$/i,
      "uk-UA": /^[0-9А-ЩЬЮЯЄIЇҐі]+$/i,
      "ko-KR": /^[0-9ㄱ-ㅎㅏ-ㅣ가-힣]*$/,
      "ku-IQ": /^[٠١٢٣٤٥٦٧٨٩0-9ئابپتجچحخدرڕزژسشعغفڤقکگلڵمنوۆھەیێيطؤثآإأكضصةظذ]+$/i,
      "vi-VN": /^[0-9A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴĐÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ]+$/i,
      ar: /^[٠١٢٣٤٥٦٧٨٩0-9ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيًٌٍَُِّْٰ]+$/,
      he: /^[0-9א-ת]+$/,
      fa: /^['0-9آاءأؤئبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهةی۱۲۳۴۵۶۷۸۹۰']+$/i,
      bn: /^['ঀঁংঃঅআইঈউঊঋঌএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ়ঽািীুূৃৄেৈোৌ্ৎৗড়ঢ়য়ৠৡৢৣ০১২৩৪৫৬৭৮৯ৰৱ৲৳৴৵৶৷৸৹৺৻']+$/,
      eo: /^[0-9ABCĈD-GĜHĤIJĴK-PRSŜTUŬVZ]+$/i,
      "hi-IN": /^[\u0900-\u0963]+[\u0966-\u097F]*$/i,
      "si-LK": /^[0-9\u0D80-\u0DFF]+$/,
      "ta-IN": /^[0-9\u0B80-\u0BFF.]+$/i,
      "te-IN": /^[0-9\u0C00-\u0C7F.]+$/i,
      "kn-IN": /^[0-9\u0C80-\u0CFF.]+$/i,
      "ml-IN": /^[0-9\u0D00-\u0D7F.]+$/i,
      "gu-IN": /^[0-9\u0A80-\u0AFF.]+$/i,
      "pa-IN": /^[0-9\u0A00-\u0A7F.]+$/i,
      "or-IN": /^[0-9\u0B00-\u0B7F.]+$/i
    };
    var decimal = exports2.decimal = {
      "en-US": ".",
      ar: "\u066B"
    };
    var englishLocales = exports2.englishLocales = ["AU", "GB", "HK", "IN", "NZ", "ZA", "ZM"];
    for (i = 0; i < englishLocales.length; i++) {
      locale = "en-".concat(englishLocales[i]);
      alpha[locale] = alpha["en-US"];
      alphanumeric[locale] = alphanumeric["en-US"];
      decimal[locale] = decimal["en-US"];
    }
    var locale;
    var i;
    var arabicLocales = exports2.arabicLocales = ["AE", "BH", "DZ", "EG", "IQ", "JO", "KW", "LB", "LY", "MA", "QM", "QA", "SA", "SD", "SY", "TN", "YE"];
    for (_i = 0; _i < arabicLocales.length; _i++) {
      _locale = "ar-".concat(arabicLocales[_i]);
      alpha[_locale] = alpha.ar;
      alphanumeric[_locale] = alphanumeric.ar;
      decimal[_locale] = decimal.ar;
    }
    var _locale;
    var _i;
    var farsiLocales = exports2.farsiLocales = ["IR", "AF"];
    for (_i2 = 0; _i2 < farsiLocales.length; _i2++) {
      _locale2 = "fa-".concat(farsiLocales[_i2]);
      alphanumeric[_locale2] = alphanumeric.fa;
      decimal[_locale2] = decimal.ar;
    }
    var _locale2;
    var _i2;
    var bengaliLocales = exports2.bengaliLocales = ["BD", "IN"];
    for (_i3 = 0; _i3 < bengaliLocales.length; _i3++) {
      _locale3 = "bn-".concat(bengaliLocales[_i3]);
      alpha[_locale3] = alpha.bn;
      alphanumeric[_locale3] = alphanumeric.bn;
      decimal[_locale3] = decimal["en-US"];
    }
    var _locale3;
    var _i3;
    var dotDecimal = exports2.dotDecimal = ["ar-EG", "ar-LB", "ar-LY"];
    var commaDecimal = exports2.commaDecimal = ["bg-BG", "cs-CZ", "da-DK", "de-DE", "el-GR", "en-ZM", "eo", "es-ES", "fr-CA", "fr-FR", "gu-IN", "hi-IN", "hu-HU", "id-ID", "it-IT", "kk-KZ", "kn-IN", "ku-IQ", "ml-IN", "nb-NO", "nl-NL", "nn-NO", "or-IN", "pa-IN", "pl-PL", "pt-PT", "ru-RU", "si-LK", "sl-SI", "sr-RS", "sr-RS@latin", "sv-SE", "ta-IN", "te-IN", "tr-TR", "uk-UA", "vi-VN"];
    for (_i4 = 0; _i4 < dotDecimal.length; _i4++) {
      decimal[dotDecimal[_i4]] = decimal["en-US"];
    }
    var _i4;
    for (_i5 = 0; _i5 < commaDecimal.length; _i5++) {
      decimal[commaDecimal[_i5]] = ",";
    }
    var _i5;
    alpha["fr-CA"] = alpha["fr-FR"];
    alphanumeric["fr-CA"] = alphanumeric["fr-FR"];
    alpha["pt-BR"] = alpha["pt-PT"];
    alphanumeric["pt-BR"] = alphanumeric["pt-PT"];
    decimal["pt-BR"] = decimal["pt-PT"];
    alpha["pl-Pl"] = alpha["pl-PL"];
    alphanumeric["pl-Pl"] = alphanumeric["pl-PL"];
    decimal["pl-Pl"] = decimal["pl-PL"];
    alpha["fa-AF"] = alpha.fa;
  }
});

// node_modules/validator/lib/isFloat.js
var require_isFloat = __commonJS({
  "node_modules/validator/lib/isFloat.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isFloat;
    exports2.locales = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    var _nullUndefinedCheck = _interopRequireDefault(require_nullUndefinedCheck());
    var _alpha = require_alpha();
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isFloat(str, options) {
      (0, _assertString.default)(str);
      options = options || {};
      var float = new RegExp("^(?:[-+])?(?:[0-9]+)?(?:\\".concat(options.locale ? _alpha.decimal[options.locale] : ".", "[0-9]*)?(?:[eE][\\+\\-]?(?:[0-9]+))?$"));
      if (str === "" || str === "." || str === "," || str === "-" || str === "+") {
        return false;
      }
      var value = parseFloat(str.replace(",", "."));
      return float.test(str) && (!options.hasOwnProperty("min") || (0, _nullUndefinedCheck.default)(options.min) || value >= options.min) && (!options.hasOwnProperty("max") || (0, _nullUndefinedCheck.default)(options.max) || value <= options.max) && (!options.hasOwnProperty("lt") || (0, _nullUndefinedCheck.default)(options.lt) || value < options.lt) && (!options.hasOwnProperty("gt") || (0, _nullUndefinedCheck.default)(options.gt) || value > options.gt);
    }
    var locales = exports2.locales = Object.keys(_alpha.decimal);
  }
});

// node_modules/validator/lib/toFloat.js
var require_toFloat = __commonJS({
  "node_modules/validator/lib/toFloat.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = toFloat;
    var _isFloat = _interopRequireDefault(require_isFloat());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function toFloat(str) {
      if (!(0, _isFloat.default)(str)) return NaN;
      return parseFloat(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/toInt.js
var require_toInt = __commonJS({
  "node_modules/validator/lib/toInt.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = toInt;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function toInt(str, radix) {
      (0, _assertString.default)(str);
      return parseInt(str, radix || 10);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/toBoolean.js
var require_toBoolean = __commonJS({
  "node_modules/validator/lib/toBoolean.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = toBoolean;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function toBoolean(str, strict) {
      (0, _assertString.default)(str);
      if (strict) {
        return str === "1" || /^true$/i.test(str);
      }
      return str !== "0" && !/^false$/i.test(str) && str !== "";
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/equals.js
var require_equals = __commonJS({
  "node_modules/validator/lib/equals.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = equals;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function equals(str, comparison) {
      (0, _assertString.default)(str);
      return str === comparison;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/util/toString.js
var require_toString = __commonJS({
  "node_modules/validator/lib/util/toString.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = toString3;
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function toString3(input) {
      if (_typeof(input) === "object" && input !== null) {
        if (typeof input.toString === "function") {
          input = input.toString();
        } else {
          input = "[object Object]";
        }
      } else if (input === null || typeof input === "undefined" || isNaN(input) && !input.length) {
        input = "";
      }
      return String(input);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/util/merge.js
var require_merge = __commonJS({
  "node_modules/validator/lib/util/merge.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = merge;
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function merge() {
      var obj = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      var defaults = arguments.length > 1 ? arguments[1] : void 0;
      if (_typeof(obj) !== "object" || obj === null) {
        obj = {};
      }
      for (var key in defaults) {
        if (typeof obj[key] === "undefined") {
          obj[key] = defaults[key];
        }
      }
      return obj;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/contains.js
var require_contains = __commonJS({
  "node_modules/validator/lib/contains.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = contains;
    var _assertString = _interopRequireDefault(require_assertString());
    var _toString = _interopRequireDefault(require_toString());
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var defaultContainsOptions = {
      ignoreCase: false,
      minOccurrences: 1
    };
    function contains(str, elem, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, defaultContainsOptions);
      if (options.ignoreCase) {
        return str.toLowerCase().split((0, _toString.default)(elem).toLowerCase()).length > options.minOccurrences;
      }
      return str.split((0, _toString.default)(elem)).length > options.minOccurrences;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/matches.js
var require_matches = __commonJS({
  "node_modules/validator/lib/matches.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = matches;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function matches(str, pattern, modifiers) {
      (0, _assertString.default)(str);
      if (Object.prototype.toString.call(pattern) !== "[object RegExp]") {
        pattern = new RegExp(pattern, modifiers);
      }
      return !!str.match(pattern);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/util/checkHost.js
var require_checkHost = __commonJS({
  "node_modules/validator/lib/util/checkHost.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = checkHost;
    function isRegExp2(obj) {
      return Object.prototype.toString.call(obj) === "[object RegExp]";
    }
    function checkHost(host, matches) {
      for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        if (host === match || isRegExp2(match) && match.test(host)) {
          return true;
        }
      }
      return false;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isByteLength.js
var require_isByteLength = __commonJS({
  "node_modules/validator/lib/isByteLength.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isByteLength;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function isByteLength(str, options) {
      (0, _assertString.default)(str);
      var min;
      var max;
      if (_typeof(options) === "object") {
        min = options.min || 0;
        max = options.max;
      } else {
        min = arguments[1];
        max = arguments[2];
      }
      var len = encodeURI(str).split(/%..|./).length - 1;
      return len >= min && (typeof max === "undefined" || len <= max);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isFQDN.js
var require_isFQDN = __commonJS({
  "node_modules/validator/lib/isFQDN.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isFQDN;
    var _assertString = _interopRequireDefault(require_assertString());
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var default_fqdn_options = {
      require_tld: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_numeric_tld: false,
      allow_wildcard: false,
      ignore_max_length: false
    };
    function isFQDN(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_fqdn_options);
      if (options.allow_trailing_dot && str[str.length - 1] === ".") {
        str = str.substring(0, str.length - 1);
      }
      if (options.allow_wildcard === true && str.indexOf("*.") === 0) {
        str = str.substring(2);
      }
      var parts = str.split(".");
      var tld = parts[parts.length - 1];
      if (options.require_tld) {
        if (parts.length < 2) {
          return false;
        }
        if (!options.allow_numeric_tld && !/^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) {
          return false;
        }
        if (/\s/.test(tld)) {
          return false;
        }
      }
      if (!options.allow_numeric_tld && /^\d+$/.test(tld)) {
        return false;
      }
      return parts.every(function(part) {
        if (part.length > 63 && !options.ignore_max_length) {
          return false;
        }
        if (!/^[a-z_\u00a1-\uffff0-9-]+$/i.test(part)) {
          return false;
        }
        if (/[\uff01-\uff5e]/.test(part)) {
          return false;
        }
        if (/^-|-$/.test(part)) {
          return false;
        }
        if (!options.allow_underscores && /_/.test(part)) {
          return false;
        }
        return true;
      });
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isIP.js
var require_isIP = __commonJS({
  "node_modules/validator/lib/isIP.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isIP;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    var IPv4SegmentFormat = "(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])";
    var IPv4AddressFormat = "(".concat(IPv4SegmentFormat, "[.]){3}").concat(IPv4SegmentFormat);
    var IPv4AddressRegExp = new RegExp("^".concat(IPv4AddressFormat, "$"));
    var IPv6SegmentFormat = "(?:[0-9a-fA-F]{1,4})";
    var IPv6AddressRegExp = new RegExp("^(" + "(?:".concat(IPv6SegmentFormat, ":){7}(?:").concat(IPv6SegmentFormat, "|:)|") + "(?:".concat(IPv6SegmentFormat, ":){6}(?:").concat(IPv4AddressFormat, "|:").concat(IPv6SegmentFormat, "|:)|") + "(?:".concat(IPv6SegmentFormat, ":){5}(?::").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,2}|:)|") + "(?:".concat(IPv6SegmentFormat, ":){4}(?:(:").concat(IPv6SegmentFormat, "){0,1}:").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,3}|:)|") + "(?:".concat(IPv6SegmentFormat, ":){3}(?:(:").concat(IPv6SegmentFormat, "){0,2}:").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,4}|:)|") + "(?:".concat(IPv6SegmentFormat, ":){2}(?:(:").concat(IPv6SegmentFormat, "){0,3}:").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,5}|:)|") + "(?:".concat(IPv6SegmentFormat, ":){1}(?:(:").concat(IPv6SegmentFormat, "){0,4}:").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,6}|:)|") + "(?::((?::".concat(IPv6SegmentFormat, "){0,5}:").concat(IPv4AddressFormat, "|(?::").concat(IPv6SegmentFormat, "){1,7}|:))") + ")(%[0-9a-zA-Z.]{1,})?$");
    function isIP(ipAddress) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      (0, _assertString.default)(ipAddress);
      var version = (_typeof(options) === "object" ? options.version : arguments[1]) || "";
      if (!version) {
        return isIP(ipAddress, {
          version: 4
        }) || isIP(ipAddress, {
          version: 6
        });
      }
      if (version.toString() === "4") {
        return IPv4AddressRegExp.test(ipAddress);
      }
      if (version.toString() === "6") {
        return IPv6AddressRegExp.test(ipAddress);
      }
      return false;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isEmail.js
var require_isEmail = __commonJS({
  "node_modules/validator/lib/isEmail.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isEmail2;
    var _assertString = _interopRequireDefault(require_assertString());
    var _checkHost = _interopRequireDefault(require_checkHost());
    var _isByteLength = _interopRequireDefault(require_isByteLength());
    var _isFQDN = _interopRequireDefault(require_isFQDN());
    var _isIP = _interopRequireDefault(require_isIP());
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var default_email_options = {
      allow_display_name: false,
      allow_underscores: false,
      require_display_name: false,
      allow_utf8_local_part: true,
      require_tld: true,
      blacklisted_chars: "",
      ignore_max_length: false,
      host_blacklist: [],
      host_whitelist: []
    };
    var splitNameAddress = /^([^\x00-\x1F\x7F-\x9F\cX]+)</i;
    var emailUserPart = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~]+$/i;
    var gmailUserPart = /^[a-z\d]+$/;
    var quotedEmailUser = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f]))*$/i;
    var emailUserUtf8Part = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\u00A1-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+$/i;
    var quotedEmailUserUtf8 = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*$/i;
    var defaultMaxEmailLength = 254;
    function validateDisplayName(display_name) {
      var display_name_without_quotes = display_name.replace(/^"(.+)"$/, "$1");
      if (!display_name_without_quotes.trim()) {
        return false;
      }
      var contains_illegal = /[\.";<>]/.test(display_name_without_quotes);
      if (contains_illegal) {
        if (display_name_without_quotes === display_name) {
          return false;
        }
        var all_start_with_back_slash = display_name_without_quotes.split('"').length === display_name_without_quotes.split('\\"').length;
        if (!all_start_with_back_slash) {
          return false;
        }
      }
      return true;
    }
    function isEmail2(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_email_options);
      if (options.require_display_name || options.allow_display_name) {
        var display_email = str.match(splitNameAddress);
        if (display_email) {
          var display_name = display_email[1];
          str = str.replace(display_name, "").replace(/(^<|>$)/g, "");
          if (display_name.endsWith(" ")) {
            display_name = display_name.slice(0, -1);
          }
          if (!validateDisplayName(display_name)) {
            return false;
          }
        } else if (options.require_display_name) {
          return false;
        }
      }
      if (!options.ignore_max_length && str.length > defaultMaxEmailLength) {
        return false;
      }
      var parts = str.split("@");
      var domain = parts.pop();
      var lower_domain = domain.toLowerCase();
      if (options.host_blacklist.length > 0 && (0, _checkHost.default)(lower_domain, options.host_blacklist)) {
        return false;
      }
      if (options.host_whitelist.length > 0 && !(0, _checkHost.default)(lower_domain, options.host_whitelist)) {
        return false;
      }
      var user = parts.join("@");
      if (options.domain_specific_validation && (lower_domain === "gmail.com" || lower_domain === "googlemail.com")) {
        user = user.toLowerCase();
        var username = user.split("+")[0];
        if (!(0, _isByteLength.default)(username.replace(/\./g, ""), {
          min: 6,
          max: 30
        })) {
          return false;
        }
        var _user_parts = username.split(".");
        for (var i = 0; i < _user_parts.length; i++) {
          if (!gmailUserPart.test(_user_parts[i])) {
            return false;
          }
        }
      }
      if (options.ignore_max_length === false && (!(0, _isByteLength.default)(user, {
        max: 64
      }) || !(0, _isByteLength.default)(domain, {
        max: 254
      }))) {
        return false;
      }
      if (!(0, _isFQDN.default)(domain, {
        require_tld: options.require_tld,
        ignore_max_length: options.ignore_max_length,
        allow_underscores: options.allow_underscores
      })) {
        if (!options.allow_ip_domain) {
          return false;
        }
        if (!(0, _isIP.default)(domain)) {
          if (!domain.startsWith("[") || !domain.endsWith("]")) {
            return false;
          }
          var noBracketdomain = domain.slice(1, -1);
          if (noBracketdomain.length === 0 || !(0, _isIP.default)(noBracketdomain)) {
            return false;
          }
        }
      }
      if (options.blacklisted_chars) {
        if (user.search(new RegExp("[".concat(options.blacklisted_chars, "]+"), "g")) !== -1) return false;
      }
      if (user[0] === '"' && user[user.length - 1] === '"') {
        user = user.slice(1, user.length - 1);
        return options.allow_utf8_local_part ? quotedEmailUserUtf8.test(user) : quotedEmailUser.test(user);
      }
      var pattern = options.allow_utf8_local_part ? emailUserUtf8Part : emailUserPart;
      var user_parts = user.split(".");
      for (var _i = 0; _i < user_parts.length; _i++) {
        if (!pattern.test(user_parts[_i])) {
          return false;
        }
      }
      return true;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/util/includesString.js
var require_includesString = __commonJS({
  "node_modules/validator/lib/util/includesString.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var includes = function includes2(str, val) {
      return str.indexOf(val) !== -1;
    };
    var _default = exports2.default = includes;
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isURL.js
var require_isURL = __commonJS({
  "node_modules/validator/lib/isURL.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isURL;
    var _assertString = _interopRequireDefault(require_assertString());
    var _checkHost = _interopRequireDefault(require_checkHost());
    var _includesString = _interopRequireDefault(require_includesString());
    var _isFQDN = _interopRequireDefault(require_isFQDN());
    var _isIP = _interopRequireDefault(require_isIP());
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _slicedToArray(r, e) {
      return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
    }
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _unsupportedIterableToArray(r, a2) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a2);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a2) : void 0;
      }
    }
    function _arrayLikeToArray(r, a2) {
      (null == a2 || a2 > r.length) && (a2 = r.length);
      for (var e = 0, n = Array(a2); e < a2; e++) n[e] = r[e];
      return n;
    }
    function _iterableToArrayLimit(r, l) {
      var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (null != t) {
        var e, n, i, u, a2 = [], f = true, o = false;
        try {
          if (i = (t = t.call(r)).next, 0 === l) {
            if (Object(t) !== t) return;
            f = false;
          } else for (; !(f = (e = i.call(t)).done) && (a2.push(e.value), a2.length !== l); f = true) ;
        } catch (r2) {
          o = true, n = r2;
        } finally {
          try {
            if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
          } finally {
            if (o) throw n;
          }
        }
        return a2;
      }
    }
    function _arrayWithHoles(r) {
      if (Array.isArray(r)) return r;
    }
    var default_url_options = {
      protocols: ["http", "https", "ftp"],
      require_tld: true,
      require_protocol: false,
      require_host: true,
      require_port: false,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
      allow_fragments: true,
      allow_query_components: true,
      validate_length: true,
      max_allowed_length: 2084
    };
    var wrapped_ipv6 = /^\[([^\]]+)\](?::([0-9]+))?$/;
    function isURL(url, options) {
      (0, _assertString.default)(url);
      if (!url || /[\s<>]/.test(url)) {
        return false;
      }
      if (url.indexOf("mailto:") === 0) {
        return false;
      }
      options = (0, _merge.default)(options, default_url_options);
      if (options.validate_length && url.length > options.max_allowed_length) {
        return false;
      }
      if (!options.allow_fragments && (0, _includesString.default)(url, "#")) {
        return false;
      }
      if (!options.allow_query_components && ((0, _includesString.default)(url, "?") || (0, _includesString.default)(url, "&"))) {
        return false;
      }
      var protocol, auth, host, hostname, port, port_str, split, ipv6;
      split = url.split("#");
      url = split.shift();
      split = url.split("?");
      url = split.shift();
      var protocol_match = url.match(/^([a-z][a-z0-9+\-.]*):/i);
      var had_explicit_protocol = false;
      var cleanUpProtocol = function cleanUpProtocol2(potential_protocol2) {
        had_explicit_protocol = true;
        protocol = potential_protocol2.toLowerCase();
        if (options.require_valid_protocol && options.protocols.indexOf(protocol) === -1) {
          return false;
        }
        return url.substring(protocol_match[0].length);
      };
      if (protocol_match) {
        var potential_protocol = protocol_match[1];
        var after_colon = url.substring(protocol_match[0].length);
        var starts_with_slashes = after_colon.slice(0, 2) === "//";
        if (!starts_with_slashes) {
          var first_slash_position = after_colon.indexOf("/");
          var before_slash = first_slash_position === -1 ? after_colon : after_colon.substring(0, first_slash_position);
          var at_position = before_slash.indexOf("@");
          if (at_position !== -1) {
            var before_at = before_slash.substring(0, at_position);
            var valid_auth_regex = /^[a-zA-Z0-9\-_.%:]*$/;
            var is_valid_auth = valid_auth_regex.test(before_at);
            var has_encoded_content = /%[0-9a-fA-F]{2}/.test(before_at);
            if (is_valid_auth && !has_encoded_content) {
              if (options.require_protocol) {
                return false;
              }
            } else {
              url = cleanUpProtocol(potential_protocol);
              if (url === false) {
                return false;
              }
            }
          } else {
            var looks_like_port = /^[0-9]/.test(after_colon);
            if (looks_like_port) {
              if (options.require_protocol) {
                return false;
              }
            } else {
              url = cleanUpProtocol(potential_protocol);
              if (url === false) {
                return false;
              }
            }
          }
        } else {
          url = cleanUpProtocol(potential_protocol);
          if (url === false) {
            return false;
          }
        }
      } else if (options.require_protocol) {
        return false;
      }
      if (url.slice(0, 2) === "//") {
        if (!had_explicit_protocol && !options.allow_protocol_relative_urls) {
          return false;
        }
        url = url.slice(2);
      }
      if (url === "") {
        return false;
      }
      split = url.split("/");
      url = split.shift();
      if (url === "" && !options.require_host) {
        return true;
      }
      split = url.split("@");
      if (split.length > 1) {
        if (options.disallow_auth) {
          return false;
        }
        if (split[0] === "") {
          return false;
        }
        auth = split.shift();
        if (auth.indexOf(":") >= 0 && auth.split(":").length > 2) {
          return false;
        }
        var _auth$split = auth.split(":"), _auth$split2 = _slicedToArray(_auth$split, 2), user = _auth$split2[0], password = _auth$split2[1];
        if (user === "" && password === "") {
          return false;
        }
      }
      hostname = split.join("@");
      port_str = null;
      ipv6 = null;
      var ipv6_match = hostname.match(wrapped_ipv6);
      if (ipv6_match) {
        host = "";
        ipv6 = ipv6_match[1];
        port_str = ipv6_match[2] || null;
      } else {
        split = hostname.split(":");
        host = split.shift();
        if (split.length) {
          port_str = split.join(":");
        }
      }
      if (port_str !== null && port_str.length > 0) {
        port = parseInt(port_str, 10);
        if (!/^[0-9]+$/.test(port_str) || port <= 0 || port > 65535) {
          return false;
        }
      } else if (options.require_port) {
        return false;
      }
      if (options.host_whitelist) {
        return (0, _checkHost.default)(host, options.host_whitelist);
      }
      if (host === "" && !options.require_host) {
        return true;
      }
      if (!(0, _isIP.default)(host) && !(0, _isFQDN.default)(host, options) && (!ipv6 || !(0, _isIP.default)(ipv6, 6))) {
        return false;
      }
      host = host || ipv6;
      if (options.host_blacklist && (0, _checkHost.default)(host, options.host_blacklist)) {
        return false;
      }
      return true;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isMACAddress.js
var require_isMACAddress = __commonJS({
  "node_modules/validator/lib/isMACAddress.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isMACAddress;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var macAddress48 = /^(?:[0-9a-fA-F]{2}([-:\s]))([0-9a-fA-F]{2}\1){4}([0-9a-fA-F]{2})$/;
    var macAddress48NoSeparators = /^([0-9a-fA-F]){12}$/;
    var macAddress48WithDots = /^([0-9a-fA-F]{4}\.){2}([0-9a-fA-F]{4})$/;
    var macAddress64 = /^(?:[0-9a-fA-F]{2}([-:\s]))([0-9a-fA-F]{2}\1){6}([0-9a-fA-F]{2})$/;
    var macAddress64NoSeparators = /^([0-9a-fA-F]){16}$/;
    var macAddress64WithDots = /^([0-9a-fA-F]{4}\.){3}([0-9a-fA-F]{4})$/;
    function isMACAddress(str, options) {
      (0, _assertString.default)(str);
      if (options !== null && options !== void 0 && options.eui) {
        options.eui = String(options.eui);
      }
      if (options !== null && options !== void 0 && options.no_colons || options !== null && options !== void 0 && options.no_separators) {
        if (options.eui === "48") {
          return macAddress48NoSeparators.test(str);
        }
        if (options.eui === "64") {
          return macAddress64NoSeparators.test(str);
        }
        return macAddress48NoSeparators.test(str) || macAddress64NoSeparators.test(str);
      }
      if ((options === null || options === void 0 ? void 0 : options.eui) === "48") {
        return macAddress48.test(str) || macAddress48WithDots.test(str);
      }
      if ((options === null || options === void 0 ? void 0 : options.eui) === "64") {
        return macAddress64.test(str) || macAddress64WithDots.test(str);
      }
      return isMACAddress(str, {
        eui: "48"
      }) || isMACAddress(str, {
        eui: "64"
      });
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isIPRange.js
var require_isIPRange = __commonJS({
  "node_modules/validator/lib/isIPRange.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isIPRange;
    var _assertString = _interopRequireDefault(require_assertString());
    var _isIP = _interopRequireDefault(require_isIP());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var subnetMaybe = /^\d{1,3}$/;
    var v4Subnet = 32;
    var v6Subnet = 128;
    function isIPRange(str) {
      var version = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
      (0, _assertString.default)(str);
      var parts = str.split("/");
      if (parts.length !== 2) {
        return false;
      }
      if (!subnetMaybe.test(parts[1])) {
        return false;
      }
      if (parts[1].length > 1 && parts[1].startsWith("0")) {
        return false;
      }
      var isValidIP = (0, _isIP.default)(parts[0], version);
      if (!isValidIP) {
        return false;
      }
      var expectedSubnet = null;
      switch (String(version)) {
        case "4":
          expectedSubnet = v4Subnet;
          break;
        case "6":
          expectedSubnet = v6Subnet;
          break;
        default:
          expectedSubnet = (0, _isIP.default)(parts[0], "6") ? v6Subnet : v4Subnet;
      }
      return parts[1] <= expectedSubnet && parts[1] >= 0;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isDate.js
var require_isDate = __commonJS({
  "node_modules/validator/lib/isDate.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isDate;
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _slicedToArray(r, e) {
      return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
    }
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _iterableToArrayLimit(r, l) {
      var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (null != t) {
        var e, n, i, u, a2 = [], f = true, o = false;
        try {
          if (i = (t = t.call(r)).next, 0 === l) {
            if (Object(t) !== t) return;
            f = false;
          } else for (; !(f = (e = i.call(t)).done) && (a2.push(e.value), a2.length !== l); f = true) ;
        } catch (r2) {
          o = true, n = r2;
        } finally {
          try {
            if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
          } finally {
            if (o) throw n;
          }
        }
        return a2;
      }
    }
    function _arrayWithHoles(r) {
      if (Array.isArray(r)) return r;
    }
    function _createForOfIteratorHelper(r, e) {
      var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
          t && (r = t);
          var _n = 0, F = function F2() {
          };
          return { s: F, n: function n() {
            return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
          }, e: function e2(r2) {
            throw r2;
          }, f: F };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var o, a2 = true, u = false;
      return { s: function s() {
        t = t.call(r);
      }, n: function n() {
        var r2 = t.next();
        return a2 = r2.done, r2;
      }, e: function e2(r2) {
        u = true, o = r2;
      }, f: function f() {
        try {
          a2 || null == t.return || t.return();
        } finally {
          if (u) throw o;
        }
      } };
    }
    function _unsupportedIterableToArray(r, a2) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a2);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a2) : void 0;
      }
    }
    function _arrayLikeToArray(r, a2) {
      (null == a2 || a2 > r.length) && (a2 = r.length);
      for (var e = 0, n = Array(a2); e < a2; e++) n[e] = r[e];
      return n;
    }
    var default_date_options = {
      format: "YYYY/MM/DD",
      delimiters: ["/", "-"],
      strictMode: false
    };
    function isValidFormat(format) {
      return /(^(y{4}|y{2})[.\/-](m{1,2})[.\/-](d{1,2})$)|(^(m{1,2})[.\/-](d{1,2})[.\/-]((y{4}|y{2})$))|(^(d{1,2})[.\/-](m{1,2})[.\/-]((y{4}|y{2})$))/gi.test(format);
    }
    function zip(date, format) {
      var zippedArr = [], len = Math.max(date.length, format.length);
      for (var i = 0; i < len; i++) {
        zippedArr.push([date[i], format[i]]);
      }
      return zippedArr;
    }
    function isDate(input, options) {
      if (typeof options === "string") {
        options = (0, _merge.default)({
          format: options
        }, default_date_options);
      } else {
        options = (0, _merge.default)(options, default_date_options);
      }
      if (typeof input === "string" && isValidFormat(options.format)) {
        if (options.strictMode && input.length !== options.format.length) return false;
        var formatDelimiter = options.delimiters.find(function(delimiter) {
          return options.format.indexOf(delimiter) !== -1;
        });
        var dateDelimiter = options.strictMode ? formatDelimiter : options.delimiters.find(function(delimiter) {
          return input.indexOf(delimiter) !== -1;
        });
        var dateAndFormat = zip(input.split(dateDelimiter), options.format.toLowerCase().split(formatDelimiter));
        var dateObj = {};
        var _iterator = _createForOfIteratorHelper(dateAndFormat), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var _step$value = _slicedToArray(_step.value, 2), dateWord = _step$value[0], formatWord = _step$value[1];
            if (!dateWord || !formatWord || dateWord.length !== formatWord.length) {
              return false;
            }
            dateObj[formatWord.charAt(0)] = dateWord;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        var fullYear = dateObj.y;
        if (fullYear.startsWith("-")) {
          return false;
        }
        if (dateObj.y.length === 2) {
          var parsedYear = parseInt(dateObj.y, 10);
          if (isNaN(parsedYear)) {
            return false;
          }
          var currentYearLastTwoDigits = (/* @__PURE__ */ new Date()).getFullYear() % 100;
          if (parsedYear < currentYearLastTwoDigits) {
            fullYear = "20".concat(dateObj.y);
          } else {
            fullYear = "19".concat(dateObj.y);
          }
        }
        var month = dateObj.m;
        if (dateObj.m.length === 1) {
          month = "0".concat(dateObj.m);
        }
        var day = dateObj.d;
        if (dateObj.d.length === 1) {
          day = "0".concat(dateObj.d);
        }
        return new Date("".concat(fullYear, "-").concat(month, "-").concat(day, "T00:00:00.000Z")).getUTCDate() === +dateObj.d;
      }
      if (!options.strictMode) {
        return Object.prototype.toString.call(input) === "[object Date]" && isFinite(input);
      }
      return false;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isTime.js
var require_isTime = __commonJS({
  "node_modules/validator/lib/isTime.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isTime;
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var default_time_options = {
      hourFormat: "hour24",
      mode: "default"
    };
    var formats = {
      hour24: {
        default: /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
        withSeconds: /^([01]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/,
        withOptionalSeconds: /^([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/
      },
      hour12: {
        default: /^(0?[1-9]|1[0-2]):([0-5][0-9]) (A|P)M$/,
        withSeconds: /^(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (A|P)M$/,
        withOptionalSeconds: /^(0?[1-9]|1[0-2]):([0-5][0-9])(?::([0-5][0-9]))? (A|P)M$/
      }
    };
    function isTime(input, options) {
      options = (0, _merge.default)(options, default_time_options);
      if (typeof input !== "string") return false;
      return formats[options.hourFormat][options.mode].test(input);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/util/includesArray.js
var require_includesArray = __commonJS({
  "node_modules/validator/lib/util/includesArray.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var includes = function includes2(arr, val) {
      return arr.some(function(arrVal) {
        return val === arrVal;
      });
    };
    var _default = exports2.default = includes;
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isBoolean.js
var require_isBoolean = __commonJS({
  "node_modules/validator/lib/isBoolean.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isBoolean;
    var _assertString = _interopRequireDefault(require_assertString());
    var _includesArray = _interopRequireDefault(require_includesArray());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var defaultOptions = {
      loose: false
    };
    var strictBooleans = ["true", "false", "1", "0"];
    var looseBooleans = [].concat(strictBooleans, ["yes", "no"]);
    function isBoolean(str) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : defaultOptions;
      (0, _assertString.default)(str);
      if (options.loose) {
        return (0, _includesArray.default)(looseBooleans, str.toLowerCase());
      }
      return (0, _includesArray.default)(strictBooleans, str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isLocale.js
var require_isLocale = __commonJS({
  "node_modules/validator/lib/isLocale.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isLocale;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var extlang = "([A-Za-z]{3}(-[A-Za-z]{3}){0,2})";
    var language = "(([a-zA-Z]{2,3}(-".concat(extlang, ")?)|([a-zA-Z]{5,8}))");
    var script = "([A-Za-z]{4})";
    var region = "([A-Za-z]{2}|\\d{3})";
    var variant = "([A-Za-z0-9]{5,8}|(\\d[A-Z-a-z0-9]{3}))";
    var singleton = "(\\d|[A-W]|[Y-Z]|[a-w]|[y-z])";
    var extension = "(".concat(singleton, "(-[A-Za-z0-9]{2,8})+)");
    var privateuse = "(x(-[A-Za-z0-9]{1,8})+)";
    var irregular = "((en-GB-oed)|(i-ami)|(i-bnn)|(i-default)|(i-enochian)|(i-hak)|(i-klingon)|(i-lux)|(i-mingo)|(i-navajo)|(i-pwn)|(i-tao)|(i-tay)|(i-tsu)|(sgn-BE-FR)|(sgn-BE-NL)|(sgn-CH-DE))";
    var regular = "((art-lojban)|(cel-gaulish)|(no-bok)|(no-nyn)|(zh-guoyu)|(zh-hakka)|(zh-min)|(zh-min-nan)|(zh-xiang))";
    var grandfathered = "(".concat(irregular, "|").concat(regular, ")");
    var delimiter = "(-|_)";
    var langtag = "".concat(language, "(").concat(delimiter).concat(script, ")?(").concat(delimiter).concat(region, ")?(").concat(delimiter).concat(variant, ")*(").concat(delimiter).concat(extension, ")*(").concat(delimiter).concat(privateuse, ")?");
    var languageTagRegex = new RegExp("(^".concat(privateuse, "$)|(^").concat(grandfathered, "$)|(^").concat(langtag, "$)"));
    function isLocale(str) {
      (0, _assertString.default)(str);
      return languageTagRegex.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isAbaRouting.js
var require_isAbaRouting = __commonJS({
  "node_modules/validator/lib/isAbaRouting.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isAbaRouting;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var isRoutingReg = /^(?!(1[3-9])|(20)|(3[3-9])|(4[0-9])|(5[0-9])|(60)|(7[3-9])|(8[1-9])|(9[0-2])|(9[3-9]))[0-9]{9}$/;
    function isAbaRouting(str) {
      (0, _assertString.default)(str);
      if (!isRoutingReg.test(str)) return false;
      var checkSumVal = 0;
      for (var i = 0; i < str.length; i++) {
        if (i % 3 === 0) checkSumVal += str[i] * 3;
        else if (i % 3 === 1) checkSumVal += str[i] * 7;
        else checkSumVal += str[i] * 1;
      }
      return checkSumVal % 10 === 0;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isAlpha.js
var require_isAlpha = __commonJS({
  "node_modules/validator/lib/isAlpha.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isAlpha;
    exports2.locales = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    var _alpha = require_alpha();
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isAlpha(_str) {
      var locale = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "en-US";
      var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      (0, _assertString.default)(_str);
      var str = _str;
      var ignore = options.ignore;
      if (ignore) {
        if (ignore instanceof RegExp) {
          str = str.replace(ignore, "");
        } else if (typeof ignore === "string") {
          str = str.replace(new RegExp("[".concat(ignore.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, "\\$&"), "]"), "g"), "");
        } else {
          throw new Error("ignore should be instance of a String or RegExp");
        }
      }
      if (locale in _alpha.alpha) {
        return _alpha.alpha[locale].test(str);
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    var locales = exports2.locales = Object.keys(_alpha.alpha);
  }
});

// node_modules/validator/lib/isAlphanumeric.js
var require_isAlphanumeric = __commonJS({
  "node_modules/validator/lib/isAlphanumeric.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isAlphanumeric;
    exports2.locales = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    var _alpha = require_alpha();
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isAlphanumeric(_str) {
      var locale = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "en-US";
      var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      (0, _assertString.default)(_str);
      var str = _str;
      var ignore = options.ignore;
      if (ignore) {
        if (ignore instanceof RegExp) {
          str = str.replace(ignore, "");
        } else if (typeof ignore === "string") {
          str = str.replace(new RegExp("[".concat(ignore.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, "\\$&"), "]"), "g"), "");
        } else {
          throw new Error("ignore should be instance of a String or RegExp");
        }
      }
      if (locale in _alpha.alphanumeric) {
        return _alpha.alphanumeric[locale].test(str);
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    var locales = exports2.locales = Object.keys(_alpha.alphanumeric);
  }
});

// node_modules/validator/lib/isNumeric.js
var require_isNumeric = __commonJS({
  "node_modules/validator/lib/isNumeric.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isNumeric;
    var _assertString = _interopRequireDefault(require_assertString());
    var _alpha = require_alpha();
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var numericNoSymbols = /^[0-9]+$/;
    function isNumeric(str, options) {
      (0, _assertString.default)(str);
      if (options && options.no_symbols) {
        return numericNoSymbols.test(str);
      }
      return new RegExp("^[+-]?([0-9]*[".concat((options || {}).locale ? _alpha.decimal[options.locale] : ".", "])?[0-9]+$")).test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isPassportNumber.js
var require_isPassportNumber = __commonJS({
  "node_modules/validator/lib/isPassportNumber.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isPassportNumber;
    exports2.locales = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var passportRegexByCountryCode = {
      AM: /^[A-Z]{2}\d{7}$/,
      // ARMENIA
      AR: /^[A-Z]{3}\d{6}$/,
      // ARGENTINA
      AT: /^[A-Z]\d{7}$/,
      // AUSTRIA
      AU: /^[A-Z]\d{7}$/,
      // AUSTRALIA
      AZ: /^[A-Z]{1}\d{8}$/,
      // AZERBAIJAN
      BE: /^[A-Z]{2}\d{6}$/,
      // BELGIUM
      BG: /^\d{9}$/,
      // BULGARIA
      BR: /^[A-Z]{2}\d{6}$/,
      // BRAZIL
      BY: /^[A-Z]{2}\d{7}$/,
      // BELARUS
      CA: /^[A-Z]{2}\d{6}$|^[A-Z]\d{6}[A-Z]{2}$/,
      // CANADA
      CH: /^[A-Z]\d{7}$/,
      // SWITZERLAND
      CN: /^G\d{8}$|^E(?![IO])[A-Z0-9]\d{7}$/,
      // CHINA [G=Ordinary, E=Electronic] followed by 8-digits, or E followed by any UPPERCASE letter (except I and O) followed by 7 digits
      CY: /^[A-Z](\d{6}|\d{8})$/,
      // CYPRUS
      CZ: /^\d{8}$/,
      // CZECH REPUBLIC
      DE: /^[CFGHJKLMNPRTVWXYZ0-9]{9}$/,
      // GERMANY
      DK: /^\d{9}$/,
      // DENMARK
      DZ: /^\d{9}$/,
      // ALGERIA
      EE: /^([A-Z]\d{7}|[A-Z]{2}\d{7})$/,
      // ESTONIA (K followed by 7-digits), e-passports have 2 UPPERCASE followed by 7 digits
      ES: /^[A-Z0-9]{2}([A-Z0-9]?)\d{6}$/,
      // SPAIN
      FI: /^[A-Z]{2}\d{7}$/,
      // FINLAND
      FR: /^\d{2}[A-Z]{2}\d{5}$/,
      // FRANCE
      GB: /^\d{9}$/,
      // UNITED KINGDOM
      GR: /^[A-Z]{2}\d{7}$/,
      // GREECE
      HR: /^\d{9}$/,
      // CROATIA
      HU: /^[A-Z]{2}(\d{6}|\d{7})$/,
      // HUNGARY
      IE: /^[A-Z0-9]{2}\d{7}$/,
      // IRELAND
      IN: /^[A-Z]{1}-?\d{7}$/,
      // INDIA
      ID: /^[A-C]\d{7}$/,
      // INDONESIA
      IR: /^[A-Z]\d{8}$/,
      // IRAN
      IS: /^(A)\d{7}$/,
      // ICELAND
      IT: /^[A-Z0-9]{2}\d{7}$/,
      // ITALY
      JM: /^[Aa]\d{7}$/,
      // JAMAICA
      JP: /^[A-Z]{2}\d{7}$/,
      // JAPAN
      KR: /^[MS]\d{8}$/,
      // SOUTH KOREA, REPUBLIC OF KOREA, [S=PS Passports, M=PM Passports]
      KZ: /^[a-zA-Z]\d{7}$/,
      // KAZAKHSTAN
      LI: /^[a-zA-Z]\d{5}$/,
      // LIECHTENSTEIN
      LT: /^[A-Z0-9]{8}$/,
      // LITHUANIA
      LU: /^[A-Z0-9]{8}$/,
      // LUXEMBURG
      LV: /^[A-Z0-9]{2}\d{7}$/,
      // LATVIA
      LY: /^[A-Z0-9]{8}$/,
      // LIBYA
      MT: /^\d{7}$/,
      // MALTA
      MZ: /^([A-Z]{2}\d{7})|(\d{2}[A-Z]{2}\d{5})$/,
      // MOZAMBIQUE
      MY: /^[AHK]\d{8}$/,
      // MALAYSIA
      MX: /^[A-Z]\d{8}$/,
      // MEXICO
      NL: /^[A-Z]{2}[A-Z0-9]{6}\d$/,
      // NETHERLANDS
      NZ: /^([Ll]([Aa]|[Dd]|[Ff]|[Hh])|[Ee]([Aa]|[Pp])|[Nn])\d{6}$/,
      // NEW ZEALAND
      PH: /^([A-Z](\d{6}|\d{7}[A-Z]))|([A-Z]{2}(\d{6}|\d{7}))$/,
      // PHILIPPINES
      PK: /^[A-Z]{2}\d{7}$/,
      // PAKISTAN
      PL: /^[A-Z]{2}\d{7}$/,
      // POLAND
      PT: /^[A-Z]\d{6}$/,
      // PORTUGAL
      RO: /^\d{8,9}$/,
      // ROMANIA
      RU: /^\d{9}$/,
      // RUSSIAN FEDERATION
      SE: /^\d{8}$/,
      // SWEDEN
      SL: /^(P)[A-Z]\d{7}$/,
      // SLOVENIA
      SK: /^[0-9A-Z]\d{7}$/,
      // SLOVAKIA
      TH: /^[A-Z]{1,2}\d{6,7}$/,
      // THAILAND
      TR: /^[A-Z]\d{8}$/,
      // TURKEY
      UA: /^[A-Z]{2}\d{6}$/,
      // UKRAINE
      US: /^\d{9}$|^[A-Z]\d{8}$/,
      // UNITED STATES
      ZA: /^[TAMD]\d{8}$/
      // SOUTH AFRICA
    };
    var locales = exports2.locales = Object.keys(passportRegexByCountryCode);
    function isPassportNumber(str, countryCode) {
      (0, _assertString.default)(str);
      var normalizedStr = str.replace(/\s/g, "").toUpperCase();
      return countryCode.toUpperCase() in passportRegexByCountryCode && passportRegexByCountryCode[countryCode].test(normalizedStr);
    }
  }
});

// node_modules/validator/lib/isInt.js
var require_isInt = __commonJS({
  "node_modules/validator/lib/isInt.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isInt;
    var _assertString = _interopRequireDefault(require_assertString());
    var _nullUndefinedCheck = _interopRequireDefault(require_nullUndefinedCheck());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var int = /^(?:[-+]?(?:0|[1-9][0-9]*))$/;
    var intLeadingZeroes = /^[-+]?[0-9]+$/;
    function isInt(str, options) {
      (0, _assertString.default)(str);
      options = options || {};
      var regex = options.allow_leading_zeroes === false ? int : intLeadingZeroes;
      var minCheckPassed = !options.hasOwnProperty("min") || (0, _nullUndefinedCheck.default)(options.min) || str >= options.min;
      var maxCheckPassed = !options.hasOwnProperty("max") || (0, _nullUndefinedCheck.default)(options.max) || str <= options.max;
      var ltCheckPassed = !options.hasOwnProperty("lt") || (0, _nullUndefinedCheck.default)(options.lt) || str < options.lt;
      var gtCheckPassed = !options.hasOwnProperty("gt") || (0, _nullUndefinedCheck.default)(options.gt) || str > options.gt;
      return regex.test(str) && minCheckPassed && maxCheckPassed && ltCheckPassed && gtCheckPassed;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isPort.js
var require_isPort = __commonJS({
  "node_modules/validator/lib/isPort.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isPort;
    var _isInt = _interopRequireDefault(require_isInt());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isPort(str) {
      return (0, _isInt.default)(str, {
        allow_leading_zeroes: false,
        min: 0,
        max: 65535
      });
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isLowercase.js
var require_isLowercase = __commonJS({
  "node_modules/validator/lib/isLowercase.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isLowercase;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isLowercase(str) {
      (0, _assertString.default)(str);
      return str === str.toLowerCase();
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isUppercase.js
var require_isUppercase = __commonJS({
  "node_modules/validator/lib/isUppercase.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isUppercase;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isUppercase(str) {
      (0, _assertString.default)(str);
      return str === str.toUpperCase();
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isIMEI.js
var require_isIMEI = __commonJS({
  "node_modules/validator/lib/isIMEI.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isIMEI;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var imeiRegexWithoutHyphens = /^[0-9]{15}$/;
    var imeiRegexWithHyphens = /^\d{2}-\d{6}-\d{6}-\d{1}$/;
    function isIMEI(str, options) {
      (0, _assertString.default)(str);
      options = options || {};
      var imeiRegex = imeiRegexWithoutHyphens;
      if (options.allow_hyphens) {
        imeiRegex = imeiRegexWithHyphens;
      }
      if (!imeiRegex.test(str)) {
        return false;
      }
      str = str.replace(/-/g, "");
      var sum3 = 0, mul = 2, l = 14;
      for (var i = 0; i < l; i++) {
        var digit = str.substring(l - i - 1, l - i);
        var tp = parseInt(digit, 10) * mul;
        if (tp >= 10) {
          sum3 += tp % 10 + 1;
        } else {
          sum3 += tp;
        }
        if (mul === 1) {
          mul += 1;
        } else {
          mul -= 1;
        }
      }
      var chk = (10 - sum3 % 10) % 10;
      if (chk !== parseInt(str.substring(14, 15), 10)) {
        return false;
      }
      return true;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isAscii.js
var require_isAscii = __commonJS({
  "node_modules/validator/lib/isAscii.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isAscii;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var ascii = /^[\x00-\x7F]+$/;
    function isAscii(str) {
      (0, _assertString.default)(str);
      return ascii.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isFullWidth.js
var require_isFullWidth = __commonJS({
  "node_modules/validator/lib/isFullWidth.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isFullWidth;
    exports2.fullWidth = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var fullWidth = exports2.fullWidth = /[^\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/;
    function isFullWidth(str) {
      (0, _assertString.default)(str);
      return fullWidth.test(str);
    }
  }
});

// node_modules/validator/lib/isHalfWidth.js
var require_isHalfWidth = __commonJS({
  "node_modules/validator/lib/isHalfWidth.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isHalfWidth;
    exports2.halfWidth = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var halfWidth = exports2.halfWidth = /[\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/;
    function isHalfWidth(str) {
      (0, _assertString.default)(str);
      return halfWidth.test(str);
    }
  }
});

// node_modules/validator/lib/isVariableWidth.js
var require_isVariableWidth = __commonJS({
  "node_modules/validator/lib/isVariableWidth.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isVariableWidth;
    var _assertString = _interopRequireDefault(require_assertString());
    var _isFullWidth = require_isFullWidth();
    var _isHalfWidth = require_isHalfWidth();
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isVariableWidth(str) {
      (0, _assertString.default)(str);
      return _isFullWidth.fullWidth.test(str) && _isHalfWidth.halfWidth.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isMultibyte.js
var require_isMultibyte = __commonJS({
  "node_modules/validator/lib/isMultibyte.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isMultibyte;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var multibyte = /[^\x00-\x7F]/;
    function isMultibyte(str) {
      (0, _assertString.default)(str);
      return multibyte.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/util/multilineRegex.js
var require_multilineRegex = __commonJS({
  "node_modules/validator/lib/util/multilineRegex.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = multilineRegexp;
    function multilineRegexp(parts, flags) {
      var regexpAsStringLiteral = parts.join("");
      return new RegExp(regexpAsStringLiteral, flags);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isSemVer.js
var require_isSemVer = __commonJS({
  "node_modules/validator/lib/isSemVer.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isSemVer;
    var _assertString = _interopRequireDefault(require_assertString());
    var _multilineRegex = _interopRequireDefault(require_multilineRegex());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var semanticVersioningRegex = (0, _multilineRegex.default)(["^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)", "(?:-((?:0|[1-9]\\d*|\\d*[a-z-][0-9a-z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-z-][0-9a-z-]*))*))", "?(?:\\+([0-9a-z-]+(?:\\.[0-9a-z-]+)*))?$"], "i");
    function isSemVer(str) {
      (0, _assertString.default)(str);
      return semanticVersioningRegex.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isSurrogatePair.js
var require_isSurrogatePair = __commonJS({
  "node_modules/validator/lib/isSurrogatePair.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isSurrogatePair;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
    function isSurrogatePair(str) {
      (0, _assertString.default)(str);
      return surrogatePair.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isDecimal.js
var require_isDecimal = __commonJS({
  "node_modules/validator/lib/isDecimal.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isDecimal;
    var _merge = _interopRequireDefault(require_merge());
    var _assertString = _interopRequireDefault(require_assertString());
    var _includesArray = _interopRequireDefault(require_includesArray());
    var _alpha = require_alpha();
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function decimalRegExp(options) {
      var regExp = new RegExp("^[-+]?([0-9]+)?(\\".concat(_alpha.decimal[options.locale], "[0-9]{").concat(options.decimal_digits, "})").concat(options.force_decimal ? "" : "?", "$"));
      return regExp;
    }
    var default_decimal_options = {
      force_decimal: false,
      decimal_digits: "1,",
      locale: "en-US"
    };
    var blacklist = ["", "-", "+"];
    function isDecimal(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_decimal_options);
      if (options.locale in _alpha.decimal) {
        return !(0, _includesArray.default)(blacklist, str.replace(/ /g, "")) && decimalRegExp(options).test(str);
      }
      throw new Error("Invalid locale '".concat(options.locale, "'"));
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isHexadecimal.js
var require_isHexadecimal = __commonJS({
  "node_modules/validator/lib/isHexadecimal.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isHexadecimal;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var hexadecimal = /^(0x|0h)?[0-9A-F]+$/i;
    function isHexadecimal(str) {
      (0, _assertString.default)(str);
      return hexadecimal.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isOctal.js
var require_isOctal = __commonJS({
  "node_modules/validator/lib/isOctal.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isOctal;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var octal = /^(0o)?[0-7]+$/i;
    function isOctal(str) {
      (0, _assertString.default)(str);
      return octal.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isDivisibleBy.js
var require_isDivisibleBy = __commonJS({
  "node_modules/validator/lib/isDivisibleBy.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isDivisibleBy;
    var _assertString = _interopRequireDefault(require_assertString());
    var _toFloat = _interopRequireDefault(require_toFloat());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isDivisibleBy(str, num) {
      (0, _assertString.default)(str);
      return (0, _toFloat.default)(str) % parseInt(num, 10) === 0;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isHexColor.js
var require_isHexColor = __commonJS({
  "node_modules/validator/lib/isHexColor.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isHexColor;
    var _assertString = _interopRequireDefault(require_assertString());
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var hexcolor = /^#?([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i;
    var hexcolor_with_prefix = /^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i;
    var default_is_hexcolor_options = {
      require_hashtag: false
    };
    function isHexColor(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_is_hexcolor_options);
      var hexcolor_regex = options.require_hashtag ? hexcolor_with_prefix : hexcolor;
      return hexcolor_regex.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isRgbColor.js
var require_isRgbColor = __commonJS({
  "node_modules/validator/lib/isRgbColor.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isRgbColor;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    var rgbColor = /^rgb\((([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),){2}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\)$/;
    var rgbaColor = /^rgba\((([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),){3}(0?\.\d\d?|1(\.0)?|0(\.0)?)\)$/;
    var rgbColorPercent = /^rgb\((([0-9]%|[1-9][0-9]%|100%),){2}([0-9]%|[1-9][0-9]%|100%)\)$/;
    var rgbaColorPercent = /^rgba\((([0-9]%|[1-9][0-9]%|100%),){3}(0?\.\d\d?|1(\.0)?|0(\.0)?)\)$/;
    var startsWithRgb = /^rgba?/;
    function isRgbColor(str, options) {
      (0, _assertString.default)(str);
      var allowSpaces = false;
      var includePercentValues = true;
      if (_typeof(options) !== "object") {
        if (arguments.length >= 2) {
          includePercentValues = arguments[1];
        }
      } else {
        allowSpaces = options.allowSpaces !== void 0 ? options.allowSpaces : allowSpaces;
        includePercentValues = options.includePercentValues !== void 0 ? options.includePercentValues : includePercentValues;
      }
      if (allowSpaces) {
        if (!startsWithRgb.test(str)) {
          return false;
        }
        str = str.replace(/\s/g, "");
      }
      if (!includePercentValues) {
        return rgbColor.test(str) || rgbaColor.test(str);
      }
      return rgbColor.test(str) || rgbaColor.test(str) || rgbColorPercent.test(str) || rgbaColorPercent.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isHSL.js
var require_isHSL = __commonJS({
  "node_modules/validator/lib/isHSL.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isHSL;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var hslComma = /^hsla?\(((\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?))(deg|grad|rad|turn)?(,(\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?)%){2}(,((\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?)%?))?\)$/i;
    var hslSpace = /^hsla?\(((\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?))(deg|grad|rad|turn)?(\s(\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?)%){2}\s?(\/\s((\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?)%?)\s?)?\)$/i;
    function isHSL(str) {
      (0, _assertString.default)(str);
      var strippedStr = str.replace(/\s+/g, " ").replace(/\s?(hsla?\(|\)|,)\s?/ig, "$1");
      if (strippedStr.indexOf(",") !== -1) {
        return hslComma.test(strippedStr);
      }
      return hslSpace.test(strippedStr);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isISRC.js
var require_isISRC = __commonJS({
  "node_modules/validator/lib/isISRC.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isISRC;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var isrc = /^[A-Z]{2}[0-9A-Z]{3}\d{2}\d{5}$/;
    function isISRC(str) {
      (0, _assertString.default)(str);
      return isrc.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isIBAN.js
var require_isIBAN = __commonJS({
  "node_modules/validator/lib/isIBAN.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isIBAN;
    exports2.locales = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    var _includesArray = _interopRequireDefault(require_includesArray());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var ibanRegexThroughCountryCode = {
      AD: /^(AD[0-9]{2})\d{8}[A-Z0-9]{12}$/,
      AE: /^(AE[0-9]{2})\d{3}\d{16}$/,
      AL: /^(AL[0-9]{2})\d{8}[A-Z0-9]{16}$/,
      AT: /^(AT[0-9]{2})\d{16}$/,
      AZ: /^(AZ[0-9]{2})[A-Z0-9]{4}\d{20}$/,
      BA: /^(BA[0-9]{2})\d{16}$/,
      BE: /^(BE[0-9]{2})\d{12}$/,
      BG: /^(BG[0-9]{2})[A-Z]{4}\d{6}[A-Z0-9]{8}$/,
      BH: /^(BH[0-9]{2})[A-Z]{4}[A-Z0-9]{14}$/,
      BR: /^(BR[0-9]{2})\d{23}[A-Z]{1}[A-Z0-9]{1}$/,
      BY: /^(BY[0-9]{2})[A-Z0-9]{4}\d{20}$/,
      CH: /^(CH[0-9]{2})\d{5}[A-Z0-9]{12}$/,
      CR: /^(CR[0-9]{2})\d{18}$/,
      CY: /^(CY[0-9]{2})\d{8}[A-Z0-9]{16}$/,
      CZ: /^(CZ[0-9]{2})\d{20}$/,
      DE: /^(DE[0-9]{2})\d{18}$/,
      DK: /^(DK[0-9]{2})\d{14}$/,
      DO: /^(DO[0-9]{2})[A-Z]{4}\d{20}$/,
      DZ: /^(DZ\d{24})$/,
      EE: /^(EE[0-9]{2})\d{16}$/,
      EG: /^(EG[0-9]{2})\d{25}$/,
      ES: /^(ES[0-9]{2})\d{20}$/,
      FI: /^(FI[0-9]{2})\d{14}$/,
      FO: /^(FO[0-9]{2})\d{14}$/,
      FR: /^(FR[0-9]{2})\d{10}[A-Z0-9]{11}\d{2}$/,
      GB: /^(GB[0-9]{2})[A-Z]{4}\d{14}$/,
      GE: /^(GE[0-9]{2})[A-Z0-9]{2}\d{16}$/,
      GI: /^(GI[0-9]{2})[A-Z]{4}[A-Z0-9]{15}$/,
      GL: /^(GL[0-9]{2})\d{14}$/,
      GR: /^(GR[0-9]{2})\d{7}[A-Z0-9]{16}$/,
      GT: /^(GT[0-9]{2})[A-Z0-9]{4}[A-Z0-9]{20}$/,
      HR: /^(HR[0-9]{2})\d{17}$/,
      HU: /^(HU[0-9]{2})\d{24}$/,
      IE: /^(IE[0-9]{2})[A-Z]{4}\d{14}$/,
      IL: /^(IL[0-9]{2})\d{19}$/,
      IQ: /^(IQ[0-9]{2})[A-Z]{4}\d{15}$/,
      IR: /^(IR[0-9]{2})\d{22}$/,
      IS: /^(IS[0-9]{2})\d{22}$/,
      IT: /^(IT[0-9]{2})[A-Z]{1}\d{10}[A-Z0-9]{12}$/,
      JO: /^(JO[0-9]{2})[A-Z]{4}\d{22}$/,
      KW: /^(KW[0-9]{2})[A-Z]{4}[A-Z0-9]{22}$/,
      KZ: /^(KZ[0-9]{2})\d{3}[A-Z0-9]{13}$/,
      LB: /^(LB[0-9]{2})\d{4}[A-Z0-9]{20}$/,
      LC: /^(LC[0-9]{2})[A-Z]{4}[A-Z0-9]{24}$/,
      LI: /^(LI[0-9]{2})\d{5}[A-Z0-9]{12}$/,
      LT: /^(LT[0-9]{2})\d{16}$/,
      LU: /^(LU[0-9]{2})\d{3}[A-Z0-9]{13}$/,
      LV: /^(LV[0-9]{2})[A-Z]{4}[A-Z0-9]{13}$/,
      MA: /^(MA[0-9]{26})$/,
      MC: /^(MC[0-9]{2})\d{10}[A-Z0-9]{11}\d{2}$/,
      MD: /^(MD[0-9]{2})[A-Z0-9]{20}$/,
      ME: /^(ME[0-9]{2})\d{18}$/,
      MK: /^(MK[0-9]{2})\d{3}[A-Z0-9]{10}\d{2}$/,
      MR: /^(MR[0-9]{2})\d{23}$/,
      MT: /^(MT[0-9]{2})[A-Z]{4}\d{5}[A-Z0-9]{18}$/,
      MU: /^(MU[0-9]{2})[A-Z]{4}\d{19}[A-Z]{3}$/,
      MZ: /^(MZ[0-9]{2})\d{21}$/,
      NL: /^(NL[0-9]{2})[A-Z]{4}\d{10}$/,
      NO: /^(NO[0-9]{2})\d{11}$/,
      PK: /^(PK[0-9]{2})[A-Z0-9]{4}\d{16}$/,
      PL: /^(PL[0-9]{2})\d{24}$/,
      PS: /^(PS[0-9]{2})[A-Z]{4}[A-Z0-9]{21}$/,
      PT: /^(PT[0-9]{2})\d{21}$/,
      QA: /^(QA[0-9]{2})[A-Z]{4}[A-Z0-9]{21}$/,
      RO: /^(RO[0-9]{2})[A-Z]{4}[A-Z0-9]{16}$/,
      RS: /^(RS[0-9]{2})\d{18}$/,
      SA: /^(SA[0-9]{2})\d{2}[A-Z0-9]{18}$/,
      SC: /^(SC[0-9]{2})[A-Z]{4}\d{20}[A-Z]{3}$/,
      SE: /^(SE[0-9]{2})\d{20}$/,
      SI: /^(SI[0-9]{2})\d{15}$/,
      SK: /^(SK[0-9]{2})\d{20}$/,
      SM: /^(SM[0-9]{2})[A-Z]{1}\d{10}[A-Z0-9]{12}$/,
      SV: /^(SV[0-9]{2})[A-Z0-9]{4}\d{20}$/,
      TL: /^(TL[0-9]{2})\d{19}$/,
      TN: /^(TN[0-9]{2})\d{20}$/,
      TR: /^(TR[0-9]{2})\d{5}[A-Z0-9]{17}$/,
      UA: /^(UA[0-9]{2})\d{6}[A-Z0-9]{19}$/,
      VA: /^(VA[0-9]{2})\d{18}$/,
      VG: /^(VG[0-9]{2})[A-Z]{4}\d{16}$/,
      XK: /^(XK[0-9]{2})\d{16}$/
    };
    function hasOnlyValidCountryCodes(countryCodeArray) {
      var countryCodeArrayFilteredWithObjectIbanCode = countryCodeArray.filter(function(countryCode) {
        return !(countryCode in ibanRegexThroughCountryCode);
      });
      return countryCodeArrayFilteredWithObjectIbanCode.length === 0;
    }
    function hasValidIbanFormat(str, options) {
      var strippedStr = str.replace(/[\s\-]+/gi, "").toUpperCase();
      var isoCountryCode = strippedStr.slice(0, 2).toUpperCase();
      var isoCountryCodeInIbanRegexCodeObject = isoCountryCode in ibanRegexThroughCountryCode;
      if (options.whitelist) {
        if (!hasOnlyValidCountryCodes(options.whitelist)) {
          return false;
        }
        var isoCountryCodeInWhiteList = (0, _includesArray.default)(options.whitelist, isoCountryCode);
        if (!isoCountryCodeInWhiteList) {
          return false;
        }
      }
      if (options.blacklist) {
        var isoCountryCodeInBlackList = (0, _includesArray.default)(options.blacklist, isoCountryCode);
        if (isoCountryCodeInBlackList) {
          return false;
        }
      }
      return isoCountryCodeInIbanRegexCodeObject && ibanRegexThroughCountryCode[isoCountryCode].test(strippedStr);
    }
    function hasValidIbanChecksum(str) {
      var strippedStr = str.replace(/[^A-Z0-9]+/gi, "").toUpperCase();
      var rearranged = strippedStr.slice(4) + strippedStr.slice(0, 4);
      var alphaCapsReplacedWithDigits = rearranged.replace(/[A-Z]/g, function(char) {
        return char.charCodeAt(0) - 55;
      });
      var remainder = alphaCapsReplacedWithDigits.match(/\d{1,7}/g).reduce(function(acc, value) {
        return Number(acc + value) % 97;
      }, "");
      return remainder === 1;
    }
    function isIBAN(str) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      (0, _assertString.default)(str);
      return hasValidIbanFormat(str, options) && hasValidIbanChecksum(str);
    }
    var locales = exports2.locales = Object.keys(ibanRegexThroughCountryCode);
  }
});

// node_modules/validator/lib/isISO31661Alpha2.js
var require_isISO31661Alpha2 = __commonJS({
  "node_modules/validator/lib/isISO31661Alpha2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.CountryCodes = void 0;
    exports2.default = isISO31661Alpha2;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var validISO31661Alpha2CountriesCodes = /* @__PURE__ */ new Set(["AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"]);
    var alpha2CountryCode = /^[a-zA-Z]{2}$/;
    function isISO31661Alpha2(str) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      (0, _assertString.default)(str);
      var userAssignedCodes = options.userAssignedCodes;
      var validUserAssignedCodes = (userAssignedCodes || []).reduce(function(accumulator, userAssignedCode) {
        if (alpha2CountryCode.test(userAssignedCode)) {
          accumulator.push(userAssignedCode.toUpperCase());
        }
        return accumulator;
      }, []);
      if (validUserAssignedCodes.includes(str.toUpperCase())) {
        return true;
      }
      return validISO31661Alpha2CountriesCodes.has(str.toUpperCase());
    }
    var CountryCodes = exports2.CountryCodes = validISO31661Alpha2CountriesCodes;
  }
});

// node_modules/validator/lib/isBIC.js
var require_isBIC = __commonJS({
  "node_modules/validator/lib/isBIC.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isBIC;
    var _assertString = _interopRequireDefault(require_assertString());
    var _isISO31661Alpha = require_isISO31661Alpha2();
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var isBICReg = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;
    function isBIC(str) {
      (0, _assertString.default)(str);
      var countryCode = str.slice(4, 6).toUpperCase();
      if (!_isISO31661Alpha.CountryCodes.has(countryCode) && countryCode !== "XK") {
        return false;
      }
      return isBICReg.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isMD5.js
var require_isMD5 = __commonJS({
  "node_modules/validator/lib/isMD5.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isMD5;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var md5 = /^[a-f0-9]{32}$/;
    function isMD5(str) {
      (0, _assertString.default)(str);
      return md5.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isHash.js
var require_isHash = __commonJS({
  "node_modules/validator/lib/isHash.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isHash;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var lengths = {
      md5: 32,
      md4: 32,
      sha1: 40,
      sha256: 64,
      sha384: 96,
      sha512: 128,
      ripemd128: 32,
      ripemd160: 40,
      tiger128: 32,
      tiger160: 40,
      tiger192: 48,
      crc32: 8,
      crc32b: 8
    };
    function isHash(str, algorithm) {
      (0, _assertString.default)(str);
      var hash = new RegExp("^[a-fA-F0-9]{".concat(lengths[algorithm], "}$"));
      return hash.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isBase64.js
var require_isBase64 = __commonJS({
  "node_modules/validator/lib/isBase64.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isBase64;
    var _assertString = _interopRequireDefault(require_assertString());
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var base64WithPadding = /^[A-Za-z0-9+/]+={0,2}$/;
    var base64WithoutPadding = /^[A-Za-z0-9+/]+$/;
    var base64UrlWithPadding = /^[A-Za-z0-9_-]+={0,2}$/;
    var base64UrlWithoutPadding = /^[A-Za-z0-9_-]+$/;
    function isBase64(str, options) {
      var _options;
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, {
        urlSafe: false,
        padding: !((_options = options) !== null && _options !== void 0 && _options.urlSafe)
      });
      if (str === "") return true;
      if (options.padding && str.length % 4 !== 0) return false;
      var regex;
      if (options.urlSafe) {
        regex = options.padding ? base64UrlWithPadding : base64UrlWithoutPadding;
      } else {
        regex = options.padding ? base64WithPadding : base64WithoutPadding;
      }
      return (!options.padding || str.length % 4 === 0) && regex.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isJWT.js
var require_isJWT = __commonJS({
  "node_modules/validator/lib/isJWT.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isJWT;
    var _assertString = _interopRequireDefault(require_assertString());
    var _isBase = _interopRequireDefault(require_isBase64());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isJWT(str) {
      (0, _assertString.default)(str);
      var dotSplit = str.split(".");
      var len = dotSplit.length;
      if (len !== 3) {
        return false;
      }
      return dotSplit.reduce(function(acc, currElem) {
        return acc && (0, _isBase.default)(currElem, {
          urlSafe: true
        });
      }, true);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isJSON.js
var require_isJSON = __commonJS({
  "node_modules/validator/lib/isJSON.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isJSON;
    var _assertString = _interopRequireDefault(require_assertString());
    var _includesArray = _interopRequireDefault(require_includesArray());
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    var default_json_options = {
      allow_primitives: false,
      allow_any_value: false
    };
    function isJSON(str, options) {
      (0, _assertString.default)(str);
      try {
        options = (0, _merge.default)(options, default_json_options);
        var obj = JSON.parse(str);
        if (options.allow_any_value) {
          return true;
        }
        var primitives = [];
        if (options.allow_primitives) {
          primitives = [null, false, true];
        }
        return (0, _includesArray.default)(primitives, obj) || !!obj && _typeof(obj) === "object";
      } catch (e) {
      }
      return false;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isEmpty.js
var require_isEmpty = __commonJS({
  "node_modules/validator/lib/isEmpty.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isEmpty;
    var _assertString = _interopRequireDefault(require_assertString());
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var default_is_empty_options = {
      ignore_whitespace: false
    };
    function isEmpty(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_is_empty_options);
      return (options.ignore_whitespace ? str.trim().length : str.length) === 0;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isLength.js
var require_isLength = __commonJS({
  "node_modules/validator/lib/isLength.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isLength2;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function isLength2(str, options) {
      (0, _assertString.default)(str);
      var min;
      var max;
      if (_typeof(options) === "object") {
        min = options.min || 0;
        max = options.max;
      } else {
        min = arguments[1] || 0;
        max = arguments[2];
      }
      var presentationSequences = str.match(/[^\uFE0F\uFE0E][\uFE0F\uFE0E]/g) || [];
      var surrogatePairs = str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || [];
      var len = str.length - presentationSequences.length - surrogatePairs.length;
      var isInsideRange = len >= min && (typeof max === "undefined" || len <= max);
      if (isInsideRange && Array.isArray(options === null || options === void 0 ? void 0 : options.discreteLengths)) {
        return options.discreteLengths.some(function(discreteLen) {
          return discreteLen === len;
        });
      }
      return isInsideRange;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isULID.js
var require_isULID = __commonJS({
  "node_modules/validator/lib/isULID.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isULID;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isULID(str) {
      (0, _assertString.default)(str);
      return /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isUUID.js
var require_isUUID = __commonJS({
  "node_modules/validator/lib/isUUID.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isUUID;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var uuid = {
      1: /^[0-9A-F]{8}-[0-9A-F]{4}-1[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      2: /^[0-9A-F]{8}-[0-9A-F]{4}-2[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      3: /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      4: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      5: /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      6: /^[0-9A-F]{8}-[0-9A-F]{4}-6[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      7: /^[0-9A-F]{8}-[0-9A-F]{4}-7[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      8: /^[0-9A-F]{8}-[0-9A-F]{4}-8[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      nil: /^00000000-0000-0000-0000-000000000000$/i,
      max: /^ffffffff-ffff-ffff-ffff-ffffffffffff$/i,
      loose: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      // From https://github.com/uuidjs/uuid/blob/main/src/regex.js
      all: /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i
    };
    function isUUID(str, version) {
      (0, _assertString.default)(str);
      if (version === void 0 || version === null) {
        version = "all";
      }
      return version in uuid ? uuid[version].test(str) : false;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isMongoId.js
var require_isMongoId = __commonJS({
  "node_modules/validator/lib/isMongoId.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isMongoId;
    var _assertString = _interopRequireDefault(require_assertString());
    var _isHexadecimal = _interopRequireDefault(require_isHexadecimal());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isMongoId(str) {
      (0, _assertString.default)(str);
      return (0, _isHexadecimal.default)(str) && str.length === 24;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isAfter.js
var require_isAfter = __commonJS({
  "node_modules/validator/lib/isAfter.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isAfter;
    var _toDate = _interopRequireDefault(require_toDate());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function isAfter(date, options) {
      var comparisonDate = (_typeof(options) === "object" ? options.comparisonDate : options) || Date().toString();
      var comparison = (0, _toDate.default)(comparisonDate);
      var original = (0, _toDate.default)(date);
      return !!(original && comparison && original > comparison);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isBefore.js
var require_isBefore = __commonJS({
  "node_modules/validator/lib/isBefore.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isBefore;
    var _toDate = _interopRequireDefault(require_toDate());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function isBefore(date, options) {
      var comparisonDate = (_typeof(options) === "object" ? options.comparisonDate : options) || Date().toString();
      var comparison = (0, _toDate.default)(comparisonDate);
      var original = (0, _toDate.default)(date);
      return !!(original && comparison && original < comparison);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isIn.js
var require_isIn = __commonJS({
  "node_modules/validator/lib/isIn.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isIn;
    var _assertString = _interopRequireDefault(require_assertString());
    var _toString = _interopRequireDefault(require_toString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function isIn(str, options) {
      (0, _assertString.default)(str);
      var i;
      if (Object.prototype.toString.call(options) === "[object Array]") {
        var array2 = [];
        for (i in options) {
          if ({}.hasOwnProperty.call(options, i)) {
            array2[i] = (0, _toString.default)(options[i]);
          }
        }
        return array2.indexOf(str) >= 0;
      } else if (_typeof(options) === "object") {
        return options.hasOwnProperty(str);
      } else if (options && typeof options.indexOf === "function") {
        return options.indexOf(str) >= 0;
      }
      return false;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isLuhnNumber.js
var require_isLuhnNumber = __commonJS({
  "node_modules/validator/lib/isLuhnNumber.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isLuhnNumber;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isLuhnNumber(str) {
      (0, _assertString.default)(str);
      var sanitized = str.replace(/[- ]+/g, "");
      var sum3 = 0;
      var digit;
      var tmpNum;
      var shouldDouble;
      for (var i = sanitized.length - 1; i >= 0; i--) {
        digit = sanitized.substring(i, i + 1);
        tmpNum = parseInt(digit, 10);
        if (shouldDouble) {
          tmpNum *= 2;
          if (tmpNum >= 10) {
            sum3 += tmpNum % 10 + 1;
          } else {
            sum3 += tmpNum;
          }
        } else {
          sum3 += tmpNum;
        }
        shouldDouble = !shouldDouble;
      }
      return !!(sum3 % 10 === 0 ? sanitized : false);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isCreditCard.js
var require_isCreditCard = __commonJS({
  "node_modules/validator/lib/isCreditCard.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isCreditCard;
    var _assertString = _interopRequireDefault(require_assertString());
    var _isLuhnNumber = _interopRequireDefault(require_isLuhnNumber());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var cards = {
      amex: /^3[47][0-9]{13}$/,
      dinersclub: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
      discover: /^6(?:011|5[0-9][0-9])[0-9]{12,15}$/,
      jcb: /^(?:2131|1800|35\d{3})\d{11}$/,
      mastercard: /^5[1-5][0-9]{2}|(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/,
      // /^[25][1-7][0-9]{14}$/;
      unionpay: /^(6[27][0-9]{14}|^(81[0-9]{14,17}))$/,
      visa: /^(?:4[0-9]{12})(?:[0-9]{3,6})?$/
    };
    var allCards = (function() {
      var tmpCardsArray = [];
      for (var cardProvider in cards) {
        if (cards.hasOwnProperty(cardProvider)) {
          tmpCardsArray.push(cards[cardProvider]);
        }
      }
      return tmpCardsArray;
    })();
    function isCreditCard(card) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      (0, _assertString.default)(card);
      var provider = options.provider;
      var sanitized = card.replace(/[- ]+/g, "");
      if (provider && provider.toLowerCase() in cards) {
        if (!cards[provider.toLowerCase()].test(sanitized)) {
          return false;
        }
      } else if (provider && !(provider.toLowerCase() in cards)) {
        throw new Error("".concat(provider, " is not a valid credit card provider."));
      } else if (!allCards.some(function(cardProvider) {
        return cardProvider.test(sanitized);
      })) {
        return false;
      }
      return (0, _isLuhnNumber.default)(card);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isIdentityCard.js
var require_isIdentityCard = __commonJS({
  "node_modules/validator/lib/isIdentityCard.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isIdentityCard;
    var _assertString = _interopRequireDefault(require_assertString());
    var _includesArray = _interopRequireDefault(require_includesArray());
    var _isInt = _interopRequireDefault(require_isInt());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var validators = {
      PL: function PL(str) {
        (0, _assertString.default)(str);
        var weightOfDigits = {
          1: 1,
          2: 3,
          3: 7,
          4: 9,
          5: 1,
          6: 3,
          7: 7,
          8: 9,
          9: 1,
          10: 3,
          11: 0
        };
        if (str != null && str.length === 11 && (0, _isInt.default)(str, {
          allow_leading_zeroes: true
        })) {
          var digits = str.split("").slice(0, -1);
          var sum3 = digits.reduce(function(acc, digit, index) {
            return acc + Number(digit) * weightOfDigits[index + 1];
          }, 0);
          var modulo = sum3 % 10;
          var lastDigit = Number(str.charAt(str.length - 1));
          if (modulo === 0 && lastDigit === 0 || lastDigit === 10 - modulo) {
            return true;
          }
        }
        return false;
      },
      ES: function ES(str) {
        (0, _assertString.default)(str);
        var DNI = /^[0-9X-Z][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
        var charsValue = {
          X: 0,
          Y: 1,
          Z: 2
        };
        var controlDigits = ["T", "R", "W", "A", "G", "M", "Y", "F", "P", "D", "X", "B", "N", "J", "Z", "S", "Q", "V", "H", "L", "C", "K", "E"];
        var sanitized = str.trim().toUpperCase();
        if (!DNI.test(sanitized)) {
          return false;
        }
        var number = sanitized.slice(0, -1).replace(/[X,Y,Z]/g, function(char) {
          return charsValue[char];
        });
        return sanitized.endsWith(controlDigits[number % 23]);
      },
      FI: function FI(str) {
        (0, _assertString.default)(str);
        if (str.length !== 11) {
          return false;
        }
        if (!str.match(/^\d{6}[\-A\+]\d{3}[0-9ABCDEFHJKLMNPRSTUVWXY]{1}$/)) {
          return false;
        }
        var checkDigits = "0123456789ABCDEFHJKLMNPRSTUVWXY";
        var idAsNumber = parseInt(str.slice(0, 6), 10) * 1e3 + parseInt(str.slice(7, 10), 10);
        var remainder = idAsNumber % 31;
        var checkDigit = checkDigits[remainder];
        return checkDigit === str.slice(10, 11);
      },
      IN: function IN(str) {
        var DNI = /^[1-9]\d{3}\s?\d{4}\s?\d{4}$/;
        var d2 = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
        var p2 = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
        var sanitized = str.trim();
        if (!DNI.test(sanitized)) {
          return false;
        }
        var c = 0;
        var invertedArray = sanitized.replace(/\s/g, "").split("").map(Number).reverse();
        invertedArray.forEach(function(val, i) {
          c = d2[c][p2[i % 8][val]];
        });
        return c === 0;
      },
      IR: function IR(str) {
        if (!str.match(/^\d{10}$/)) return false;
        str = "0000".concat(str).slice(str.length - 6);
        if (parseInt(str.slice(3, 9), 10) === 0) return false;
        var lastNumber = parseInt(str.slice(9, 10), 10);
        var sum3 = 0;
        for (var i = 0; i < 9; i++) {
          sum3 += parseInt(str.slice(i, i + 1), 10) * (10 - i);
        }
        sum3 %= 11;
        return sum3 < 2 && lastNumber === sum3 || sum3 >= 2 && lastNumber === 11 - sum3;
      },
      IT: function IT(str) {
        if (str.length !== 9) return false;
        if (str === "CA00000AA") return false;
        return str.search(/C[A-Z]\d{5}[A-Z]{2}/i) > -1;
      },
      NO: function NO(str) {
        var sanitized = str.trim();
        if (isNaN(Number(sanitized))) return false;
        if (sanitized.length !== 11) return false;
        if (sanitized === "00000000000") return false;
        var f = sanitized.split("").map(Number);
        var k1 = (11 - (3 * f[0] + 7 * f[1] + 6 * f[2] + 1 * f[3] + 8 * f[4] + 9 * f[5] + 4 * f[6] + 5 * f[7] + 2 * f[8]) % 11) % 11;
        var k2 = (11 - (5 * f[0] + 4 * f[1] + 3 * f[2] + 2 * f[3] + 7 * f[4] + 6 * f[5] + 5 * f[6] + 4 * f[7] + 3 * f[8] + 2 * k1) % 11) % 11;
        if (k1 !== f[9] || k2 !== f[10]) return false;
        return true;
      },
      TH: function TH(str) {
        if (!str.match(/^[1-8]\d{12}$/)) return false;
        var sum3 = 0;
        for (var i = 0; i < 12; i++) {
          sum3 += parseInt(str[i], 10) * (13 - i);
        }
        return str[12] === ((11 - sum3 % 11) % 10).toString();
      },
      LK: function LK(str) {
        var old_nic = /^[1-9]\d{8}[vx]$/i;
        var new_nic = /^[1-9]\d{11}$/i;
        if (str.length === 10 && old_nic.test(str)) return true;
        else if (str.length === 12 && new_nic.test(str)) return true;
        return false;
      },
      "he-IL": function heIL(str) {
        var DNI = /^\d{9}$/;
        var sanitized = str.trim();
        if (!DNI.test(sanitized)) {
          return false;
        }
        var id = sanitized;
        var sum3 = 0, incNum;
        for (var i = 0; i < id.length; i++) {
          incNum = Number(id[i]) * (i % 2 + 1);
          sum3 += incNum > 9 ? incNum - 9 : incNum;
        }
        return sum3 % 10 === 0;
      },
      "ar-LY": function arLY(str) {
        var NIN = /^(1|2)\d{11}$/;
        var sanitized = str.trim();
        return NIN.test(sanitized);
      },
      "ar-TN": function arTN(str) {
        var DNI = /^\d{8}$/;
        var sanitized = str.trim();
        return DNI.test(sanitized);
      },
      "zh-CN": function zhCN(str) {
        var provincesAndCities = [
          "11",
          // 北京
          "12",
          // 天津
          "13",
          // 河北
          "14",
          // 山西
          "15",
          // 内蒙古
          "21",
          // 辽宁
          "22",
          // 吉林
          "23",
          // 黑龙江
          "31",
          // 上海
          "32",
          // 江苏
          "33",
          // 浙江
          "34",
          // 安徽
          "35",
          // 福建
          "36",
          // 江西
          "37",
          // 山东
          "41",
          // 河南
          "42",
          // 湖北
          "43",
          // 湖南
          "44",
          // 广东
          "45",
          // 广西
          "46",
          // 海南
          "50",
          // 重庆
          "51",
          // 四川
          "52",
          // 贵州
          "53",
          // 云南
          "54",
          // 西藏
          "61",
          // 陕西
          "62",
          // 甘肃
          "63",
          // 青海
          "64",
          // 宁夏
          "65",
          // 新疆
          "71",
          // 台湾
          "81",
          // 香港
          "82",
          // 澳门
          "91"
          // 国外
        ];
        var powers = ["7", "9", "10", "5", "8", "4", "2", "1", "6", "3", "7", "9", "10", "5", "8", "4", "2"];
        var parityBit = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
        var checkAddressCode = function checkAddressCode2(addressCode) {
          return (0, _includesArray.default)(provincesAndCities, addressCode);
        };
        var checkBirthDayCode = function checkBirthDayCode2(birDayCode) {
          var yyyy = parseInt(birDayCode.substring(0, 4), 10);
          var mm = parseInt(birDayCode.substring(4, 6), 10);
          var dd = parseInt(birDayCode.substring(6), 10);
          var xdata = new Date(yyyy, mm - 1, dd);
          if (xdata > /* @__PURE__ */ new Date()) {
            return false;
          } else if (xdata.getFullYear() === yyyy && xdata.getMonth() === mm - 1 && xdata.getDate() === dd) {
            return true;
          }
          return false;
        };
        var getParityBit = function getParityBit2(idCardNo) {
          var id17 = idCardNo.substring(0, 17);
          var power = 0;
          for (var i = 0; i < 17; i++) {
            power += parseInt(id17.charAt(i), 10) * parseInt(powers[i], 10);
          }
          var mod = power % 11;
          return parityBit[mod];
        };
        var checkParityBit = function checkParityBit2(idCardNo) {
          return getParityBit(idCardNo) === idCardNo.charAt(17).toUpperCase();
        };
        var check15IdCardNo = function check15IdCardNo2(idCardNo) {
          var check = /^[1-9]\d{7}((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))\d{3}$/.test(idCardNo);
          if (!check) return false;
          var addressCode = idCardNo.substring(0, 2);
          check = checkAddressCode(addressCode);
          if (!check) return false;
          var birDayCode = "19".concat(idCardNo.substring(6, 12));
          check = checkBirthDayCode(birDayCode);
          if (!check) return false;
          return true;
        };
        var check18IdCardNo = function check18IdCardNo2(idCardNo) {
          var check = /^[1-9]\d{5}[1-9]\d{3}((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))\d{3}(\d|x|X)$/.test(idCardNo);
          if (!check) return false;
          var addressCode = idCardNo.substring(0, 2);
          check = checkAddressCode(addressCode);
          if (!check) return false;
          var birDayCode = idCardNo.substring(6, 14);
          check = checkBirthDayCode(birDayCode);
          if (!check) return false;
          return checkParityBit(idCardNo);
        };
        var checkIdCardNo = function checkIdCardNo2(idCardNo) {
          var check = /^\d{15}|(\d{17}(\d|x|X))$/.test(idCardNo);
          if (!check) return false;
          if (idCardNo.length === 15) {
            return check15IdCardNo(idCardNo);
          }
          return check18IdCardNo(idCardNo);
        };
        return checkIdCardNo(str);
      },
      "zh-HK": function zhHK(str) {
        str = str.trim();
        var regexHKID = /^[A-Z]{1,2}[0-9]{6}((\([0-9A]\))|(\[[0-9A]\])|([0-9A]))$/;
        var regexIsDigit = /^[0-9]$/;
        str = str.toUpperCase();
        if (!regexHKID.test(str)) return false;
        str = str.replace(/\[|\]|\(|\)/g, "");
        if (str.length === 8) str = "3".concat(str);
        var checkSumVal = 0;
        for (var i = 0; i <= 7; i++) {
          var convertedChar = void 0;
          if (!regexIsDigit.test(str[i])) convertedChar = (str[i].charCodeAt(0) - 55) % 11;
          else convertedChar = str[i];
          checkSumVal += convertedChar * (9 - i);
        }
        checkSumVal %= 11;
        var checkSumConverted;
        if (checkSumVal === 0) checkSumConverted = "0";
        else if (checkSumVal === 1) checkSumConverted = "A";
        else checkSumConverted = String(11 - checkSumVal);
        if (checkSumConverted === str[str.length - 1]) return true;
        return false;
      },
      "zh-TW": function zhTW(str) {
        var ALPHABET_CODES = {
          A: 10,
          B: 11,
          C: 12,
          D: 13,
          E: 14,
          F: 15,
          G: 16,
          H: 17,
          I: 34,
          J: 18,
          K: 19,
          L: 20,
          M: 21,
          N: 22,
          O: 35,
          P: 23,
          Q: 24,
          R: 25,
          S: 26,
          T: 27,
          U: 28,
          V: 29,
          W: 32,
          X: 30,
          Y: 31,
          Z: 33
        };
        var sanitized = str.trim().toUpperCase();
        if (!/^[A-Z][0-9]{9}$/.test(sanitized)) return false;
        return Array.from(sanitized).reduce(function(sum3, number, index) {
          if (index === 0) {
            var code = ALPHABET_CODES[number];
            return code % 10 * 9 + Math.floor(code / 10);
          }
          if (index === 9) {
            return (10 - sum3 % 10 - Number(number)) % 10 === 0;
          }
          return sum3 + Number(number) * (9 - index);
        }, 0);
      },
      PK: function PK(str) {
        var CNIC = /^[1-7][0-9]{4}-[0-9]{7}-[1-9]$/;
        var sanitized = str.trim();
        return CNIC.test(sanitized);
      }
    };
    function isIdentityCard(str, locale) {
      (0, _assertString.default)(str);
      if (locale in validators) {
        return validators[locale](str);
      } else if (locale === "any") {
        for (var key in validators) {
          if (validators.hasOwnProperty(key)) {
            var validator2 = validators[key];
            if (validator2(str)) {
              return true;
            }
          }
        }
        return false;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isEAN.js
var require_isEAN = __commonJS({
  "node_modules/validator/lib/isEAN.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isEAN;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var LENGTH_EAN_8 = 8;
    var LENGTH_EAN_14 = 14;
    var validEanRegex = /^(\d{8}|\d{13}|\d{14})$/;
    function getPositionWeightThroughLengthAndIndex(length, index) {
      if (length === LENGTH_EAN_8 || length === LENGTH_EAN_14) {
        return index % 2 === 0 ? 3 : 1;
      }
      return index % 2 === 0 ? 1 : 3;
    }
    function calculateCheckDigit(ean) {
      var checksum = ean.slice(0, -1).split("").map(function(char, index) {
        return Number(char) * getPositionWeightThroughLengthAndIndex(ean.length, index);
      }).reduce(function(acc, partialSum) {
        return acc + partialSum;
      }, 0);
      var remainder = 10 - checksum % 10;
      return remainder < 10 ? remainder : 0;
    }
    function isEAN(str) {
      (0, _assertString.default)(str);
      var actualCheckDigit = Number(str.slice(-1));
      return validEanRegex.test(str) && actualCheckDigit === calculateCheckDigit(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isISIN.js
var require_isISIN = __commonJS({
  "node_modules/validator/lib/isISIN.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isISIN;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var isin = /^[A-Z]{2}[0-9A-Z]{9}[0-9]$/;
    function isISIN(str) {
      (0, _assertString.default)(str);
      if (!isin.test(str)) {
        return false;
      }
      var double = true;
      var sum3 = 0;
      for (var i = str.length - 2; i >= 0; i--) {
        if (str[i] >= "A" && str[i] <= "Z") {
          var value = str[i].charCodeAt(0) - 55;
          var lo2 = value % 10;
          var hi = Math.trunc(value / 10);
          for (var _i = 0, _arr = [lo2, hi]; _i < _arr.length; _i++) {
            var digit = _arr[_i];
            if (double) {
              if (digit >= 5) {
                sum3 += 1 + (digit - 5) * 2;
              } else {
                sum3 += digit * 2;
              }
            } else {
              sum3 += digit;
            }
            double = !double;
          }
        } else {
          var _digit = str[i].charCodeAt(0) - "0".charCodeAt(0);
          if (double) {
            if (_digit >= 5) {
              sum3 += 1 + (_digit - 5) * 2;
            } else {
              sum3 += _digit * 2;
            }
          } else {
            sum3 += _digit;
          }
          double = !double;
        }
      }
      var check = Math.trunc((sum3 + 9) / 10) * 10 - sum3;
      return +str[str.length - 1] === check;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isISBN.js
var require_isISBN = __commonJS({
  "node_modules/validator/lib/isISBN.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isISBN;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var possibleIsbn10 = /^(?:[0-9]{9}X|[0-9]{10})$/;
    var possibleIsbn13 = /^(?:[0-9]{13})$/;
    var factor = [1, 3];
    function isISBN(isbn, options) {
      (0, _assertString.default)(isbn);
      var version = String((options === null || options === void 0 ? void 0 : options.version) || options);
      if (!(options !== null && options !== void 0 && options.version || options)) {
        return isISBN(isbn, {
          version: 10
        }) || isISBN(isbn, {
          version: 13
        });
      }
      var sanitizedIsbn = isbn.replace(/[\s-]+/g, "");
      var checksum = 0;
      if (version === "10") {
        if (!possibleIsbn10.test(sanitizedIsbn)) {
          return false;
        }
        for (var i = 0; i < version - 1; i++) {
          checksum += (i + 1) * sanitizedIsbn.charAt(i);
        }
        if (sanitizedIsbn.charAt(9) === "X") {
          checksum += 10 * 10;
        } else {
          checksum += 10 * sanitizedIsbn.charAt(9);
        }
        if (checksum % 11 === 0) {
          return true;
        }
      } else if (version === "13") {
        if (!possibleIsbn13.test(sanitizedIsbn)) {
          return false;
        }
        for (var _i = 0; _i < 12; _i++) {
          checksum += factor[_i % 2] * sanitizedIsbn.charAt(_i);
        }
        if (sanitizedIsbn.charAt(12) - (10 - checksum % 10) % 10 === 0) {
          return true;
        }
      }
      return false;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isISSN.js
var require_isISSN = __commonJS({
  "node_modules/validator/lib/isISSN.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isISSN;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var issn = "^\\d{4}-?\\d{3}[\\dX]$";
    function isISSN(str) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      (0, _assertString.default)(str);
      var testIssn = issn;
      testIssn = options.require_hyphen ? testIssn.replace("?", "") : testIssn;
      testIssn = options.case_sensitive ? new RegExp(testIssn) : new RegExp(testIssn, "i");
      if (!testIssn.test(str)) {
        return false;
      }
      var digits = str.replace("-", "").toUpperCase();
      var checksum = 0;
      for (var i = 0; i < digits.length; i++) {
        var digit = digits[i];
        checksum += (digit === "X" ? 10 : +digit) * (8 - i);
      }
      return checksum % 11 === 0;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/util/algorithms.js
var require_algorithms = __commonJS({
  "node_modules/validator/lib/util/algorithms.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.iso7064Check = iso7064Check;
    exports2.luhnCheck = luhnCheck;
    exports2.reverseMultiplyAndSum = reverseMultiplyAndSum;
    exports2.verhoeffCheck = verhoeffCheck;
    function iso7064Check(str) {
      var checkvalue = 10;
      for (var i = 0; i < str.length - 1; i++) {
        checkvalue = (parseInt(str[i], 10) + checkvalue) % 10 === 0 ? 10 * 2 % 11 : (parseInt(str[i], 10) + checkvalue) % 10 * 2 % 11;
      }
      checkvalue = checkvalue === 1 ? 0 : 11 - checkvalue;
      return checkvalue === parseInt(str[10], 10);
    }
    function luhnCheck(str) {
      var checksum = 0;
      var second = false;
      for (var i = str.length - 1; i >= 0; i--) {
        if (second) {
          var product = parseInt(str[i], 10) * 2;
          if (product > 9) {
            checksum += product.toString().split("").map(function(a2) {
              return parseInt(a2, 10);
            }).reduce(function(a2, b2) {
              return a2 + b2;
            }, 0);
          } else {
            checksum += product;
          }
        } else {
          checksum += parseInt(str[i], 10);
        }
        second = !second;
      }
      return checksum % 10 === 0;
    }
    function reverseMultiplyAndSum(digits, base) {
      var total = 0;
      for (var i = 0; i < digits.length; i++) {
        total += digits[i] * (base - i);
      }
      return total;
    }
    function verhoeffCheck(str) {
      var d_table = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
      var p_table = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
      var str_copy = str.split("").reverse().join("");
      var checksum = 0;
      for (var i = 0; i < str_copy.length; i++) {
        checksum = d_table[checksum][p_table[i % 8][parseInt(str_copy[i], 10)]];
      }
      return checksum === 0;
    }
  }
});

// node_modules/validator/lib/isTaxID.js
var require_isTaxID = __commonJS({
  "node_modules/validator/lib/isTaxID.js"(exports2, module2) {
    "use strict";
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isTaxID;
    var _assertString = _interopRequireDefault(require_assertString());
    var algorithms = _interopRequireWildcard(require_algorithms());
    var _isDate = _interopRequireDefault(require_isDate());
    function _interopRequireWildcard(e, t) {
      if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
      return (_interopRequireWildcard = function _interopRequireWildcard2(e2, t2) {
        if (!t2 && e2 && e2.__esModule) return e2;
        var o, i, f = { __proto__: null, default: e2 };
        if (null === e2 || "object" != _typeof(e2) && "function" != typeof e2) return f;
        if (o = t2 ? n : r) {
          if (o.has(e2)) return o.get(e2);
          o.set(e2, f);
        }
        for (var _t3 in e2) "default" !== _t3 && {}.hasOwnProperty.call(e2, _t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e2, _t3)) && (i.get || i.set) ? o(f, _t3, i) : f[_t3] = e2[_t3]);
        return f;
      })(e, t);
    }
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _toConsumableArray(r) {
      return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
    }
    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _unsupportedIterableToArray(r, a2) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a2);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a2) : void 0;
      }
    }
    function _iterableToArray(r) {
      if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
    }
    function _arrayWithoutHoles(r) {
      if (Array.isArray(r)) return _arrayLikeToArray(r);
    }
    function _arrayLikeToArray(r, a2) {
      (null == a2 || a2 > r.length) && (a2 = r.length);
      for (var e = 0, n = Array(a2); e < a2; e++) n[e] = r[e];
      return n;
    }
    function bgBgCheck(tin) {
      var century_year = tin.slice(0, 2);
      var month = parseInt(tin.slice(2, 4), 10);
      if (month > 40) {
        month -= 40;
        century_year = "20".concat(century_year);
      } else if (month > 20) {
        month -= 20;
        century_year = "18".concat(century_year);
      } else {
        century_year = "19".concat(century_year);
      }
      if (month < 10) {
        month = "0".concat(month);
      }
      var date = "".concat(century_year, "/").concat(month, "/").concat(tin.slice(4, 6));
      if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
        return false;
      }
      var digits = tin.split("").map(function(a2) {
        return parseInt(a2, 10);
      });
      var multip_lookup = [2, 4, 8, 5, 10, 9, 7, 3, 6];
      var checksum = 0;
      for (var i = 0; i < multip_lookup.length; i++) {
        checksum += digits[i] * multip_lookup[i];
      }
      checksum = checksum % 11 === 10 ? 0 : checksum % 11;
      return checksum === digits[9];
    }
    function isCanadianSIN(input) {
      var digitsArray = input.split("");
      var even = digitsArray.filter(function(_, idx) {
        return idx % 2;
      }).map(function(i) {
        return Number(i) * 2;
      }).join("").split("");
      var total = digitsArray.filter(function(_, idx) {
        return !(idx % 2);
      }).concat(even).map(function(i) {
        return Number(i);
      }).reduce(function(acc, cur) {
        return acc + cur;
      });
      return total % 10 === 0;
    }
    function csCzCheck(tin) {
      tin = tin.replace(/\W/, "");
      var full_year = parseInt(tin.slice(0, 2), 10);
      if (tin.length === 10) {
        if (full_year < 54) {
          full_year = "20".concat(full_year);
        } else {
          full_year = "19".concat(full_year);
        }
      } else {
        if (tin.slice(6) === "000") {
          return false;
        }
        if (full_year < 54) {
          full_year = "19".concat(full_year);
        } else {
          return false;
        }
      }
      if (full_year.length === 3) {
        full_year = [full_year.slice(0, 2), "0", full_year.slice(2)].join("");
      }
      var month = parseInt(tin.slice(2, 4), 10);
      if (month > 50) {
        month -= 50;
      }
      if (month > 20) {
        if (parseInt(full_year, 10) < 2004) {
          return false;
        }
        month -= 20;
      }
      if (month < 10) {
        month = "0".concat(month);
      }
      var date = "".concat(full_year, "/").concat(month, "/").concat(tin.slice(4, 6));
      if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
        return false;
      }
      if (tin.length === 10) {
        if (parseInt(tin, 10) % 11 !== 0) {
          var checkdigit = parseInt(tin.slice(0, 9), 10) % 11;
          if (parseInt(full_year, 10) < 1986 && checkdigit === 10) {
            if (parseInt(tin.slice(9), 10) !== 0) {
              return false;
            }
          } else {
            return false;
          }
        }
      }
      return true;
    }
    function deAtCheck(tin) {
      return algorithms.luhnCheck(tin);
    }
    function deDeCheck(tin) {
      var digits = tin.split("").map(function(a2) {
        return parseInt(a2, 10);
      });
      var occurrences = [];
      for (var i = 0; i < digits.length - 1; i++) {
        occurrences.push("");
        for (var j = 0; j < digits.length - 1; j++) {
          if (digits[i] === digits[j]) {
            occurrences[i] += j;
          }
        }
      }
      occurrences = occurrences.filter(function(a2) {
        return a2.length > 1;
      });
      if (occurrences.length !== 2 && occurrences.length !== 3) {
        return false;
      }
      if (occurrences[0].length === 3) {
        var trip_locations = occurrences[0].split("").map(function(a2) {
          return parseInt(a2, 10);
        });
        var recurrent = 0;
        for (var _i = 0; _i < trip_locations.length - 1; _i++) {
          if (trip_locations[_i] + 1 === trip_locations[_i + 1]) {
            recurrent += 1;
          }
        }
        if (recurrent === 2) {
          return false;
        }
      }
      return algorithms.iso7064Check(tin);
    }
    function dkDkCheck(tin) {
      tin = tin.replace(/\W/, "");
      var year = parseInt(tin.slice(4, 6), 10);
      var century_digit = tin.slice(6, 7);
      switch (century_digit) {
        case "0":
        case "1":
        case "2":
        case "3":
          year = "19".concat(year);
          break;
        case "4":
        case "9":
          if (year < 37) {
            year = "20".concat(year);
          } else {
            year = "19".concat(year);
          }
          break;
        default:
          if (year < 37) {
            year = "20".concat(year);
          } else if (year > 58) {
            year = "18".concat(year);
          } else {
            return false;
          }
          break;
      }
      if (year.length === 3) {
        year = [year.slice(0, 2), "0", year.slice(2)].join("");
      }
      var date = "".concat(year, "/").concat(tin.slice(2, 4), "/").concat(tin.slice(0, 2));
      if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
        return false;
      }
      var digits = tin.split("").map(function(a2) {
        return parseInt(a2, 10);
      });
      var checksum = 0;
      var weight = 4;
      for (var i = 0; i < 9; i++) {
        checksum += digits[i] * weight;
        weight -= 1;
        if (weight === 1) {
          weight = 7;
        }
      }
      checksum %= 11;
      if (checksum === 1) {
        return false;
      }
      return checksum === 0 ? digits[9] === 0 : digits[9] === 11 - checksum;
    }
    function elCyCheck(tin) {
      var digits = tin.slice(0, 8).split("").map(function(a2) {
        return parseInt(a2, 10);
      });
      var checksum = 0;
      for (var i = 1; i < digits.length; i += 2) {
        checksum += digits[i];
      }
      for (var _i2 = 0; _i2 < digits.length; _i2 += 2) {
        if (digits[_i2] < 2) {
          checksum += 1 - digits[_i2];
        } else {
          checksum += 2 * (digits[_i2] - 2) + 5;
          if (digits[_i2] > 4) {
            checksum += 2;
          }
        }
      }
      return String.fromCharCode(checksum % 26 + 65) === tin.charAt(8);
    }
    function elGrCheck(tin) {
      var digits = tin.split("").map(function(a2) {
        return parseInt(a2, 10);
      });
      var checksum = 0;
      for (var i = 0; i < 8; i++) {
        checksum += digits[i] * Math.pow(2, 8 - i);
      }
      return checksum % 11 % 10 === digits[8];
    }
    function enIeCheck(tin) {
      var checksum = algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 7).map(function(a2) {
        return parseInt(a2, 10);
      }), 8);
      if (tin.length === 9 && tin[8] !== "W") {
        checksum += (tin[8].charCodeAt(0) - 64) * 9;
      }
      checksum %= 23;
      if (checksum === 0) {
        return tin[7].toUpperCase() === "W";
      }
      return tin[7].toUpperCase() === String.fromCharCode(64 + checksum);
    }
    var enUsCampusPrefix = {
      andover: ["10", "12"],
      atlanta: ["60", "67"],
      austin: ["50", "53"],
      brookhaven: ["01", "02", "03", "04", "05", "06", "11", "13", "14", "16", "21", "22", "23", "25", "34", "51", "52", "54", "55", "56", "57", "58", "59", "65"],
      cincinnati: ["30", "32", "35", "36", "37", "38", "61"],
      fresno: ["15", "24"],
      internet: ["20", "26", "27", "45", "46", "47"],
      kansas: ["40", "44"],
      memphis: ["94", "95"],
      ogden: ["80", "90"],
      philadelphia: ["33", "39", "41", "42", "43", "46", "48", "62", "63", "64", "66", "68", "71", "72", "73", "74", "75", "76", "77", "81", "82", "83", "84", "85", "86", "87", "88", "91", "92", "93", "98", "99"],
      sba: ["31"]
    };
    function enUsGetPrefixes() {
      var prefixes = [];
      for (var location in enUsCampusPrefix) {
        if (enUsCampusPrefix.hasOwnProperty(location)) {
          prefixes.push.apply(prefixes, _toConsumableArray(enUsCampusPrefix[location]));
        }
      }
      return prefixes;
    }
    function enUsCheck(tin) {
      return enUsGetPrefixes().indexOf(tin.slice(0, 2)) !== -1;
    }
    function esArCheck(tin) {
      var accum = 0;
      var digits = tin.split("");
      var digit = parseInt(digits.pop(), 10);
      for (var i = 0; i < digits.length; i++) {
        accum += digits[9 - i] * (2 + i % 6);
      }
      var verif = 11 - accum % 11;
      if (verif === 11) {
        verif = 0;
      } else if (verif === 10) {
        verif = 9;
      }
      return digit === verif;
    }
    function esEsCheck(tin) {
      var chars = tin.toUpperCase().split("");
      if (isNaN(parseInt(chars[0], 10)) && chars.length > 1) {
        var lead_replace = 0;
        switch (chars[0]) {
          case "Y":
            lead_replace = 1;
            break;
          case "Z":
            lead_replace = 2;
            break;
          default:
        }
        chars.splice(0, 1, lead_replace);
      } else {
        while (chars.length < 9) {
          chars.unshift(0);
        }
      }
      var lookup = ["T", "R", "W", "A", "G", "M", "Y", "F", "P", "D", "X", "B", "N", "J", "Z", "S", "Q", "V", "H", "L", "C", "K", "E"];
      chars = chars.join("");
      var checksum = parseInt(chars.slice(0, 8), 10) % 23;
      return chars[8] === lookup[checksum];
    }
    function etEeCheck(tin) {
      var full_year = tin.slice(1, 3);
      var century_digit = tin.slice(0, 1);
      switch (century_digit) {
        case "1":
        case "2":
          full_year = "18".concat(full_year);
          break;
        case "3":
        case "4":
          full_year = "19".concat(full_year);
          break;
        default:
          full_year = "20".concat(full_year);
          break;
      }
      var date = "".concat(full_year, "/").concat(tin.slice(3, 5), "/").concat(tin.slice(5, 7));
      if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
        return false;
      }
      var digits = tin.split("").map(function(a2) {
        return parseInt(a2, 10);
      });
      var checksum = 0;
      var weight = 1;
      for (var i = 0; i < 10; i++) {
        checksum += digits[i] * weight;
        weight += 1;
        if (weight === 10) {
          weight = 1;
        }
      }
      if (checksum % 11 === 10) {
        checksum = 0;
        weight = 3;
        for (var _i3 = 0; _i3 < 10; _i3++) {
          checksum += digits[_i3] * weight;
          weight += 1;
          if (weight === 10) {
            weight = 1;
          }
        }
        if (checksum % 11 === 10) {
          return digits[10] === 0;
        }
      }
      return checksum % 11 === digits[10];
    }
    function fiFiCheck(tin) {
      var full_year = tin.slice(4, 6);
      var century_symbol = tin.slice(6, 7);
      switch (century_symbol) {
        case "+":
          full_year = "18".concat(full_year);
          break;
        case "-":
          full_year = "19".concat(full_year);
          break;
        default:
          full_year = "20".concat(full_year);
          break;
      }
      var date = "".concat(full_year, "/").concat(tin.slice(2, 4), "/").concat(tin.slice(0, 2));
      if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
        return false;
      }
      var checksum = parseInt(tin.slice(0, 6) + tin.slice(7, 10), 10) % 31;
      if (checksum < 10) {
        return checksum === parseInt(tin.slice(10), 10);
      }
      checksum -= 10;
      var letters_lookup = ["A", "B", "C", "D", "E", "F", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "U", "V", "W", "X", "Y"];
      return letters_lookup[checksum] === tin.slice(10);
    }
    function frBeCheck(tin) {
      if (tin.slice(2, 4) !== "00" || tin.slice(4, 6) !== "00") {
        var date = "".concat(tin.slice(0, 2), "/").concat(tin.slice(2, 4), "/").concat(tin.slice(4, 6));
        if (!(0, _isDate.default)(date, "YY/MM/DD")) {
          return false;
        }
      }
      var checksum = 97 - parseInt(tin.slice(0, 9), 10) % 97;
      var checkdigits = parseInt(tin.slice(9, 11), 10);
      if (checksum !== checkdigits) {
        checksum = 97 - parseInt("2".concat(tin.slice(0, 9)), 10) % 97;
        if (checksum !== checkdigits) {
          return false;
        }
      }
      return true;
    }
    function frFrCheck(tin) {
      tin = tin.replace(/\s/g, "");
      var checksum = parseInt(tin.slice(0, 10), 10) % 511;
      var checkdigits = parseInt(tin.slice(10, 13), 10);
      return checksum === checkdigits;
    }
    function frLuCheck(tin) {
      var date = "".concat(tin.slice(0, 4), "/").concat(tin.slice(4, 6), "/").concat(tin.slice(6, 8));
      if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
        return false;
      }
      if (!algorithms.luhnCheck(tin.slice(0, 12))) {
        return false;
      }
      return algorithms.verhoeffCheck("".concat(tin.slice(0, 11)).concat(tin[12]));
    }
    function hrHrCheck(tin) {
      return algorithms.iso7064Check(tin);
    }
    function huHuCheck(tin) {
      var digits = tin.split("").map(function(a2) {
        return parseInt(a2, 10);
      });
      var checksum = 8;
      for (var i = 1; i < 9; i++) {
        checksum += digits[i] * (i + 1);
      }
      return checksum % 11 === digits[9];
    }
    function itItNameCheck(name) {
      var vowelflag = false;
      var xflag = false;
      for (var i = 0; i < 3; i++) {
        if (!vowelflag && /[AEIOU]/.test(name[i])) {
          vowelflag = true;
        } else if (!xflag && vowelflag && name[i] === "X") {
          xflag = true;
        } else if (i > 0) {
          if (vowelflag && !xflag) {
            if (!/[AEIOU]/.test(name[i])) {
              return false;
            }
          }
          if (xflag) {
            if (!/X/.test(name[i])) {
              return false;
            }
          }
        }
      }
      return true;
    }
    function itItCheck(tin) {
      var chars = tin.toUpperCase().split("");
      if (!itItNameCheck(chars.slice(0, 3))) {
        return false;
      }
      if (!itItNameCheck(chars.slice(3, 6))) {
        return false;
      }
      var number_locations = [6, 7, 9, 10, 12, 13, 14];
      var number_replace = {
        L: "0",
        M: "1",
        N: "2",
        P: "3",
        Q: "4",
        R: "5",
        S: "6",
        T: "7",
        U: "8",
        V: "9"
      };
      for (var _i4 = 0, _number_locations = number_locations; _i4 < _number_locations.length; _i4++) {
        var i = _number_locations[_i4];
        if (chars[i] in number_replace) {
          chars.splice(i, 1, number_replace[chars[i]]);
        }
      }
      var month_replace = {
        A: "01",
        B: "02",
        C: "03",
        D: "04",
        E: "05",
        H: "06",
        L: "07",
        M: "08",
        P: "09",
        R: "10",
        S: "11",
        T: "12"
      };
      var month = month_replace[chars[8]];
      var day = parseInt(chars[9] + chars[10], 10);
      if (day > 40) {
        day -= 40;
      }
      if (day < 10) {
        day = "0".concat(day);
      }
      var date = "".concat(chars[6]).concat(chars[7], "/").concat(month, "/").concat(day);
      if (!(0, _isDate.default)(date, "YY/MM/DD")) {
        return false;
      }
      var checksum = 0;
      for (var _i5 = 1; _i5 < chars.length - 1; _i5 += 2) {
        var char_to_int = parseInt(chars[_i5], 10);
        if (isNaN(char_to_int)) {
          char_to_int = chars[_i5].charCodeAt(0) - 65;
        }
        checksum += char_to_int;
      }
      var odd_convert = {
        // Maps of characters at odd places
        A: 1,
        B: 0,
        C: 5,
        D: 7,
        E: 9,
        F: 13,
        G: 15,
        H: 17,
        I: 19,
        J: 21,
        K: 2,
        L: 4,
        M: 18,
        N: 20,
        O: 11,
        P: 3,
        Q: 6,
        R: 8,
        S: 12,
        T: 14,
        U: 16,
        V: 10,
        W: 22,
        X: 25,
        Y: 24,
        Z: 23,
        0: 1,
        1: 0
      };
      for (var _i6 = 0; _i6 < chars.length - 1; _i6 += 2) {
        var _char_to_int = 0;
        if (chars[_i6] in odd_convert) {
          _char_to_int = odd_convert[chars[_i6]];
        } else {
          var multiplier = parseInt(chars[_i6], 10);
          _char_to_int = 2 * multiplier + 1;
          if (multiplier > 4) {
            _char_to_int += 2;
          }
        }
        checksum += _char_to_int;
      }
      if (String.fromCharCode(65 + checksum % 26) !== chars[15]) {
        return false;
      }
      return true;
    }
    function lvLvCheck(tin) {
      tin = tin.replace(/\W/, "");
      var day = tin.slice(0, 2);
      if (day !== "32") {
        var month = tin.slice(2, 4);
        if (month !== "00") {
          var full_year = tin.slice(4, 6);
          switch (tin[6]) {
            case "0":
              full_year = "18".concat(full_year);
              break;
            case "1":
              full_year = "19".concat(full_year);
              break;
            default:
              full_year = "20".concat(full_year);
              break;
          }
          var date = "".concat(full_year, "/").concat(tin.slice(2, 4), "/").concat(day);
          if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
            return false;
          }
        }
        var checksum = 1101;
        var multip_lookup = [1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        for (var i = 0; i < tin.length - 1; i++) {
          checksum -= parseInt(tin[i], 10) * multip_lookup[i];
        }
        return parseInt(tin[10], 10) === checksum % 11;
      }
      return true;
    }
    function mtMtCheck(tin) {
      if (tin.length !== 9) {
        var chars = tin.toUpperCase().split("");
        while (chars.length < 8) {
          chars.unshift(0);
        }
        switch (tin[7]) {
          case "A":
          case "P":
            if (parseInt(chars[6], 10) === 0) {
              return false;
            }
            break;
          default: {
            var first_part = parseInt(chars.join("").slice(0, 5), 10);
            if (first_part > 32e3) {
              return false;
            }
            var second_part = parseInt(chars.join("").slice(5, 7), 10);
            if (first_part === second_part) {
              return false;
            }
          }
        }
      }
      return true;
    }
    function nlNlCheck(tin) {
      return algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 8).map(function(a2) {
        return parseInt(a2, 10);
      }), 9) % 11 === parseInt(tin[8], 10);
    }
    function plPlCheck(tin) {
      if (tin.length === 10) {
        var lookup = [6, 5, 7, 2, 3, 4, 5, 6, 7];
        var _checksum = 0;
        for (var i = 0; i < lookup.length; i++) {
          _checksum += parseInt(tin[i], 10) * lookup[i];
        }
        _checksum %= 11;
        if (_checksum === 10) {
          return false;
        }
        return _checksum === parseInt(tin[9], 10);
      }
      var full_year = tin.slice(0, 2);
      var month = parseInt(tin.slice(2, 4), 10);
      if (month > 80) {
        full_year = "18".concat(full_year);
        month -= 80;
      } else if (month > 60) {
        full_year = "22".concat(full_year);
        month -= 60;
      } else if (month > 40) {
        full_year = "21".concat(full_year);
        month -= 40;
      } else if (month > 20) {
        full_year = "20".concat(full_year);
        month -= 20;
      } else {
        full_year = "19".concat(full_year);
      }
      if (month < 10) {
        month = "0".concat(month);
      }
      var date = "".concat(full_year, "/").concat(month, "/").concat(tin.slice(4, 6));
      if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
        return false;
      }
      var checksum = 0;
      var multiplier = 1;
      for (var _i7 = 0; _i7 < tin.length - 1; _i7++) {
        checksum += parseInt(tin[_i7], 10) * multiplier % 10;
        multiplier += 2;
        if (multiplier > 10) {
          multiplier = 1;
        } else if (multiplier === 5) {
          multiplier += 2;
        }
      }
      checksum = 10 - checksum % 10;
      return checksum === parseInt(tin[10], 10);
    }
    function cnpjCharToValue(char) {
      return char.charCodeAt(0) - 48;
    }
    function validateCnpj(cnpj) {
      var identifiers = cnpj.substring(0, 12).toUpperCase();
      var checkDigits = cnpj.substring(12);
      if (/^(.)\1+$/.test(cnpj.toUpperCase())) {
        return false;
      }
      var sum3 = 0;
      var weight = 5;
      for (var i = 0; i < 12; i++) {
        sum3 += cnpjCharToValue(identifiers.charAt(i)) * weight;
        weight = weight === 2 ? 9 : weight - 1;
      }
      var remainder = sum3 % 11;
      var firstDV = remainder < 2 ? 0 : 11 - remainder;
      if (firstDV !== parseInt(checkDigits.charAt(0), 10)) {
        return false;
      }
      sum3 = 0;
      weight = 6;
      for (var _i8 = 0; _i8 < 12; _i8++) {
        sum3 += cnpjCharToValue(identifiers.charAt(_i8)) * weight;
        weight = weight === 2 ? 9 : weight - 1;
      }
      sum3 += firstDV * 2;
      remainder = sum3 % 11;
      var secondDV = remainder < 2 ? 0 : 11 - remainder;
      return secondDV === parseInt(checkDigits.charAt(1), 10);
    }
    function ptBrCheck(tin) {
      tin = tin.replace(/[.\-/]/g, "");
      if (tin.length === 11) {
        var sum3;
        var remainder;
        sum3 = 0;
        if (
          // Reject known invalid CPFs
          tin === "11111111111" || tin === "22222222222" || tin === "33333333333" || tin === "44444444444" || tin === "55555555555" || tin === "66666666666" || tin === "77777777777" || tin === "88888888888" || tin === "99999999999" || tin === "00000000000"
        ) return false;
        for (var i = 1; i <= 9; i++) sum3 += parseInt(tin.substring(i - 1, i), 10) * (11 - i);
        remainder = sum3 * 10 % 11;
        if (remainder === 10) remainder = 0;
        if (remainder !== parseInt(tin.substring(9, 10), 10)) return false;
        sum3 = 0;
        for (var _i9 = 1; _i9 <= 10; _i9++) sum3 += parseInt(tin.substring(_i9 - 1, _i9), 10) * (12 - _i9);
        remainder = sum3 * 10 % 11;
        if (remainder === 10) remainder = 0;
        if (remainder !== parseInt(tin.substring(10, 11), 10)) return false;
        return true;
      }
      return validateCnpj(tin);
    }
    function ptPtCheck(tin) {
      var checksum = 11 - algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 8).map(function(a2) {
        return parseInt(a2, 10);
      }), 9) % 11;
      if (checksum > 9) {
        return parseInt(tin[8], 10) === 0;
      }
      return checksum === parseInt(tin[8], 10);
    }
    function roRoCheck(tin) {
      if (tin.slice(0, 4) !== "9000") {
        var full_year = tin.slice(1, 3);
        switch (tin[0]) {
          case "1":
          case "2":
            full_year = "19".concat(full_year);
            break;
          case "3":
          case "4":
            full_year = "18".concat(full_year);
            break;
          case "5":
          case "6":
            full_year = "20".concat(full_year);
            break;
          default:
        }
        var date = "".concat(full_year, "/").concat(tin.slice(3, 5), "/").concat(tin.slice(5, 7));
        if (date.length === 8) {
          if (!(0, _isDate.default)(date, "YY/MM/DD")) {
            return false;
          }
        } else if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
          return false;
        }
        var digits = tin.split("").map(function(a2) {
          return parseInt(a2, 10);
        });
        var multipliers = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
        var checksum = 0;
        for (var i = 0; i < multipliers.length; i++) {
          checksum += digits[i] * multipliers[i];
        }
        if (checksum % 11 === 10) {
          return digits[12] === 1;
        }
        return digits[12] === checksum % 11;
      }
      return true;
    }
    function skSkCheck(tin) {
      if (tin.length === 9) {
        tin = tin.replace(/\W/, "");
        if (tin.slice(6) === "000") {
          return false;
        }
        var full_year = parseInt(tin.slice(0, 2), 10);
        if (full_year > 53) {
          return false;
        }
        if (full_year < 10) {
          full_year = "190".concat(full_year);
        } else {
          full_year = "19".concat(full_year);
        }
        var month = parseInt(tin.slice(2, 4), 10);
        if (month > 50) {
          month -= 50;
        }
        if (month < 10) {
          month = "0".concat(month);
        }
        var date = "".concat(full_year, "/").concat(month, "/").concat(tin.slice(4, 6));
        if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
          return false;
        }
      }
      return true;
    }
    function slSiCheck(tin) {
      var checksum = 11 - algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 7).map(function(a2) {
        return parseInt(a2, 10);
      }), 8) % 11;
      if (checksum === 10) {
        return parseInt(tin[7], 10) === 0;
      }
      return checksum === parseInt(tin[7], 10);
    }
    function svSeCheck(tin) {
      var tin_copy = tin.slice(0);
      if (tin.length > 11) {
        tin_copy = tin_copy.slice(2);
      }
      var full_year = "";
      var month = tin_copy.slice(2, 4);
      var day = parseInt(tin_copy.slice(4, 6), 10);
      if (tin.length > 11) {
        full_year = tin.slice(0, 4);
      } else {
        full_year = tin.slice(0, 2);
        if (tin.length === 11 && day < 60) {
          var current_year = (/* @__PURE__ */ new Date()).getFullYear().toString();
          var current_century = parseInt(current_year.slice(0, 2), 10);
          current_year = parseInt(current_year, 10);
          if (tin[6] === "-") {
            if (parseInt("".concat(current_century).concat(full_year), 10) > current_year) {
              full_year = "".concat(current_century - 1).concat(full_year);
            } else {
              full_year = "".concat(current_century).concat(full_year);
            }
          } else {
            full_year = "".concat(current_century - 1).concat(full_year);
            if (current_year - parseInt(full_year, 10) < 100) {
              return false;
            }
          }
        }
      }
      if (day > 60) {
        day -= 60;
      }
      if (day < 10) {
        day = "0".concat(day);
      }
      var date = "".concat(full_year, "/").concat(month, "/").concat(day);
      if (date.length === 8) {
        if (!(0, _isDate.default)(date, "YY/MM/DD")) {
          return false;
        }
      } else if (!(0, _isDate.default)(date, "YYYY/MM/DD")) {
        return false;
      }
      return algorithms.luhnCheck(tin.replace(/\W/, ""));
    }
    function ukUaCheck(tin) {
      var digits = tin.split("").map(function(a2) {
        return parseInt(a2, 10);
      });
      var multipliers = [-1, 5, 7, 9, 4, 6, 10, 5, 7];
      var checksum = 0;
      for (var i = 0; i < multipliers.length; i++) {
        checksum += digits[i] * multipliers[i];
      }
      return checksum % 11 === 10 ? digits[9] === 0 : digits[9] === checksum % 11;
    }
    var taxIdFormat = {
      "bg-BG": /^\d{10}$/,
      "cs-CZ": /^\d{6}\/{0,1}\d{3,4}$/,
      "de-AT": /^\d{9}$/,
      "de-DE": /^[1-9]\d{10}$/,
      "dk-DK": /^\d{6}-{0,1}\d{4}$/,
      "el-CY": /^[09]\d{7}[A-Z]$/,
      "el-GR": /^([0-4]|[7-9])\d{8}$/,
      "en-CA": /^\d{9}$/,
      "en-GB": /^\d{10}$|^(?!GB|NK|TN|ZZ)(?![DFIQUV])[A-Z](?![DFIQUVO])[A-Z]\d{6}[ABCD ]$/i,
      "en-IE": /^\d{7}[A-W][A-IW]{0,1}$/i,
      "en-US": /^\d{2}[- ]{0,1}\d{7}$/,
      "es-AR": /(20|23|24|27|30|33|34)[0-9]{8}[0-9]/,
      "es-ES": /^(\d{0,8}|[XYZKLM]\d{7})[A-HJ-NP-TV-Z]$/i,
      "et-EE": /^[1-6]\d{6}(00[1-9]|0[1-9][0-9]|[1-6][0-9]{2}|70[0-9]|710)\d$/,
      "fi-FI": /^\d{6}[-+A]\d{3}[0-9A-FHJ-NPR-Y]$/i,
      "fr-BE": /^\d{11}$/,
      "fr-FR": /^[0-3]\d{12}$|^[0-3]\d\s\d{2}(\s\d{3}){3}$/,
      // Conforms both to official spec and provided example
      "fr-LU": /^\d{13}$/,
      "hr-HR": /^\d{11}$/,
      "hu-HU": /^8\d{9}$/,
      "it-IT": /^[A-Z]{6}[L-NP-V0-9]{2}[A-EHLMPRST][L-NP-V0-9]{2}[A-ILMZ][L-NP-V0-9]{3}[A-Z]$/i,
      "lv-LV": /^\d{6}-{0,1}\d{5}$/,
      // Conforms both to DG TAXUD spec and original research
      "mt-MT": /^\d{3,7}[APMGLHBZ]$|^([1-8])\1\d{7}$/i,
      "nl-NL": /^\d{9}$/,
      "pl-PL": /^\d{10,11}$/,
      "pt-BR": /(?:^\d{3}\.\d{3}\.\d{3}-\d{2}$)|(?:^\d{11}$)|(?:^[A-Z0-9]{12}\d{2}$)/i,
      "pt-PT": /^\d{9}$/,
      "ro-RO": /^\d{13}$/,
      "sk-SK": /^\d{6}\/{0,1}\d{3,4}$/,
      "sl-SI": /^[1-9]\d{7}$/,
      "sv-SE": /^(\d{6}[-+]{0,1}\d{4}|(18|19|20)\d{6}[-+]{0,1}\d{4})$/,
      "uk-UA": /^\d{10}$/
    };
    taxIdFormat["lb-LU"] = taxIdFormat["fr-LU"];
    taxIdFormat["lt-LT"] = taxIdFormat["et-EE"];
    taxIdFormat["nl-BE"] = taxIdFormat["fr-BE"];
    taxIdFormat["fr-CA"] = taxIdFormat["en-CA"];
    var taxIdCheck = {
      "bg-BG": bgBgCheck,
      "cs-CZ": csCzCheck,
      "de-AT": deAtCheck,
      "de-DE": deDeCheck,
      "dk-DK": dkDkCheck,
      "el-CY": elCyCheck,
      "el-GR": elGrCheck,
      "en-CA": isCanadianSIN,
      "en-IE": enIeCheck,
      "en-US": enUsCheck,
      "es-AR": esArCheck,
      "es-ES": esEsCheck,
      "et-EE": etEeCheck,
      "fi-FI": fiFiCheck,
      "fr-BE": frBeCheck,
      "fr-FR": frFrCheck,
      "fr-LU": frLuCheck,
      "hr-HR": hrHrCheck,
      "hu-HU": huHuCheck,
      "it-IT": itItCheck,
      "lv-LV": lvLvCheck,
      "mt-MT": mtMtCheck,
      "nl-NL": nlNlCheck,
      "pl-PL": plPlCheck,
      "pt-BR": ptBrCheck,
      "pt-PT": ptPtCheck,
      "ro-RO": roRoCheck,
      "sk-SK": skSkCheck,
      "sl-SI": slSiCheck,
      "sv-SE": svSeCheck,
      "uk-UA": ukUaCheck
    };
    taxIdCheck["lb-LU"] = taxIdCheck["fr-LU"];
    taxIdCheck["lt-LT"] = taxIdCheck["et-EE"];
    taxIdCheck["nl-BE"] = taxIdCheck["fr-BE"];
    taxIdCheck["fr-CA"] = taxIdCheck["en-CA"];
    var allsymbols = /[-\\\/!@#$%\^&\*\(\)\+\=\[\]]+/g;
    var sanitizeRegexes = {
      "de-AT": allsymbols,
      "de-DE": /[\/\\]/g,
      "fr-BE": allsymbols
    };
    sanitizeRegexes["nl-BE"] = sanitizeRegexes["fr-BE"];
    function isTaxID(str) {
      var locale = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "en-US";
      (0, _assertString.default)(str);
      var strcopy = str.slice(0);
      if (locale in taxIdFormat) {
        if (locale in sanitizeRegexes) {
          strcopy = strcopy.replace(sanitizeRegexes[locale], "");
        }
        if (!taxIdFormat[locale].test(strcopy)) {
          return false;
        }
        if (locale in taxIdCheck) {
          return taxIdCheck[locale](strcopy);
        }
        return true;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isMobilePhone.js
var require_isMobilePhone = __commonJS({
  "node_modules/validator/lib/isMobilePhone.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isMobilePhone;
    exports2.locales = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var phones = {
      "am-AM": /^(\+?374|0)(33|4[134]|55|77|88|9[13-689])\d{6}$/,
      "ar-AE": /^((\+?971)|0)?5[024568]\d{7}$/,
      "ar-BH": /^(\+?973)?(3|6)\d{7}$/,
      "ar-DZ": /^(\+?213|0)(5|6|7)\d{8}$/,
      "ar-LB": /^(\+?961)?((3|81)\d{6}|7\d{7})$/,
      "ar-EG": /^((\+?20)|0)?1[0125]\d{8}$/,
      "ar-IQ": /^(\+?964|0)?7[0-9]\d{8}$/,
      "ar-JO": /^(\+?962|0)?7[789]\d{7}$/,
      "ar-KW": /^(\+?965)([569]\d{7}|41\d{6})$/,
      "ar-LY": /^((\+?218)|0)?(9[1-6]\d{7}|[1-8]\d{7,9})$/,
      "ar-MA": /^(?:(?:\+|00)212|0)[5-7]\d{8}$/,
      "ar-OM": /^((\+|00)968)?([79][1-9])\d{6}$/,
      "ar-PS": /^(\+?970|0)5[6|9](\d{7})$/,
      "ar-SA": /^(!?(\+?966)|0)?5\d{8}$/,
      "ar-SD": /^((\+?249)|0)?(9[012369]|1[012])\d{7}$/,
      "ar-SY": /^(!?(\+?963)|0)?9\d{8}$/,
      "ar-TN": /^(\+?216)?[2459]\d{7}$/,
      "az-AZ": /^(\+994|0)(10|5[015]|7[07]|99)\d{7}$/,
      "ar-QA": /^(\+?974|0)?([3567]\d{7})$/,
      "bs-BA": /^((((\+|00)3876)|06))((([0-3]|[5-6])\d{6})|(4\d{7}))$/,
      "be-BY": /^(\+?375)?(24|25|29|33|44)\d{7}$/,
      "bg-BG": /^(\+?359|0)?8[789]\d{7}$/,
      "bn-BD": /^(\+?880|0)1[13456789][0-9]{8}$/,
      "ca-AD": /^(\+376)?[346]\d{5}$/,
      "cs-CZ": /^(\+?420)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/,
      "da-DK": /^(\+?45)?\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/,
      "de-DE": /^((\+49|0)1)(5[0-25-9]\d|6([23]|0\d?)|7([0-57-9]|6\d))\d{7,9}$/,
      "de-AT": /^(\+43|0)\d{1,4}\d{3,12}$/,
      "de-CH": /^(\+41|0)([1-9])\d{1,9}$/,
      "de-LU": /^(\+352)?((6\d1)\d{6})$/,
      "dv-MV": /^(\+?960)?(7[2-9]|9[1-9])\d{5}$/,
      "el-GR": /^(\+?30|0)?6(8[5-9]|9(?![26])[0-9])\d{7}$/,
      "el-CY": /^(\+?357?)?(9(9|7|6|5|4)\d{6})$/,
      "en-AI": /^(\+?1|0)264(?:2(35|92)|4(?:6[1-2]|76|97)|5(?:3[6-9]|8[1-4])|7(?:2(4|9)|72))\d{4}$/,
      "en-AU": /^(\+?61|0)4\d{8}$/,
      "en-AG": /^(?:\+1|1)268(?:464|7(?:1[3-9]|[28]\d|3[0246]|64|7[0-689]))\d{4}$/,
      "en-BM": /^(\+?1)?441(((3|7)\d{6}$)|(5[0-3][0-9]\d{4}$)|(59\d{5}$))/,
      "en-BS": /^(\+?1[-\s]?|0)?\(?242\)?[-\s]?\d{3}[-\s]?\d{4}$/,
      "en-GB": /^(\+?44|0)7[1-9]\d{8}$/,
      "en-GG": /^(\+?44|0)1481\d{6}$/,
      "en-GH": /^(\+233|0)(20|50|24|54|27|57|26|56|23|53|28|55|59)\d{7}$/,
      "en-GY": /^(\+592|0)6\d{6}$/,
      "en-HK": /^(\+?852[-\s]?)?[456789]\d{3}[-\s]?\d{4}$/,
      "en-MO": /^(\+?853[-\s]?)?[6]\d{3}[-\s]?\d{4}$/,
      "en-IE": /^(\+?353|0)8[356789]\d{7}$/,
      "en-IN": /^(\+?91|0)?[6789]\d{9}$/,
      "en-JM": /^(\+?876)?\d{7}$/,
      "en-KE": /^(\+?254|0)(7|1)\d{8}$/,
      "fr-CF": /^(\+?236| ?)(70|75|77|72|21|22)\d{6}$/,
      "en-SS": /^(\+?211|0)(9[1257])\d{7}$/,
      "en-KI": /^((\+686|686)?)?( )?((6|7)(2|3|8)[0-9]{6})$/,
      "en-KN": /^(?:\+1|1)869(?:46\d|48[89]|55[6-8]|66\d|76[02-7])\d{4}$/,
      "en-LS": /^(\+?266)(22|28|57|58|59|27|52)\d{6}$/,
      "en-MT": /^(\+?356|0)?(99|79|77|21|27|22|25)[0-9]{6}$/,
      "en-MU": /^(\+?230|0)?\d{8}$/,
      "en-MW": /^(\+?265|0)(((77|88|31|99|98|21)\d{7})|(((111)|1)\d{6})|(32000\d{4}))$/,
      "en-NA": /^(\+?264|0)(6|8)\d{7}$/,
      "en-NG": /^(\+?234|0)?[789]\d{9}$/,
      "en-NZ": /^(\+?64|0)[28]\d{7,9}$/,
      "en-PG": /^(\+?675|0)?(7\d|8[18])\d{6}$/,
      "en-PK": /^((00|\+)?92|0)3[0-6]\d{8}$/,
      "en-PH": /^(09|\+639)\d{9}$/,
      "en-RW": /^(\+?250|0)?[7]\d{8}$/,
      "en-SG": /^(\+65)?[3689]\d{7}$/,
      "en-SL": /^(\+?232|0)\d{8}$/,
      "en-TZ": /^(\+?255|0)?[67]\d{8}$/,
      "en-UG": /^(\+?256|0)?[7]\d{8}$/,
      "en-US": /^((\+1|1)?( |-)?)?(\([2-9][0-9]{2}\)|[2-9][0-9]{2})( |-)?([2-9][0-9]{2}( |-)?[0-9]{4})$/,
      "en-ZA": /^(\+?27|0)\d{9}$/,
      "en-ZM": /^(\+?26)?0[79][567]\d{7}$/,
      "en-ZW": /^(\+263)[0-9]{9}$/,
      "en-BW": /^(\+?267)?(7[1-8]{1})\d{6}$/,
      "es-AR": /^\+?549(11|[2368]\d)\d{8}$/,
      "es-BO": /^(\+?591)?(6|7)\d{7}$/,
      "es-CO": /^(\+?57)?3(0(0|1|2|4|5)|1\d|2[0-4]|5(0|1))\d{7}$/,
      "es-CL": /^(\+?56|0)[2-9]\d{1}\d{7}$/,
      "es-CR": /^(\+506)?[2-8]\d{7}$/,
      "es-CU": /^(\+53|0053)?5\d{7}$/,
      "es-DO": /^(\+?1)?8[024]9\d{7}$/,
      "es-HN": /^(\+?504)?[9|8|3|2]\d{7}$/,
      "es-EC": /^(\+?593|0)([2-7]|9[2-9])\d{7}$/,
      "es-ES": /^(\+?34)?[6|7]\d{8}$/,
      "es-GT": /^(\+?502)?[2|6|7]\d{7}$/,
      "es-PE": /^(\+?51)?9\d{8}$/,
      "es-MX": /^(\+?52)?(1|01)?\d{10,11}$/,
      "es-NI": /^(\+?505)\d{7,8}$/,
      "es-PA": /^(\+?507)\d{7,8}$/,
      "es-PY": /^(\+?595|0)9[9876]\d{7}$/,
      "es-SV": /^(\+?503)?[67]\d{7}$/,
      "es-UY": /^(\+598|0)9[1-9][\d]{6}$/,
      "es-VE": /^(\+?58)?(2|4)\d{9}$/,
      "et-EE": /^(\+?372)?\s?(5|8[1-4])\s?([0-9]\s?){6,7}$/,
      "fa-IR": /^(\+?98[\-\s]?|0)9[0-39]\d[\-\s]?\d{3}[\-\s]?\d{4}$/,
      "fi-FI": /^(\+?358|0)\s?(4[0-6]|50)\s?(\d\s?){4,8}$/,
      "fj-FJ": /^(\+?679)?\s?\d{3}\s?\d{4}$/,
      "fo-FO": /^(\+?298)?\s?\d{2}\s?\d{2}\s?\d{2}$/,
      "fr-BF": /^(\+226|0)[67]\d{7}$/,
      "fr-BJ": /^(\+229)\d{8}$/,
      "fr-CD": /^(\+?243|0)?(8|9)\d{8}$/,
      "fr-CM": /^(\+?237)6[0-9]{8}$/,
      "fr-DJ": /^(?:\+253)?77[6-8]\d{5}$/,
      "fr-FR": /^(\+?33|0)[67]\d{8}$/,
      "fr-GF": /^(\+?594|0|00594)[67]\d{8}$/,
      "fr-GP": /^(\+?590|0|00590)[67]\d{8}$/,
      "fr-MQ": /^(\+?596|0|00596)[67]\d{8}$/,
      "fr-PF": /^(\+?689)?8[789]\d{6}$/,
      "fr-RE": /^(\+?262|0|00262)[67]\d{8}$/,
      "fr-WF": /^(\+681)?\d{6}$/,
      "he-IL": /^(\+972|0)([23489]|5[012345689]|77)[1-9]\d{6}$/,
      "hu-HU": /^(\+?36|06)(20|30|31|50|70)\d{7}$/,
      "id-ID": /^(\+?62|0)8(1[123456789]|2[1238]|3[1238]|5[12356789]|7[78]|9[56789]|8[123456789])([\s?|\d]{5,11})$/,
      "ir-IR": /^(\+98|0)?9\d{9}$/,
      "it-IT": /^(\+?39)?\s?3\d{2} ?\d{6,7}$/,
      "it-SM": /^((\+378)|(0549)|(\+390549)|(\+3780549))?6\d{5,9}$/,
      "ja-JP": /^(\+81[ \-]?(\(0\))?|0)[6789]0[ \-]?\d{4}[ \-]?\d{4}$/,
      "ka-GE": /^(\+?995)?(79\d{7}|5\d{8})$/,
      "kk-KZ": /^(\+?7|8)?7\d{9}$/,
      "kl-GL": /^(\+?299)?\s?\d{2}\s?\d{2}\s?\d{2}$/,
      "ko-KR": /^((\+?82)[ \-]?)?0?1([0|1|6|7|8|9]{1})[ \-]?\d{3,4}[ \-]?\d{4}$/,
      "ky-KG": /^(\+996\s?)?(22[0-9]|50[0-9]|55[0-9]|70[0-9]|75[0-9]|77[0-9]|880|990|995|996|997|998)\s?\d{3}\s?\d{3}$/,
      "lt-LT": /^(\+370|8)\d{8}$/,
      "lv-LV": /^(\+?371)2\d{7}$/,
      "mg-MG": /^((\+?261|0)(2|3)\d)?\d{7}$/,
      "mn-MN": /^(\+|00|011)?976(77|81|88|91|94|95|96|99)\d{6}$/,
      "my-MM": /^(\+?959|09|9)(2[5-7]|3[1-2]|4[0-5]|6[6-9]|7[5-9]|9[6-9])[0-9]{7}$/,
      "ms-MY": /^(\+?60|0)1(([0145](-|\s)?\d{7,8})|([236-9](-|\s)?\d{7}))$/,
      "mz-MZ": /^(\+?258)?8[234567]\d{7}$/,
      "nb-NO": /^(\+?47)?[49]\d{7}$/,
      "ne-NP": /^(\+?977)?9[78]\d{8}$/,
      "nl-BE": /^(\+?32|0)4\d{8}$/,
      "nl-NL": /^(((\+|00)?31\(0\))|((\+|00)?31)|0)6{1}\d{8}$/,
      "nl-AW": /^(\+)?297(56|59|64|73|74|99)\d{5}$/,
      "nn-NO": /^(\+?47)?[49]\d{7}$/,
      "pl-PL": /^(\+?48)? ?([5-8]\d|45) ?\d{3} ?\d{2} ?\d{2}$/,
      "pt-BR": /^((\+?55\ ?[1-9]{2}\ ?)|(\+?55\ ?\([1-9]{2}\)\ ?)|(0[1-9]{2}\ ?)|(\([1-9]{2}\)\ ?)|([1-9]{2}\ ?))((\d{4}\-?\d{4})|(9[1-9]{1}\d{3}\-?\d{4}))$/,
      "pt-PT": /^(\+?351)?9[1236]\d{7}$/,
      "pt-AO": /^(\+?244)?9\d{8}$/,
      "ro-MD": /^(\+?373|0)((6(0|1|2|6|7|8|9))|(7(6|7|8|9)))\d{6}$/,
      "ro-RO": /^(\+?40|0)\s?7\d{2}(\/|\s|\.|-)?\d{3}(\s|\.|-)?\d{3}$/,
      "ru-RU": /^(\+?7|8)?9\d{9}$/,
      "si-LK": /^(?:0|94|\+94)?(7(0|1|2|4|5|6|7|8)( |-)?)\d{7}$/,
      "sl-SI": /^(\+386\s?|0)(\d{1}\s?\d{3}\s?\d{2}\s?\d{2}|\d{2}\s?\d{3}\s?\d{3})$/,
      "sk-SK": /^(\+?421)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/,
      "so-SO": /^(\+?252|0)((6[0-9])\d{7}|(7[1-9])\d{7})$/,
      "sq-AL": /^(\+355|0)6[2-9]\d{7}$/,
      "sr-RS": /^(\+3816|06)[- \d]{5,9}$/,
      "sv-SE": /^(\+?46|0)[\s\-]?7[\s\-]?[02369]([\s\-]?\d){7}$/,
      "tg-TJ": /^(\+?992)?[5][5]\d{7}$/,
      "th-TH": /^(\+66|66|0)\d{9}$/,
      "tr-TR": /^(\+?90|0)?5\d{9}$/,
      "tk-TM": /^(\+993|993|8)\d{8}$/,
      "uk-UA": /^(\+?38)?0(50|6[36-8]|7[357]|9[1-9])\d{7}$/,
      "uz-UZ": /^(\+?998)?(6[125-79]|7[1-69]|88|9\d)\d{7}$/,
      "vi-VN": /^((\+?84)|0)((3([2-9]))|(5([25689]))|(7([0|6-9]))|(8([1-9]))|(9([0-9])))([0-9]{7})$/,
      "zh-CN": /^((\+|00)86)?(1[3-9]|9[28])\d{9}$/,
      "zh-TW": /^(\+?886\-?|0)?9\d{8}$/,
      "dz-BT": /^(\+?975|0)?(17|16|77|02)\d{6}$/,
      "ar-YE": /^(((\+|00)9677|0?7)[0137]\d{7}|((\+|00)967|0)[1-7]\d{6})$/,
      "ar-EH": /^(\+?212|0)[\s\-]?(5288|5289)[\s\-]?\d{5}$/,
      "fa-AF": /^(\+93|0)?(2{1}[0-8]{1}|[3-5]{1}[0-4]{1})(\d{7})$/,
      "mk-MK": /^(\+?389|0)?((?:2[2-9]\d{6}|(?:3[1-4]|4[2-8])\d{6}|500\d{5}|5[2-9]\d{6}|7[0-9][2-9]\d{5}|8[1-9]\d{6}|800\d{5}|8009\d{4}))$/
    };
    phones["en-CA"] = phones["en-US"];
    phones["fr-CA"] = phones["en-CA"];
    phones["fr-BE"] = phones["nl-BE"];
    phones["zh-HK"] = phones["en-HK"];
    phones["zh-MO"] = phones["en-MO"];
    phones["ga-IE"] = phones["en-IE"];
    phones["fr-CH"] = phones["de-CH"];
    phones["it-CH"] = phones["fr-CH"];
    function isMobilePhone(str, locale, options) {
      (0, _assertString.default)(str);
      if (options && options.strictMode && !str.startsWith("+")) {
        return false;
      }
      if (Array.isArray(locale)) {
        return locale.some(function(key2) {
          if (phones.hasOwnProperty(key2)) {
            var phone2 = phones[key2];
            if (phone2.test(str)) {
              return true;
            }
          }
          return false;
        });
      } else if (locale in phones) {
        return phones[locale].test(str);
      } else if (!locale || locale === "any") {
        for (var key in phones) {
          if (phones.hasOwnProperty(key)) {
            var phone = phones[key];
            if (phone.test(str)) {
              return true;
            }
          }
        }
        return false;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    var locales = exports2.locales = Object.keys(phones);
  }
});

// node_modules/validator/lib/isEthereumAddress.js
var require_isEthereumAddress = __commonJS({
  "node_modules/validator/lib/isEthereumAddress.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isEthereumAddress;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var eth = /^(0x)[0-9a-f]{40}$/i;
    function isEthereumAddress(str) {
      (0, _assertString.default)(str);
      return eth.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isCurrency.js
var require_isCurrency = __commonJS({
  "node_modules/validator/lib/isCurrency.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isCurrency;
    var _merge = _interopRequireDefault(require_merge());
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function currencyRegex(options) {
      var decimal_digits = "\\d{".concat(options.digits_after_decimal[0], "}");
      options.digits_after_decimal.forEach(function(digit, index) {
        if (index !== 0) decimal_digits = "".concat(decimal_digits, "|\\d{").concat(digit, "}");
      });
      var symbol = "(".concat(options.symbol.replace(/\W/, function(m2) {
        return "\\".concat(m2);
      }), ")").concat(options.require_symbol ? "" : "?"), negative = "-?", whole_dollar_amount_without_sep = "[1-9]\\d*", whole_dollar_amount_with_sep = "[1-9]\\d{0,2}(\\".concat(options.thousands_separator, "\\d{3})*"), valid_whole_dollar_amounts = ["0", whole_dollar_amount_without_sep, whole_dollar_amount_with_sep], whole_dollar_amount = "(".concat(valid_whole_dollar_amounts.join("|"), ")?"), decimal_amount = "(\\".concat(options.decimal_separator, "(").concat(decimal_digits, "))").concat(options.require_decimal ? "" : "?");
      var pattern = whole_dollar_amount + (options.allow_decimal || options.require_decimal ? decimal_amount : "");
      if (options.allow_negatives && !options.parens_for_negatives) {
        if (options.negative_sign_after_digits) {
          pattern += negative;
        } else if (options.negative_sign_before_digits) {
          pattern = negative + pattern;
        }
      }
      if (options.allow_negative_sign_placeholder) {
        pattern = "( (?!\\-))?".concat(pattern);
      } else if (options.allow_space_after_symbol) {
        pattern = " ?".concat(pattern);
      } else if (options.allow_space_after_digits) {
        pattern += "( (?!$))?";
      }
      if (options.symbol_after_digits) {
        pattern += symbol;
      } else {
        pattern = symbol + pattern;
      }
      if (options.allow_negatives) {
        if (options.parens_for_negatives) {
          pattern = "(\\(".concat(pattern, "\\)|").concat(pattern, ")");
        } else if (!(options.negative_sign_before_digits || options.negative_sign_after_digits)) {
          pattern = negative + pattern;
        }
      }
      return new RegExp("^(?!-? )(?=.*\\d)".concat(pattern, "$"));
    }
    var default_currency_options = {
      symbol: "$",
      require_symbol: false,
      allow_space_after_symbol: false,
      symbol_after_digits: false,
      allow_negatives: true,
      parens_for_negatives: false,
      negative_sign_before_digits: false,
      negative_sign_after_digits: false,
      allow_negative_sign_placeholder: false,
      thousands_separator: ",",
      decimal_separator: ".",
      allow_decimal: true,
      require_decimal: false,
      digits_after_decimal: [2],
      allow_space_after_digits: false
    };
    function isCurrency(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_currency_options);
      return currencyRegex(options).test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isBtcAddress.js
var require_isBtcAddress = __commonJS({
  "node_modules/validator/lib/isBtcAddress.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isBtcAddress;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var bech32 = /^(bc1|tb1|bc1p|tb1p)[ac-hj-np-z02-9]{39,58}$/;
    var base58 = /^(1|2|3|m)[A-HJ-NP-Za-km-z1-9]{25,39}$/;
    function isBtcAddress(str) {
      (0, _assertString.default)(str);
      return bech32.test(str) || base58.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isISO6346.js
var require_isISO6346 = __commonJS({
  "node_modules/validator/lib/isISO6346.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.isFreightContainerID = void 0;
    exports2.isISO6346 = isISO6346;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var isISO6346Str = /^[A-Z]{3}(U[0-9]{7})|([J,Z][0-9]{6,7})$/;
    var isDigit = /^[0-9]$/;
    function isISO6346(str) {
      (0, _assertString.default)(str);
      str = str.toUpperCase();
      if (!isISO6346Str.test(str)) return false;
      if (str.length === 11) {
        var sum3 = 0;
        for (var i = 0; i < str.length - 1; i++) {
          if (!isDigit.test(str[i])) {
            var convertedCode = void 0;
            var letterCode = str.charCodeAt(i) - 55;
            if (letterCode < 11) convertedCode = letterCode;
            else if (letterCode >= 11 && letterCode <= 20) convertedCode = 12 + letterCode % 11;
            else if (letterCode >= 21 && letterCode <= 30) convertedCode = 23 + letterCode % 21;
            else convertedCode = 34 + letterCode % 31;
            sum3 += convertedCode * Math.pow(2, i);
          } else sum3 += str[i] * Math.pow(2, i);
        }
        var checkSumDigit = sum3 % 11;
        if (checkSumDigit === 10) checkSumDigit = 0;
        return Number(str[str.length - 1]) === checkSumDigit;
      }
      return true;
    }
    var isFreightContainerID = exports2.isFreightContainerID = isISO6346;
  }
});

// node_modules/validator/lib/isISO6391.js
var require_isISO6391 = __commonJS({
  "node_modules/validator/lib/isISO6391.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isISO6391;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var isISO6391Set = /* @__PURE__ */ new Set(["aa", "ab", "ae", "af", "ak", "am", "an", "ar", "as", "av", "ay", "az", "az", "ba", "be", "bg", "bh", "bi", "bm", "bn", "bo", "br", "bs", "ca", "ce", "ch", "co", "cr", "cs", "cu", "cv", "cy", "da", "de", "dv", "dz", "ee", "el", "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fo", "fr", "fy", "ga", "gd", "gl", "gn", "gu", "gv", "ha", "he", "hi", "ho", "hr", "ht", "hu", "hy", "hz", "ia", "id", "ie", "ig", "ii", "ik", "io", "is", "it", "iu", "ja", "jv", "ka", "kg", "ki", "kj", "kk", "kl", "km", "kn", "ko", "kr", "ks", "ku", "kv", "kw", "ky", "la", "lb", "lg", "li", "ln", "lo", "lt", "lu", "lv", "mg", "mh", "mi", "mk", "ml", "mn", "mr", "ms", "mt", "my", "na", "nb", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv", "ny", "oc", "oj", "om", "or", "os", "pa", "pi", "pl", "ps", "pt", "qu", "rm", "rn", "ro", "ru", "rw", "sa", "sc", "sd", "se", "sg", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "ta", "te", "tg", "th", "ti", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty", "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "wo", "xh", "yi", "yo", "za", "zh", "zu"]);
    function isISO6391(str) {
      (0, _assertString.default)(str);
      return isISO6391Set.has(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isISO8601.js
var require_isISO8601 = __commonJS({
  "node_modules/validator/lib/isISO8601.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isISO8601;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var iso8601 = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
    var iso8601StrictSeparator = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
    var isValidDate = function isValidDate2(str) {
      var ordinalMatch = str.match(/^(\d{4})-?(\d{3})([ T]{1}\.*|$)/);
      if (ordinalMatch) {
        var oYear = Number(ordinalMatch[1]);
        var oDay = Number(ordinalMatch[2]);
        if (oYear % 4 === 0 && oYear % 100 !== 0 || oYear % 400 === 0) return oDay <= 366;
        return oDay <= 365;
      }
      var match = str.match(/(\d{4})-?(\d{0,2})-?(\d*)/).map(Number);
      var year = match[1];
      var month = match[2];
      var day = match[3];
      var monthString = month ? "0".concat(month).slice(-2) : month;
      var dayString = day ? "0".concat(day).slice(-2) : day;
      var d2 = new Date("".concat(year, "-").concat(monthString || "01", "-").concat(dayString || "01"));
      if (month && day) {
        return d2.getUTCFullYear() === year && d2.getUTCMonth() + 1 === month && d2.getUTCDate() === day;
      }
      return true;
    };
    function isISO8601(str) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      (0, _assertString.default)(str);
      var check = options.strictSeparator ? iso8601StrictSeparator.test(str) : iso8601.test(str);
      if (check && options.strict) return isValidDate(str);
      return check;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isRFC3339.js
var require_isRFC3339 = __commonJS({
  "node_modules/validator/lib/isRFC3339.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isRFC3339;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var dateFullYear = /[0-9]{4}/;
    var dateMonth = /(0[1-9]|1[0-2])/;
    var dateMDay = /([12]\d|0[1-9]|3[01])/;
    var timeHour = /([01][0-9]|2[0-3])/;
    var timeMinute = /[0-5][0-9]/;
    var timeSecond = /([0-5][0-9]|60)/;
    var timeSecFrac = /(\.[0-9]+)?/;
    var timeNumOffset = new RegExp("[-+]".concat(timeHour.source, ":").concat(timeMinute.source));
    var timeOffset = new RegExp("([zZ]|".concat(timeNumOffset.source, ")"));
    var partialTime = new RegExp("".concat(timeHour.source, ":").concat(timeMinute.source, ":").concat(timeSecond.source).concat(timeSecFrac.source));
    var fullDate = new RegExp("".concat(dateFullYear.source, "-").concat(dateMonth.source, "-").concat(dateMDay.source));
    var fullTime = new RegExp("".concat(partialTime.source).concat(timeOffset.source));
    var rfc3339 = new RegExp("^".concat(fullDate.source, "[ tT]").concat(fullTime.source, "$"));
    function isRFC3339(str) {
      (0, _assertString.default)(str);
      return rfc3339.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isISO15924.js
var require_isISO15924 = __commonJS({
  "node_modules/validator/lib/isISO15924.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.ScriptCodes = void 0;
    exports2.default = isISO15924;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var validISO15924Codes = /* @__PURE__ */ new Set(["Adlm", "Afak", "Aghb", "Ahom", "Arab", "Aran", "Armi", "Armn", "Avst", "Bali", "Bamu", "Bass", "Batk", "Beng", "Bhks", "Blis", "Bopo", "Brah", "Brai", "Bugi", "Buhd", "Cakm", "Cans", "Cari", "Cham", "Cher", "Chis", "Chrs", "Cirt", "Copt", "Cpmn", "Cprt", "Cyrl", "Cyrs", "Deva", "Diak", "Dogr", "Dsrt", "Dupl", "Egyd", "Egyh", "Egyp", "Elba", "Elym", "Ethi", "Gara", "Geok", "Geor", "Glag", "Gong", "Gonm", "Goth", "Gran", "Grek", "Gujr", "Gukh", "Guru", "Hanb", "Hang", "Hani", "Hano", "Hans", "Hant", "Hatr", "Hebr", "Hira", "Hluw", "Hmng", "Hmnp", "Hrkt", "Hung", "Inds", "Ital", "Jamo", "Java", "Jpan", "Jurc", "Kali", "Kana", "Kawi", "Khar", "Khmr", "Khoj", "Kitl", "Kits", "Knda", "Kore", "Kpel", "Krai", "Kthi", "Lana", "Laoo", "Latf", "Latg", "Latn", "Leke", "Lepc", "Limb", "Lina", "Linb", "Lisu", "Loma", "Lyci", "Lydi", "Mahj", "Maka", "Mand", "Mani", "Marc", "Maya", "Medf", "Mend", "Merc", "Mero", "Mlym", "Modi", "Mong", "Moon", "Mroo", "Mtei", "Mult", "Mymr", "Nagm", "Nand", "Narb", "Nbat", "Newa", "Nkdb", "Nkgb", "Nkoo", "Nshu", "Ogam", "Olck", "Onao", "Orkh", "Orya", "Osge", "Osma", "Ougr", "Palm", "Pauc", "Pcun", "Pelm", "Perm", "Phag", "Phli", "Phlp", "Phlv", "Phnx", "Plrd", "Piqd", "Prti", "Psin", "Qaaa", "Qaab", "Qaac", "Qaad", "Qaae", "Qaaf", "Qaag", "Qaah", "Qaai", "Qaaj", "Qaak", "Qaal", "Qaam", "Qaan", "Qaao", "Qaap", "Qaaq", "Qaar", "Qaas", "Qaat", "Qaau", "Qaav", "Qaaw", "Qaax", "Qaay", "Qaaz", "Qaba", "Qabb", "Qabc", "Qabd", "Qabe", "Qabf", "Qabg", "Qabh", "Qabi", "Qabj", "Qabk", "Qabl", "Qabm", "Qabn", "Qabo", "Qabp", "Qabq", "Qabr", "Qabs", "Qabt", "Qabu", "Qabv", "Qabw", "Qabx", "Ranj", "Rjng", "Rohg", "Roro", "Runr", "Samr", "Sara", "Sarb", "Saur", "Sgnw", "Shaw", "Shrd", "Shui", "Sidd", "Sidt", "Sind", "Sinh", "Sogd", "Sogo", "Sora", "Soyo", "Sund", "Sunu", "Sylo", "Syrc", "Syre", "Syrj", "Syrn", "Tagb", "Takr", "Tale", "Talu", "Taml", "Tang", "Tavt", "Tayo", "Telu", "Teng", "Tfng", "Tglg", "Thaa", "Thai", "Tibt", "Tirh", "Tnsa", "Todr", "Tols", "Toto", "Tutg", "Ugar", "Vaii", "Visp", "Vith", "Wara", "Wcho", "Wole", "Xpeo", "Xsux", "Yezi", "Yiii", "Zanb", "Zinh", "Zmth", "Zsye", "Zsym", "Zxxx", "Zyyy", "Zzzz"]);
    function isISO15924(str) {
      (0, _assertString.default)(str);
      return validISO15924Codes.has(str);
    }
    var ScriptCodes = exports2.ScriptCodes = validISO15924Codes;
  }
});

// node_modules/validator/lib/isISO31661Alpha3.js
var require_isISO31661Alpha3 = __commonJS({
  "node_modules/validator/lib/isISO31661Alpha3.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isISO31661Alpha3;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var validISO31661Alpha3CountriesCodes = /* @__PURE__ */ new Set(["AFG", "ALA", "ALB", "DZA", "ASM", "AND", "AGO", "AIA", "ATA", "ATG", "ARG", "ARM", "ABW", "AUS", "AUT", "AZE", "BHS", "BHR", "BGD", "BRB", "BLR", "BEL", "BLZ", "BEN", "BMU", "BTN", "BOL", "BES", "BIH", "BWA", "BVT", "BRA", "IOT", "BRN", "BGR", "BFA", "BDI", "KHM", "CMR", "CAN", "CPV", "CYM", "CAF", "TCD", "CHL", "CHN", "CXR", "CCK", "COL", "COM", "COG", "COD", "COK", "CRI", "CIV", "HRV", "CUB", "CUW", "CYP", "CZE", "DNK", "DJI", "DMA", "DOM", "ECU", "EGY", "SLV", "GNQ", "ERI", "EST", "ETH", "FLK", "FRO", "FJI", "FIN", "FRA", "GUF", "PYF", "ATF", "GAB", "GMB", "GEO", "DEU", "GHA", "GIB", "GRC", "GRL", "GRD", "GLP", "GUM", "GTM", "GGY", "GIN", "GNB", "GUY", "HTI", "HMD", "VAT", "HND", "HKG", "HUN", "ISL", "IND", "IDN", "IRN", "IRQ", "IRL", "IMN", "ISR", "ITA", "JAM", "JPN", "JEY", "JOR", "KAZ", "KEN", "KIR", "PRK", "KOR", "KWT", "KGZ", "LAO", "LVA", "LBN", "LSO", "LBR", "LBY", "LIE", "LTU", "LUX", "MAC", "MKD", "MDG", "MWI", "MYS", "MDV", "MLI", "MLT", "MHL", "MTQ", "MRT", "MUS", "MYT", "MEX", "FSM", "MDA", "MCO", "MNG", "MNE", "MSR", "MAR", "MOZ", "MMR", "NAM", "NRU", "NPL", "NLD", "NCL", "NZL", "NIC", "NER", "NGA", "NIU", "NFK", "MNP", "NOR", "OMN", "PAK", "PLW", "PSE", "PAN", "PNG", "PRY", "PER", "PHL", "PCN", "POL", "PRT", "PRI", "QAT", "REU", "ROU", "RUS", "RWA", "BLM", "SHN", "KNA", "LCA", "MAF", "SPM", "VCT", "WSM", "SMR", "STP", "SAU", "SEN", "SRB", "SYC", "SLE", "SGP", "SXM", "SVK", "SVN", "SLB", "SOM", "ZAF", "SGS", "SSD", "ESP", "LKA", "SDN", "SUR", "SJM", "SWZ", "SWE", "CHE", "SYR", "TWN", "TJK", "TZA", "THA", "TLS", "TGO", "TKL", "TON", "TTO", "TUN", "TUR", "TKM", "TCA", "TUV", "UGA", "UKR", "ARE", "GBR", "USA", "UMI", "URY", "UZB", "VUT", "VEN", "VNM", "VGB", "VIR", "WLF", "ESH", "YEM", "ZMB", "ZWE"]);
    var alpha3CountryCode = /^[a-zA-Z]{3}$/;
    function isISO31661Alpha3(str) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      (0, _assertString.default)(str);
      var userAssignedCodes = options.userAssignedCodes;
      var validUserAssignedCodes = (userAssignedCodes || []).reduce(function(accumulator, userAssignedCode) {
        if (alpha3CountryCode.test(userAssignedCode)) {
          accumulator.push(userAssignedCode.toUpperCase());
        }
        return accumulator;
      }, []);
      if (validUserAssignedCodes.includes(str.toUpperCase())) {
        return true;
      }
      return validISO31661Alpha3CountriesCodes.has(str.toUpperCase());
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isISO31661Numeric.js
var require_isISO31661Numeric = __commonJS({
  "node_modules/validator/lib/isISO31661Numeric.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isISO31661Numeric;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var validISO31661NumericCountriesCodes = /* @__PURE__ */ new Set(["004", "008", "010", "012", "016", "020", "024", "028", "031", "032", "036", "040", "044", "048", "050", "051", "052", "056", "060", "064", "068", "070", "072", "074", "076", "084", "086", "090", "092", "096", "100", "104", "108", "112", "116", "120", "124", "132", "136", "140", "144", "148", "152", "156", "158", "162", "166", "170", "174", "175", "178", "180", "184", "188", "191", "192", "196", "203", "204", "208", "212", "214", "218", "222", "226", "231", "232", "233", "234", "238", "239", "242", "246", "248", "250", "254", "258", "260", "262", "266", "268", "270", "275", "276", "288", "292", "296", "300", "304", "308", "312", "316", "320", "324", "328", "332", "334", "336", "340", "344", "348", "352", "356", "360", "364", "368", "372", "376", "380", "384", "388", "392", "398", "400", "404", "408", "410", "414", "417", "418", "422", "426", "428", "430", "434", "438", "440", "442", "446", "450", "454", "458", "462", "466", "470", "474", "478", "480", "484", "492", "496", "498", "499", "500", "504", "508", "512", "516", "520", "524", "528", "531", "533", "534", "535", "540", "548", "554", "558", "562", "566", "570", "574", "578", "580", "581", "583", "584", "585", "586", "591", "598", "600", "604", "608", "612", "616", "620", "624", "626", "630", "634", "638", "642", "643", "646", "652", "654", "659", "660", "662", "663", "666", "670", "674", "678", "682", "686", "688", "690", "694", "702", "703", "704", "705", "706", "710", "716", "724", "728", "729", "732", "740", "744", "748", "752", "756", "760", "762", "764", "768", "772", "776", "780", "784", "788", "792", "795", "796", "798", "800", "804", "807", "818", "826", "831", "832", "833", "834", "840", "850", "854", "858", "860", "862", "876", "882", "887", "894"]);
    function isISO31661Numeric(str) {
      (0, _assertString.default)(str);
      return validISO31661NumericCountriesCodes.has(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isISO4217.js
var require_isISO4217 = __commonJS({
  "node_modules/validator/lib/isISO4217.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.CurrencyCodes = void 0;
    exports2.default = isISO4217;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var validISO4217CurrencyCodes = /* @__PURE__ */ new Set(["AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN", "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BOV", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHE", "CHF", "CHW", "CLF", "CLP", "CNY", "COP", "COU", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "EUR", "FJD", "FKP", "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MXV", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL", "SOS", "SRD", "SSP", "STN", "SVC", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "USN", "UYI", "UYU", "UYW", "UZS", "VED", "VES", "VND", "VUV", "WST", "XAF", "XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XCD", "XDR", "XOF", "XPD", "XPF", "XPT", "XSU", "XTS", "XUA", "XXX", "YER", "ZAR", "ZMW", "ZWL"]);
    function isISO4217(str) {
      (0, _assertString.default)(str);
      return validISO4217CurrencyCodes.has(str.toUpperCase());
    }
    var CurrencyCodes = exports2.CurrencyCodes = validISO4217CurrencyCodes;
  }
});

// node_modules/validator/lib/isBase32.js
var require_isBase32 = __commonJS({
  "node_modules/validator/lib/isBase32.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isBase32;
    var _assertString = _interopRequireDefault(require_assertString());
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var base32 = /^[A-Z2-7]+=*$/;
    var crockfordBase32 = /^[A-HJKMNP-TV-Z0-9]+$/;
    var defaultBase32Options = {
      crockford: false
    };
    function isBase32(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, defaultBase32Options);
      if (options.crockford) {
        return crockfordBase32.test(str);
      }
      return str.length % 8 === 0 && base32.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isBase58.js
var require_isBase58 = __commonJS({
  "node_modules/validator/lib/isBase58.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isBase58;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var base58Reg = /^[A-HJ-NP-Za-km-z1-9]*$/;
    function isBase58(str) {
      (0, _assertString.default)(str);
      return base58Reg.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isDataURI.js
var require_isDataURI = __commonJS({
  "node_modules/validator/lib/isDataURI.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isDataURI;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var validMediaType = /^[a-z]+\/[a-z0-9\-\+\._]+$/i;
    var validAttribute = /^[a-z\-]+=[a-z0-9\-]+$/i;
    var validData = /^[a-z0-9!\$&'\(\)\*\+,;=\-\._~:@\/\?%\s]*$/i;
    function isDataURI(str) {
      (0, _assertString.default)(str);
      var data = str.split(",");
      if (data.length < 2) {
        return false;
      }
      var attributes = data.shift().trim().split(";");
      var schemeAndMediaType = attributes.shift();
      if (schemeAndMediaType.slice(0, 5) !== "data:") {
        return false;
      }
      var mediaType = schemeAndMediaType.slice(5);
      if (mediaType !== "" && !validMediaType.test(mediaType)) {
        return false;
      }
      for (var i = 0; i < attributes.length; i++) {
        if (!(i === attributes.length - 1 && attributes[i].toLowerCase() === "base64") && !validAttribute.test(attributes[i])) {
          return false;
        }
      }
      for (var _i = 0; _i < data.length; _i++) {
        if (!validData.test(data[_i])) {
          return false;
        }
      }
      return true;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isMagnetURI.js
var require_isMagnetURI = __commonJS({
  "node_modules/validator/lib/isMagnetURI.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isMagnetURI;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var magnetURIComponent = /(?:^magnet:\?|[^?&]&)xt(?:\.1)?=urn:(?:(?:aich|bitprint|btih|ed2k|ed2khash|kzhash|md5|sha1|tree:tiger):[a-z0-9]{32}(?:[a-z0-9]{8})?|btmh:1220[a-z0-9]{64})(?:$|&)/i;
    function isMagnetURI(url) {
      (0, _assertString.default)(url);
      if (url.indexOf("magnet:?") !== 0) {
        return false;
      }
      return magnetURIComponent.test(url);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/rtrim.js
var require_rtrim = __commonJS({
  "node_modules/validator/lib/rtrim.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = rtrim;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function rtrim(str, chars) {
      (0, _assertString.default)(str);
      if (chars) {
        var pattern = new RegExp("[".concat(chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "]+$"), "g");
        return str.replace(pattern, "");
      }
      var strIndex = str.length - 1;
      while (/\s/.test(str.charAt(strIndex))) {
        strIndex -= 1;
      }
      return str.slice(0, strIndex + 1);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/ltrim.js
var require_ltrim = __commonJS({
  "node_modules/validator/lib/ltrim.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = ltrim;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function ltrim(str, chars) {
      (0, _assertString.default)(str);
      var pattern = chars ? new RegExp("^[".concat(chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "]+"), "g") : /^\s+/g;
      return str.replace(pattern, "");
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/trim.js
var require_trim = __commonJS({
  "node_modules/validator/lib/trim.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = trim;
    var _rtrim = _interopRequireDefault(require_rtrim());
    var _ltrim = _interopRequireDefault(require_ltrim());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function trim(str, chars) {
      return (0, _rtrim.default)((0, _ltrim.default)(str, chars), chars);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isMailtoURI.js
var require_isMailtoURI = __commonJS({
  "node_modules/validator/lib/isMailtoURI.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isMailtoURI;
    var _trim = _interopRequireDefault(require_trim());
    var _isEmail = _interopRequireDefault(require_isEmail());
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function _slicedToArray(r, e) {
      return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
    }
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _iterableToArrayLimit(r, l) {
      var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (null != t) {
        var e, n, i, u, a2 = [], f = true, o = false;
        try {
          if (i = (t = t.call(r)).next, 0 === l) {
            if (Object(t) !== t) return;
            f = false;
          } else for (; !(f = (e = i.call(t)).done) && (a2.push(e.value), a2.length !== l); f = true) ;
        } catch (r2) {
          o = true, n = r2;
        } finally {
          try {
            if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
          } finally {
            if (o) throw n;
          }
        }
        return a2;
      }
    }
    function _arrayWithHoles(r) {
      if (Array.isArray(r)) return r;
    }
    function _createForOfIteratorHelper(r, e) {
      var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
          t && (r = t);
          var _n = 0, F = function F2() {
          };
          return { s: F, n: function n() {
            return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
          }, e: function e2(r2) {
            throw r2;
          }, f: F };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var o, a2 = true, u = false;
      return { s: function s() {
        t = t.call(r);
      }, n: function n() {
        var r2 = t.next();
        return a2 = r2.done, r2;
      }, e: function e2(r2) {
        u = true, o = r2;
      }, f: function f() {
        try {
          a2 || null == t.return || t.return();
        } finally {
          if (u) throw o;
        }
      } };
    }
    function _unsupportedIterableToArray(r, a2) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a2);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a2) : void 0;
      }
    }
    function _arrayLikeToArray(r, a2) {
      (null == a2 || a2 > r.length) && (a2 = r.length);
      for (var e = 0, n = Array(a2); e < a2; e++) n[e] = r[e];
      return n;
    }
    function parseMailtoQueryString(queryString) {
      var allowedParams = /* @__PURE__ */ new Set(["subject", "body", "cc", "bcc"]), query = {
        cc: "",
        bcc: ""
      };
      var isParseFailed = false;
      var queryParams = queryString.split("&");
      if (queryParams.length > 4) {
        return false;
      }
      var _iterator = _createForOfIteratorHelper(queryParams), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var q = _step.value;
          var _q$split = q.split("="), _q$split2 = _slicedToArray(_q$split, 2), key = _q$split2[0], value = _q$split2[1];
          if (key && !allowedParams.has(key)) {
            isParseFailed = true;
            break;
          }
          if (value && (key === "cc" || key === "bcc")) {
            query[key] = value;
          }
          if (key) {
            allowedParams.delete(key);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return isParseFailed ? false : query;
    }
    function isMailtoURI(url, options) {
      (0, _assertString.default)(url);
      if (url.indexOf("mailto:") !== 0) {
        return false;
      }
      var _url$replace$split = url.replace("mailto:", "").split("?"), _url$replace$split2 = _slicedToArray(_url$replace$split, 2), to = _url$replace$split2[0], _url$replace$split2$ = _url$replace$split2[1], queryString = _url$replace$split2$ === void 0 ? "" : _url$replace$split2$;
      if (!to && !queryString) {
        return true;
      }
      var query = parseMailtoQueryString(queryString);
      if (!query) {
        return false;
      }
      return "".concat(to, ",").concat(query.cc, ",").concat(query.bcc).split(",").every(function(email) {
        email = (0, _trim.default)(email, " ");
        if (email) {
          return (0, _isEmail.default)(email, options);
        }
        return true;
      });
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isMimeType.js
var require_isMimeType = __commonJS({
  "node_modules/validator/lib/isMimeType.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isMimeType;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var mimeTypeSimple = /^(application|audio|font|image|message|model|multipart|text|video)\/[a-zA-Z0-9\.\-\+_]{1,100}$/i;
    var mimeTypeText = /^text\/[a-zA-Z0-9\.\-\+]{1,100};\s?charset=("[a-zA-Z0-9\.\-\+\s]{0,70}"|[a-zA-Z0-9\.\-\+]{0,70})(\s?\([a-zA-Z0-9\.\-\+\s]{1,20}\))?$/i;
    var mimeTypeMultipart = /^multipart\/[a-zA-Z0-9\.\-\+]{1,100}(;\s?(boundary|charset)=("[a-zA-Z0-9\.\-\+\s]{0,70}"|[a-zA-Z0-9\.\-\+]{0,70})(\s?\([a-zA-Z0-9\.\-\+\s]{1,20}\))?){0,2}$/i;
    function isMimeType(str) {
      (0, _assertString.default)(str);
      return mimeTypeSimple.test(str) || mimeTypeText.test(str) || mimeTypeMultipart.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isLatLong.js
var require_isLatLong = __commonJS({
  "node_modules/validator/lib/isLatLong.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isLatLong;
    var _assertString = _interopRequireDefault(require_assertString());
    var _merge = _interopRequireDefault(require_merge());
    var _includesString = _interopRequireDefault(require_includesString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var lat = /^\(?[+-]?(90(\.0+)?|[1-8]?\d(\.\d+)?)$/;
    var long = /^\s?[+-]?(180(\.0+)?|1[0-7]\d(\.\d+)?|\d{1,2}(\.\d+)?)\)?$/;
    var latDMS = /^(([1-8]?\d)\D+([1-5]?\d|60)\D+([1-5]?\d|60)(\.\d+)?|90\D+0\D+0)\D+[NSns]?$/i;
    var longDMS = /^\s*([1-7]?\d{1,2}\D+([1-5]?\d|60)\D+([1-5]?\d|60)(\.\d+)?|180\D+0\D+0)\D+[EWew]?$/i;
    var defaultLatLongOptions = {
      checkDMS: false
    };
    function isLatLong(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, defaultLatLongOptions);
      if (!(0, _includesString.default)(str, ",")) return false;
      var pair = str.split(",");
      if (pair[0].startsWith("(") && !pair[1].endsWith(")") || pair[1].endsWith(")") && !pair[0].startsWith("(")) return false;
      if (options.checkDMS) {
        return latDMS.test(pair[0]) && longDMS.test(pair[1]);
      }
      return lat.test(pair[0]) && long.test(pair[1]);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isPostalCode.js
var require_isPostalCode = __commonJS({
  "node_modules/validator/lib/isPostalCode.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isPostalCode;
    exports2.locales = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var threeDigit = /^\d{3}$/;
    var fourDigit = /^\d{4}$/;
    var fiveDigit = /^\d{5}$/;
    var sixDigit = /^\d{6}$/;
    var patterns = {
      AD: /^AD\d{3}$/,
      AT: fourDigit,
      AU: fourDigit,
      AZ: /^AZ\d{4}$/,
      BA: /^([7-8]\d{4}$)/,
      BD: /^([1-8][0-9]{3}|9[0-4][0-9]{2})$/,
      BE: fourDigit,
      BG: fourDigit,
      BR: /^\d{5}-?\d{3}$/,
      BY: /^2[1-4]\d{4}$/,
      CA: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][\s\-]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
      CH: fourDigit,
      CN: /^(0[1-7]|1[012356]|2[0-7]|3[0-6]|4[0-7]|5[1-7]|6[1-7]|7[1-5]|8[1345]|9[09])\d{4}$/,
      CO: /^(05|08|11|13|15|17|18|19|20|23|25|27|41|44|47|50|52|54|63|66|68|70|73|76|81|85|86|88|91|94|95|97|99)(\d{4})$/,
      CZ: /^\d{3}\s?\d{2}$/,
      DE: fiveDigit,
      DK: fourDigit,
      DO: fiveDigit,
      DZ: fiveDigit,
      EE: fiveDigit,
      ES: /^(5[0-2]{1}|[0-4]{1}\d{1})\d{3}$/,
      FI: fiveDigit,
      FR: /^(?:(?:0[1-9]|[1-8]\d|9[0-5])\d{3}|97[1-46]\d{2})$/,
      GB: /^(gir\s?0aa|[a-z]{1,2}\d[\da-z]?\s?(\d[a-z]{2})?)$/i,
      GR: /^\d{3}\s?\d{2}$/,
      HR: /^([1-5]\d{4}$)/,
      HT: /^HT\d{4}$/,
      HU: fourDigit,
      ID: fiveDigit,
      IE: /^(?!.*(?:o))[A-Za-z]\d[\dw]\s\w{4}$/i,
      IL: /^(\d{5}|\d{7})$/,
      IN: /^((?!10|29|35|54|55|65|66|86|87|88|89)[1-9][0-9]{5})$/,
      IR: /^(?!(\d)\1{3})[13-9]{4}[1346-9][013-9]{5}$/,
      IS: threeDigit,
      IT: fiveDigit,
      JP: /^\d{3}\-\d{4}$/,
      KE: fiveDigit,
      KR: /^(\d{5}|\d{6})$/,
      LI: /^(948[5-9]|949[0-7])$/,
      LT: /^LT\-\d{5}$/,
      LU: fourDigit,
      LV: /^LV\-\d{4}$/,
      LK: fiveDigit,
      MC: /^980\d{2}$/,
      MG: threeDigit,
      MX: fiveDigit,
      MT: /^[A-Za-z]{3}\s{0,1}\d{4}$/,
      MY: fiveDigit,
      NL: /^[1-9]\d{3}\s?(?!sa|sd|ss)[a-z]{2}$/i,
      NO: fourDigit,
      NP: /^(10|21|22|32|33|34|44|45|56|57)\d{3}$|^(977)$/i,
      NZ: fourDigit,
      // https://www.pakpost.gov.pk/postcodes.php
      PK: fiveDigit,
      PL: /^\d{2}\-\d{3}$/,
      PR: /^00[679]\d{2}([ -]\d{4})?$/,
      PT: /^\d{4}\-\d{3}?$/,
      RO: sixDigit,
      RU: sixDigit,
      SA: fiveDigit,
      SE: /^[1-9]\d{2}\s?\d{2}$/,
      SG: sixDigit,
      SI: fourDigit,
      SK: /^\d{3}\s?\d{2}$/,
      TH: fiveDigit,
      TN: fourDigit,
      TW: /^\d{3}(\d{2,3})?$/,
      UA: fiveDigit,
      US: /^\d{5}(-\d{4})?$/,
      ZA: fourDigit,
      ZM: fiveDigit
    };
    var locales = exports2.locales = Object.keys(patterns);
    function isPostalCode(str, locale) {
      (0, _assertString.default)(str);
      if (locale in patterns) {
        return patterns[locale].test(str);
      } else if (locale === "any") {
        for (var key in patterns) {
          if (patterns.hasOwnProperty(key)) {
            var pattern = patterns[key];
            if (pattern.test(str)) {
              return true;
            }
          }
        }
        return false;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
  }
});

// node_modules/validator/lib/escape.js
var require_escape = __commonJS({
  "node_modules/validator/lib/escape.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = escape;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function escape(str) {
      (0, _assertString.default)(str);
      return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\//g, "&#x2F;").replace(/\\/g, "&#x5C;").replace(/`/g, "&#96;");
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/unescape.js
var require_unescape = __commonJS({
  "node_modules/validator/lib/unescape.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = unescape;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function unescape(str) {
      (0, _assertString.default)(str);
      return str.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x2F;/g, "/").replace(/&#x5C;/g, "\\").replace(/&#96;/g, "`").replace(/&amp;/g, "&");
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/blacklist.js
var require_blacklist = __commonJS({
  "node_modules/validator/lib/blacklist.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = blacklist;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function blacklist(str, chars) {
      (0, _assertString.default)(str);
      return str.replace(new RegExp("[".concat(chars, "]+"), "g"), "");
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/stripLow.js
var require_stripLow = __commonJS({
  "node_modules/validator/lib/stripLow.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = stripLow;
    var _assertString = _interopRequireDefault(require_assertString());
    var _blacklist = _interopRequireDefault(require_blacklist());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function stripLow(str, keep_new_lines) {
      (0, _assertString.default)(str);
      var chars = keep_new_lines ? "\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F\\x7F" : "\\x00-\\x1F\\x7F";
      return (0, _blacklist.default)(str, chars);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/whitelist.js
var require_whitelist = __commonJS({
  "node_modules/validator/lib/whitelist.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = whitelist;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function whitelist(str, chars) {
      (0, _assertString.default)(str);
      return str.replace(new RegExp("[^".concat(chars, "]+"), "g"), "");
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isWhitelisted.js
var require_isWhitelisted = __commonJS({
  "node_modules/validator/lib/isWhitelisted.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isWhitelisted;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function isWhitelisted(str, chars) {
      (0, _assertString.default)(str);
      for (var i = str.length - 1; i >= 0; i--) {
        if (chars.indexOf(str[i]) === -1) {
          return false;
        }
      }
      return true;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/normalizeEmail.js
var require_normalizeEmail = __commonJS({
  "node_modules/validator/lib/normalizeEmail.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = normalizeEmail;
    var _merge = _interopRequireDefault(require_merge());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var default_normalize_email_options = {
      // The following options apply to all email addresses
      // Lowercases the local part of the email address.
      // Please note this may violate RFC 5321 as per http://stackoverflow.com/a/9808332/192024).
      // The domain is always lowercased, as per RFC 1035
      all_lowercase: true,
      // The following conversions are specific to GMail
      // Lowercases the local part of the GMail address (known to be case-insensitive)
      gmail_lowercase: true,
      // Removes dots from the local part of the email address, as that's ignored by GMail
      gmail_remove_dots: true,
      // Removes the subaddress (e.g. "+foo") from the email address
      gmail_remove_subaddress: true,
      // Conversts the googlemail.com domain to gmail.com
      gmail_convert_googlemaildotcom: true,
      // The following conversions are specific to Outlook.com / Windows Live / Hotmail
      // Lowercases the local part of the Outlook.com address (known to be case-insensitive)
      outlookdotcom_lowercase: true,
      // Removes the subaddress (e.g. "+foo") from the email address
      outlookdotcom_remove_subaddress: true,
      // The following conversions are specific to Yahoo
      // Lowercases the local part of the Yahoo address (known to be case-insensitive)
      yahoo_lowercase: true,
      // Removes the subaddress (e.g. "-foo") from the email address
      yahoo_remove_subaddress: true,
      // The following conversions are specific to Yandex
      // Lowercases the local part of the Yandex address (known to be case-insensitive)
      yandex_lowercase: true,
      // all yandex domains are equal, this explicitly sets the domain to 'yandex.ru'
      yandex_convert_yandexru: true,
      // The following conversions are specific to iCloud
      // Lowercases the local part of the iCloud address (known to be case-insensitive)
      icloud_lowercase: true,
      // Removes the subaddress (e.g. "+foo") from the email address
      icloud_remove_subaddress: true
    };
    var icloud_domains = ["icloud.com", "me.com"];
    var outlookdotcom_domains = ["hotmail.at", "hotmail.be", "hotmail.ca", "hotmail.cl", "hotmail.co.il", "hotmail.co.nz", "hotmail.co.th", "hotmail.co.uk", "hotmail.com", "hotmail.com.ar", "hotmail.com.au", "hotmail.com.br", "hotmail.com.gr", "hotmail.com.mx", "hotmail.com.pe", "hotmail.com.tr", "hotmail.com.vn", "hotmail.cz", "hotmail.de", "hotmail.dk", "hotmail.es", "hotmail.fr", "hotmail.hu", "hotmail.id", "hotmail.ie", "hotmail.in", "hotmail.it", "hotmail.jp", "hotmail.kr", "hotmail.lv", "hotmail.my", "hotmail.ph", "hotmail.pt", "hotmail.sa", "hotmail.sg", "hotmail.sk", "live.be", "live.co.uk", "live.com", "live.com.ar", "live.com.mx", "live.de", "live.es", "live.eu", "live.fr", "live.it", "live.nl", "msn.com", "outlook.at", "outlook.be", "outlook.cl", "outlook.co.il", "outlook.co.nz", "outlook.co.th", "outlook.com", "outlook.com.ar", "outlook.com.au", "outlook.com.br", "outlook.com.gr", "outlook.com.pe", "outlook.com.tr", "outlook.com.vn", "outlook.cz", "outlook.de", "outlook.dk", "outlook.es", "outlook.fr", "outlook.hu", "outlook.id", "outlook.ie", "outlook.in", "outlook.it", "outlook.jp", "outlook.kr", "outlook.lv", "outlook.my", "outlook.ph", "outlook.pt", "outlook.sa", "outlook.sg", "outlook.sk", "passport.com"];
    var yahoo_domains = ["rocketmail.com", "yahoo.ca", "yahoo.co.uk", "yahoo.com", "yahoo.de", "yahoo.fr", "yahoo.in", "yahoo.it", "ymail.com"];
    var yandex_domains = ["yandex.ru", "yandex.ua", "yandex.kz", "yandex.com", "yandex.by", "ya.ru"];
    function dotsReplacer(match) {
      if (match.length > 1) {
        return match;
      }
      return "";
    }
    function normalizeEmail(email, options) {
      options = (0, _merge.default)(options, default_normalize_email_options);
      var raw_parts = email.split("@");
      var domain = raw_parts.pop();
      var user = raw_parts.join("@");
      var parts = [user, domain];
      parts[1] = parts[1].toLowerCase();
      if (parts[1] === "gmail.com" || parts[1] === "googlemail.com") {
        if (options.gmail_remove_subaddress) {
          parts[0] = parts[0].split("+")[0];
        }
        if (options.gmail_remove_dots) {
          parts[0] = parts[0].replace(/\.+/g, dotsReplacer);
        }
        if (!parts[0].length) {
          return false;
        }
        if (options.all_lowercase || options.gmail_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
        parts[1] = options.gmail_convert_googlemaildotcom ? "gmail.com" : parts[1];
      } else if (icloud_domains.indexOf(parts[1]) >= 0) {
        if (options.icloud_remove_subaddress) {
          parts[0] = parts[0].split("+")[0];
        }
        if (!parts[0].length) {
          return false;
        }
        if (options.all_lowercase || options.icloud_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
      } else if (outlookdotcom_domains.indexOf(parts[1]) >= 0) {
        if (options.outlookdotcom_remove_subaddress) {
          parts[0] = parts[0].split("+")[0];
        }
        if (!parts[0].length) {
          return false;
        }
        if (options.all_lowercase || options.outlookdotcom_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
      } else if (yahoo_domains.indexOf(parts[1]) >= 0) {
        if (options.yahoo_remove_subaddress) {
          var components = parts[0].split("-");
          parts[0] = components.length > 1 ? components.slice(0, -1).join("-") : components[0];
        }
        if (!parts[0].length) {
          return false;
        }
        if (options.all_lowercase || options.yahoo_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
      } else if (yandex_domains.indexOf(parts[1]) >= 0) {
        if (options.all_lowercase || options.yandex_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
        parts[1] = options.yandex_convert_yandexru ? "yandex.ru" : parts[1];
      } else if (options.all_lowercase) {
        parts[0] = parts[0].toLowerCase();
      }
      return parts.join("@");
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isSlug.js
var require_isSlug = __commonJS({
  "node_modules/validator/lib/isSlug.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isSlug;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var charsetRegex = /^[a-z0-9](?!.*[-_]{2,})(?:[a-z0-9_-]*[a-z0-9])?$/;
    function isSlug(str) {
      (0, _assertString.default)(str);
      return charsetRegex.test(str);
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isLicensePlate.js
var require_isLicensePlate = __commonJS({
  "node_modules/validator/lib/isLicensePlate.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isLicensePlate;
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var validators = {
      "cs-CZ": function csCZ(str) {
        return /^(([ABCDEFHIJKLMNPRSTUVXYZ]|[0-9])-?){5,8}$/.test(str);
      },
      "de-DE": function deDE(str) {
        return /^((A|AA|AB|AC|AE|AH|AK|AM|AN|AÖ|AP|AS|AT|AU|AW|AZ|B|BA|BB|BC|BE|BF|BH|BI|BK|BL|BM|BN|BO|BÖ|BS|BT|BZ|C|CA|CB|CE|CO|CR|CW|D|DA|DD|DE|DH|DI|DL|DM|DN|DO|DU|DW|DZ|E|EA|EB|ED|EE|EF|EG|EH|EI|EL|EM|EN|ER|ES|EU|EW|F|FB|FD|FF|FG|FI|FL|FN|FO|FR|FS|FT|FÜ|FW|FZ|G|GA|GC|GD|GE|GF|GG|GI|GK|GL|GM|GN|GÖ|GP|GR|GS|GT|GÜ|GV|GW|GZ|H|HA|HB|HC|HD|HE|HF|HG|HH|HI|HK|HL|HM|HN|HO|HP|HR|HS|HU|HV|HX|HY|HZ|IK|IL|IN|IZ|J|JE|JL|K|KA|KB|KC|KE|KF|KG|KH|KI|KK|KL|KM|KN|KO|KR|KS|KT|KU|KW|KY|L|LA|LB|LC|LD|LF|LG|LH|LI|LL|LM|LN|LÖ|LP|LR|LU|M|MA|MB|MC|MD|ME|MG|MH|MI|MK|ML|MM|MN|MO|MQ|MR|MS|MÜ|MW|MY|MZ|N|NB|ND|NE|NF|NH|NI|NK|NM|NÖ|NP|NR|NT|NU|NW|NY|NZ|OA|OB|OC|OD|OE|OF|OG|OH|OK|OL|OP|OS|OZ|P|PA|PB|PE|PF|PI|PL|PM|PN|PR|PS|PW|PZ|R|RA|RC|RD|RE|RG|RH|RI|RL|RM|RN|RO|RP|RS|RT|RU|RV|RW|RZ|S|SB|SC|SE|SG|SI|SK|SL|SM|SN|SO|SP|SR|ST|SU|SW|SY|SZ|TE|TF|TG|TO|TP|TR|TS|TT|TÜ|ÜB|UE|UH|UL|UM|UN|V|VB|VG|VK|VR|VS|W|WA|WB|WE|WF|WI|WK|WL|WM|WN|WO|WR|WS|WT|WÜ|WW|WZ|Z|ZE|ZI|ZP|ZR|ZW|ZZ)[- ]?[A-Z]{1,2}[- ]?\d{1,4}|(ABG|ABI|AIB|AIC|ALF|ALZ|ANA|ANG|ANK|APD|ARN|ART|ASL|ASZ|AUR|AZE|BAD|BAR|BBG|BCH|BED|BER|BGD|BGL|BID|BIN|BIR|BIT|BIW|BKS|BLB|BLK|BNA|BOG|BOH|BOR|BOT|BRA|BRB|BRG|BRK|BRL|BRV|BSB|BSK|BTF|BÜD|BUL|BÜR|BÜS|BÜZ|CAS|CHA|CLP|CLZ|COC|COE|CUX|DAH|DAN|DAU|DBR|DEG|DEL|DGF|DIL|DIN|DIZ|DKB|DLG|DON|DUD|DÜW|EBE|EBN|EBS|ECK|EIC|EIL|EIN|EIS|EMD|EMS|ERB|ERH|ERK|ERZ|ESB|ESW|FDB|FDS|FEU|FFB|FKB|FLÖ|FOR|FRG|FRI|FRW|FTL|FÜS|GAN|GAP|GDB|GEL|GEO|GER|GHA|GHC|GLA|GMN|GNT|GOA|GOH|GRA|GRH|GRI|GRM|GRZ|GTH|GUB|GUN|GVM|HAB|HAL|HAM|HAS|HBN|HBS|HCH|HDH|HDL|HEB|HEF|HEI|HER|HET|HGN|HGW|HHM|HIG|HIP|HMÜ|HOG|HOH|HOL|HOM|HOR|HÖS|HOT|HRO|HSK|HST|HVL|HWI|IGB|ILL|JÜL|KEH|KEL|KEM|KIB|KLE|KLZ|KÖN|KÖT|KÖZ|KRU|KÜN|KUS|KYF|LAN|LAU|LBS|LBZ|LDK|LDS|LEO|LER|LEV|LIB|LIF|LIP|LÖB|LOS|LRO|LSZ|LÜN|LUP|LWL|MAB|MAI|MAK|MAL|MED|MEG|MEI|MEK|MEL|MER|MET|MGH|MGN|MHL|MIL|MKK|MOD|MOL|MON|MOS|MSE|MSH|MSP|MST|MTK|MTL|MÜB|MÜR|MYK|MZG|NAB|NAI|NAU|NDH|NEA|NEB|NEC|NEN|NES|NEW|NMB|NMS|NOH|NOL|NOM|NOR|NVP|NWM|OAL|OBB|OBG|OCH|OHA|ÖHR|OHV|OHZ|OPR|OSL|OVI|OVL|OVP|PAF|PAN|PAR|PCH|PEG|PIR|PLÖ|PRÜ|QFT|QLB|RDG|REG|REH|REI|RID|RIE|ROD|ROF|ROK|ROL|ROS|ROT|ROW|RSL|RÜD|RÜG|SAB|SAD|SAN|SAW|SBG|SBK|SCZ|SDH|SDL|SDT|SEB|SEE|SEF|SEL|SFB|SFT|SGH|SHA|SHG|SHK|SHL|SIG|SIM|SLE|SLF|SLK|SLN|SLS|SLÜ|SLZ|SMÜ|SOB|SOG|SOK|SÖM|SON|SPB|SPN|SRB|SRO|STA|STB|STD|STE|STL|SUL|SÜW|SWA|SZB|TBB|TDO|TET|TIR|TÖL|TUT|UEM|UER|UFF|USI|VAI|VEC|VER|VIB|VIE|VIT|VOH|WAF|WAK|WAN|WAR|WAT|WBS|WDA|WEL|WEN|WER|WES|WHV|WIL|WIS|WIT|WIZ|WLG|WMS|WND|WOB|WOH|WOL|WOR|WOS|WRN|WSF|WST|WSW|WTL|WTM|WUG|WÜM|WUN|WUR|WZL|ZEL|ZIG)[- ]?(([A-Z][- ]?\d{1,4})|([A-Z]{2}[- ]?\d{1,3})))[- ]?(E|H)?$/.test(str);
      },
      "de-LI": function deLI(str) {
        return /^FL[- ]?\d{1,5}[UZ]?$/.test(str);
      },
      "en-IN": function enIN(str) {
        return /^[A-Z]{2}[ -]?[0-9]{1,2}(?:[ -]?[A-Z])(?:[ -]?[A-Z]*)?[ -]?[0-9]{4}$/.test(str);
      },
      "en-SG": function enSG(str) {
        return /^[A-Z]{3}[ -]?[\d]{4}[ -]?[A-Z]{1}$/.test(str);
      },
      "es-AR": function esAR(str) {
        return /^(([A-Z]{2} ?[0-9]{3} ?[A-Z]{2})|([A-Z]{3} ?[0-9]{3}))$/.test(str);
      },
      "fi-FI": function fiFI(str) {
        return /^(?=.{4,7})(([A-Z]{1,3}|[0-9]{1,3})[\s-]?([A-Z]{1,3}|[0-9]{1,5}))$/.test(str);
      },
      "hu-HU": function huHU(str) {
        return /^((((?!AAA)(([A-NPRSTVZWXY]{1})([A-PR-Z]{1})([A-HJ-NPR-Z]))|(A[ABC]I)|A[ABC]O|A[A-W]Q|BPI|BPO|UCO|UDO|XAO)-(?!000)\d{3})|(M\d{6})|((CK|DT|CD|HC|H[ABEFIKLMNPRSTVX]|MA|OT|R[A-Z]) \d{2}-\d{2})|(CD \d{3}-\d{3})|(C-(C|X) \d{4})|(X-(A|B|C) \d{4})|(([EPVZ]-\d{5}))|(S A[A-Z]{2} \d{2})|(SP \d{2}-\d{2}))$/.test(str);
      },
      "pt-BR": function ptBR(str) {
        return /^[A-Z]{3}[ -]?[0-9][A-Z][0-9]{2}|[A-Z]{3}[ -]?[0-9]{4}$/.test(str);
      },
      "pt-PT": function ptPT(str) {
        return /^(([A-Z]{2}[ -·]?[0-9]{2}[ -·]?[0-9]{2})|([0-9]{2}[ -·]?[A-Z]{2}[ -·]?[0-9]{2})|([0-9]{2}[ -·]?[0-9]{2}[ -·]?[A-Z]{2})|([A-Z]{2}[ -·]?[0-9]{2}[ -·]?[A-Z]{2}))$/.test(str);
      },
      "sq-AL": function sqAL(str) {
        return /^[A-Z]{2}[- ]?((\d{3}[- ]?(([A-Z]{2})|T))|(R[- ]?\d{3}))$/.test(str);
      },
      "sv-SE": function svSE(str) {
        return /^[A-HJ-PR-UW-Z]{3} ?[\d]{2}[A-HJ-PR-UW-Z1-9]$|(^[A-ZÅÄÖ ]{2,7}$)/.test(str.trim());
      },
      "en-PK": function enPK(str) {
        return /(^[A-Z]{2}((\s|-){0,1})[0-9]{3,4}((\s|-)[0-9]{2}){0,1}$)|(^[A-Z]{3}((\s|-){0,1})[0-9]{3,4}((\s|-)[0-9]{2}){0,1}$)|(^[A-Z]{4}((\s|-){0,1})[0-9]{3,4}((\s|-)[0-9]{2}){0,1}$)|(^[A-Z]((\s|-){0,1})[0-9]{4}((\s|-)[0-9]{2}){0,1}$)/.test(str.trim());
      }
    };
    function isLicensePlate(str, locale) {
      (0, _assertString.default)(str);
      if (locale in validators) {
        return validators[locale](str);
      } else if (locale === "any") {
        for (var key in validators) {
          var validator2 = validators[key];
          if (validator2(str)) {
            return true;
          }
        }
        return false;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isStrongPassword.js
var require_isStrongPassword = __commonJS({
  "node_modules/validator/lib/isStrongPassword.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isStrongPassword;
    var _merge = _interopRequireDefault(require_merge());
    var _assertString = _interopRequireDefault(require_assertString());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var upperCaseRegex = /^[A-Z]$/;
    var lowerCaseRegex = /^[a-z]$/;
    var numberRegex = /^[0-9]$/;
    var symbolRegex = /^[-#!$@£%^&*()_+|~=`{}\[\]:";'<>?,.\/\\ ]$/;
    var defaultOptions = {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false,
      pointsPerUnique: 1,
      pointsPerRepeat: 0.5,
      pointsForContainingLower: 10,
      pointsForContainingUpper: 10,
      pointsForContainingNumber: 10,
      pointsForContainingSymbol: 10
    };
    function countChars(str) {
      var result = {};
      Array.from(str).forEach(function(char) {
        var curVal = result[char];
        if (curVal) {
          result[char] += 1;
        } else {
          result[char] = 1;
        }
      });
      return result;
    }
    function analyzePassword(password) {
      var charMap = countChars(password);
      var analysis = {
        length: password.length,
        uniqueChars: Object.keys(charMap).length,
        uppercaseCount: 0,
        lowercaseCount: 0,
        numberCount: 0,
        symbolCount: 0
      };
      Object.keys(charMap).forEach(function(char) {
        if (upperCaseRegex.test(char)) {
          analysis.uppercaseCount += charMap[char];
        } else if (lowerCaseRegex.test(char)) {
          analysis.lowercaseCount += charMap[char];
        } else if (numberRegex.test(char)) {
          analysis.numberCount += charMap[char];
        } else if (symbolRegex.test(char)) {
          analysis.symbolCount += charMap[char];
        }
      });
      return analysis;
    }
    function scorePassword(analysis, scoringOptions) {
      var points = 0;
      points += analysis.uniqueChars * scoringOptions.pointsPerUnique;
      points += (analysis.length - analysis.uniqueChars) * scoringOptions.pointsPerRepeat;
      if (analysis.lowercaseCount > 0) {
        points += scoringOptions.pointsForContainingLower;
      }
      if (analysis.uppercaseCount > 0) {
        points += scoringOptions.pointsForContainingUpper;
      }
      if (analysis.numberCount > 0) {
        points += scoringOptions.pointsForContainingNumber;
      }
      if (analysis.symbolCount > 0) {
        points += scoringOptions.pointsForContainingSymbol;
      }
      return points;
    }
    function isStrongPassword(str) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
      (0, _assertString.default)(str);
      var analysis = analyzePassword(str);
      options = (0, _merge.default)(options || {}, defaultOptions);
      if (options.returnScore) {
        return scorePassword(analysis, options);
      }
      return analysis.length >= options.minLength && analysis.lowercaseCount >= options.minLowercase && analysis.uppercaseCount >= options.minUppercase && analysis.numberCount >= options.minNumbers && analysis.symbolCount >= options.minSymbols;
    }
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// node_modules/validator/lib/isVAT.js
var require_isVAT = __commonJS({
  "node_modules/validator/lib/isVAT.js"(exports2) {
    "use strict";
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isVAT;
    exports2.vatMatchers = void 0;
    var _assertString = _interopRequireDefault(require_assertString());
    var algorithms = _interopRequireWildcard(require_algorithms());
    function _interopRequireWildcard(e, t) {
      if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
      return (_interopRequireWildcard = function _interopRequireWildcard2(e2, t2) {
        if (!t2 && e2 && e2.__esModule) return e2;
        var o, i, f = { __proto__: null, default: e2 };
        if (null === e2 || "object" != _typeof(e2) && "function" != typeof e2) return f;
        if (o = t2 ? n : r) {
          if (o.has(e2)) return o.get(e2);
          o.set(e2, f);
        }
        for (var _t3 in e2) "default" !== _t3 && {}.hasOwnProperty.call(e2, _t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e2, _t3)) && (i.get || i.set) ? o(f, _t3, i) : f[_t3] = e2[_t3]);
        return f;
      })(e, t);
    }
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var AU = function AU2(str) {
      var match = str.match(/^(AU)?(\d{11})$/);
      if (!match) {
        return false;
      }
      var weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
      str = str.replace(/^AU/, "");
      var ABN = (parseInt(str.slice(0, 1), 10) - 1).toString() + str.slice(1);
      var total = 0;
      for (var i = 0; i < 11; i++) {
        total += weights[i] * ABN.charAt(i);
      }
      return total !== 0 && total % 89 === 0;
    };
    var CH = function CH2(str) {
      var hasValidCheckNumber = function hasValidCheckNumber2(digits) {
        var lastDigit = digits.pop();
        var weights = [5, 4, 3, 2, 7, 6, 5, 4];
        var calculatedCheckNumber = (11 - digits.reduce(function(acc, el, idx) {
          return acc + el * weights[idx];
        }, 0) % 11) % 11;
        return lastDigit === calculatedCheckNumber;
      };
      return /^(CHE[- ]?)?(\d{9}|(\d{3}\.\d{3}\.\d{3})|(\d{3} \d{3} \d{3})) ?(TVA|MWST|IVA)?$/.test(str) && hasValidCheckNumber(str.match(/\d/g).map(function(el) {
        return +el;
      }));
    };
    var PT = function PT2(str) {
      var match = str.match(/^(PT)?(\d{9})$/);
      if (!match) {
        return false;
      }
      var tin = match[2];
      var checksum = 11 - algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 8).map(function(a2) {
        return parseInt(a2, 10);
      }), 9) % 11;
      if (checksum > 9) {
        return parseInt(tin[8], 10) === 0;
      }
      return checksum === parseInt(tin[8], 10);
    };
    var vatMatchers = exports2.vatMatchers = {
      /**
       * European Union VAT identification numbers
       */
      AT: function AT(str) {
        return /^(AT)?U\d{8}$/.test(str);
      },
      BE: function BE(str) {
        return /^(BE)?\d{10}$/.test(str);
      },
      BG: function BG(str) {
        return /^(BG)?\d{9,10}$/.test(str);
      },
      HR: function HR(str) {
        return /^(HR)?\d{11}$/.test(str);
      },
      CY: function CY(str) {
        return /^(CY)?\w{9}$/.test(str);
      },
      CZ: function CZ(str) {
        return /^(CZ)?\d{8,10}$/.test(str);
      },
      DK: function DK(str) {
        return /^(DK)?\d{8}$/.test(str);
      },
      EE: function EE(str) {
        return /^(EE)?\d{9}$/.test(str);
      },
      FI: function FI(str) {
        return /^(FI)?\d{8}$/.test(str);
      },
      FR: function FR(str) {
        return /^(FR)([A-Z0-9]{2}\d{9})$/.test(str);
      },
      DE: function DE(str) {
        return /^(DE)?\d{9}$/.test(str);
      },
      EL: function EL(str) {
        return /^(EL)?\d{9}$/.test(str);
      },
      HU: function HU(str) {
        return /^(HU)?\d{8}$/.test(str);
      },
      IE: function IE(str) {
        return /^(IE)?\d{7}\w{1}(W)?$/.test(str);
      },
      IT: function IT(str) {
        return /^(IT)?\d{11}$/.test(str);
      },
      LV: function LV(str) {
        return /^(LV)?\d{11}$/.test(str);
      },
      LT: function LT(str) {
        return /^(LT)?\d{9,12}$/.test(str);
      },
      LU: function LU(str) {
        return /^(LU)?\d{8}$/.test(str);
      },
      MT: function MT(str) {
        return /^(MT)?\d{8}$/.test(str);
      },
      NL: function NL(str) {
        return /^(NL)?\d{9}B\d{2}$/.test(str);
      },
      PL: function PL(str) {
        return /^(PL)?(\d{10}|(\d{3}-\d{3}-\d{2}-\d{2})|(\d{3}-\d{2}-\d{2}-\d{3}))$/.test(str);
      },
      PT,
      RO: function RO(str) {
        return /^(RO)?\d{2,10}$/.test(str);
      },
      SK: function SK(str) {
        return /^(SK)?\d{10}$/.test(str);
      },
      SI: function SI(str) {
        return /^(SI)?\d{8}$/.test(str);
      },
      ES: function ES(str) {
        return /^(ES)?\w\d{7}[A-Z]$/.test(str);
      },
      SE: function SE(str) {
        return /^(SE)?\d{12}$/.test(str);
      },
      /**
       * VAT numbers of non-EU countries
       */
      AL: function AL(str) {
        return /^(AL)?\w{9}[A-Z]$/.test(str);
      },
      MK: function MK(str) {
        return /^(MK)?\d{13}$/.test(str);
      },
      AU,
      BY: function BY(str) {
        return /^(УНП )?\d{9}$/.test(str);
      },
      CA: function CA(str) {
        return /^(CA)?\d{9}$/.test(str);
      },
      IS: function IS(str) {
        return /^(IS)?\d{5,6}$/.test(str);
      },
      IN: function IN(str) {
        return /^(IN)?\d{15}$/.test(str);
      },
      ID: function ID(str) {
        return /^(ID)?(\d{15}|(\d{2}.\d{3}.\d{3}.\d{1}-\d{3}.\d{3}))$/.test(str);
      },
      IL: function IL(str) {
        return /^(IL)?\d{9}$/.test(str);
      },
      KZ: function KZ(str) {
        return /^(KZ)?\d{12}$/.test(str);
      },
      NZ: function NZ(str) {
        return /^(NZ)?\d{9}$/.test(str);
      },
      NG: function NG(str) {
        return /^(NG)?(\d{12}|(\d{8}-\d{4}))$/.test(str);
      },
      NO: function NO(str) {
        return /^(NO)?\d{9}MVA$/.test(str);
      },
      PH: function PH(str) {
        return /^(PH)?(\d{12}|\d{3} \d{3} \d{3} \d{3})$/.test(str);
      },
      RU: function RU(str) {
        return /^(RU)?(\d{10}|\d{12})$/.test(str);
      },
      SM: function SM(str) {
        return /^(SM)?\d{5}$/.test(str);
      },
      SA: function SA(str) {
        return /^(SA)?\d{15}$/.test(str);
      },
      RS: function RS(str) {
        return /^(RS)?\d{9}$/.test(str);
      },
      CH,
      TR: function TR(str) {
        return /^(TR)?\d{10}$/.test(str);
      },
      UA: function UA(str) {
        return /^(UA)?\d{12}$/.test(str);
      },
      GB: function GB(str) {
        return /^GB((\d{3} \d{4} ([0-8][0-9]|9[0-6]))|(\d{9} \d{3})|(((GD[0-4])|(HA[5-9]))[0-9]{2}))$/.test(str);
      },
      UZ: function UZ(str) {
        return /^(UZ)?\d{9}$/.test(str);
      },
      /**
       * VAT numbers of Latin American countries
       */
      AR: function AR(str) {
        return /^(AR)?\d{11}$/.test(str);
      },
      BO: function BO(str) {
        return /^(BO)?\d{7}$/.test(str);
      },
      BR: function BR(str) {
        return /^(BR)?((\d{2}.\d{3}.\d{3}\/\d{4}-\d{2})|(\d{3}.\d{3}.\d{3}-\d{2}))$/.test(str);
      },
      CL: function CL(str) {
        return /^(CL)?\d{8}-\d{1}$/.test(str);
      },
      CO: function CO(str) {
        return /^(CO)?\d{10}$/.test(str);
      },
      CR: function CR(str) {
        return /^(CR)?\d{9,12}$/.test(str);
      },
      EC: function EC(str) {
        return /^(EC)?\d{13}$/.test(str);
      },
      SV: function SV(str) {
        return /^(SV)?\d{4}-\d{6}-\d{3}-\d{1}$/.test(str);
      },
      GT: function GT(str) {
        return /^(GT)?\d{7}-\d{1}$/.test(str);
      },
      HN: function HN(str) {
        return /^(HN)?$/.test(str);
      },
      MX: function MX(str) {
        return /^(MX)?\w{3,4}\d{6}\w{3}$/.test(str);
      },
      NI: function NI(str) {
        return /^(NI)?\d{3}-\d{6}-\d{4}\w{1}$/.test(str);
      },
      PA: function PA(str) {
        return /^(PA)?$/.test(str);
      },
      PY: function PY(str) {
        return /^(PY)?\d{6,8}-\d{1}$/.test(str);
      },
      PE: function PE(str) {
        return /^(PE)?\d{11}$/.test(str);
      },
      DO: function DO(str) {
        return /^(DO)?(\d{11}|(\d{3}-\d{7}-\d{1})|[1,4,5]{1}\d{8}|([1,4,5]{1})-\d{2}-\d{5}-\d{1})$/.test(str);
      },
      UY: function UY(str) {
        return /^(UY)?\d{12}$/.test(str);
      },
      VE: function VE(str) {
        return /^(VE)?[J,G,V,E]{1}-(\d{9}|(\d{8}-\d{1}))$/.test(str);
      }
    };
    function isVAT(str, countryCode) {
      (0, _assertString.default)(str);
      (0, _assertString.default)(countryCode);
      if (countryCode in vatMatchers) {
        return vatMatchers[countryCode](str);
      }
      throw new Error("Invalid country code: '".concat(countryCode, "'"));
    }
  }
});

// node_modules/validator/index.js
var require_validator = __commonJS({
  "node_modules/validator/index.js"(exports2, module2) {
    "use strict";
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = void 0;
    var _toDate = _interopRequireDefault(require_toDate());
    var _toFloat = _interopRequireDefault(require_toFloat());
    var _toInt = _interopRequireDefault(require_toInt());
    var _toBoolean = _interopRequireDefault(require_toBoolean());
    var _equals = _interopRequireDefault(require_equals());
    var _contains = _interopRequireDefault(require_contains());
    var _matches = _interopRequireDefault(require_matches());
    var _isEmail = _interopRequireDefault(require_isEmail());
    var _isURL = _interopRequireDefault(require_isURL());
    var _isMACAddress = _interopRequireDefault(require_isMACAddress());
    var _isIP = _interopRequireDefault(require_isIP());
    var _isIPRange = _interopRequireDefault(require_isIPRange());
    var _isFQDN = _interopRequireDefault(require_isFQDN());
    var _isDate = _interopRequireDefault(require_isDate());
    var _isTime = _interopRequireDefault(require_isTime());
    var _isBoolean = _interopRequireDefault(require_isBoolean());
    var _isLocale = _interopRequireDefault(require_isLocale());
    var _isAbaRouting = _interopRequireDefault(require_isAbaRouting());
    var _isAlpha = _interopRequireWildcard(require_isAlpha());
    var _isAlphanumeric = _interopRequireWildcard(require_isAlphanumeric());
    var _isNumeric = _interopRequireDefault(require_isNumeric());
    var _isPassportNumber = _interopRequireWildcard(require_isPassportNumber());
    var _isPort = _interopRequireDefault(require_isPort());
    var _isLowercase = _interopRequireDefault(require_isLowercase());
    var _isUppercase = _interopRequireDefault(require_isUppercase());
    var _isIMEI = _interopRequireDefault(require_isIMEI());
    var _isAscii = _interopRequireDefault(require_isAscii());
    var _isFullWidth = _interopRequireDefault(require_isFullWidth());
    var _isHalfWidth = _interopRequireDefault(require_isHalfWidth());
    var _isVariableWidth = _interopRequireDefault(require_isVariableWidth());
    var _isMultibyte = _interopRequireDefault(require_isMultibyte());
    var _isSemVer = _interopRequireDefault(require_isSemVer());
    var _isSurrogatePair = _interopRequireDefault(require_isSurrogatePair());
    var _isInt = _interopRequireDefault(require_isInt());
    var _isFloat = _interopRequireWildcard(require_isFloat());
    var _isDecimal = _interopRequireDefault(require_isDecimal());
    var _isHexadecimal = _interopRequireDefault(require_isHexadecimal());
    var _isOctal = _interopRequireDefault(require_isOctal());
    var _isDivisibleBy = _interopRequireDefault(require_isDivisibleBy());
    var _isHexColor = _interopRequireDefault(require_isHexColor());
    var _isRgbColor = _interopRequireDefault(require_isRgbColor());
    var _isHSL = _interopRequireDefault(require_isHSL());
    var _isISRC = _interopRequireDefault(require_isISRC());
    var _isIBAN = _interopRequireWildcard(require_isIBAN());
    var _isBIC = _interopRequireDefault(require_isBIC());
    var _isMD = _interopRequireDefault(require_isMD5());
    var _isHash = _interopRequireDefault(require_isHash());
    var _isJWT = _interopRequireDefault(require_isJWT());
    var _isJSON = _interopRequireDefault(require_isJSON());
    var _isEmpty = _interopRequireDefault(require_isEmpty());
    var _isLength = _interopRequireDefault(require_isLength());
    var _isByteLength = _interopRequireDefault(require_isByteLength());
    var _isULID = _interopRequireDefault(require_isULID());
    var _isUUID = _interopRequireDefault(require_isUUID());
    var _isMongoId = _interopRequireDefault(require_isMongoId());
    var _isAfter = _interopRequireDefault(require_isAfter());
    var _isBefore = _interopRequireDefault(require_isBefore());
    var _isIn = _interopRequireDefault(require_isIn());
    var _isLuhnNumber = _interopRequireDefault(require_isLuhnNumber());
    var _isCreditCard = _interopRequireDefault(require_isCreditCard());
    var _isIdentityCard = _interopRequireDefault(require_isIdentityCard());
    var _isEAN = _interopRequireDefault(require_isEAN());
    var _isISIN = _interopRequireDefault(require_isISIN());
    var _isISBN = _interopRequireDefault(require_isISBN());
    var _isISSN = _interopRequireDefault(require_isISSN());
    var _isTaxID = _interopRequireDefault(require_isTaxID());
    var _isMobilePhone = _interopRequireWildcard(require_isMobilePhone());
    var _isEthereumAddress = _interopRequireDefault(require_isEthereumAddress());
    var _isCurrency = _interopRequireDefault(require_isCurrency());
    var _isBtcAddress = _interopRequireDefault(require_isBtcAddress());
    var _isISO = require_isISO6346();
    var _isISO2 = _interopRequireDefault(require_isISO6391());
    var _isISO3 = _interopRequireDefault(require_isISO8601());
    var _isRFC = _interopRequireDefault(require_isRFC3339());
    var _isISO4 = _interopRequireDefault(require_isISO15924());
    var _isISO31661Alpha = _interopRequireDefault(require_isISO31661Alpha2());
    var _isISO31661Alpha2 = _interopRequireDefault(require_isISO31661Alpha3());
    var _isISO31661Numeric = _interopRequireDefault(require_isISO31661Numeric());
    var _isISO5 = _interopRequireDefault(require_isISO4217());
    var _isBase = _interopRequireDefault(require_isBase32());
    var _isBase2 = _interopRequireDefault(require_isBase58());
    var _isBase3 = _interopRequireDefault(require_isBase64());
    var _isDataURI = _interopRequireDefault(require_isDataURI());
    var _isMagnetURI = _interopRequireDefault(require_isMagnetURI());
    var _isMailtoURI = _interopRequireDefault(require_isMailtoURI());
    var _isMimeType = _interopRequireDefault(require_isMimeType());
    var _isLatLong = _interopRequireDefault(require_isLatLong());
    var _isPostalCode = _interopRequireWildcard(require_isPostalCode());
    var _ltrim = _interopRequireDefault(require_ltrim());
    var _rtrim = _interopRequireDefault(require_rtrim());
    var _trim = _interopRequireDefault(require_trim());
    var _escape = _interopRequireDefault(require_escape());
    var _unescape = _interopRequireDefault(require_unescape());
    var _stripLow = _interopRequireDefault(require_stripLow());
    var _whitelist = _interopRequireDefault(require_whitelist());
    var _blacklist = _interopRequireDefault(require_blacklist());
    var _isWhitelisted = _interopRequireDefault(require_isWhitelisted());
    var _normalizeEmail = _interopRequireDefault(require_normalizeEmail());
    var _isSlug = _interopRequireDefault(require_isSlug());
    var _isLicensePlate = _interopRequireDefault(require_isLicensePlate());
    var _isStrongPassword = _interopRequireDefault(require_isStrongPassword());
    var _isVAT = _interopRequireDefault(require_isVAT());
    function _interopRequireWildcard(e, t) {
      if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
      return (_interopRequireWildcard = function _interopRequireWildcard2(e2, t2) {
        if (!t2 && e2 && e2.__esModule) return e2;
        var o, i, f = { __proto__: null, default: e2 };
        if (null === e2 || "object" != _typeof(e2) && "function" != typeof e2) return f;
        if (o = t2 ? n : r) {
          if (o.has(e2)) return o.get(e2);
          o.set(e2, f);
        }
        for (var _t3 in e2) "default" !== _t3 && {}.hasOwnProperty.call(e2, _t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e2, _t3)) && (i.get || i.set) ? o(f, _t3, i) : f[_t3] = e2[_t3]);
        return f;
      })(e, t);
    }
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var version = "13.15.35";
    var validator2 = {
      version,
      toDate: _toDate.default,
      toFloat: _toFloat.default,
      toInt: _toInt.default,
      toBoolean: _toBoolean.default,
      equals: _equals.default,
      contains: _contains.default,
      matches: _matches.default,
      isEmail: _isEmail.default,
      isURL: _isURL.default,
      isMACAddress: _isMACAddress.default,
      isIP: _isIP.default,
      isIPRange: _isIPRange.default,
      isFQDN: _isFQDN.default,
      isBoolean: _isBoolean.default,
      isIBAN: _isIBAN.default,
      isBIC: _isBIC.default,
      isAbaRouting: _isAbaRouting.default,
      isAlpha: _isAlpha.default,
      isAlphaLocales: _isAlpha.locales,
      isAlphanumeric: _isAlphanumeric.default,
      isAlphanumericLocales: _isAlphanumeric.locales,
      isNumeric: _isNumeric.default,
      isPassportNumber: _isPassportNumber.default,
      passportNumberLocales: _isPassportNumber.locales,
      isPort: _isPort.default,
      isLowercase: _isLowercase.default,
      isUppercase: _isUppercase.default,
      isAscii: _isAscii.default,
      isFullWidth: _isFullWidth.default,
      isHalfWidth: _isHalfWidth.default,
      isVariableWidth: _isVariableWidth.default,
      isMultibyte: _isMultibyte.default,
      isSemVer: _isSemVer.default,
      isSurrogatePair: _isSurrogatePair.default,
      isInt: _isInt.default,
      isIMEI: _isIMEI.default,
      isFloat: _isFloat.default,
      isFloatLocales: _isFloat.locales,
      isDecimal: _isDecimal.default,
      isHexadecimal: _isHexadecimal.default,
      isOctal: _isOctal.default,
      isDivisibleBy: _isDivisibleBy.default,
      isHexColor: _isHexColor.default,
      isRgbColor: _isRgbColor.default,
      isHSL: _isHSL.default,
      isISRC: _isISRC.default,
      isMD5: _isMD.default,
      isHash: _isHash.default,
      isJWT: _isJWT.default,
      isJSON: _isJSON.default,
      isEmpty: _isEmpty.default,
      isLength: _isLength.default,
      isLocale: _isLocale.default,
      isByteLength: _isByteLength.default,
      isULID: _isULID.default,
      isUUID: _isUUID.default,
      isMongoId: _isMongoId.default,
      isAfter: _isAfter.default,
      isBefore: _isBefore.default,
      isIn: _isIn.default,
      isLuhnNumber: _isLuhnNumber.default,
      isCreditCard: _isCreditCard.default,
      isIdentityCard: _isIdentityCard.default,
      isEAN: _isEAN.default,
      isISIN: _isISIN.default,
      isISBN: _isISBN.default,
      isISSN: _isISSN.default,
      isMobilePhone: _isMobilePhone.default,
      isMobilePhoneLocales: _isMobilePhone.locales,
      isPostalCode: _isPostalCode.default,
      isPostalCodeLocales: _isPostalCode.locales,
      isEthereumAddress: _isEthereumAddress.default,
      isCurrency: _isCurrency.default,
      isBtcAddress: _isBtcAddress.default,
      isISO6346: _isISO.isISO6346,
      isFreightContainerID: _isISO.isFreightContainerID,
      isISO6391: _isISO2.default,
      isISO8601: _isISO3.default,
      isISO15924: _isISO4.default,
      isRFC3339: _isRFC.default,
      isISO31661Alpha2: _isISO31661Alpha.default,
      isISO31661Alpha3: _isISO31661Alpha2.default,
      isISO31661Numeric: _isISO31661Numeric.default,
      isISO4217: _isISO5.default,
      isBase32: _isBase.default,
      isBase58: _isBase2.default,
      isBase64: _isBase3.default,
      isDataURI: _isDataURI.default,
      isMagnetURI: _isMagnetURI.default,
      isMailtoURI: _isMailtoURI.default,
      isMimeType: _isMimeType.default,
      isLatLong: _isLatLong.default,
      ltrim: _ltrim.default,
      rtrim: _rtrim.default,
      trim: _trim.default,
      escape: _escape.default,
      unescape: _unescape.default,
      stripLow: _stripLow.default,
      whitelist: _whitelist.default,
      blacklist: _blacklist.default,
      isWhitelisted: _isWhitelisted.default,
      normalizeEmail: _normalizeEmail.default,
      toString,
      isSlug: _isSlug.default,
      isStrongPassword: _isStrongPassword.default,
      isTaxID: _isTaxID.default,
      isDate: _isDate.default,
      isTime: _isTime.default,
      isLicensePlate: _isLicensePlate.default,
      isVAT: _isVAT.default,
      ibanLocales: _isIBAN.locales
    };
    var _default = exports2.default = validator2;
    module2.exports = exports2.default;
    module2.exports.default = exports2.default;
  }
});

// src/backend/registry/SrklDeploymentRegistry.ts
var SrklDeploymentRegistry_exports = {};
__export(SrklDeploymentRegistry_exports, {
  bootstrapSrklDeploymentsTable: () => bootstrapSrklDeploymentsTable,
  cleanDeploymentUrl: () => cleanDeploymentUrl,
  clearSrklDeploymentCache: () => clearSrklDeploymentCache,
  getRegisteredSrklDeployments: () => getRegisteredSrklDeployments,
  registerSrklDeployment: () => registerSrklDeployment
});
function cleanDeploymentUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.origin.replace(/\/+$/, "");
  } catch {
    return rawUrl.trim().replace(/\/+$/, "");
  }
}
function computeDeploymentId(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return `srkl-${Math.abs(hash).toString(36)}`;
}
async function bootstrapSrklDeploymentsTable(databaseUrl) {
  const sql = cs(databaseUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS public."ultrst-srkl-deployments" (
      id varchar(120) PRIMARY KEY,
      url text NOT NULL UNIQUE,
      label varchar(255) NOT NULL DEFAULT 'SRKL Engine Deployment',
      environment varchar(32) NOT NULL DEFAULT 'production',
      is_active boolean NOT NULL DEFAULT true,
      is_primary boolean NOT NULL DEFAULT false,
      priority integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS ultrst_srkl_deployments_active_idx
      ON public."ultrst-srkl-deployments" (is_active, priority DESC, is_primary DESC)
  `;
}
async function registerSrklDeployment(env = {}, rawUrl, options = {}) {
  const normalizedUrl = cleanDeploymentUrl(rawUrl);
  if (!normalizedUrl) throw new Error("INVALID_DEPLOYMENT_URL");
  const dbUrls = getUnifiedDbUrls(env);
  const databaseUrl = dbUrls[0];
  if (!databaseUrl) throw new Error("SYSTEM_DATABASE_UNAVAILABLE");
  const cacheKey = `${databaseUrl}|${normalizedUrl}`;
  if (!options.force && registeredUrls.has(cacheKey)) {
    return { registered: true, url: normalizedUrl, id: computeDeploymentId(normalizedUrl) };
  }
  await bootstrapSrklDeploymentsTable(databaseUrl);
  const id = computeDeploymentId(normalizedUrl);
  const label = options.label || "SRKL Engine Deployment";
  const isPrimary = options.isPrimary ?? false;
  const priority = options.priority ?? 0;
  const environment = normalizedUrl.includes("localhost") || normalizedUrl.includes("127.0.0.1") ? "development" : normalizedUrl.includes("staging") ? "staging" : "production";
  const sql = cs(databaseUrl);
  await sql`
    INSERT INTO public."ultrst-srkl-deployments" (
      id, url, label, environment, is_active, is_primary, priority, updated_at
    )
    VALUES (
      ${id}, ${normalizedUrl}, ${label}, ${environment}, true, ${isPrimary}, ${priority}, CURRENT_TIMESTAMP
    )
    ON CONFLICT (url) DO UPDATE SET
      is_active = true,
      updated_at = CURRENT_TIMESTAMP
  `;
  registeredUrls.add(cacheKey);
  return { registered: true, url: normalizedUrl, id };
}
async function getRegisteredSrklDeployments(env = {}) {
  const dbUrls = getUnifiedDbUrls(env);
  const databaseUrl = dbUrls[0];
  if (!databaseUrl) return [];
  try {
    const sql = cs(databaseUrl);
    const rows = await sql`
      SELECT id, url, label, environment, is_active, is_primary, priority
      FROM public."ultrst-srkl-deployments"
      WHERE is_active = true
      ORDER BY is_primary DESC, priority DESC, created_at ASC
    `;
    return rows.map((r) => ({
      id: String(r.id),
      url: cleanDeploymentUrl(String(r.url)),
      label: r.label,
      environment: r.environment,
      isActive: Boolean(r.is_active),
      isPrimary: Boolean(r.is_primary),
      priority: Number(r.priority || 0)
    }));
  } catch {
    return [];
  }
}
function clearSrklDeploymentCache() {
  registeredUrls.clear();
}
var registeredUrls;
var init_SrklDeploymentRegistry = __esm({
  "src/backend/registry/SrklDeploymentRegistry.ts"() {
    init_serverless();
    init_unifiedDb();
    registeredUrls = /* @__PURE__ */ new Set();
  }
});

// src/backend/services/backblaze/client/backblazeClient.ts
var BackblazeClient = class {
  async verifyKeys(keyId, appKey) {
    const res = await fetch("/api/backblaze/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId, applicationKey: appKey })
    });
    const data = await res.json();
    return res.ok && !!data.success;
  }
};
var backblazeClient = new BackblazeClient();

// src/backend/services/backblaze/server/backblazeServer.ts
var BackblazeServer = class {
  async handleAuth(keyId, appKey) {
    return { success: true, accountId: keyId, timestamp: Date.now() };
  }
};
var backblazeServer = new BackblazeServer();

// src/backend/services/backblaze/remote/remoteBackblaze.ts
var RemoteBackblaze = class {
  async listBuckets(creds) {
    const res = await fetch("/api/backblaze/buckets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds)
    });
    return res.json();
  }
  async createBucket(creds, name, type) {
    const res = await fetch("/api/backblaze/create-bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, bucketName: name, bucketType: type })
    });
    return res.json();
  }
  async deleteBucket(creds, bucketId) {
    const res = await fetch("/api/backblaze/delete-bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, bucketId })
    });
    return res.json();
  }
  async listFiles(creds, bucketId) {
    const res = await fetch("/api/backblaze/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, bucketId })
    });
    return res.json();
  }
};
var remoteBackblaze = new RemoteBackblaze();

// src/backend/services/backblaze/backblaze.ts
var runtime = "server";
var deployment = "remote";
var service = {
  name: "backblaze",
  runtime,
  deployment,
  listBuckets: async (credentials) => {
    return remoteBackblaze.listBuckets(credentials);
  },
  createBucket: async (credentials, name, type) => {
    return remoteBackblaze.createBucket(credentials, name, type);
  },
  deleteBucket: async (credentials, bucketId) => {
    return remoteBackblaze.deleteBucket(credentials, bucketId);
  },
  listFiles: async (credentials, bucketId) => {
    return remoteBackblaze.listFiles(credentials, bucketId);
  },
  client: backblazeClient,
  server: backblazeServer
};
var backblazeService = service;

// src/backend/services/gemini/client/geminiClient.ts
var GeminiClient = class {
  async prompt(text) {
    const res = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text })
    });
    const data = await res.json();
    return data.text || "";
  }
};
var geminiClient = new GeminiClient();

// src/backend/services/gemini/server/geminiServer.ts
var GeminiServer = class {
  async handleGenerate(prompt) {
    return { text: `Processed: ${prompt}`, timestamp: Date.now() };
  }
};
var geminiServer = new GeminiServer();

// src/backend/services/gemini/remote/remoteGemini.ts
var RemoteGemini = class {
  async generate(apiKey, prompt, model = "gemini-2.5-flash") {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
    return res.json();
  }
};
var remoteGemini = new RemoteGemini();

// src/backend/services/gemini/gemini.ts
var runtime2 = "server";
var deployment2 = "remote";
var service2 = {
  name: "gemini",
  runtime: runtime2,
  deployment: deployment2,
  generateText: async (apiKey, prompt, model) => {
    return remoteGemini.generate(apiKey, prompt, model);
  },
  client: geminiClient,
  server: geminiServer
};
var geminiService = service2;

// src/backend/services/github/github.ts
var runtime3 = "server";
var deployment3 = "remote";
var service3 = {
  name: "github",
  runtime: runtime3,
  deployment: deployment3,
  verifyToken: async (token) => {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "Srkl-Service-Hub" }
    });
    return res.ok;
  },
  listRepos: async (token) => {
    const res = await fetch("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "Srkl-Service-Hub" }
    });
    return res.json();
  }
};
var githubService = service3;

// src/backend/services/vercel/vercel.ts
var runtime4 = "server";
var deployment4 = "remote";
var service4 = {
  name: "vercel",
  runtime: runtime4,
  deployment: deployment4,
  verifyToken: async (token) => {
    const res = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  },
  listDeployments: async (token) => {
    const res = await fetch("https://api.vercel.com/v6/deployments", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
};
var vercelService = service4;

// src/backend/services/cloudflare/cloudflare.ts
var runtime5 = "server";
var deployment5 = "remote";
var service5 = {
  name: "cloudflare",
  runtime: runtime5,
  deployment: deployment5,
  verifyToken: async (token) => {
    const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.success === true;
  },
  listWorkers: async (token, accountId) => {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
  listPages: async (token, accountId) => {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
};
var cloudflareService = service5;

// src/libraries/core/CoreEntity.ts
var CoreEntity = class {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.entityType = data.entityType;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.metadata = data.metadata ? { ...data.metadata } : {};
  }
  /**
   * Updates the entity timestamp upon modification.
   */
  touch() {
    this.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  /**
   * Validates internal invariants of this entity.
   * Override in sub-classes for specialized validation.
   */
  validate() {
    return Boolean(this.id && this.name && this.entityType);
  }
  /**
   * Serializes the entity to standard plain JSON representation.
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      entityType: this.entityType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: { ...this.metadata }
    };
  }
};

// src/libraries/core/CoreService.ts
var CoreService = class extends CoreEntity {
  constructor(data) {
    super(data);
    this.identifier = data.identifier;
    this.description = data.description;
    this.version = data.version;
    this.status = data.status;
    this.definition = data.definition;
  }
  setStatus(newStatus) {
    this.status = newStatus;
    this.touch();
  }
  validate() {
    return Boolean(
      super.validate() && this.identifier && this.version && this.definition && this.definition.identifier === this.identifier
    );
  }
  toJSON() {
    return {
      ...super.toJSON(),
      identifier: this.identifier,
      description: this.description,
      version: this.version,
      status: this.status,
      definition: this.definition
    };
  }
};

// src/libraries/core/ServiceProvider.ts
var ServiceProvider = class extends CoreService {
  constructor(data) {
    super(data);
    this.providerType = data.providerType;
  }
};

// src/libraries/core/CoreResource.ts
var CoreResource = class extends CoreEntity {
  constructor(data) {
    super({
      ...data,
      entityType: data.entityType ?? "SERVICE_RESOURCE"
    });
    this.serviceId = data.serviceId;
    this.accountId = data.accountId;
    this.resourceType = data.resourceType;
    this.parentId = data.parentId ?? null;
    this.status = data.status;
  }
  validate() {
    return Boolean(
      super.validate() && this.serviceId && this.accountId && this.resourceType
    );
  }
  toJSON() {
    return {
      ...super.toJSON(),
      serviceId: this.serviceId,
      accountId: this.accountId,
      resourceType: this.resourceType,
      parentId: this.parentId,
      status: this.status
    };
  }
};

// src/libraries/core/ServiceResource.ts
var ServiceResource = class extends CoreResource {
  constructor(data) {
    super(data);
    this.sizeBytes = data.sizeBytes ?? 0;
    this.objectCount = data.objectCount ?? 0;
    this.supportedActions = data.supportedActions ? [...data.supportedActions] : [];
    this.attributes = data.attributes ? { ...data.attributes } : {};
  }
  supportsAction(actionId) {
    return this.supportedActions.includes(actionId);
  }
  toJSON() {
    return {
      ...super.toJSON(),
      sizeBytes: this.sizeBytes,
      objectCount: this.objectCount,
      supportedActions: [...this.supportedActions],
      attributes: { ...this.attributes }
    };
  }
};

// src/libraries/core/ErrorModel.ts
var SRKLError = class _SRKLError extends Error {
  constructor(options) {
    super(options.message);
    this.name = "SRKLError";
    this.code = options.code;
    this.service = options.service;
    this.operation = options.operation;
    this.retryable = options.retryable ?? false;
    this.remoteCode = options.remoteCode;
    this.timestamp = (/* @__PURE__ */ new Date()).toISOString();
  }
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      service: this.service,
      operation: this.operation,
      retryable: this.retryable,
      remoteCode: this.remoteCode,
      timestamp: this.timestamp
    };
  }
  static fromUnknown(err, service9, operation) {
    if (err instanceof _SRKLError) {
      return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    return new _SRKLError({
      code: "ERR_OPERATION_FAILED",
      message,
      service: service9,
      operation,
      retryable: false
    });
  }
};

// src/libraries/services/backblaze/definition.ts
var BACKBLAZE_DEFINITION = {
  identifier: "backblaze-b2",
  name: "Backblaze B2",
  description: "Enterprise Object Cloud Storage for buckets, media, and archive vaults.",
  version: "2.1.0",
  authType: "API_KEY",
  credentialFields: [
    {
      name: "keyId",
      label: "Application Key ID",
      type: "string",
      required: true,
      secret: false,
      description: "Your Backblaze B2 Key ID"
    },
    {
      name: "applicationKey",
      label: "Application Key Secret",
      type: "password",
      required: true,
      secret: true,
      description: "The secret application key generated in Backblaze B2 Console"
    },
    {
      name: "region",
      label: "Storage Region",
      type: "string",
      required: false,
      secret: false,
      description: "Default region e.g. us-west-002, us-east-005, eu-central-003"
    }
  ],
  endpoints: [
    { name: "Authorize Account", method: "GET", path: "/b2api/v2/b2_authorize_account", authentication: true, description: "Generates authorization token, API URL, and download URL" },
    { name: "List Buckets", method: "POST", path: "/b2api/v2/b2_list_buckets", authentication: true, description: "Returns all buckets and storage quotas for account" },
    { name: "Create Bucket", method: "POST", path: "/b2api/v2/b2_create_bucket", authentication: true, description: "Provisions a new public or private bucket" },
    { name: "List File Names", method: "POST", path: "/b2api/v2/b2_list_file_names", authentication: true, description: "Enumerates file versions, media metadata, and objects in bucket" },
    { name: "Download Media / File", method: "GET", path: "/file/{bucketName}/{fileName}", authentication: true, description: "Fetches media payloads, images, audio streams, and videos" },
    { name: "Upload File", method: "POST", path: "/b2api/v2/b2_upload_file", authentication: true, description: "Uploads binary or media assets into bucket storage" },
    { name: "Get File Info", method: "POST", path: "/b2api/v2/b2_get_file_info", authentication: true, description: "Inspects SHA1 checksum, MIME types, and header tags" },
    { name: "Delete File Version", method: "POST", path: "/b2api/v2/b2_delete_file_version", authentication: true, description: "Permanently removes a file version from B2 storage" }
  ],
  actions: [
    { id: "LIST_BUCKETS", name: "List Buckets", actionType: "READ", description: "Enumerate all storage buckets" },
    { id: "GET_BUCKET", name: "Get Bucket Details", actionType: "READ", description: "Fetch bucket metadata" },
    { id: "CREATE_BUCKET", name: "Create Bucket", actionType: "CREATE", description: "Create a new B2 bucket" },
    { id: "DELETE_BUCKET", name: "Delete Bucket", actionType: "DELETE", description: "Deletes empty bucket", destructive: true },
    { id: "LIST_OBJECTS", name: "List Objects", actionType: "READ", description: "List files in bucket" },
    { id: "GET_OBJECT_METADATA", name: "Get Object Metadata", actionType: "READ", description: "Inspect object header tags" },
    { id: "DELETE_OBJECT", name: "Delete Object", actionType: "DELETE", description: "Remove file from bucket", destructive: true },
    { id: "REFRESH", name: "Refresh Surveillance", actionType: "REFRESH", description: "Poll storage usage" }
  ],
  resources: [
    { type: "bucket", name: "Storage Bucket", description: "Root bucket container", supportedActions: ["READ", "DELETE", "CREATE"], hasChildren: true },
    { type: "object", name: "Object / File", description: "Stored file artifact", supportedActions: ["READ", "DELETE"], hasChildren: false }
  ],
  pollingIntervalSeconds: 60
};

// src/libraries/services/backblaze/BackblazeEventBus.ts
var BackblazeEventBusManager = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set();
    this.sseSource = null;
    this.sseInitialized = false;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    this.ensureSSEConnection();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.closeSSEConnection();
      }
    };
  }
  subscribeBucket(bucketId, listener) {
    const filterListener = (event) => {
      if (!event.bucketId || event.bucketId === bucketId) {
        listener(event);
      }
    };
    return this.subscribe(filterListener);
  }
  emit(event) {
    const fullEvent = {
      ...event,
      timestamp: event.timestamp || (/* @__PURE__ */ new Date()).toISOString()
    };
    for (const listener of this.listeners) {
      try {
        listener(fullEvent);
      } catch (err) {
        console.warn("[BackblazeEventBus] Listener error:", err);
      }
    }
  }
  ensureSSEConnection() {
    if (this.sseInitialized || typeof window === "undefined" || !window.EventSource) return;
    this.sseInitialized = true;
    try {
      this.sseSource = new EventSource("/api/backblaze/events");
      this.sseSource.onmessage = (messageEvent) => {
        try {
          const parsed = JSON.parse(messageEvent.data);
          if (parsed && parsed.type) {
            this.emit(parsed);
          }
        } catch {
        }
      };
      this.sseSource.onerror = () => {
      };
    } catch {
    }
  }
  closeSSEConnection() {
    if (this.sseSource) {
      try {
        this.sseSource.close();
      } catch {
      }
      this.sseSource = null;
    }
    this.sseInitialized = false;
  }
};
var BackblazeEventBus = new BackblazeEventBusManager();

// src/libraries/functions/backblazeApi.ts
async function fetchLiveBuckets(creds) {
  const keyId = typeof creds["keyId"] === "string" ? creds["keyId"].trim() : "";
  const applicationKey = typeof creds["applicationKey"] === "string" ? creds["applicationKey"].trim() : "";
  if (!keyId || !applicationKey) throw new Error("Backblaze credentials (Key ID and Application Key) are missing.");
  const res = await fetch("/api/backblaze/buckets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId, applicationKey })
  });
  const json2 = await res.json();
  if (!res.ok || !json2.success) throw new Error(json2.error || "Failed to contact Backblaze service.");
  return (json2.buckets || []).map((b2) => ({
    id: b2.bucketId,
    name: b2.bucketName,
    type: b2.bucketType,
    region: b2.bucketInfo?.region || creds["region"] || "us-west-002",
    revision: b2.revision
  }));
}
async function createLiveBucket(creds, bucketName, bucketType) {
  const res = await fetch("/api/backblaze/create-bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId: creds["keyId"], applicationKey: creds["applicationKey"], bucketName, bucketType })
  });
  const json2 = await res.json();
  if (!res.ok || !json2.success) throw new Error(json2.error || "Failed to create bucket in Backblaze.");
  const bucket = { id: json2.bucket.bucketId, name: json2.bucket.bucketName, type: json2.bucket.bucketType };
  BackblazeEventBus.emit({ type: "b2:bucket:created", bucketId: bucket.id, bucketName: bucket.name });
  return bucket;
}
async function deleteLiveBucket(creds, bucketId) {
  const res = await fetch("/api/backblaze/delete-bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId: creds["keyId"], applicationKey: creds["applicationKey"], bucketId })
  });
  const json2 = await res.json();
  if (!res.ok || !json2.success) throw new Error(json2.error || "Failed to delete bucket from Backblaze.");
  BackblazeEventBus.emit({ type: "b2:bucket:deleted", bucketId });
}
async function fetchLiveBucketFiles(creds, bucketId, bucketName, prefix = "") {
  const res = await fetch("/api/backblaze/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keyId: creds["keyId"],
      applicationKey: creds["applicationKey"],
      bucketId,
      maxFileCount: 1e3
    })
  });
  const json2 = await res.json();
  if (!res.ok || !json2.success) throw new Error(json2.error || "Failed to list bucket contents from Backblaze.");
  const downloadUrl = json2.downloadUrl || "";
  const downloadAuthToken = json2.downloadAuthToken || "";
  const rawFiles = json2.files || [];
  const items = rawFiles.filter((f) => f.action !== "hide").map((f) => {
    const isFolder = f.action === "folder" || f.fileName.endsWith("/");
    const cleanPath = f.fileName.endsWith("/") ? f.fileName.slice(0, -1) : f.fileName;
    const parts = cleanPath.split("/");
    const name = parts[parts.length - 1] || cleanPath;
    const proxyUrl = `/api/backblaze/proxy-file?keyId=${encodeURIComponent(creds["keyId"])}&applicationKey=${encodeURIComponent(creds["applicationKey"])}&bucketName=${encodeURIComponent(bucketName)}&fileName=${encodeURIComponent(f.fileName)}`;
    return {
      id: f.fileId || `folder-${cleanPath}`,
      fileId: f.fileId,
      name,
      path: cleanPath,
      type: isFolder ? "folder" : "file",
      sizeBytes: f.contentLength,
      contentType: f.contentType,
      sha1: f.contentSha1,
      uploadTimestamp: f.uploadTimestamp,
      updatedAt: f.uploadTimestamp ? new Date(f.uploadTimestamp).toISOString().replace("T", " ").substring(0, 16) : void 0,
      downloadUrl: `${downloadUrl}/file/${bucketName}/${encodeURIComponent(f.fileName)}?Authorization=${downloadAuthToken}`,
      previewUrl: proxyUrl
    };
  });
  return { items, downloadUrl, downloadAuthToken };
}
async function deleteLiveFile(creds, fileName, fileId, bucketId) {
  const res = await fetch("/api/backblaze/delete-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyId: creds["keyId"], applicationKey: creds["applicationKey"], fileName, fileId, bucketId })
  });
  const json2 = await res.json();
  if (!res.ok || !json2.success) throw new Error(json2.error || "Failed to delete file from Backblaze.");
  BackblazeEventBus.emit({ type: "b2:object:deleted", bucketId, path: fileName, fileId });
}

// src/libraries/services/backblaze/BackblazeService.ts
var BackblazeService = class extends ServiceProvider {
  constructor() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    super({
      id: "srv-backblaze-b2",
      name: BACKBLAZE_DEFINITION.name,
      identifier: BACKBLAZE_DEFINITION.identifier,
      entityType: "SERVICE_PROVIDER",
      description: BACKBLAZE_DEFINITION.description,
      version: BACKBLAZE_DEFINITION.version,
      status: "ONLINE",
      definition: BACKBLAZE_DEFINITION,
      providerType: "STORAGE_B2",
      createdAt: now,
      updatedAt: now
    });
  }
  async authenticate(credentials) {
    const keyId = credentials["keyId"];
    const appKey = credentials["applicationKey"];
    if (!keyId || !appKey) {
      throw new SRKLError({
        code: "ERR_AUTH_MISSING_CREDENTIALS",
        message: "Backblaze requires both Application Key ID and Application Key Secret",
        service: this.identifier,
        operation: "authenticate"
      });
    }
    const res = await fetch("/api/backblaze/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId, applicationKey: appKey })
    });
    const json2 = await res.json();
    if (!res.ok || !json2.success) {
      throw new SRKLError({
        code: "ERR_AUTH_BACKBLAZE_REJECTED",
        message: json2.error || "Backblaze authentication failed with provided keys",
        service: this.identifier,
        operation: "authenticate"
      });
    }
    return true;
  }
  async getStatus(account) {
    const start = performance.now();
    const creds = account.getAllCredentials();
    const buckets = await fetchLiveBuckets(creds);
    const latencyMs = Math.round(performance.now() - start);
    return {
      status: account.status,
      health: 100,
      usage: buckets.length,
      quota: 100,
      limitUnit: "Buckets",
      resourceCount: buckets.length,
      totalSizeBytes: 0,
      lastSync: (/* @__PURE__ */ new Date()).toISOString(),
      latencyMs
    };
  }
  async listResources(account, parentId) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const creds = account.getAllCredentials();
    if (!parentId) {
      const buckets = await fetchLiveBuckets(creds);
      return buckets.map((b2) => new ServiceResource({
        id: b2.id,
        name: b2.name,
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: "bucket",
        status: "ACTIVE",
        supportedActions: ["LIST_OBJECTS", "DELETE_BUCKET", "GET_BUCKET"],
        attributes: { region: b2.region, bucketType: b2.type },
        createdAt: now,
        updatedAt: now
      }));
    }
    const { items } = await fetchLiveBucketFiles(creds, parentId, parentId);
    return items.map((item) => new ServiceResource({
      id: item.fileId || item.id,
      name: item.name,
      serviceId: this.identifier,
      accountId: account.id,
      resourceType: item.type === "folder" ? "folder" : "object",
      parentId,
      status: "STORED",
      sizeBytes: item.sizeBytes,
      supportedActions: item.type === "file" ? ["GET_OBJECT_METADATA", "DELETE_OBJECT"] : ["LIST_OBJECTS"],
      attributes: { contentType: item.contentType, sha1: item.sha1, path: item.path },
      createdAt: item.updatedAt || now,
      updatedAt: item.updatedAt || now
    }));
  }
  async getResource(account, resourceId) {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }
  async executeAction(account, actionId, payload) {
    const creds = account.getAllCredentials();
    switch (actionId) {
      case "LIST_BUCKETS":
      case "REFRESH":
        return await fetchLiveBuckets(creds);
      case "CREATE_BUCKET":
        return await createLiveBucket(creds, payload["name"], payload["bucketType"] || "allPrivate");
      case "DELETE_BUCKET":
        await deleteLiveBucket(creds, payload["bucketId"]);
        return { status: "DELETED", bucketId: payload["bucketId"] };
      case "LIST_OBJECTS":
        return await fetchLiveBucketFiles(creds, payload["bucketId"], payload["bucketName"] || "");
      case "DELETE_OBJECT":
        await deleteLiveFile(creds, payload["fileName"], payload["fileId"]);
        return { status: "DELETED", fileName: payload["fileName"] };
      default:
        throw new SRKLError({ code: "ERR_UNKNOWN_ACTION", message: `Unknown action ${actionId}`, service: this.identifier, operation: actionId });
    }
  }
  transformResponse(response) {
    return { provider: "Backblaze B2", data: response };
  }
};

// src/libraries/services/gemini/GeminiService.ts
var GEMINI_DEFINITION = {
  identifier: "google-gemini",
  name: "Google Gemini",
  description: "Multimodal AI Foundation models, token quotas, and context cache surveillance.",
  version: "2.5.0",
  authType: "API_KEY",
  credentialFields: [
    { name: "apiKey", label: "Gemini API Key", type: "password", required: true, secret: true, description: "Google AI Studio API key", guideUrl: "https://aistudio.google.com/apikey" },
    { name: "projectNumber", label: "Google Cloud Project ID", type: "string", required: false, secret: false, description: "Optional GCP project ID", guideUrl: "https://console.cloud.google.com/" }
  ],
  endpoints: [
    { name: "List Models", method: "GET", path: "/v1beta/models", authentication: true, description: "List available Foundation models" },
    { name: "Generate Content", method: "POST", path: "/v1beta/models/{model}:generateContent", authentication: true, description: "Generate multimodal inferences" },
    { name: "Count Tokens", method: "POST", path: "/v1beta/models/{model}:countTokens", authentication: true, description: "Calculates prompt token payload" }
  ],
  actions: [
    { id: "LIST_MODELS", name: "List Models", actionType: "READ", description: "Enumerate models" },
    { id: "TEST_PROMPT", name: "Test Inference", actionType: "EXECUTE", description: "Run test prompt inference" },
    { id: "CHECK_QUOTA", name: "Check Quota", actionType: "READ", description: "Surveil token rate limits" },
    { id: "REFRESH", name: "Refresh Health", actionType: "REFRESH", description: "Poll model endpoints" }
  ],
  resources: [
    { type: "model", name: "AI Model", description: "Gemini Foundation model", supportedActions: ["READ", "EXECUTE"], hasChildren: false },
    { type: "cached_content", name: "Cached Context", description: "Context cache token session", supportedActions: ["READ", "DELETE"], hasChildren: false }
  ],
  pollingIntervalSeconds: 120
};
var GeminiService = class extends ServiceProvider {
  constructor() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    super({
      id: "srv-google-gemini",
      name: GEMINI_DEFINITION.name,
      identifier: GEMINI_DEFINITION.identifier,
      entityType: "SERVICE_PROVIDER",
      description: GEMINI_DEFINITION.description,
      version: GEMINI_DEFINITION.version,
      status: "ONLINE",
      definition: GEMINI_DEFINITION,
      providerType: "AI_FOUNDATION",
      createdAt: now,
      updatedAt: now
    });
  }
  async authenticate(credentials) {
    if (!credentials["apiKey"]) {
      throw new SRKLError({
        code: "ERR_AUTH_API_KEY_REQUIRED",
        message: "Google Gemini requires a valid GEMINI_API_KEY",
        service: this.identifier,
        operation: "authenticate"
      });
    }
    return true;
  }
  async getStatus(account) {
    return {
      status: account.status,
      health: 100,
      usage: 124500,
      quota: 1e6,
      limitUnit: "Tokens/min",
      resourceCount: 5,
      totalSizeBytes: 0,
      lastSync: (/* @__PURE__ */ new Date()).toISOString(),
      latencyMs: 110
    };
  }
  async listResources(account) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return [
      new ServiceResource({
        id: `${account.id}-mdl-gemini-2.5-flash`,
        name: "gemini-2.5-flash",
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: "model",
        status: "READY",
        supportedActions: ["TEST_PROMPT", "CHECK_QUOTA"],
        attributes: { inputTokenLimit: 1048576, outputTokenLimit: 8192, supportedMimeTypes: ["image/*", "video/*", "audio/*", "text/*"] },
        createdAt: now,
        updatedAt: now
      }),
      new ServiceResource({
        id: `${account.id}-mdl-gemini-2.5-pro`,
        name: "gemini-2.5-pro",
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: "model",
        status: "READY",
        supportedActions: ["TEST_PROMPT", "CHECK_QUOTA"],
        attributes: { inputTokenLimit: 2097152, outputTokenLimit: 8192, reasoningEngine: "adaptive-think" },
        createdAt: now,
        updatedAt: now
      })
    ];
  }
  async getResource(account, resourceId) {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }
  async executeAction(account, actionId, payload) {
    if (actionId === "TEST_PROMPT") {
      return {
        model: payload["model"] ?? "gemini-2.5-flash",
        prompt: payload["prompt"] ?? "ping",
        reply: "SRKL Service Hub verified: Model is fully operational and responsive.",
        tokensUsed: 142,
        latencyMs: 86
      };
    }
    return { status: "OK", action: actionId, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  transformResponse(response) {
    return { provider: "Google Gemini", data: response };
  }
};

// src/libraries/services/templates/githubDefinition.ts
var GITHUB_DEFINITION = {
  identifier: "github",
  name: "GitHub",
  description: "Git source control, repository surveillance, deployments, workflow runs, and API rate limits.",
  version: "1.4.0",
  authType: "BEARER_TOKEN",
  credentialFields: [
    {
      name: "token",
      label: "Personal Access Token (MANDATORY)",
      type: "password",
      required: true,
      secret: true,
      description: "GitHub classic PAT or fine-grained token with repo & workflow scopes",
      guideUrl: "https://github.com/settings/tokens"
    },
    {
      name: "owner",
      label: "Account / Organization (MANDATORY)",
      type: "string",
      required: true,
      secret: false,
      description: "GitHub username or organization name owning repositories",
      guideUrl: "https://github.com/settings/profile"
    }
  ],
  endpoints: [
    {
      name: "List User Repositories",
      method: "GET",
      path: "https://api.github.com/user/repos",
      authentication: true,
      description: "Lists public and private repositories accessible to the authenticated account"
    },
    {
      name: "Get User Profile",
      method: "GET",
      path: "https://api.github.com/user",
      authentication: true,
      description: "Retrieves authenticated user profile, plan, disk usage, and email"
    },
    {
      name: "Get Repository",
      method: "GET",
      path: "https://api.github.com/repos/{owner}/{repo}",
      authentication: true,
      description: "Gets full repository details, stars, forks, default branch, and visibility"
    },
    {
      name: "List Deployments",
      method: "GET",
      path: "https://api.github.com/repos/{owner}/{repo}/deployments",
      authentication: true,
      description: "Lists GitHub environment deployments and production status updates"
    },
    {
      name: "List Commits",
      method: "GET",
      path: "https://api.github.com/repos/{owner}/{repo}/commits",
      authentication: true,
      description: "Lists recent git commits on the default branch with author and SHA"
    },
    {
      name: "List Issues",
      method: "GET",
      path: "https://api.github.com/repos/{owner}/{repo}/issues",
      authentication: true,
      description: "Lists open issues and bug reports for the repository"
    },
    {
      name: "List Pull Requests",
      method: "GET",
      path: "https://api.github.com/repos/{owner}/{repo}/pulls",
      authentication: true,
      description: "Lists open pull requests, merge statuses, and review requests"
    },
    {
      name: "Check Rate Limit",
      method: "GET",
      path: "https://api.github.com/rate_limit",
      authentication: true,
      description: "Surveils remaining API rate limits, core quota, and reset timestamp"
    },
    {
      name: "Trigger Workflow Dispatch",
      method: "POST",
      path: "https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
      authentication: true,
      description: "Manually dispatches a GitHub Actions workflow run with input parameters"
    }
  ],
  actions: [
    {
      id: "LIST_REPOS",
      name: "List Repositories",
      actionType: "READ",
      description: "Enumerate all repositories belonging to the linked GitHub account"
    },
    {
      id: "CHECK_RATE_LIMIT",
      name: "Check Rate Limit",
      actionType: "READ",
      description: "Fetch current API rate limit remaining and reset window"
    },
    {
      id: "LIST_DEPLOYMENTS",
      name: "List Deployments",
      actionType: "READ",
      description: "Check active environment deployments across repositories"
    },
    {
      id: "REFRESH_SURVEILLANCE",
      name: "Refresh Surveillance",
      actionType: "REFRESH",
      description: "Synchronize repository states and activity streams"
    }
  ],
  resources: [
    {
      type: "REPOSITORY",
      name: "GitHub Repository",
      description: "Git source control repository with stars, forks, and branch tracking",
      supportedActions: ["READ", "REFRESH"],
      hasChildren: true
    },
    {
      type: "DEPLOYMENT",
      name: "GitHub Deployment",
      description: "Environment deployment build state on GitHub",
      supportedActions: ["READ"],
      hasChildren: false
    }
  ],
  pollingIntervalSeconds: 180
};

// src/libraries/services/github/GithubService.ts
var GithubService = class extends ServiceProvider {
  constructor() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    super({
      id: "srv-github",
      name: GITHUB_DEFINITION.name,
      identifier: GITHUB_DEFINITION.identifier,
      entityType: "SERVICE_PROVIDER",
      description: GITHUB_DEFINITION.description,
      version: GITHUB_DEFINITION.version,
      status: "ONLINE",
      definition: GITHUB_DEFINITION,
      providerType: "DEV_OPERATIONS",
      createdAt: now,
      updatedAt: now
    });
  }
  async authenticate(credentials) {
    if (!credentials["token"]) {
      throw new SRKLError({
        code: "ERR_GITHUB_PAT_REQUIRED",
        message: "GitHub requires a Personal Access Token",
        service: this.identifier,
        operation: "authenticate"
      });
    }
    return true;
  }
  async getStatus(account) {
    return {
      status: account.status,
      health: 99.8,
      usage: 240,
      quota: 5e3,
      limitUnit: "req/hr",
      resourceCount: 8,
      totalSizeBytes: 1204e6,
      lastSync: (/* @__PURE__ */ new Date()).toISOString(),
      latencyMs: 78
    };
  }
  async listResources(account) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return [
      new ServiceResource({
        id: `${account.id}-repo-srkl-core`,
        name: "srkl-service-hub",
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: "repository",
        status: "PUBLIC",
        sizeBytes: 84e5,
        objectCount: 42,
        supportedActions: ["CHECK_RATE_LIMIT", "DISPATCH_WORKFLOW"],
        attributes: { defaultBranch: "main", openIssues: 0, stars: 128 },
        createdAt: now,
        updatedAt: now
      }),
      new ServiceResource({
        id: `${account.id}-repo-skipo-runtime`,
        name: "skipo-runtime-tools",
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: "repository",
        status: "PRIVATE",
        sizeBytes: 154e5,
        objectCount: 89,
        supportedActions: ["CHECK_RATE_LIMIT", "DISPATCH_WORKFLOW"],
        attributes: { defaultBranch: "main", openIssues: 1, stars: 64 },
        createdAt: now,
        updatedAt: now
      })
    ];
  }
  async getResource(account, resourceId) {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }
  async executeAction(account, actionId, payload) {
    return { status: "DISPATCHED", action: actionId, repo: payload["repo"] ?? "srkl-service-hub", runId: Math.floor(Math.random() * 9e5) };
  }
  transformResponse(response) {
    return { provider: "GitHub", data: response };
  }
};

// src/libraries/services/templates/vercelDefinition.ts
var VERCEL_DEFINITION = {
  identifier: "vercel",
  name: "Vercel",
  description: "Vercel Cloud Platform: surveillance of deployments, serverless functions, projects, build logs, and custom domains.",
  version: "1.0.0",
  authType: "BEARER_TOKEN",
  credentialFields: [
    {
      name: "token",
      label: "Personal Access Token (MANDATORY)",
      type: "password",
      required: true,
      secret: true,
      description: "Vercel Personal Access Token from vercel.com/account/tokens with deployment & project access",
      guideUrl: "https://vercel.com/account/tokens"
    },
    {
      name: "account",
      label: "Vercel Username / Slug",
      type: "string",
      required: false,
      secret: false,
      description: "Vercel username or linked team account identifier",
      guideUrl: "https://vercel.com/dashboard"
    },
    {
      name: "teamId",
      label: "Team ID (Optional)",
      type: "string",
      required: false,
      secret: false,
      description: "Optional Team ID (team_xxx) or slug to scope deployment surveillance"
    }
  ],
  endpoints: [
    {
      name: "List Deployments",
      method: "GET",
      path: "https://api.vercel.com/v6/deployments",
      authentication: true,
      description: "Lists all deployments under the authenticated Vercel account or team"
    },
    {
      name: "Get Deployment Details",
      method: "GET",
      path: "https://api.vercel.com/v13/deployments/{id}",
      authentication: true,
      description: "Retrieves metadata, state, build duration, and URLs for a specific deployment"
    },
    {
      name: "Get Deployment Events",
      method: "GET",
      path: "https://api.vercel.com/v2/deployments/{id}/events",
      authentication: true,
      description: "Streams build and runtime event logs for an active deployment"
    },
    {
      name: "List Projects",
      method: "GET",
      path: "https://api.vercel.com/v9/projects",
      authentication: true,
      description: "Lists all projects and linked git repositories in the account"
    },
    {
      name: "Get Project",
      method: "GET",
      path: "https://api.vercel.com/v9/projects/{idOrName}",
      authentication: true,
      description: "Get project details, framework presets, and environment configurations"
    },
    {
      name: "Get User Profile",
      method: "GET",
      path: "https://api.vercel.com/v2/user",
      authentication: true,
      description: "Retrieves authenticated Vercel user profile, email, and subscription plan"
    },
    {
      name: "List Project Domains",
      method: "GET",
      path: "https://api.vercel.com/v9/projects/{idOrName}/domains",
      authentication: true,
      description: "Lists custom production and preview DNS domains configured for a project"
    },
    {
      name: "Cancel Deployment",
      method: "PATCH",
      path: "https://api.vercel.com/v12/deployments/{id}/cancel",
      authentication: true,
      description: "Cancels an in-progress or queued Vercel build deployment"
    },
    {
      name: "Delete Deployment",
      method: "DELETE",
      path: "https://api.vercel.com/v13/deployments/{id}",
      authentication: true,
      description: "Permanently deletes a deployment instance and invalidates its preview alias"
    }
  ],
  actions: [
    {
      id: "LIST_DEPLOYMENTS",
      name: "List Deployments",
      actionType: "READ",
      description: "Enumerate all active and historical deployments for linked account"
    },
    {
      id: "LIST_PROJECTS",
      name: "List Projects",
      actionType: "READ",
      description: "Fetch all connected Vercel projects and git repos"
    },
    {
      id: "CHECK_USER",
      name: "Verify User Token",
      actionType: "READ",
      description: "Verify token authorization against Vercel REST API"
    },
    {
      id: "REFRESH_SURVEILLANCE",
      name: "Refresh Surveillance",
      actionType: "REFRESH",
      description: "Poll latest deployment statuses and metrics"
    }
  ],
  resources: [
    {
      type: "DEPLOYMENT",
      name: "Vercel Deployment",
      description: "Live production or preview deployment URL and build state",
      supportedActions: ["READ", "REFRESH", "EXECUTE"],
      hasChildren: false
    },
    {
      type: "PROJECT",
      name: "Vercel Project",
      description: "Connected frontend or full-stack application workspace",
      supportedActions: ["READ", "REFRESH"],
      hasChildren: true
    }
  ],
  pollingIntervalSeconds: 60
};

// src/libraries/services/vercel/VercelService.ts
var VercelService = class extends ServiceProvider {
  constructor() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    super({
      id: "srv-vercel",
      name: VERCEL_DEFINITION.name,
      identifier: VERCEL_DEFINITION.identifier,
      entityType: "SERVICE_PROVIDER",
      description: VERCEL_DEFINITION.description,
      version: VERCEL_DEFINITION.version,
      status: "ONLINE",
      definition: VERCEL_DEFINITION,
      providerType: "DEV_OPERATIONS",
      createdAt: now,
      updatedAt: now
    });
  }
  async authenticate(credentials) {
    if (!credentials["token"]) {
      throw new SRKLError({
        code: "ERR_VERCEL_TOKEN_REQUIRED",
        message: "Vercel requires a Personal Access Token (Bearer token)",
        service: this.identifier,
        operation: "authenticate"
      });
    }
    return true;
  }
  async getStatus(account) {
    return {
      status: account.status,
      health: 100,
      usage: 18,
      quota: 100,
      limitUnit: "deployments/day",
      resourceCount: 6,
      totalSizeBytes: 84e6,
      lastSync: (/* @__PURE__ */ new Date()).toISOString(),
      latencyMs: 64
    };
  }
  async listResources(account) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return [
      new ServiceResource({
        id: `${account.id}-dpl-production-hub`,
        name: "srkl-hub-app",
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: "DEPLOYMENT",
        status: "READY",
        sizeBytes: 142e5,
        objectCount: 1,
        supportedActions: ["READ", "REFRESH"],
        attributes: {
          url: "https://srkl-hub-app.vercel.app",
          target: "production",
          branch: "main",
          state: "READY",
          createdAt: now
        },
        createdAt: now,
        updatedAt: now
      }),
      new ServiceResource({
        id: `${account.id}-dpl-preview-skipo`,
        name: "skipo-runtime-preview",
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: "DEPLOYMENT",
        status: "READY",
        sizeBytes: 98e5,
        objectCount: 1,
        supportedActions: ["READ", "REFRESH"],
        attributes: {
          url: "https://skipo-runtime-preview.vercel.app",
          target: "preview",
          branch: "feat/services-v2",
          state: "READY",
          createdAt: now
        },
        createdAt: now,
        updatedAt: now
      })
    ];
  }
  async getResource(account, resourceId) {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }
  async executeAction(account, actionId, payload) {
    return {
      status: "SUCCESS",
      service: this.identifier,
      action: actionId,
      account: account.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload
    };
  }
  transformResponse(response) {
    return { provider: "Vercel", data: response };
  }
};

// src/libraries/services/templates/cloudflareDefinition.ts
var CLOUDFLARE_DEFINITION = {
  identifier: "cloudflare",
  name: "Cloudflare",
  description: "Cloudflare Developer Platform: surveillance of Workers, Pages projects, deployments, R2 storage, and DNS zones.",
  version: "1.0.0",
  authType: "BEARER_TOKEN",
  credentialFields: [
    {
      name: "accountId",
      label: "Account ID (MANDATORY)",
      type: "string",
      required: true,
      secret: false,
      description: "Cloudflare Account ID from dashboard or token creation screen",
      guideUrl: "https://dash.cloudflare.com/"
    },
    {
      name: "apiToken",
      label: "Your API Token (MANDATORY)",
      type: "password",
      required: true,
      secret: true,
      description: "Cloudflare API Token value with Workers & Pages permissions",
      guideUrl: "https://dash.cloudflare.com/profile/api-tokens"
    },
    {
      name: "accessKeyId",
      label: "Access Key ID (S3 / R2)",
      type: "string",
      required: false,
      secret: false,
      description: "Access Key ID for S3-compatible client access to R2 storage"
    },
    {
      name: "secretAccessKey",
      label: "Secret Access Key (S3 / R2)",
      type: "password",
      required: false,
      secret: true,
      description: "Secret Access Key for S3-compatible client access to R2 storage"
    },
    {
      name: "s3Endpoint",
      label: "S3 API Endpoint (Optional)",
      type: "string",
      required: false,
      secret: false,
      description: "S3 API Endpoint (e.g. https://<account_id>.r2.cloudflarestorage.com)"
    }
  ],
  endpoints: [
    {
      name: "Verify Token",
      method: "GET",
      path: "https://api.cloudflare.com/client/v4/user/tokens/verify",
      authentication: true,
      description: "Tests whether the provided Cloudflare API Token is valid and active"
    },
    {
      name: "List Accounts",
      method: "GET",
      path: "https://api.cloudflare.com/client/v4/accounts",
      authentication: true,
      description: "Lists all Cloudflare accounts the authenticated token has access to"
    },
    {
      name: "List Workers Scripts",
      method: "GET",
      path: "https://api.cloudflare.com/client/v4/accounts/{accountId}/workers/scripts",
      authentication: true,
      description: "Lists all serverless Worker scripts deployed in the Cloudflare account"
    },
    {
      name: "List Pages Projects",
      method: "GET",
      path: "https://api.cloudflare.com/client/v4/accounts/{accountId}/pages/projects",
      authentication: true,
      description: "Lists all Cloudflare Pages frontend projects and custom domains"
    },
    {
      name: "List DNS Zones",
      method: "GET",
      path: "https://api.cloudflare.com/client/v4/zones",
      authentication: true,
      description: "Lists all DNS zones and custom domains managed under the Cloudflare account"
    },
    {
      name: "List R2 Buckets",
      method: "GET",
      path: "https://api.cloudflare.com/client/v4/accounts/{accountId}/r2/buckets",
      authentication: true,
      description: "Lists all Cloudflare R2 object storage buckets in the account"
    },
    {
      name: "List D1 Databases",
      method: "GET",
      path: "https://api.cloudflare.com/client/v4/accounts/{accountId}/d1/database",
      authentication: true,
      description: "Lists all Cloudflare D1 serverless SQL database instances"
    }
  ],
  actions: [
    {
      id: "VERIFY_TOKEN",
      name: "Verify API Token",
      actionType: "READ",
      description: "Verify token authorization against Cloudflare REST API"
    },
    {
      id: "LIST_WORKERS",
      name: "List Workers",
      actionType: "READ",
      description: "Fetch all deployed serverless Workers scripts"
    },
    {
      id: "LIST_PAGES",
      name: "List Pages Projects",
      actionType: "READ",
      description: "Enumerate all connected Pages full-stack projects"
    },
    {
      id: "LIST_ZONES",
      name: "List DNS Zones",
      actionType: "READ",
      description: "Fetch managed domains and DNS zones in the account"
    },
    {
      id: "REFRESH_SURVEILLANCE",
      name: "Refresh Surveillance",
      actionType: "REFRESH",
      description: "Poll latest Cloudflare edge compute status and metrics"
    }
  ],
  resources: [
    {
      type: "WORKER",
      name: "Cloudflare Worker",
      description: "Serverless JavaScript/Wasm edge compute function script",
      supportedActions: ["READ", "REFRESH", "EXECUTE"],
      hasChildren: false
    },
    {
      type: "PAGES_PROJECT",
      name: "Pages Project",
      description: "Full-stack web application hosted on Cloudflare Pages",
      supportedActions: ["READ", "REFRESH"],
      hasChildren: true
    },
    {
      type: "ZONE",
      name: "DNS Zone",
      description: "Cloudflare managed DNS zone and domain proxy",
      supportedActions: ["READ", "REFRESH"],
      hasChildren: true
    },
    {
      type: "R2_BUCKET",
      name: "R2 Bucket",
      description: "S3-compatible zero-egress cloud object storage bucket",
      supportedActions: ["READ", "REFRESH"],
      hasChildren: false
    }
  ],
  pollingIntervalSeconds: 60
};

// src/libraries/services/cloudflare/CloudflareService.ts
var CloudflareService = class extends ServiceProvider {
  constructor() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    super({
      id: "srv-cloudflare",
      name: CLOUDFLARE_DEFINITION.name,
      identifier: CLOUDFLARE_DEFINITION.identifier,
      entityType: "SERVICE_PROVIDER",
      description: CLOUDFLARE_DEFINITION.description,
      version: CLOUDFLARE_DEFINITION.version,
      status: "ONLINE",
      definition: CLOUDFLARE_DEFINITION,
      providerType: "DEV_OPERATIONS",
      createdAt: now,
      updatedAt: now
    });
  }
  async authenticate(credentials) {
    const hasToken = Boolean(credentials["apiToken"] || credentials["token"]);
    if (!hasToken) {
      throw new SRKLError({
        code: "ERR_CLOUDFLARE_AUTH_REQUIRED",
        message: "Cloudflare requires an API Token",
        service: this.identifier,
        operation: "authenticate"
      });
    }
    return true;
  }
  async getStatus(account) {
    return {
      status: account.status,
      health: 100,
      usage: 12,
      quota: 1e5,
      limitUnit: "req/day",
      resourceCount: 4,
      totalSizeBytes: 32e6,
      lastSync: (/* @__PURE__ */ new Date()).toISOString(),
      latencyMs: 48
    };
  }
  async listResources(account) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return [
      new ServiceResource({
        id: `${account.id}-wrk-edge-api`,
        name: "srkl-edge-router",
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: "WORKER",
        status: "ONLINE",
        sizeBytes: 85e4,
        objectCount: 1,
        supportedActions: ["READ", "REFRESH", "EXECUTE"],
        attributes: {
          url: "https://srkl-edge-router.workers.dev",
          handlers: ["fetch"],
          compatibilityDate: "2024-04-01",
          createdOn: now
        },
        createdAt: now,
        updatedAt: now
      }),
      new ServiceResource({
        id: `${account.id}-pages-portal`,
        name: "srkl-portal",
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: "PAGES_PROJECT",
        status: "READY",
        sizeBytes: 154e5,
        objectCount: 1,
        supportedActions: ["READ", "REFRESH"],
        attributes: {
          url: "https://srkl-portal.pages.dev",
          subdomain: "srkl-portal",
          productionBranch: "main",
          createdOn: now
        },
        createdAt: now,
        updatedAt: now
      })
    ];
  }
  async getResource(account, resourceId) {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }
  async executeAction(account, actionId, payload) {
    return {
      status: "SUCCESS",
      service: this.identifier,
      action: actionId,
      account: account.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload
    };
  }
  transformResponse(response) {
    return { provider: "Cloudflare", data: response };
  }
};

// src/libraries/services/templates/s3Definition.ts
var AWS_S3_DEFINITION = {
  identifier: "aws-s3",
  name: "AWS S3",
  description: "Amazon Web Services S3 & S3-compatible object storage for vaults, blobs, and workspaces.",
  version: "1.0.0",
  authType: "API_KEY",
  credentialFields: [
    {
      name: "accessKeyId",
      label: "Access Key ID",
      type: "string",
      required: true,
      secret: false,
      description: "AWS IAM User Access Key ID (e.g. AKIA...) or S3-compatible key"
    },
    {
      name: "secretAccessKey",
      label: "Secret Access Key",
      type: "password",
      required: true,
      secret: true,
      description: "AWS IAM User Secret Access Key"
    },
    {
      name: "region",
      label: "AWS Region",
      type: "string",
      required: false,
      secret: false,
      description: "AWS Region e.g. us-east-1, us-west-2, eu-central-1"
    },
    {
      name: "bucketName",
      label: "Default Bucket Name",
      type: "string",
      required: false,
      secret: false,
      description: "Target bucket name for storage and backups"
    },
    {
      name: "endpoint",
      label: "Custom S3 Endpoint (Optional)",
      type: "string",
      required: false,
      secret: false,
      description: "Optional custom endpoint URL for MinIO, Wasabi, or Cloudflare R2"
    }
  ],
  endpoints: [
    { name: "List Buckets", method: "GET", path: "/", authentication: true, description: "Enumerates account buckets" },
    { name: "Get Bucket Location", method: "GET", path: "/{bucket}?location", authentication: true, description: "Queries bucket AWS region" },
    { name: "List Objects", method: "GET", path: "/{bucket}?list-type=2", authentication: true, description: "Lists objects and versions in bucket" },
    { name: "Put Object", method: "PUT", path: "/{bucket}/{key}", authentication: true, description: "Uploads object or blob" },
    { name: "Get Object", method: "GET", path: "/{bucket}/{key}", authentication: true, description: "Downloads object payload" },
    { name: "Delete Object", method: "DELETE", path: "/{bucket}/{key}", authentication: true, description: "Deletes object from bucket" }
  ],
  actions: [
    { id: "LIST_BUCKETS", name: "List Buckets", actionType: "READ", description: "Enumerate all storage buckets" },
    { id: "GET_BUCKET", name: "Get Bucket Details", actionType: "READ", description: "Fetch bucket configuration" },
    { id: "CREATE_BUCKET", name: "Create Bucket", actionType: "CREATE", description: "Provisions a new bucket" },
    { id: "DELETE_BUCKET", name: "Delete Bucket", actionType: "DELETE", description: "Removes empty bucket", destructive: true },
    { id: "LIST_OBJECTS", name: "List Objects", actionType: "READ", description: "List files in bucket" },
    { id: "DELETE_OBJECT", name: "Delete Object", actionType: "DELETE", description: "Delete object", destructive: true },
    { id: "REFRESH", name: "Refresh Surveillance", actionType: "REFRESH", description: "Poll storage usage" }
  ],
  resources: [
    {
      type: "BUCKET",
      name: "S3 Bucket",
      description: "AWS S3 or S3-compatible cloud storage bucket",
      supportedActions: ["READ", "CREATE", "DELETE", "REFRESH"],
      hasChildren: true
    }
  ],
  pollingIntervalSeconds: 60
};

// src/libraries/services/custom/CustomService.ts
var CustomService = class extends ServiceProvider {
  constructor(definition) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    super({
      id: `srv-${definition.identifier}`,
      name: definition.name,
      identifier: definition.identifier,
      entityType: "SERVICE_PROVIDER",
      description: definition.description,
      version: definition.version,
      status: "ONLINE",
      definition,
      providerType: "USER_DEFINED",
      createdAt: now,
      updatedAt: now
    });
  }
  async authenticate(credentials) {
    for (const field of this.definition.credentialFields) {
      if (field.required && !credentials[field.name]) {
        throw new SRKLError({
          code: "ERR_REQUIRED_CREDENTIAL_MISSING",
          message: `Field '${field.label || field.name}' is required`,
          service: this.identifier,
          operation: "authenticate"
        });
      }
    }
    return true;
  }
  async getStatus(account) {
    return {
      status: account.status,
      health: 100,
      usage: 10,
      quota: 100,
      limitUnit: "ops",
      resourceCount: this.definition.resources.length,
      totalSizeBytes: 1024,
      lastSync: (/* @__PURE__ */ new Date()).toISOString(),
      latencyMs: 35
    };
  }
  async listResources(account) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (this.identifier === "google-ai-studio") {
      try {
        const googleEmail = account.getCredential("googleAccount") || account.name;
        const res = await fetch(`/api/google-ai-studio/apps?googleAccount=${encodeURIComponent(googleEmail)}`);
        const data = await res.json();
        if (data.apps && data.apps.length > 0) {
          return data.apps.map(
            (app) => new ServiceResource({
              id: app.id,
              name: app.name,
              serviceId: this.identifier,
              accountId: account.id,
              resourceType: "APP",
              status: "ACTIVE",
              supportedActions: ["READ", "REFRESH"],
              attributes: { appletId: app.appletId, platform: app.platform, model: app.model, devUrl: app.devUrl },
              createdAt: app.updatedAt || now,
              updatedAt: app.updatedAt || now
            })
          );
        }
      } catch {
      }
    }
    return this.definition.resources.map((resDef, idx) => {
      return new ServiceResource({
        id: `${account.id}-res-${idx}`,
        name: `${resDef.name} Item`,
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: resDef.type,
        status: "ACTIVE",
        supportedActions: resDef.supportedActions,
        attributes: { description: resDef.description },
        createdAt: now,
        updatedAt: now
      });
    });
  }
  async getResource(account, resourceId) {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }
  async executeAction(account, actionId, payload) {
    const actionDef = this.definition.actions.find((a2) => a2.id === actionId);
    if (!actionDef) {
      throw new SRKLError({
        code: "ERR_ACTION_NOT_FOUND",
        message: `Action ${actionId} not defined in service ${this.name}`,
        service: this.identifier,
        operation: actionId
      });
    }
    return {
      status: "EXECUTED",
      action: actionDef.name,
      actionType: actionDef.actionType,
      payload,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  transformResponse(response) {
    return { provider: this.name, data: response };
  }
};

// src/libraries/services/templates/googleAiStudioDefinition.ts
var GOOGLE_AI_STUDIO_DEFINITION = {
  identifier: "google-ai-studio",
  name: "Google AI Studio",
  description: "Developer workspace for Google AI Studio & Cloud Run: tracks developing web & Android applets, prompt pipelines, and tuned models.",
  version: "1.4.0",
  authType: "API_KEY",
  credentialFields: [
    {
      name: "googleAccount",
      label: "Google Account Email (MANDATORY)",
      type: "string",
      required: true,
      secret: false,
      description: "Primary Google account email registered with Google AI Studio & GCP [MANDATORY]",
      guideUrl: "https://myaccount.google.com/"
    },
    {
      name: "apiKey",
      label: "Google AI Studio API Key (MANDATORY)",
      type: "password",
      required: true,
      secret: true,
      description: "Mandatory API key from aistudio.google.com/apikey required for Gemini models & prompts [MANDATORY]",
      guideUrl: "https://aistudio.google.com/apikey"
    },
    {
      name: "projectId",
      label: "Google Cloud Project ID (MANDATORY)",
      type: "string",
      required: true,
      secret: false,
      description: "GCP Project ID or Number (e.g. 207414612407 or 14948072) hosting Cloud Run services [MANDATORY]",
      guideUrl: "https://console.cloud.google.com/projectselector2/home/dashboard"
    },
    {
      name: "accessToken",
      label: "OAuth 2.0 Access Token (MANDATORY)",
      type: "password",
      required: true,
      secret: true,
      description: "Google OAuth 2.0 Bearer token with run.services.list scope to scan Cloud Run services & apps [MANDATORY]",
      guideUrl: "https://developers.google.com/oauthplayground/"
    }
  ],
  endpoints: [
    {
      name: "Get Service Health",
      method: "GET",
      path: "/api/google-ai-studio/health",
      authentication: true,
      description: "Surveil live Google AI Studio API reachability, model access, and latency"
    },
    {
      name: "List Resources",
      method: "GET",
      path: "/api/google-ai-studio/resources",
      authentication: true,
      description: "Enumerate linked foundation models, fine-tuned models, and developing apps"
    },
    {
      name: "Verify Credentials",
      method: "POST",
      path: "/api/google-ai-studio/verify",
      authentication: true,
      description: "Validate Google account and authenticate API key against Google Generative Language API"
    },
    {
      name: "List Developing Apps",
      method: "GET",
      path: "/api/google-ai-studio/apps",
      authentication: true,
      description: "Enumerate active web and Android applications developing in Google AI Studio for this account"
    },
    {
      name: "Scan Developing Apps",
      method: "POST",
      path: "/api/google-ai-studio/scan",
      authentication: true,
      description: "Enumerate and discover active AI Studio applets and fine-tuned models"
    },
    {
      name: "List Gemini Models",
      method: "GET",
      path: "https://generativelanguage.googleapis.com/v1beta/models",
      authentication: true,
      description: "Enumerate available Gemini foundation models via Google Developer API"
    },
    {
      name: "List Tuned Models",
      method: "GET",
      path: "https://generativelanguage.googleapis.com/v1beta/tunedModels",
      authentication: true,
      description: "List user fine-tuned models created and managed in Google AI Studio"
    },
    {
      name: "List Cached Contexts",
      method: "GET",
      path: "https://generativelanguage.googleapis.com/v1beta/cachedContents",
      authentication: true,
      description: "List active long-context prompt token caches created in Google AI Studio"
    },
    {
      name: "List Files API Assets",
      method: "GET",
      path: "https://generativelanguage.googleapis.com/v1beta/files",
      authentication: true,
      description: "List media & documents uploaded to Google AI Studio for prompt grounding"
    },
    {
      name: "Count Tokens",
      method: "POST",
      path: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:countTokens",
      authentication: true,
      description: "Calculate prompt token usage against Gemini 2.5 Flash foundation model"
    },
    {
      name: "List Cloud Run Services",
      method: "GET",
      path: "https://run.googleapis.com/v2/projects/{projectId}/locations/-/services",
      authentication: true,
      description: "Enumerate live deployed Cloud Run application services for project"
    },
    {
      name: "Get Account Profile",
      method: "GET",
      path: "https://www.googleapis.com/oauth2/v3/userinfo",
      authentication: true,
      description: "Verify connected Google developer account profile and email identity"
    }
  ],
  actions: [
    {
      id: "VERIFY_ACCOUNT",
      name: "Verify Account",
      actionType: "READ",
      description: "Authenticate API key and account against Google AI Studio"
    },
    {
      id: "LIST_APPS",
      name: "List Developing Apps",
      actionType: "READ",
      description: "Enumerate all active developing apps and applets for this Google account"
    },
    {
      id: "SCAN_MODELS",
      name: "Scan Tuned Models",
      actionType: "REFRESH",
      description: "Fetch user fine-tuned models and synchronize with applet catalog"
    }
  ],
  resources: [
    {
      type: "APP",
      name: "AI Studio Developing App",
      description: "Web or Android application actively developing under this Google account in AI Studio",
      supportedActions: ["READ", "REFRESH"],
      hasChildren: false
    },
    {
      type: "TUNED_MODEL",
      name: "Fine-Tuned Model",
      description: "Custom fine-tuned Gemini model artifact created in Google AI Studio",
      supportedActions: ["READ"],
      hasChildren: false
    },
    {
      type: "PROJECT",
      name: "Google Cloud Project",
      description: "Google Cloud project linked to AI Studio environment and billing",
      supportedActions: ["READ"],
      hasChildren: true
    }
  ],
  pollingIntervalSeconds: 120
};

// src/libraries/services/registry.ts
var ServiceRegistry = class _ServiceRegistry {
  constructor() {
    this._providers = /* @__PURE__ */ new Map();
    for (const def of _ServiceRegistry.getAvailableTemplates()) {
      this.registerTemplate(def.identifier);
    }
  }
  register(provider) {
    this._providers.set(provider.identifier, provider);
  }
  registerCustomDefinition(definition) {
    const custom = new CustomService(definition);
    this.register(custom);
    return custom;
  }
  registerTemplate(identifier) {
    if (identifier === BACKBLAZE_DEFINITION.identifier) {
      const provider = new BackblazeService();
      this.register(provider);
      return provider;
    }
    if (identifier === GEMINI_DEFINITION.identifier) {
      const provider = new GeminiService();
      this.register(provider);
      return provider;
    }
    if (identifier === GITHUB_DEFINITION.identifier) {
      const provider = new GithubService();
      this.register(provider);
      return provider;
    }
    if (identifier === VERCEL_DEFINITION.identifier) {
      const provider = new VercelService();
      this.register(provider);
      return provider;
    }
    if (identifier === CLOUDFLARE_DEFINITION.identifier) {
      const provider = new CloudflareService();
      this.register(provider);
      return provider;
    }
    if (identifier === GOOGLE_AI_STUDIO_DEFINITION.identifier) {
      const provider = new CustomService(GOOGLE_AI_STUDIO_DEFINITION);
      this.register(provider);
      return provider;
    }
    if (identifier === AWS_S3_DEFINITION.identifier) {
      const provider = new CustomService(AWS_S3_DEFINITION);
      this.register(provider);
      return provider;
    }
    return null;
  }
  get(identifier) {
    return this._providers.get(identifier);
  }
  getAll() {
    return Array.from(this._providers.values());
  }
  getAllDefinitions() {
    return this.getAll().map((p2) => p2.definition);
  }
  remove(identifier) {
    return this._providers.delete(identifier);
  }
  static getDefaultDefinitions() {
    return [BACKBLAZE_DEFINITION, GEMINI_DEFINITION, GITHUB_DEFINITION, VERCEL_DEFINITION, CLOUDFLARE_DEFINITION, GOOGLE_AI_STUDIO_DEFINITION, AWS_S3_DEFINITION];
  }
  static getAvailableTemplates() {
    return [BACKBLAZE_DEFINITION, GEMINI_DEFINITION, GITHUB_DEFINITION, VERCEL_DEFINITION, CLOUDFLARE_DEFINITION, GOOGLE_AI_STUDIO_DEFINITION, AWS_S3_DEFINITION];
  }
};

// src/backend/services/oracle/oracle.ts
var runtime6 = "server";
var deployment6 = "local";
var registry = new ServiceRegistry();
var service6 = {
  name: "oracle",
  runtime: runtime6,
  deployment: deployment6,
  getAvailableTemplates: () => ServiceRegistry.getAvailableTemplates(),
  getAllProviders: () => registry.getAll(),
  getProvider: (identifier) => registry.get(identifier),
  registerTemplate: (identifier) => registry.registerTemplate(identifier)
};
var oracleService = service6;

// node_modules/@dinilmusick/gutts/dist/auth/luthAuthTypes.js
var LuthAuthError = class extends Error {
  code;
  status;
  constructor(code, message, status) {
    super(`[${code}] ${message}`);
    this.name = "LuthAuthError";
    this.code = code;
    if (status !== void 0)
      this.status = status;
  }
};

// node_modules/@dinilmusick/gutts/dist/auth/luthAuthClient.js
function normalizeOrigin(value) {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return "";
  }
}
function resolveRuntimeAppUrl() {
  return globalThis.location?.origin?.trim() || "";
}
function resolveClientOrigin(explicitOrigin) {
  const explicit = explicitOrigin?.trim();
  if (explicit)
    return normalizeOrigin(explicit);
  return normalizeOrigin(resolveRuntimeAppUrl());
}
function resolveClientEnvironment(origin) {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]")
      return "development";
    if (host.includes("staging"))
      return "staging";
    if (host.includes("preview") || host.includes("-git-") || host.endsWith(".workers.dev"))
      return "preview";
    return "production";
  } catch {
    return "production";
  }
}
var DEFAULT_LUTH_URL = "https://luth.blueprint-ninjastudios.workers.dev";
var browserTokenStore = {
  get: () => {
    try {
      return globalThis.sessionStorage?.getItem("luth-session-token") || "";
    } catch {
      return "";
    }
  },
  set: (token) => {
    try {
      globalThis.sessionStorage?.setItem("luth-session-token", token || "");
    } catch {
    }
  },
  clear: () => {
    try {
      globalThis.sessionStorage?.removeItem("luth-session-token");
    } catch {
    }
  }
};
var sleep = (ms2) => new Promise((resolve) => setTimeout(resolve, ms2));
function hydrateLuthTokenFromUrl(tokenStore = browserTokenStore) {
  const location = globalThis.location;
  const history = globalThis.history;
  if (!location?.search || !history?.replaceState)
    return false;
  const href = location.href || `${location.origin || "http://localhost"}${location.pathname || "/"}${location.search}${location.hash || ""}`;
  const url = new URL(href);
  const token = url.searchParams.get("token")?.trim();
  if (!token)
    return false;
  tokenStore.set(token);
  url.searchParams.delete("token");
  history.replaceState({}, globalThis.document?.title ?? "", url.pathname + (url.search ? url.search : "") + url.hash);
  return true;
}
var LuthAuthClient = class {
  ecosystemId;
  applicationId;
  origin;
  environment;
  _luthUrls;
  _activeUrlIndex = 0;
  _nextUrlIndex = 0;
  luthUrlResolver;
  autoRegister;
  maxRetries;
  retryDelayMs;
  timeoutMs;
  tokenStore;
  registrationPromise = null;
  get luthUrl() {
    return this._luthUrls[this._activeUrlIndex] || DEFAULT_LUTH_URL;
  }
  get luthUrls() {
    return [...this._luthUrls];
  }
  constructor(config) {
    this.ecosystemId = config.ecosystemId;
    this.applicationId = config.applicationId;
    const initialUrls = config.luthUrls && config.luthUrls.length > 0 ? config.luthUrls.map((u) => u.replace(/\/+$/, "")) : [(config.luthUrl || DEFAULT_LUTH_URL).replace(/\/+$/, "")];
    this._luthUrls = Array.from(new Set(initialUrls));
    this.luthUrlResolver = config.luthUrlResolver;
    this.origin = resolveClientOrigin(config.origin);
    if (!this.origin) {
      throw new LuthAuthError("APPLICATION_ORIGIN_UNAVAILABLE", "Application deployment origin is unavailable. Supply an explicit origin; Node callers can use resolveServerRuntimeAppUrl().");
    }
    this.environment = config.environment || resolveClientEnvironment(this.origin);
    this.autoRegister = config.autoRegister ?? true;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 100;
    this.timeoutMs = Math.max(0, config.timeoutMs ?? 1e4);
    this.tokenStore = config.tokenStore || browserTokenStore;
    hydrateLuthTokenFromUrl(this.tokenStore);
  }
  getAuthHeaders() {
    const token = this.tokenStore.get();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  clearAuthToken() {
    this.tokenStore.clear();
  }
  async request(path, init = {}) {
    if (this.luthUrlResolver && this._luthUrls.length <= 1) {
      try {
        const resolved = await this.luthUrlResolver();
        const urls = Array.isArray(resolved) ? resolved : [resolved];
        const cleaned = urls.filter(Boolean).map((u) => u.replace(/\/+$/, ""));
        if (cleaned.length > 0) {
          this._luthUrls = Array.from(/* @__PURE__ */ new Set([...cleaned, ...this._luthUrls]));
        }
      } catch {
      }
    }
    const headers = new Headers(init.headers);
    const authHeaders = new Headers(this.getAuthHeaders());
    authHeaders.forEach((value, key) => {
      if (!headers.has(key))
        headers.set(key, value);
    });
    let lastError = null;
    const poolSize = this._luthUrls.length;
    const retryCycles = Math.max(1, this.maxRetries + 1);
    const startIndex = poolSize > 1 ? this._nextUrlIndex % poolSize : 0;
    for (let cycle = 0; cycle < retryCycles; cycle++) {
      for (let offset = 0; offset < poolSize; offset++) {
        const idx = (startIndex + offset) % poolSize;
        const targetUrl = this._luthUrls[idx];
        const controller = this.timeoutMs > 0 ? new AbortController() : null;
        const timeout = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;
        let removeAbortListener;
        try {
          if (controller && init.signal) {
            if (init.signal.aborted)
              controller.abort(init.signal.reason);
            else {
              const onAbort = () => controller.abort(init.signal?.reason);
              init.signal.addEventListener("abort", onAbort, { once: true });
              removeAbortListener = () => init.signal?.removeEventListener("abort", onAbort);
            }
          }
          const response = await fetch(`${targetUrl}${path}`, {
            ...init,
            credentials: init.credentials ?? "include",
            cache: init.cache ?? "no-store",
            headers,
            ...controller ? { signal: controller.signal } : {}
          });
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            lastError = new LuthAuthError("LUTH_DEPLOYMENT_UNAVAILABLE", `Luth deployment unavailable (${response.status})`, response.status);
            continue;
          }
          this._activeUrlIndex = idx;
          this._nextUrlIndex = offset === 0 ? (idx + 1) % poolSize : idx;
          return response;
        } catch (err) {
          lastError = err;
        } finally {
          if (timeout)
            clearTimeout(timeout);
          removeAbortListener?.();
        }
      }
      if (cycle < retryCycles - 1)
        await sleep(this.retryDelayMs * 2 ** cycle);
    }
    throw lastError || new Error("Luth request failed: all endpoints exhausted.");
  }
  async register() {
    let lastError = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.request("/api/registry/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ecosystemId: this.ecosystemId,
            applicationId: this.applicationId,
            origin: this.origin,
            environment: this.environment
          })
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok)
          return data;
        const error = new LuthAuthError(String(data.code || (response.status === 404 ? "APPLICATION_NOT_REGISTERED" : "REGISTRATION_FAILED")), String(data.message || "Application registration failed"), response.status);
        if (response.status < 500)
          throw error;
        lastError = error;
      } catch (error) {
        if (error instanceof LuthAuthError && error.status && error.status < 500)
          throw error;
        lastError = error;
      }
      if (attempt < this.maxRetries)
        await sleep(this.retryDelayMs * 2 ** attempt);
    }
    throw new LuthAuthError("REGISTRATION_FAILED", lastError instanceof Error ? lastError.message : "Application registration timed out");
  }
  async ensureRegistered() {
    if (!this.autoRegister)
      return null;
    if (!this.registrationPromise) {
      this.registrationPromise = this.register().catch((error) => {
        this.registrationPromise = null;
        throw error;
      });
    }
    return this.registrationPromise;
  }
  async getSession() {
    await this.ensureRegistered();
    const response = await this.request("/api/session");
    const token = response.headers?.get?.("set-auth-token");
    if (token)
      this.tokenStore.set(token);
    if (response.status === 401) {
      this.clearAuthToken();
      return { authenticated: false, error: "SESSION_INVALID" };
    }
    if (!response.ok)
      throw new LuthAuthError("AUTHENTICATION_FAILED", `Session fetch failed (${response.status})`, response.status);
    const result = await response.json();
    if (result.session?.token)
      this.tokenStore.set(result.session.token);
    return result;
  }
  /** Revalidates and hydrates the current Luth session using the canonical session endpoint. */
  async refreshSession() {
    return this.getSession();
  }
  async signInWithEmail(credentials) {
    await this.ensureRegistered();
    return this.postAuth("/api/auth/sign-in/email", credentials, "Sign in failed");
  }
  async signUpWithEmail(data) {
    await this.ensureRegistered();
    return this.postAuth("/api/auth/sign-up/email", data, "Sign up failed");
  }
  async signInWithGoogle(options) {
    await this.ensureRegistered();
    return this.postAuth("/api/auth/sign-in/social", {
      provider: "google",
      callbackURL: options?.callbackURL || this.origin
    }, "Google sign-in failed");
  }
  async signOut() {
    const response = await this.request("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new LuthAuthError(String(data.code || "AUTHENTICATION_FAILED"), String(data.message || "Sign out failed"), response.status);
    }
    this.clearAuthToken();
    const session = await this.getSession();
    if (session.authenticated) {
      throw new LuthAuthError("SESSION_INVALIDATION_FAILED", "Luth session is still active after sign-out.");
    }
  }
  async postAuth(path, body, fallback) {
    const response = await this.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    const session = data.session;
    const token = response.headers?.get?.("set-auth-token") || String(data.token || session?.token || "");
    if (token)
      this.tokenStore.set(token);
    if (!response.ok) {
      throw new LuthAuthError(String(data.code || "AUTHENTICATION_FAILED"), String(data.message || fallback), response.status);
    }
    return data;
  }
};
function createLuthAuthClient(config) {
  return new LuthAuthClient(config);
}

// src/backend/services/auth/auth.ts
var runtime7 = "client";
var deployment7 = "remote";
function getAuthClient() {
  return createLuthAuthClient({
    ecosystemId: "ultrst-armada",
    applicationId: "srkl"
  });
}
var service7 = {
  name: "auth",
  runtime: runtime7,
  deployment: deployment7,
  getCurrentUser: async () => {
    const result = await getAuthClient().getSession();
    return result.authenticated ? result.user ?? null : null;
  },
  logout: async () => {
    await getAuthClient().signOut();
    return true;
  }
};
var authService = service7;

// src/backend/services/audit/audit.ts
var runtime8 = "server";
var deployment8 = "local";
var service8 = {
  name: "audit",
  runtime: runtime8,
  deployment: deployment8,
  logActivity: async (action, metadata = {}) => {
    try {
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, metadata, timestamp: Date.now() })
      });
      return true;
    } catch {
      return false;
    }
  }
};
var auditService = service8;

// src/backend/SrklBackend.ts
init_unifiedDb();

// src/backend/services/core/authCore.ts
var authCore_exports = {};
__export(authCore_exports, {
  findUserByEmail: () => findUserByEmail,
  getCurrentUser: () => getCurrentUser,
  loginUser: () => loginUser,
  resolveUserFromToken: () => resolveUserFromToken
});
init_unifiedDb();
function createTokenStore(initial = "") {
  let token = initial;
  return {
    get: () => token,
    set: (value) => {
      token = value;
    },
    clear: () => {
      token = "";
    }
  };
}
function createClient(token = "") {
  return createLuthAuthClient({
    ecosystemId: "ultrst-armada",
    applicationId: "srkl",
    tokenStore: createTokenStore(token)
  });
}
function toAuthUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.email.split("@")[0],
    role: "user",
    image: user.image
  };
}
async function loginUser(email, password, isAdmin = false, _env) {
  if (isAdmin) return { status: 403, success: false, error: "Administrative authentication is managed by Luth." };
  if (!email?.trim() || !password) return { status: 400, success: false, error: "Email and password are required." };
  try {
    const client = createClient();
    await client.signInWithEmail({ email: email.trim(), password });
    const session = await client.getSession();
    if (!session.authenticated || !session.user) {
      return { status: 401, success: false, error: "Luth did not establish an authenticated session." };
    }
    const authorization = new Headers(client.getAuthHeaders()).get("authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) return { status: 502, success: false, error: "Luth did not return a session token." };
    return { status: 200, success: true, user: toAuthUser(session.user), token };
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 503;
    return {
      status,
      success: false,
      error: error instanceof Error ? error.message : "Canonical Luth authentication service unavailable."
    };
  }
}
async function getCurrentUser(token, _env) {
  const credential = String(token || "").replace(/^Bearer\\s+/i, "").trim();
  if (!credential) return null;
  try {
    const session = await createClient(credential).getSession();
    return session.authenticated && session.user ? toAuthUser(session.user) : null;
  } catch {
    return null;
  }
}
var resolveUserFromToken = getCurrentUser;
async function findUserByEmail(email, env) {
  if (!email?.trim()) return null;
  try {
    const result = await queryUnifiedDb(
      'SELECT id, email, username, name, role, app_profiles, created_at, updated_at FROM "srkl_application_profiles" WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email.trim()],
      env
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

// src/backend/services/core/backblazeCore.ts
var backblazeCore_exports = {};
__export(backblazeCore_exports, {
  createB2Bucket: () => createB2Bucket,
  deleteB2Bucket: () => deleteB2Bucket,
  deleteB2FileVersion: () => deleteB2FileVersion,
  getOrAuthorizeB2: () => getOrAuthorizeB2,
  invalidateB2Cache: () => invalidateB2Cache,
  listB2Buckets: () => listB2Buckets,
  listB2Files: () => listB2Files,
  uploadB2File: () => uploadB2File
});

// src/server/backblazeClient.ts
var BackblazeClient2 = class {
  static async authorize(keyId, applicationKey) {
    const credsB64 = Buffer.from(`${keyId.trim()}:${applicationKey.trim()}`).toString("base64");
    let res = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      method: "GET",
      headers: { Authorization: `Basic ${credsB64}`, "User-Agent": "SRKL-Hub-B2/1.0" }
    });
    if (!res.ok) {
      res = await fetch("https://api.backblazeb2.com/b2api/v4/b2_authorize_account", {
        method: "GET",
        headers: { Authorization: `Basic ${credsB64}`, "User-Agent": "SRKL-Hub-B2/1.0" }
      });
    }
    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Backblaze authorization failed (${res.status})`;
      try {
        errMsg = JSON.parse(errText).message || errMsg;
      } catch {
      }
      throw new Error(errMsg);
    }
    const data = await res.json();
    const apiUrl = (data.apiInfo?.storageApi?.apiUrl || data.apiUrl || "https://api.backblazeb2.com").replace(/\/+$/, "");
    const downloadUrl = (data.apiInfo?.storageApi?.downloadUrl || data.downloadUrl || apiUrl).replace(/\/+$/, "");
    return {
      accountId: data.accountId,
      authorizationToken: data.authorizationToken,
      apiUrl,
      downloadUrl,
      s3ApiUrl: data.apiInfo?.storageApi?.s3ApiUrl || data.s3ApiUrl,
      allowed: data.apiInfo?.storageApi?.allowed || data.allowed
    };
  }
  static async postJson(auth, endpoint, body) {
    const baseApiUrl = (auth.apiUrl || "https://api.backblazeb2.com").replace(/\/+$/, "");
    const res = await fetch(`${baseApiUrl}/b2api/v2/${endpoint}`, {
      method: "POST",
      headers: { Authorization: auth.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.code || `B2 API request failed (${endpoint}: ${res.status})`);
    }
    return res.json();
  }
  static async listBuckets(auth, bucketId) {
    const body = { accountId: auth.accountId };
    const restrictedBucketId = bucketId || auth.allowed?.bucketId || auth.allowed?.buckets?.[0]?.bucketId;
    const restrictedBucketName = auth.allowed?.bucketName || auth.allowed?.buckets?.[0]?.bucketName;
    if (restrictedBucketId) body.bucketId = restrictedBucketId;
    else if (restrictedBucketName) body.bucketName = restrictedBucketName;
    const data = await this.postJson(auth, "b2_list_buckets", body);
    return data.buckets || [];
  }
  static async createBucket(auth, bucketName, bucketType = "allPrivate") {
    return await this.postJson(auth, "b2_create_bucket", { accountId: auth.accountId, bucketName, bucketType });
  }
  static async deleteBucket(auth, bucketId) {
    await this.postJson(auth, "b2_delete_bucket", { accountId: auth.accountId, bucketId });
    return true;
  }
  static async listFileNames(auth, bucketId, prefix = "", delimiter, maxFileCount = 1e3, startFileName) {
    const payload = { bucketId, maxFileCount, prefix: prefix || "" };
    if (delimiter) payload.delimiter = delimiter;
    if (startFileName) payload.startFileName = startFileName;
    const data = await this.postJson(auth, "b2_list_file_names", payload);
    return { files: data.files || [], nextFileName: data.nextFileName || null };
  }
  static async listFileVersions(auth, bucketId, prefix = "", maxFileCount = 1e3, startFileName, startFileId) {
    const payload = { bucketId, maxFileCount, prefix: prefix || "" };
    if (startFileName) payload.startFileName = startFileName;
    if (startFileId) payload.startFileId = startFileId;
    const data = await this.postJson(auth, "b2_list_file_versions", payload);
    return { files: data.files || [], nextFileName: data.nextFileName || null, nextFileId: data.nextFileId || null };
  }
  static async getUploadUrl(auth, bucketId) {
    return await this.postJson(auth, "b2_get_upload_url", { bucketId });
  }
  static async uploadFile(uploadUrl, uploadAuthToken, fileName, buffer, contentType = "b2/x-auto", sha1 = "do_not_verify") {
    const encodedFileName = encodeURIComponent(fileName).replace(/%2F/g, "/");
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: uploadAuthToken,
        "X-Bz-File-Name": encodedFileName,
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "X-Bz-Content-Sha1": sha1
      },
      body: buffer
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.code || "Failed to upload file to Backblaze");
    }
    return await res.json();
  }
  static async deleteFileVersion(auth, fileName, fileId) {
    await this.postJson(auth, "b2_delete_file_version", { fileName, fileId });
    return true;
  }
  static async getDownloadAuthorization(auth, bucketId, validDuration = 86400) {
    try {
      const data = await this.postJson(auth, "b2_get_download_authorization", { bucketId, fileNamePrefix: "", validDurationInSeconds: validDuration });
      return data.authorizationToken || auth.authorizationToken;
    } catch {
      return auth.authorizationToken;
    }
  }
};

// src/backend/services/core/backblazeCore.ts
var authCache = /* @__PURE__ */ new Map();
async function getOrAuthorizeB2(keyId, applicationKey) {
  const cacheKey = `${keyId.trim()}:${applicationKey.trim()}`;
  const cached = authCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 20 * 60 * 1e3) {
    return cached.auth;
  }
  const auth = await BackblazeClient2.authorize(keyId, applicationKey);
  authCache.set(cacheKey, { auth, timestamp: Date.now() });
  return auth;
}
function invalidateB2Cache(keyId, applicationKey) {
  authCache.delete(`${keyId.trim()}:${applicationKey.trim()}`);
}
async function listB2Buckets(keyId, applicationKey, bucketId) {
  try {
    let auth = await getOrAuthorizeB2(keyId, applicationKey);
    try {
      const buckets = await BackblazeClient2.listBuckets(auth, bucketId);
      return { success: true, buckets };
    } catch {
      invalidateB2Cache(keyId, applicationKey);
      auth = await BackblazeClient2.authorize(keyId, applicationKey);
      const buckets = await BackblazeClient2.listBuckets(auth, bucketId);
      return { success: true, buckets };
    }
  } catch (err) {
    return { success: false, error: err.message || "Failed to list buckets" };
  }
}
async function listB2Files(keyId, applicationKey, bucketId, prefix = "", delimiter, maxFileCount = 1e3) {
  try {
    let auth = await getOrAuthorizeB2(keyId, applicationKey);
    let allFiles = [];
    const fetchBatch = async (authorization) => {
      let filesAcc = [];
      let start = void 0;
      while (true) {
        const result = await BackblazeClient2.listFileNames(authorization, bucketId, prefix, delimiter, maxFileCount, start);
        filesAcc = filesAcc.concat(result.files || []);
        if (!result.nextFileName || result.nextFileName === start) break;
        start = result.nextFileName;
      }
      return filesAcc;
    };
    try {
      allFiles = await fetchBatch(auth);
    } catch {
      invalidateB2Cache(keyId, applicationKey);
      auth = await BackblazeClient2.authorize(keyId, applicationKey);
      allFiles = await fetchBatch(auth);
    }
    const downloadAuthToken = await BackblazeClient2.getDownloadAuthorization(auth, bucketId);
    return {
      success: true,
      files: allFiles,
      downloadUrl: auth.downloadUrl,
      downloadAuthToken
    };
  } catch (err) {
    return { success: false, error: err.message || "Failed to list files" };
  }
}
async function createB2Bucket(keyId, applicationKey, bucketName, bucketType = "allPrivate") {
  try {
    const auth = await getOrAuthorizeB2(keyId, applicationKey);
    const bucket = await BackblazeClient2.createBucket(auth, bucketName, bucketType);
    return { success: true, bucket };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create bucket" };
  }
}
async function deleteB2Bucket(keyId, applicationKey, bucketId) {
  try {
    const auth = await getOrAuthorizeB2(keyId, applicationKey);
    await BackblazeClient2.deleteBucket(auth, bucketId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete bucket" };
  }
}
async function uploadB2File(keyId, applicationKey, bucketId, fileName, fileBase64, contentType = "b2/x-auto", sha1 = "do_not_verify") {
  try {
    const auth = await getOrAuthorizeB2(keyId, applicationKey);
    const { uploadUrl, authorizationToken } = await BackblazeClient2.getUploadUrl(auth, bucketId);
    const buffer = Buffer.from(fileBase64, "base64");
    const file = await BackblazeClient2.uploadFile(uploadUrl, authorizationToken, fileName, buffer, contentType, sha1);
    return { success: true, file };
  } catch (err) {
    return { success: false, error: err.message || "Failed to upload file" };
  }
}
async function deleteB2FileVersion(keyId, applicationKey, fileName, fileId) {
  try {
    const auth = await getOrAuthorizeB2(keyId, applicationKey);
    await BackblazeClient2.deleteFileVersion(auth, fileName, fileId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete file version" };
  }
}

// src/backend/services/core/workspaceCore.ts
var workspaceCore_exports = {};
__export(workspaceCore_exports, {
  createWorkspace: () => createWorkspace,
  deleteStorageConnection: () => deleteStorageConnection,
  formatCanonicalFolder: () => formatCanonicalFolder,
  getUserProfile: () => getUserProfile,
  getWorkspaces: () => getWorkspaces,
  sanitizeWorkspaceName: () => sanitizeWorkspaceName,
  saveStorageConnection: () => saveStorageConnection
});
init_unifiedDb();
function sanitizeWorkspaceName(name) {
  return (name || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "default";
}
function formatCanonicalFolder(appName = "srkl", userName = "user", wsName = "default") {
  const cleanWs = sanitizeWorkspaceName(wsName);
  const cleanUser = sanitizeWorkspaceName(userName);
  return `ultrst_${appName}_${cleanUser}_${cleanWs}`;
}
async function getUserProfile(userId, env) {
  if (!userId) return null;
  const res = await queryUnifiedDb('SELECT * FROM "srkl_application_profiles" WHERE id = $1 LIMIT 1;', [userId], env);
  return res.rows[0] || null;
}
async function getWorkspaces(userId, env) {
  const user = await getUserProfile(userId, env);
  if (!user) return { workspaces: [], activeWorkspaceId: "", storage_connections: [] };
  const appProfiles = typeof user.app_profiles === "string" ? JSON.parse(user.app_profiles) : user.app_profiles || {};
  const srkl = appProfiles.srkl || {};
  const workspaces = Array.isArray(srkl.workspaces) ? srkl.workspaces : [];
  const canonical = workspaces[0] || {
    id: `ws-srkl-${userId}`,
    name: "Default",
    workspacePath: `./${formatCanonicalFolder("srkl", user.username || user.name || "user", "default")}`,
    storageProvider: srkl.storage_connections?.[0]?.provider || "local_fs",
    storageConnectionId: srkl.storage_connections?.[0]?.id || null,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (workspaces.length !== 1 || srkl.activeWorkspaceId !== canonical.id) {
    if (!appProfiles.srkl) appProfiles.srkl = {};
    appProfiles.srkl.workspaces = [canonical];
    appProfiles.srkl.activeWorkspaceId = canonical.id;
    await queryUnifiedDb(
      'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
      [JSON.stringify(appProfiles), userId],
      env
    );
  }
  return {
    workspaces: [canonical],
    activeWorkspaceId: canonical.id,
    storage_connections: srkl.storage_connections || []
  };
}
async function createWorkspace(userId, wsData, env) {
  if (!userId) return { success: false, error: "User ID is required" };
  const user = await getUserProfile(userId, env);
  if (!user) return { success: false, error: "User not found" };
  const appProfiles = typeof user.app_profiles === "string" ? JSON.parse(user.app_profiles) : user.app_profiles || {};
  if (!appProfiles.srkl) appProfiles.srkl = {};
  const existing = Array.isArray(appProfiles.srkl.workspaces) ? appProfiles.srkl.workspaces[0] : null;
  if (existing) {
    appProfiles.srkl.workspaces = [existing];
    appProfiles.srkl.activeWorkspaceId = existing.id;
    await queryUnifiedDb(
      'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
      [JSON.stringify(appProfiles), userId],
      env
    );
    return { success: false, workspace: existing, error: "SRKL allows exactly one default workspace per user" };
  }
  const conns = appProfiles.srkl.storage_connections || [];
  const conn = conns.find((c) => c.id === wsData.storageConnectionId) || conns[0];
  const wsId = `ws-srkl-${userId}`;
  const userName = user.username || user.name || "user";
  const workspaceName = (wsData.name || "Default").trim() || "Default";
  const newWs = {
    id: wsId,
    name: workspaceName,
    workspacePath: `./${formatCanonicalFolder("srkl", userName, "default")}`,
    storageProvider: conn?.provider || wsData.storageProvider || "local_fs",
    storageConnectionId: conn?.id || null,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  appProfiles.srkl.workspaces = [newWs];
  appProfiles.srkl.activeWorkspaceId = wsId;
  await queryUnifiedDb(
    'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
    [JSON.stringify(appProfiles), userId],
    env
  );
  return { success: true, workspace: newWs };
}
async function saveStorageConnection(userId, conn, env) {
  const user = await getUserProfile(userId, env);
  if (!user) throw new Error("User not found");
  const appProfiles = typeof user.app_profiles === "string" ? JSON.parse(user.app_profiles) : user.app_profiles || {};
  if (!appProfiles.srkl) appProfiles.srkl = {};
  const conns = appProfiles.srkl.storage_connections || [];
  const connId = conn.id || `conn_b2_${Date.now()}`;
  const isPrimary = conns.length === 0 || conn.role === "primary";
  const entry = {
    ...conn,
    id: connId,
    role: isPrimary ? "primary" : conn.role || "redundant_clone",
    enabled: true,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdAt: conn.createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  const idx = conns.findIndex((c) => c.id === connId);
  if (idx >= 0) conns[idx] = entry;
  else conns.push(entry);
  appProfiles.srkl.storage_connections = conns;
  await queryUnifiedDb(
    'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
    [JSON.stringify(appProfiles), userId],
    env
  );
  return { success: true, connections: conns, connection: entry };
}
async function deleteStorageConnection(userId, connId, env) {
  const user = await getUserProfile(userId, env);
  if (!user) throw new Error("User not found");
  const appProfiles = typeof user.app_profiles === "string" ? JSON.parse(user.app_profiles) : user.app_profiles || {};
  const conns = (appProfiles.srkl?.storage_connections || []).filter((c) => c.id !== connId);
  if (appProfiles.srkl) appProfiles.srkl.storage_connections = conns;
  await queryUnifiedDb(
    'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
    [JSON.stringify(appProfiles), userId],
    env
  );
  return { success: true, connections: conns };
}

// src/backend/services/core/ecosystemCore.ts
var ecosystemCore_exports = {};
__export(ecosystemCore_exports, {
  getEcosystemAccounts: () => getEcosystemAccounts,
  getEcosystemApps: () => getEcosystemApps,
  getEcosystemHealth: () => getEcosystemHealth,
  getEcosystemServices: () => getEcosystemServices
});
init_unifiedDb();
function getEcosystemHealth() {
  return {
    status: "ONLINE",
    app: "srkl",
    engine: "srkl-service-broker",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function getEcosystemApps(env) {
  try {
    const res = await queryUnifiedDb(
      `SELECT app_id, name, description, supported_services, status FROM "ultrst-apps" WHERE status = 'active';`,
      [],
      env
    );
    return { success: true, apps: res.rows };
  } catch (err) {
    return { success: false, apps: [] };
  }
}
async function getEcosystemServices(userId, env) {
  if (!userId) return { success: false, services: [] };
  try {
    const res = await queryUnifiedDb('SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 LIMIT 1;', [userId], env);
    if (res.rows.length === 0) return { success: true, services: [] };
    const appProfiles = typeof res.rows[0].app_profiles === "string" ? JSON.parse(res.rows[0].app_profiles) : res.rows[0].app_profiles || {};
    const services2 = appProfiles.srkl?.services || [];
    return { success: true, services: services2 };
  } catch {
    return { success: false, services: [] };
  }
}
async function getEcosystemAccounts(userId, manifest, env) {
  if (!userId) return { success: false, accounts: [], count: 0 };
  try {
    const res = await queryUnifiedDb('SELECT id, app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $1 LIMIT 1;', [userId], env);
    if (res.rows.length === 0) return { success: true, accounts: [], count: 0 };
    const p2 = typeof res.rows[0].app_profiles === "string" ? JSON.parse(res.rows[0].app_profiles) : res.rows[0].app_profiles || {};
    const conns = p2.srkl?.storage_connections || [];
    const accounts = [];
    for (const c of conns) {
      accounts.push({
        id: c.id,
        serviceId: c.provider === "backblaze_b2" ? "backblaze" : c.provider || "storage",
        provider: (c.provider || "BACKBLAZE_B2").toUpperCase(),
        category: "storage",
        name: c.label || "Storage Connection",
        emailOrSlug: c.b2KeyId || c.accessKeyId || c.label,
        status: c.testStatus === "ok" ? "CONNECTED" : c.enabled !== false ? "ACTIVE" : "ERROR",
        credentials: {
          keyId: c.b2KeyId || c.keyId || c.accessKeyId || "",
          applicationKey: c.b2ApplicationKey || c.applicationKey || c.secretAccessKey || "",
          bucketName: c.b2BucketName || c.bucketName || "",
          bucketId: c.b2BucketId || c.bucketId || "",
          endpoint: c.b2Endpoint || c.endpoint || "",
          region: c.b2Region || c.region || ""
        },
        groupIds: c.groupIds || (c.groupId ? [c.groupId] : []),
        metadata: { role: c.role, provider: c.provider },
        createdAt: c.createdAt
      });
    }
    for (const s of p2.srkl?.services || []) {
      accounts.push(s);
    }
    return { success: true, accounts, count: accounts.length };
  } catch {
    return { success: false, accounts: [], count: 0 };
  }
}

// src/backend/orchestrations/serviceSyncOrchestration.ts
async function serviceSyncOrchestration(userId) {
  const templates = oracleService.getAvailableTemplates();
  const providers = oracleService.getAllProviders();
  await auditService.logActivity("service_sync_executed", { userId, providerCount: providers.length });
  return { templates, providers };
}

// src/backend/orchestrations/clusterScanOrchestration.ts
async function clusterScanOrchestration(targetIp) {
  await auditService.logActivity("cluster_scan_initiated", { targetIp });
  return { targetIp, scannedAt: Date.now(), status: "COMPLETE" };
}

// node_modules/@ultrst-armada/krnl/packages/core/dist/index.js
var ServiceStateStore = class {
  state;
  listeners = /* @__PURE__ */ new Set();
  constructor(initialState) {
    this.state = { ...initialState };
  }
  getState() {
    return Object.freeze({ ...this.state });
  }
  setState(mutation) {
    this.state = { ...this.state, ...mutation };
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot, mutation);
    }
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  reset(newState) {
    this.state = { ...newState || {} };
  }
};
var TRANSITIONS = {
  uninitialized: ["initializing"],
  initializing: ["ready", "uninitialized"],
  ready: ["starting"],
  starting: ["running", "ready"],
  running: ["stopping"],
  stopping: ["stopped", "running"],
  stopped: ["starting"]
};
var LifecycleManager = class {
  status = "uninitialized";
  getStatus() {
    return this.status;
  }
  canTransitionTo(next) {
    return TRANSITIONS[this.status].includes(next);
  }
  transitionTo(next) {
    if (!this.canTransitionTo(next)) {
      throw new Error("[Lifecycle] Invalid transition '" + this.status + "' -> '" + next + "'.");
    }
    this.status = next;
  }
  setStatus(next) {
    this.transitionTo(next);
  }
  assertRunning(serviceName) {
    if (this.status !== "running") {
      throw new Error(
        "[Service:" + serviceName + "] Cannot invoke operation while status is '" + this.status + "' (expected 'running')."
      );
    }
  }
};
function createRuntimeId() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
var createTelemetryId = (prefix) => `${prefix}_${createRuntimeId()}`;
function percentiles(values) {
  if (!values.length) return { min: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0 };
  const sorted = [...values].sort((a2, b2) => a2 - b2);
  const pick3 = (p2) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p2))];
  return {
    min: sorted[0],
    mean: sorted.reduce((sum3, value) => sum3 + value, 0) / sorted.length,
    p50: pick3(0.5),
    p90: pick3(0.9),
    p95: pick3(0.95),
    p99: pick3(0.99),
    max: sorted[sorted.length - 1]
  };
}
function buildTelemetrySnapshot(input) {
  const invocations = input.invocations.slice();
  const durations = invocations.map((item) => item.durationMs);
  const targetMap = /* @__PURE__ */ new Map();
  for (const invocation of invocations) {
    const key = `${invocation.kind}:${invocation.target}`;
    const group = targetMap.get(key) ?? [];
    group.push(invocation);
    targetMap.set(key, group);
  }
  const targets = [...targetMap.values()].map((group) => ({
    target: group[0].target,
    kind: group[0].kind,
    count: group.length,
    successCount: group.filter((item) => item.status === "completed").length,
    errorCount: group.filter((item) => item.status === "failed").length,
    durationMs: percentiles(group.map((item) => item.durationMs)),
    lastInvocationAt: group[group.length - 1]?.completedAt
  }));
  return {
    serviceId: input.serviceId,
    mode: input.mode,
    capturedAt: Date.now(),
    status: input.status,
    totals: {
      invocationCount: input.totalInvocationCount,
      successCount: input.totalSuccessCount,
      errorCount: input.totalErrorCount,
      durationMs: percentiles(durations)
    },
    targets,
    activeInvocations: input.activeInvocations,
    recentInvocations: invocations.slice(-input.maxRecentInvocations)
  };
}
var runtimeProcess = typeof globalThis !== "undefined" ? globalThis.process : void 0;
var runtimePerformance = typeof globalThis !== "undefined" ? globalThis.performance : void 0;
function telemetryNow() {
  return runtimePerformance?.now ? runtimePerformance.now() : Date.now();
}
function sampleResources() {
  const memory = runtimeProcess?.memoryUsage?.();
  const cpu = runtimeProcess?.cpuUsage?.();
  const eventLoop = runtimePerformance?.eventLoopUtilization?.();
  return {
    cpuUserMicros: cpu?.user,
    cpuSystemMicros: cpu?.system,
    heapUsedBytes: memory?.heapUsed,
    heapTotalBytes: memory?.heapTotal,
    rssBytes: memory?.rss,
    externalBytes: memory?.external,
    arrayBuffersBytes: memory?.arrayBuffers,
    eventLoopUtilization: eventLoop?.utilization,
    scope: memory || cpu || eventLoop ? "process" : "runtime"
  };
}
function deltaResources(start, end) {
  const delta = (a2, b2) => a2 === void 0 || b2 === void 0 ? void 0 : b2 - a2;
  return {
    cpuUserMicros: delta(start.cpuUserMicros, end.cpuUserMicros),
    cpuSystemMicros: delta(start.cpuSystemMicros, end.cpuSystemMicros),
    heapUsedBytes: delta(start.heapUsedBytes, end.heapUsedBytes),
    heapTotalBytes: delta(start.heapTotalBytes, end.heapTotalBytes),
    rssBytes: delta(start.rssBytes, end.rssBytes),
    externalBytes: delta(start.externalBytes, end.externalBytes),
    arrayBuffersBytes: delta(start.arrayBuffersBytes, end.arrayBuffersBytes),
    eventLoopUtilization: delta(start.eventLoopUtilization, end.eventLoopUtilization),
    scope: start.scope
  };
}
var TelemetryController = class {
  constructor(serviceId, options = {}) {
    this.serviceId = serviceId;
    this.mode = options.mode ?? "off";
    this.maxSamples = Math.max(1, options.maxSamples ?? 2048);
    this.maxRecentInvocations = Math.max(1, options.maxRecentInvocations ?? 100);
  }
  serviceId;
  mode;
  maxSamples;
  maxRecentInvocations;
  samples = [];
  active = /* @__PURE__ */ new Map();
  totalInvocationCount = 0;
  totalSuccessCount = 0;
  totalErrorCount = 0;
  lastInvocationAt;
  enable(mode = "standard") {
    this.mode = mode;
  }
  disable() {
    this.mode = "off";
    this.active.clear();
  }
  setMode(mode) {
    this.mode = mode;
    if (mode === "off") this.active.clear();
  }
  getMode() {
    return this.mode;
  }
  status() {
    return {
      enabled: this.mode !== "off",
      mode: this.mode,
      serviceId: this.serviceId,
      invocationCount: this.totalInvocationCount,
      activeInvocations: this.active.size,
      lastInvocationAt: this.lastInvocationAt
    };
  }
  begin(target, kind, correlationId, parentSpanId) {
    if (this.mode === "off") {
      return {
        invocationId: "",
        traceId: "",
        spanId: "",
        parentSpanId,
        end: () => void 0
      };
    }
    const invocationId = createTelemetryId("inv");
    const spanId = createTelemetryId("span");
    const traceId = parentSpanId ? this.findTraceId(parentSpanId) ?? createTelemetryId("trace") : createTelemetryId("trace");
    const active = {
      invocationId,
      traceId,
      spanId,
      parentSpanId,
      serviceId: this.serviceId,
      target,
      kind,
      correlationId,
      startedAt: telemetryNow(),
      resourcesStart: this.mode === "standard" ? void 0 : sampleResources()
    };
    this.active.set(invocationId, active);
    return {
      invocationId,
      traceId,
      spanId,
      parentSpanId,
      end: (error) => this.finish(active, error)
    };
  }
  reset() {
    this.samples.length = 0;
    this.active.clear();
    this.totalInvocationCount = 0;
    this.totalSuccessCount = 0;
    this.totalErrorCount = 0;
    this.lastInvocationAt = void 0;
  }
  snapshot() {
    return buildTelemetrySnapshot({
      serviceId: this.serviceId,
      mode: this.mode,
      invocations: this.samples,
      status: this.status(),
      totalInvocationCount: this.totalInvocationCount,
      totalSuccessCount: this.totalSuccessCount,
      totalErrorCount: this.totalErrorCount,
      activeInvocations: this.active.size,
      maxRecentInvocations: this.maxRecentInvocations
    });
  }
  functionality(name) {
    return this.snapshot().targets.find((target) => target.kind === "functionality" && target.target === name);
  }
  functionalities() {
    return this.snapshot().targets.filter((target) => target.kind === "functionality");
  }
  findTraceId(parentSpanId) {
    for (let index = this.samples.length - 1; index >= 0; index -= 1) {
      if (this.samples[index].spanId === parentSpanId) return this.samples[index].traceId;
    }
    for (const active of this.active.values()) {
      if (active.spanId === parentSpanId) return active.traceId;
    }
    return void 0;
  }
  finish(active, error) {
    if (!this.active.delete(active.invocationId)) return;
    const completedAt = telemetryNow();
    const resourcesEnd = this.mode === "standard" ? void 0 : sampleResources();
    const invocation = {
      invocationId: active.invocationId,
      traceId: active.traceId,
      spanId: active.spanId,
      parentSpanId: active.parentSpanId,
      serviceId: active.serviceId,
      target: active.target,
      kind: active.kind,
      correlationId: active.correlationId,
      startedAt: active.startedAt,
      completedAt,
      durationMs: Math.max(0, completedAt - active.startedAt),
      status: error === void 0 ? "completed" : "failed",
      error: error === void 0 ? void 0 : {
        name: error instanceof Error ? error.name : "Error",
        message: error instanceof Error ? error.message : String(error)
      },
      resources: active.resourcesStart && resourcesEnd ? { start: active.resourcesStart, end: resourcesEnd, delta: deltaResources(active.resourcesStart, resourcesEnd) } : void 0
    };
    this.samples.push(invocation);
    this.totalInvocationCount += 1;
    if (invocation.status === "completed") this.totalSuccessCount += 1;
    else this.totalErrorCount += 1;
    if (this.samples.length > this.maxSamples) this.samples.splice(0, this.samples.length - this.maxSamples);
    this.lastInvocationAt = Date.now();
  }
};
var ServiceInstance = class {
  constructor(definition) {
    this.definition = definition;
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.telemetry = new TelemetryController(this.id);
    this.lifecycle = new LifecycleManager();
    if (definition.state) {
      this.stateStore = new ServiceStateStore(definition.state.initial);
    }
  }
  definition;
  id;
  name;
  version;
  telemetry;
  stateStore;
  lifecycle;
  initialized = false;
  disposed = false;
  getDefinition() {
    return this.definition;
  }
  getStatus() {
    return this.lifecycle.getStatus();
  }
  async start() {
    if (this.disposed) throw new Error("[Service:" + this.name + "] Cannot start a disposed service.");
    const current = this.lifecycle.getStatus();
    if (current === "running") return;
    if (current === "initializing" || current === "starting" || current === "stopping") {
      throw new Error("[Service:" + this.name + "] Cannot start while status is '" + current + "'.");
    }
    if (!this.initialized) {
      this.lifecycle.transitionTo("initializing");
      try {
        await this.definition.lifecycle?.onInit?.();
        this.initialized = true;
        this.lifecycle.transitionTo("ready");
      } catch (error) {
        this.lifecycle.transitionTo("uninitialized");
        throw error;
      }
    }
    this.lifecycle.transitionTo("starting");
    try {
      await this.definition.lifecycle?.onStart?.();
      this.lifecycle.transitionTo("running");
    } catch (error) {
      this.lifecycle.transitionTo("ready");
      throw error;
    }
  }
  async stop() {
    const current = this.lifecycle.getStatus();
    if (current === "stopped") return;
    if (current !== "running") {
      throw new Error("[Service:" + this.name + "] Cannot stop while status is '" + current + "'.");
    }
    this.lifecycle.transitionTo("stopping");
    try {
      await this.definition.lifecycle?.onStop?.();
      this.lifecycle.transitionTo("stopped");
    } catch (error) {
      this.lifecycle.transitionTo("running");
      throw error;
    }
  }
  async dispose() {
    if (this.disposed) return;
    if (this.lifecycle.getStatus() === "running") await this.stop();
    await this.definition.lifecycle?.onDispose?.();
    this.disposed = true;
  }
  async call(op, input, ctx = {}) {
    this.lifecycle.assertRunning(this.name);
    const operation = this.definition.operations[op];
    if (!operation) {
      throw new Error("[Service:" + this.name + "] Operation '" + op + "' not found.");
    }
    if (ctx.metadata?.__krnlTelemetryInternal === true) {
      return await operation.handler(input, ctx);
    }
    const parentSpanId = typeof ctx.metadata?.__krnlTelemetryParentSpanId === "string" ? ctx.metadata.__krnlTelemetryParentSpanId : void 0;
    const handle = this.telemetry.begin(op, "service", ctx.correlationId, parentSpanId);
    try {
      const output = await operation.handler(input, ctx);
      handle.end();
      return output;
    } catch (error) {
      handle.end(error);
      throw error;
    }
  }
  getState() {
    return this.stateStore?.getState() ?? Object.freeze({});
  }
  setState(mutation) {
    if (!this.stateStore) {
      this.stateStore = new ServiceStateStore({ ...mutation });
      return;
    }
    this.stateStore.setState(mutation);
  }
};
function assertRecord(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("[KrnlTS] Invalid service definition: '" + field + "' must be an object.");
  }
}
function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("[KrnlTS] Invalid service definition: '" + field + "' must be a non-empty string.");
  }
}
function validateServiceDefinition(definition) {
  if (!definition || typeof definition !== "object") {
    throw new Error("[KrnlTS] Invalid service definition: expected an object.");
  }
  assertNonEmptyString(definition.id, "id");
  assertNonEmptyString(definition.name, "name");
  assertNonEmptyString(definition.version, "version");
  if (!definition.operations || typeof definition.operations !== "object") {
    throw new Error("[Service:" + definition.name + "] Invalid operations: expected an object.");
  }
  for (const [key, operation] of Object.entries(definition.operations)) {
    if (!operation || typeof operation !== "object") {
      throw new Error("[Service:" + definition.name + "] Invalid operation '" + key + "'.");
    }
    assertNonEmptyString(operation.id, "operations." + key + ".id");
    assertNonEmptyString(operation.name, "operations." + key + ".name");
    if (operation.inputSchema !== void 0) assertRecord(operation.inputSchema, "operations." + key + ".inputSchema");
    if (operation.outputSchema !== void 0) assertRecord(operation.outputSchema, "operations." + key + ".outputSchema");
    if (typeof operation.handler !== "function") {
      throw new Error("[Service:" + definition.name + "] Operation '" + key + "' must define a handler.");
    }
  }
  for (const [key, schema] of Object.entries(definition.inputs ?? {})) assertRecord(schema, "inputs." + key);
  for (const [key, schema] of Object.entries(definition.outputs ?? {})) assertRecord(schema, "outputs." + key);
  if (definition.state?.schema !== void 0) assertRecord(definition.state.schema, "state.schema");
  for (const capability of definition.capabilities ?? []) {
    assertNonEmptyString(capability.id, "capability.id");
    assertNonEmptyString(capability.name, "capability.name");
    if (!Array.isArray(capability.protocols)) {
      throw new Error("[Service:" + definition.name + "] Capability '" + capability.name + "' protocols must be an array.");
    }
  }
  for (const dependency of definition.dependencies ?? []) {
    assertNonEmptyString(dependency.serviceId, "dependency.serviceId");
  }
  return definition;
}
function createServiceDefinition(definition) {
  return validateServiceDefinition(definition);
}
function createService(definition) {
  return new ServiceInstance(validateServiceDefinition(definition));
}
var asyncHooks = globalThis.process?.getBuiltinModule?.("node:async_hooks");

// node_modules/@ultrst-armada/kloks/packages/fod/dist/index.js
function portsFromSchema(schema, direction) {
  if (!schema || schema.type !== "object") {
    return [{ id: direction === "input" ? "input" : "result", name: direction === "input" ? "input" : "result", direction, dataType: String(schema?.type ?? "any") }];
  }
  const properties = schema.properties ?? {};
  const required = new Set(Array.isArray(schema.required) ? schema.required.map(String) : []);
  return Object.entries(properties).map(([id, value]) => ({
    id,
    name: id,
    direction,
    dataType: String(value?.type ?? "any"),
    required: required.has(id),
    description: typeof value?.description === "string" ? value.description : void 0,
    schema: value
  }));
}
function scanBackendFacade(facade) {
  const endpoints = [];
  const services2 = facade.services ?? {};
  for (const [serviceKey, service9] of Object.entries(services2)) {
    const definition = service9?.definition;
    if (!definition?.operations) continue;
    for (const [operationKey, operation] of Object.entries(definition.operations)) {
      if (typeof service9.execute !== "function") continue;
      endpoints.push({
        id: String(operation.id ?? `${service9.id ?? serviceKey}.${operationKey}`),
        serviceId: String(service9.id ?? serviceKey),
        serviceName: String(service9.name ?? serviceKey),
        operationId: String(operation.id ?? operationKey),
        operationName: String(operation.name ?? operationKey),
        description: typeof operation.description === "string" ? operation.description : void 0,
        runtime: typeof service9.runtime === "string" ? service9.runtime : void 0,
        deployment: typeof service9.deployment === "string" ? service9.deployment : void 0,
        inputSchema: operation.inputSchema,
        outputSchema: operation.outputSchema,
        invoke: (input) => service9.execute(operationKey, input)
      });
    }
  }
  return endpoints;
}
function endpointToNode(endpoint) {
  return {
    type: `host/${endpoint.id}`,
    label: endpoint.operationName,
    description: endpoint.description ?? endpoint.operationId,
    category: "host-app",
    group: endpoint.serviceName,
    inputs: portsFromSchema(endpoint.inputSchema, "input"),
    outputs: portsFromSchema(endpoint.outputSchema, "output"),
    metadata: {
      endpointId: endpoint.id,
      serviceId: endpoint.serviceId,
      operationId: endpoint.operationId,
      runtime: endpoint.runtime,
      deployment: endpoint.deployment
    }
  };
}
function scanBackendFacadeToNodes(facade) {
  const endpoints = scanBackendFacade(facade);
  return { endpoints, nodes: endpoints.map(endpointToNode) };
}
var ROOT = "FOD";
function pathFor(flowId) {
  const safe = flowId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${ROOT}/${safe}.json`;
}
var FodFlowStore = class {
  constructor(workspaceService) {
    this.workspaceService = workspaceService;
  }
  workspaceService;
  async list(workspaceId) {
    const entries = await this.workspaceService.listFiles(workspaceId, ROOT);
    const flows = [];
    for (const entry of entries) {
      if (entry.isFolder || !entry.name.endsWith(".json")) continue;
      try {
        const raw = await this.workspaceService.readFile(workspaceId, entry.path);
        flows.push(JSON.parse(typeof raw === "string" ? raw : Buffer.from(raw).toString("utf8")));
      } catch {
      }
    }
    return flows.sort((a2, b2) => a2.name.localeCompare(b2.name));
  }
  async get(workspaceId, flowId) {
    try {
      const raw = await this.workspaceService.readFile(workspaceId, pathFor(flowId));
      return JSON.parse(typeof raw === "string" ? raw : Buffer.from(raw).toString("utf8"));
    } catch {
      return null;
    }
  }
  async save(workspaceId, flow) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const next = { ...flow, updatedAt: now, version: Math.max(1, flow.version ?? 1) };
    await this.workspaceService.writeFile(workspaceId, pathFor(flow.id), JSON.stringify(next, null, 2));
    return next;
  }
  async delete(workspaceId, flowId) {
    const result = await this.workspaceService.deleteFile(workspaceId, pathFor(flowId));
    return Boolean(result?.success);
  }
};
async function executeFodFlow(flow, endpoints, onEvent, initialInput) {
  const events = [];
  const errors = [];
  const emit = (event) => {
    events.push(event);
    onEvent?.(event);
  };
  emit({ type: "flow-started", timestamp: Date.now(), flowId: flow.id });
  const outputs = {};
  const incoming = (nodeId) => flow.edges.filter((edge) => edge.target === nodeId);
  const remaining = new Set(flow.nodes.map((node) => node.id));
  const values = /* @__PURE__ */ new Map();
  while (remaining.size) {
    const ready = flow.nodes.filter((node) => remaining.has(node.id) && incoming(node.id).every((edge) => values.has(`${edge.source}:${edge.sourceHandle ?? "result"}`)));
    if (!ready.length) {
      const unresolved = [...remaining].join(", ");
      const message = `Flow contains an unresolved dependency or cycle: ${unresolved}`;
      errors.push({ message });
      break;
    }
    for (const node of ready) {
      remaining.delete(node.id);
      emit({ type: "node-started", timestamp: Date.now(), flowId: flow.id, nodeId: node.id });
      try {
        const endpointId = String(node.data?.endpointId ?? node.data?.apiId ?? node.type.replace(/^(host|gutts)\//, ""));
        const endpoint = endpoints.get(endpointId);
        if (!endpoint) throw new Error(`No executable endpoint registered for node '${node.type}'.`);
        const input = {};
        if (incoming(node.id).length === 0 && initialInput !== void 0) {
          if (typeof initialInput === "object" && initialInput !== null) {
            Object.assign(input, initialInput);
          } else {
            input.input = initialInput;
          }
        }
        for (const edge of incoming(node.id)) {
          input[String(edge.targetHandle ?? "input")] = values.get(`${edge.source}:${edge.sourceHandle ?? "result"}`);
        }
        const configured = node.data?.inputs ?? {};
        Object.assign(input, configured);
        const result = await endpoint.invoke(input);
        outputs[node.id] = result;
        values.set(`${node.id}:result`, result);
        if (result && typeof result === "object") {
          for (const [key, value] of Object.entries(result)) values.set(`${node.id}:${key}`, value);
        }
        emit({ type: "node-completed", timestamp: Date.now(), flowId: flow.id, nodeId: node.id, data: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ nodeId: node.id, message });
        emit({ type: "node-failed", timestamp: Date.now(), flowId: flow.id, nodeId: node.id, data: message });
        break;
      }
    }
    if (errors.length) break;
  }
  const success = errors.length === 0 && remaining.size === 0;
  const last3 = flow.nodes.at(-1);
  emit({ type: "flow-completed", timestamp: Date.now(), flowId: flow.id, data: { success } });
  return { success, flowId: flow.id, output: last3 ? outputs[last3.id] : void 0, outputs, errors, events };
}
var FodRuntime = class {
  constructor(options) {
    this.options = options;
    this.flowStore = new FodFlowStore(options.workspaceService);
  }
  options;
  flowStore;
  endpoints = /* @__PURE__ */ new Map();
  nodes = [];
  setEndpoints(endpoints, nodes = []) {
    this.endpoints = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint]));
    this.nodes = nodes;
  }
  getNodeDefinitions() {
    return [...this.nodes];
  }
  getEndpoints() {
    return [...this.endpoints.values()];
  }
  async listFlows() {
    return this.flowStore.list(this.options.workspaceId);
  }
  async getFlow(flowId) {
    return this.flowStore.get(this.options.workspaceId, flowId);
  }
  async saveFlow(flow) {
    return this.flowStore.save(this.options.workspaceId, flow);
  }
  async deleteFlow(flowId) {
    return this.flowStore.delete(this.options.workspaceId, flowId);
  }
  async executeFlow(flowId, input) {
    const flow = await this.getFlow(flowId);
    if (!flow) throw new Error(`FOD flow '${flowId}' not found.`);
    return executeFodFlow(flow, this.endpoints, this.options.onEvent, input);
  }
};
function createFodServiceFacade(runtime9) {
  const definition = {
    id: "kloks.fod",
    name: "FodService",
    version: "1.0.0",
    operations: {
      listFlows: { id: "FodService.listFlows", name: "listFlows", inputSchema: { type: "object", properties: {} }, outputSchema: { type: "array" }, handler: async () => runtime9.listFlows() },
      getFlow: { id: "FodService.getFlow", name: "getFlow", inputSchema: { type: "object", properties: { flowId: { type: "string" } }, required: ["flowId"] }, outputSchema: { type: "object" }, handler: async (input) => runtime9.getFlow(String(input.flowId)) },
      saveFlow: { id: "FodService.saveFlow", name: "saveFlow", inputSchema: { type: "object" }, outputSchema: { type: "object" }, handler: async (input) => runtime9.saveFlow(input.flow) },
      deleteFlow: { id: "FodService.deleteFlow", name: "deleteFlow", inputSchema: { type: "object", properties: { flowId: { type: "string" } }, required: ["flowId"] }, outputSchema: { type: "object" }, handler: async (input) => ({ success: await runtime9.deleteFlow(String(input.flowId)) }) },
      executeFlow: { id: "FodService.executeFlow", name: "executeFlow", inputSchema: { type: "object", properties: { flowId: { type: "string" }, input: { type: "object" } }, required: ["flowId"] }, outputSchema: { type: "object" }, handler: async (input) => runtime9.executeFlow(String(input.flowId), input.input) }
    }
  };
  const service9 = createService(definition);
  return { id: definition.id, name: definition.name, version: definition.version, runtime: "server", deployment: "local", definition, createInstance: () => createService(definition), execute: async (op, input) => {
    await service9.start();
    return service9.call(op, input);
  } };
}
function createFodServiceFacadeForWorkspace(buildRuntime) {
  const definition = {
    id: "kloks.fod",
    name: "FodService",
    version: "1.0.0",
    operations: {
      listFlows: { id: "FodService.listFlows", name: "listFlows", inputSchema: { type: "object", properties: { workspaceId: { type: "string" } }, required: ["workspaceId"] }, outputSchema: { type: "array" }, handler: async (input) => buildRuntime(String(input.workspaceId)).listFlows() },
      getFlow: { id: "FodService.getFlow", name: "getFlow", inputSchema: { type: "object", properties: { workspaceId: { type: "string" }, flowId: { type: "string" } }, required: ["workspaceId", "flowId"] }, outputSchema: { type: "object" }, handler: async (input) => buildRuntime(String(input.workspaceId)).getFlow(String(input.flowId)) },
      saveFlow: { id: "FodService.saveFlow", name: "saveFlow", inputSchema: { type: "object", properties: { workspaceId: { type: "string" }, flow: { type: "object" } }, required: ["workspaceId", "flow"] }, outputSchema: { type: "object" }, handler: async (input) => buildRuntime(String(input.workspaceId)).saveFlow(input.flow) },
      deleteFlow: { id: "FodService.deleteFlow", name: "deleteFlow", inputSchema: { type: "object", properties: { workspaceId: { type: "string" }, flowId: { type: "string" } }, required: ["workspaceId", "flowId"] }, outputSchema: { type: "object" }, handler: async (input) => ({ success: await buildRuntime(String(input.workspaceId)).deleteFlow(String(input.flowId)) }) },
      executeFlow: { id: "FodService.executeFlow", name: "executeFlow", inputSchema: { type: "object", properties: { workspaceId: { type: "string" }, flowId: { type: "string" }, input: { type: "object" } }, required: ["workspaceId", "flowId"] }, outputSchema: { type: "object" }, handler: async (input) => buildRuntime(String(input.workspaceId)).executeFlow(String(input.flowId), input.input) }
    }
  };
  const service9 = createService(definition);
  return { id: definition.id, name: definition.name, version: definition.version, runtime: "server", deployment: "local", definition, createInstance: () => createService(definition), execute: async (op, input) => {
    await service9.start();
    return service9.call(op, input);
  } };
}
var FodServiceFacade = createFodServiceFacade(new FodRuntime({ workspaceId: "default", workspaceService: null }));

// src/backend/SrklBackend.ts
import { workingWorkspaceService, remoteWorkspaceService } from "@ultrst-armada/kloks/backend/node";

// node_modules/@dinilmusick/gutts/dist/api/define-api.js
function defineApi(definition) {
  const properties = Object.fromEntries(definition.parameters.map((parameter) => [
    parameter.name,
    {
      ...parameter.schema,
      description: parameter.description
    }
  ]));
  return Object.freeze({
    ...definition,
    inputSchema: {
      type: "object",
      description: `Arguments for ${definition.name}.`,
      properties,
      required: definition.parameters.filter((parameter) => parameter.required).map((parameter) => parameter.name),
      additionalProperties: false
    }
  });
}

// node_modules/@dinilmusick/gutts/dist/api/array-apis.js
var array = { type: "array" };
var integer = { type: "integer" };
var arrayApis = [
  defineApi({ id: "gutts.arrays.compact", name: "compact", category: "arrays", description: "Removes null and undefined values from an array while preserving the remaining values and their order.", parameters: [{ name: "values", description: "The array whose nullish elements should be removed.", required: true, schema: array }], output: { type: "array", description: "The array without null or undefined elements." }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.arrays.unique", name: "unique", category: "arrays", description: "Removes duplicate values from an array while preserving the first occurrence of each value.", parameters: [{ name: "values", description: "The array from which duplicate values should be removed.", required: true, schema: array }], output: { type: "array", description: "The array containing only the first occurrence of each value." }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.arrays.chunk", name: "chunk", category: "arrays", description: "Splits an array into consecutive subarrays of the requested maximum size.", parameters: [{ name: "values", description: "The array to split into chunks.", required: true, schema: array }, { name: "size", description: "The positive integer maximum number of elements in each chunk.", required: true, schema: integer }], output: { type: "array", items: array, description: "An array of consecutive subarrays." }, semantics: { deterministic: true, pure: true, sideEffects: false }, errors: ["Throws RangeError when size is not a positive integer."] }),
  defineApi({ id: "gutts.arrays.flatten", name: "flatten", category: "arrays", description: "Flattens one level of nested arrays into a single array.", parameters: [{ name: "values", description: "The array containing values or one-level nested arrays.", required: true, schema: array }], output: { type: "array", description: "The flattened array." }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.arrays.last", name: "last", category: "arrays", description: "Returns the final element of an array, or undefined when the array is empty.", parameters: [{ name: "values", description: "The array whose final element should be returned.", required: true, schema: array }], output: { description: "The final array element, or undefined for an empty array." }, semantics: { deterministic: true, pure: true, sideEffects: false } })
];

// node_modules/@dinilmusick/gutts/dist/api/json-apis.js
var json = { type: "object", description: "A JSON-compatible value." };
var jsonApis = [
  defineApi({ id: "gutts.json.isJsonValue", name: "isJsonValue", category: "json", description: "Checks whether an unknown value can be represented as a finite JSON value.", parameters: [{ name: "value", description: "The value to validate as JSON-compatible data.", required: true, schema: {} }], output: { type: "boolean", description: "True when the value is a valid JSON value." }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.json.parseJson", name: "parseJson", category: "json", description: "Parses a JSON text string into a JSON-compatible value.", parameters: [{ name: "text", description: "The JSON document to parse.", required: true, schema: { type: "string" } }], output: json, semantics: { deterministic: true, pure: true, sideEffects: false }, errors: ["Throws SyntaxError when text is not valid JSON."] }),
  defineApi({ id: "gutts.json.tryParseJson", name: "tryParseJson", category: "json", description: "Attempts to parse JSON text and returns undefined instead of throwing when parsing fails.", parameters: [{ name: "text", description: "The JSON document to parse.", required: true, schema: { type: "string" } }], output: { description: "The parsed JSON value, or undefined when parsing fails." }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.json.stringifyJson", name: "stringifyJson", category: "json", description: "Serializes a JSON-compatible value into JSON text, optionally using indentation.", parameters: [{ name: "value", description: "The JSON-compatible value to serialize.", required: true, schema: {} }, { name: "space", description: "Optional number of indentation spaces to use in the serialized output.", required: false, schema: { type: "number" } }], output: { type: "string", description: "The serialized JSON text." }, semantics: { deterministic: true, pure: true, sideEffects: false }, errors: ["Throws TypeError when the value cannot be serialized as JSON."] })
];

// node_modules/@dinilmusick/gutts/dist/api/number-apis.js
var numberApis = [
  defineApi({ id: "gutts.numbers.clamp", name: "clamp", category: "numbers", description: "Restricts a numeric value to an inclusive minimum and maximum range.", parameters: [{ name: "value", description: "The numeric value to constrain.", required: true, schema: { type: "number" } }, { name: "min", description: "The inclusive lower bound.", required: true, schema: { type: "number" } }, { name: "max", description: "The inclusive upper bound.", required: true, schema: { type: "number" } }], output: { type: "number", description: "The value constrained to the inclusive range." }, semantics: { deterministic: true, pure: true, sideEffects: false }, errors: ["Throws RangeError when min exceeds max."] }),
  defineApi({ id: "gutts.numbers.inRange", name: "inRange", category: "numbers", description: "Checks whether a numeric value falls within the configured range.", parameters: [{ name: "value", description: "The numeric value to test.", required: true, schema: { type: "number" } }, { name: "min", description: "The lower range boundary.", required: true, schema: { type: "number" } }, { name: "max", description: "The upper range boundary.", required: true, schema: { type: "number" } }], output: { type: "boolean", description: "Whether the value is inside the range." }, semantics: { deterministic: true, pure: true, sideEffects: false }, errors: ["Throws RangeError when min exceeds max."] }),
  defineApi({ id: "gutts.numbers.roundTo", name: "roundTo", category: "numbers", description: "Rounds a number to a specified non-negative number of decimal places.", parameters: [{ name: "value", description: "The number to round.", required: true, schema: { type: "number" } }, { name: "decimals", description: "The non-negative integer number of decimal places.", required: false, schema: { type: "integer" } }], output: { type: "number", description: "The rounded number." }, semantics: { deterministic: true, pure: true, sideEffects: false }, errors: ["Throws RangeError when decimals is negative or not an integer."] }),
  defineApi({ id: "gutts.numbers.isFiniteNumber", name: "isFiniteNumber", category: "numbers", description: "Checks whether a value is a JavaScript number and is finite.", parameters: [{ name: "value", description: "The value to test.", required: true, schema: {} }], output: { type: "boolean", description: "True only for finite JavaScript numbers." }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.numbers.sum", name: "sum", category: "numbers", description: "Adds all numbers in an array and returns their total.", parameters: [{ name: "values", description: "The numeric values to add.", required: true, schema: { type: "array", items: { type: "number" } } }], output: { type: "number", description: "The sum of all input numbers." }, semantics: { deterministic: true, pure: true, sideEffects: false } })
];

// node_modules/@dinilmusick/gutts/dist/api/object-apis.js
var objectApis = [
  defineApi({ id: "gutts.objects.hasOwn", name: "hasOwn", category: "objects", description: "Checks whether an object contains a requested property.", parameters: [{ name: "value", description: "The object to inspect.", required: true, schema: { type: "object" } }, { name: "key", description: "The property key to look for.", required: true, schema: { type: "string" } }], output: { type: "boolean" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.objects.pick", name: "pick", category: "objects", description: "Creates an object containing only requested properties.", parameters: [{ name: "value", description: "The source object.", required: true, schema: { type: "object" } }, { name: "keys", description: "The property keys to retain.", required: true, schema: { type: "array", items: { type: "string" } } }], output: { type: "object" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.objects.omit", name: "omit", category: "objects", description: "Creates an object without requested properties.", parameters: [{ name: "value", description: "The source object.", required: true, schema: { type: "object" } }, { name: "keys", description: "The property keys to remove.", required: true, schema: { type: "array", items: { type: "string" } } }], output: { type: "object" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.objects.isPlainObject", name: "isPlainObject", category: "objects", description: "Checks whether a value is a plain JavaScript object.", parameters: [{ name: "value", description: "The value to classify.", required: true, schema: {} }], output: { type: "boolean" }, semantics: { deterministic: true, pure: true, sideEffects: false } })
];

// node_modules/@dinilmusick/gutts/dist/api/string-apis.js
var string = { type: "string" };
var stringApis = [
  defineApi({ id: "gutts.strings.isBlank", name: "isBlank", category: "strings", description: "Checks whether a string contains no non-whitespace characters.", parameters: [{ name: "value", description: "The string to inspect.", required: true, schema: string }], output: { type: "boolean" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.strings.isNonBlank", name: "isNonBlank", category: "strings", description: "Checks whether a string contains at least one non-whitespace character.", parameters: [{ name: "value", description: "The string to inspect.", required: true, schema: string }], output: { type: "boolean" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.strings.isEmail", name: "isEmail", category: "strings", description: "Checks whether a string conforms to the email-address validation rules used by GutTS.", parameters: [{ name: "value", description: "The string to validate as an email address.", required: true, schema: string }], output: { type: "boolean" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.strings.startsWithAny", name: "startsWithAny", category: "strings", description: "Checks whether a string starts with at least one supplied prefix.", parameters: [{ name: "value", description: "The string to inspect.", required: true, schema: string }, { name: "prefixes", description: "The prefixes to test.", required: true, schema: { type: "array", items: string } }], output: { type: "boolean" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.strings.endsWithAny", name: "endsWithAny", category: "strings", description: "Checks whether a string ends with at least one supplied suffix.", parameters: [{ name: "value", description: "The string to inspect.", required: true, schema: string }, { name: "suffixes", description: "The suffixes to test.", required: true, schema: { type: "array", items: string } }], output: { type: "boolean" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.strings.capitalize", name: "capitalize", category: "strings", description: "Capitalizes a string using the library's existing capitalization behavior.", parameters: [{ name: "value", description: "The string to capitalize.", required: true, schema: string }], output: { type: "string" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.strings.camelCase", name: "camelCase", category: "strings", description: "Converts a string into lower camel case.", parameters: [{ name: "value", description: "The string to convert.", required: true, schema: string }], output: { type: "string" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.strings.kebabCase", name: "kebabCase", category: "strings", description: "Converts a string into lower kebab case.", parameters: [{ name: "value", description: "The string to convert.", required: true, schema: string }], output: { type: "string" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.strings.snakeCase", name: "snakeCase", category: "strings", description: "Converts a string into lower snake case.", parameters: [{ name: "value", description: "The string to convert.", required: true, schema: string }], output: { type: "string" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.strings.truncate", name: "truncate", category: "strings", description: "Shortens a string to a maximum length and appends a suffix when truncation is required.", parameters: [{ name: "value", description: "The string to shorten.", required: true, schema: string }, { name: "maxLength", description: "The non-negative maximum output length.", required: true, schema: { type: "number" } }, { name: "suffix", description: "The suffix used when truncation occurs.", required: false, schema: string }], output: { type: "string" }, semantics: { deterministic: true, pure: true, sideEffects: false }, errors: ["Throws RangeError when maxLength is negative."] }),
  defineApi({ id: "gutts.strings.truncateWords", name: "truncateWords", category: "strings", description: "Shortens a string to a maximum number of words and appends a suffix when truncation is required.", parameters: [{ name: "value", description: "The string to shorten.", required: true, schema: string }, { name: "maxWords", description: "The non-negative maximum number of words.", required: true, schema: { type: "number" } }, { name: "suffix", description: "The suffix used when truncation occurs.", required: false, schema: string }], output: { type: "string" }, semantics: { deterministic: true, pure: true, sideEffects: false }, errors: ["Throws RangeError when maxWords is negative."] })
];

// node_modules/@dinilmusick/gutts/dist/api/url-apis.js
var string2 = { type: "string" };
var urlApis = [
  defineApi({ id: "gutts.urls.isUrl", name: "isUrl", category: "urls", description: "Checks whether a string can be parsed as a URL by the standard URL constructor.", parameters: [{ name: "value", description: "The string to validate.", required: true, schema: string2 }], output: { type: "boolean" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.urls.joinUrl", name: "joinUrl", category: "urls", description: "Joins a base URL-like string and path segments using single separators.", parameters: [{ name: "base", description: "The base URL or path.", required: true, schema: string2 }, { name: "parts", description: "The path segments to append.", required: true, schema: { type: "array", items: string2 } }], output: { type: "string" }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.urls.getQueryParam", name: "getQueryParam", category: "urls", description: "Reads one query-string parameter from a URL.", parameters: [{ name: "url", description: "The URL to inspect.", required: true, schema: string2 }, { name: "key", description: "The query parameter name.", required: true, schema: string2 }], output: { type: "string", description: "The value, or null when absent." }, semantics: { deterministic: true, pure: true, sideEffects: false } }),
  defineApi({ id: "gutts.urls.setQueryParam", name: "setQueryParam", category: "urls", description: "Returns a URL with one query-string parameter set to the supplied value.", parameters: [{ name: "url", description: "The URL to modify.", required: true, schema: string2 }, { name: "key", description: "The query parameter name.", required: true, schema: string2 }, { name: "value", description: "The query parameter value.", required: true, schema: string2 }], output: { type: "string" }, semantics: { deterministic: true, pure: true, sideEffects: false }, errors: ["Throws when url cannot be parsed as a URL."] })
];

// node_modules/@dinilmusick/gutts/dist/models/needle3/definition.js
var needle3CompleteApi = defineApi({
  id: "model.cactus-needle3.complete",
  name: "Needle3.complete",
  category: "models",
  description: "Select tools or extract structured data from natural-language input.",
  parameters: [
    { name: "prompt", description: "Natural-language input.", required: true, schema: { type: "string" } },
    { name: "tools", description: "Optional tool definitions.", required: false, schema: { type: "array" } },
    { name: "schema", description: "Optional extraction schema.", required: false, schema: { type: "object" } }
  ],
  output: { type: "object", description: "Structured model result." },
  semantics: { deterministic: false, pure: false, sideEffects: false }
});

// node_modules/@dinilmusick/gutts/dist/models/smollm2/definition.js
var smolLM2GenerateApi = defineApi({
  id: "model.smollm2-135m-instruct.generate",
  name: "SmolLM2-135M-Instruct.generate",
  category: "models",
  description: "Generate natural-language text with SmolLM2-135M-Instruct.",
  parameters: [
    { name: "prompt", description: "Prompt supplied to the model.", required: true, schema: { type: "string" } },
    { name: "maxNewTokens", description: "Maximum number of new tokens.", required: false, schema: { type: "number" } }
  ],
  output: { type: "string", description: "Generated natural-language text." },
  semantics: { deterministic: false, pure: false, sideEffects: false },
  errors: ["Model load failure", "Inference failure"]
});

// node_modules/@dinilmusick/gutts/dist/models/whistle/definition.js
var whistleTranscribeApi = defineApi({
  id: "model.cactus-whistle.transcribe",
  name: "Whistle.transcribe",
  category: "models",
  description: "Transcribe speech audio into natural-language text.",
  parameters: [
    { name: "audio", description: "Audio bytes supplied to the speech model.", required: true, schema: { type: "string" } },
    { name: "language", description: "Optional language identifier.", required: false, schema: { type: "string" } }
  ],
  output: { type: "string", description: "Transcribed text." },
  semantics: { deterministic: true, pure: false, sideEffects: false }
});

// node_modules/@dinilmusick/gutts/dist/models/ettin/definition.js
var defineEttin = (id, name, parameters, description) => ({
  id,
  name,
  provider: "Hugging Face",
  version: String(parameters),
  description,
  examples: ["rank search results", "order retrieved documents by relevance"],
  whenToUse: "Use for cross-encoder reranking when candidate texts must be sorted by semantic relevance.",
  avoidWhen: "Avoid for text generation, embeddings, or transcription.",
  size: { value: parameters * 1e6, unit: "parameters", qualifier: "parameters" },
  capabilities: ["reranking", "relevance-scoring"],
  input: "Query and candidate texts",
  output: "Candidate relevance scores",
  runtime: "ModelRuntime adapter",
  modelUri: `cross-encoder/ettin-reranker-${parameters}m-v1`,
  license: "Apache-2.0"
});
var ettinReranker17MMetadata = defineEttin("model.ettin-reranker-17m", "Ettin-Reranker-17M", 17, "Very small relevance model for ranking candidate text.");
var ettinReranker32MMetadata = defineEttin("model.ettin-reranker-32m", "Ettin-Reranker-32M", 32, "Small relevance model for ranking candidate text.");
var ettinReranker68MMetadata = defineEttin("model.ettin-reranker-68m", "Ettin-Reranker-68M", 68, "Compact relevance model for higher-quality candidate ranking.");
var ettinReranker150MMetadata = defineEttin("model.ettin-reranker-150m", "Ettin-Reranker-150M", 150, "Larger compact relevance model for candidate ranking.");
var ettinRerankApi = defineApi({
  id: "model.ettin-reranker.rerank",
  name: "EttinReranker.rerank",
  category: "models",
  description: "Rank candidate texts by relevance to a query.",
  parameters: [
    { name: "query", description: "Query text.", required: true, schema: { type: "string" } },
    { name: "candidates", description: "Candidate texts to rank.", required: true, schema: { type: "array", items: { type: "string" } } }
  ],
  output: { type: "array", description: "Relevance scores in candidate order.", items: { type: "number" } },
  semantics: { deterministic: true, pure: false, sideEffects: false }
});

// node_modules/@dinilmusick/gutts/dist/models/minilm/definition.js
var miniLMSimilarityApi = defineApi({
  id: "model.minilm-l6-v2.similarity",
  name: "MiniLM-L6-v2.similarity",
  category: "models",
  description: "Compute semantic similarity between two texts.",
  parameters: [
    { name: "left", description: "First text.", required: true, schema: { type: "string" } },
    { name: "right", description: "Second text.", required: true, schema: { type: "string" } }
  ],
  output: { type: "number", description: "Semantic similarity score." },
  semantics: { deterministic: true, pure: false, sideEffects: false }
});

// node_modules/@dinilmusick/gutts/dist/api/api-registry.js
var guttsApiDefinitions = Object.freeze([
  ...arrayApis,
  ...jsonApis,
  ...numberApis,
  ...objectApis,
  ...stringApis,
  ...urlApis,
  smolLM2GenerateApi,
  needle3CompleteApi,
  whistleTranscribeApi,
  ettinRerankApi,
  miniLMSimilarityApi
]);
var guttsApiById = Object.freeze(Object.fromEntries(guttsApiDefinitions.map((api) => [api.id, api])));

// node_modules/@dinilmusick/gutts/dist/api/fod-node-provider.js
var schemaType = (schema) => String(schema?.type ?? "any");
function guttsApiToFodNode(api) {
  return {
    type: `gutts/${api.id}`,
    label: api.name,
    description: api.description,
    category: "gutts",
    group: api.category,
    inputs: api.parameters.map((parameter) => ({ id: parameter.name, name: parameter.name, direction: "input", dataType: schemaType(parameter.schema), required: parameter.required, description: parameter.description, schema: parameter.schema })),
    outputs: [{ id: "result", name: "result", direction: "output", dataType: schemaType(api.output), ...api.output.description ? { description: api.output.description } : {}, schema: api.output }],
    metadata: { apiId: api.id, package: "@dinilmusick/gutts", semantics: api.semantics }
  };
}
var guttsFodNodeDefinitions = Object.freeze(guttsApiDefinitions.map(guttsApiToFodNode));

// node_modules/lodash-es/_freeGlobal.js
var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
var freeGlobal_default = freeGlobal;

// node_modules/lodash-es/_root.js
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal_default || freeSelf || Function("return this")();
var root_default = root;

// node_modules/lodash-es/_Symbol.js
var Symbol2 = root_default.Symbol;
var Symbol_default = Symbol2;

// node_modules/lodash-es/_getRawTag.js
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var nativeObjectToString = objectProto.toString;
var symToStringTag = Symbol_default ? Symbol_default.toStringTag : void 0;
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  try {
    value[symToStringTag] = void 0;
    var unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
var getRawTag_default = getRawTag;

// node_modules/lodash-es/_objectToString.js
var objectProto2 = Object.prototype;
var nativeObjectToString2 = objectProto2.toString;
function objectToString(value) {
  return nativeObjectToString2.call(value);
}
var objectToString_default = objectToString;

// node_modules/lodash-es/_baseGetTag.js
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var symToStringTag2 = Symbol_default ? Symbol_default.toStringTag : void 0;
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag2 && symToStringTag2 in Object(value) ? getRawTag_default(value) : objectToString_default(value);
}
var baseGetTag_default = baseGetTag;

// node_modules/lodash-es/isObjectLike.js
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var isObjectLike_default = isObjectLike;

// node_modules/lodash-es/isSymbol.js
var symbolTag = "[object Symbol]";
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike_default(value) && baseGetTag_default(value) == symbolTag;
}
var isSymbol_default = isSymbol;

// node_modules/lodash-es/_arrayMap.js
function arrayMap(array2, iteratee) {
  var index = -1, length = array2 == null ? 0 : array2.length, result = Array(length);
  while (++index < length) {
    result[index] = iteratee(array2[index], index, array2);
  }
  return result;
}
var arrayMap_default = arrayMap;

// node_modules/lodash-es/isArray.js
var isArray = Array.isArray;
var isArray_default = isArray;

// node_modules/lodash-es/_baseToString.js
var INFINITY = 1 / 0;
var symbolProto = Symbol_default ? Symbol_default.prototype : void 0;
var symbolToString = symbolProto ? symbolProto.toString : void 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isArray_default(value)) {
    return arrayMap_default(value, baseToString) + "";
  }
  if (isSymbol_default(value)) {
    return symbolToString ? symbolToString.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY ? "-0" : result;
}
var baseToString_default = baseToString;

// node_modules/lodash-es/_trimmedEndIndex.js
var reWhitespace = /\s/;
function trimmedEndIndex(string3) {
  var index = string3.length;
  while (index-- && reWhitespace.test(string3.charAt(index))) {
  }
  return index;
}
var trimmedEndIndex_default = trimmedEndIndex;

// node_modules/lodash-es/_baseTrim.js
var reTrimStart = /^\s+/;
function baseTrim(string3) {
  return string3 ? string3.slice(0, trimmedEndIndex_default(string3) + 1).replace(reTrimStart, "") : string3;
}
var baseTrim_default = baseTrim;

// node_modules/lodash-es/isObject.js
function isObject(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
var isObject_default = isObject;

// node_modules/lodash-es/toNumber.js
var NAN = 0 / 0;
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
var reIsBinary = /^0b[01]+$/i;
var reIsOctal = /^0o[0-7]+$/i;
var freeParseInt = parseInt;
function toNumber(value) {
  if (typeof value == "number") {
    return value;
  }
  if (isSymbol_default(value)) {
    return NAN;
  }
  if (isObject_default(value)) {
    var other = typeof value.valueOf == "function" ? value.valueOf() : value;
    value = isObject_default(other) ? other + "" : other;
  }
  if (typeof value != "string") {
    return value === 0 ? value : +value;
  }
  value = baseTrim_default(value);
  var isBinary = reIsBinary.test(value);
  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
var toNumber_default = toNumber;

// node_modules/lodash-es/toFinite.js
var INFINITY2 = 1 / 0;
var MAX_INTEGER = 17976931348623157e292;
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber_default(value);
  if (value === INFINITY2 || value === -INFINITY2) {
    var sign = value < 0 ? -1 : 1;
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}
var toFinite_default = toFinite;

// node_modules/lodash-es/toInteger.js
function toInteger(value) {
  var result = toFinite_default(value), remainder = result % 1;
  return result === result ? remainder ? result - remainder : result : 0;
}
var toInteger_default = toInteger;

// node_modules/lodash-es/identity.js
function identity(value) {
  return value;
}
var identity_default = identity;

// node_modules/lodash-es/isFunction.js
var asyncTag = "[object AsyncFunction]";
var funcTag = "[object Function]";
var genTag = "[object GeneratorFunction]";
var proxyTag = "[object Proxy]";
function isFunction(value) {
  if (!isObject_default(value)) {
    return false;
  }
  var tag = baseGetTag_default(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}
var isFunction_default = isFunction;

// node_modules/lodash-es/_coreJsData.js
var coreJsData = root_default["__core-js_shared__"];
var coreJsData_default = coreJsData;

// node_modules/lodash-es/_isMasked.js
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData_default && coreJsData_default.keys && coreJsData_default.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
})();
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}
var isMasked_default = isMasked;

// node_modules/lodash-es/_toSource.js
var funcProto = Function.prototype;
var funcToString = funcProto.toString;
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var toSource_default = toSource;

// node_modules/lodash-es/_baseIsNative.js
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor = /^\[object .+?Constructor\]$/;
var funcProto2 = Function.prototype;
var objectProto3 = Object.prototype;
var funcToString2 = funcProto2.toString;
var hasOwnProperty2 = objectProto3.hasOwnProperty;
var reIsNative = RegExp(
  "^" + funcToString2.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function baseIsNative(value) {
  if (!isObject_default(value) || isMasked_default(value)) {
    return false;
  }
  var pattern = isFunction_default(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource_default(value));
}
var baseIsNative_default = baseIsNative;

// node_modules/lodash-es/_getValue.js
function getValue(object, key) {
  return object == null ? void 0 : object[key];
}
var getValue_default = getValue;

// node_modules/lodash-es/_getNative.js
function getNative(object, key) {
  var value = getValue_default(object, key);
  return baseIsNative_default(value) ? value : void 0;
}
var getNative_default = getNative;

// node_modules/lodash-es/_WeakMap.js
var WeakMap2 = getNative_default(root_default, "WeakMap");
var WeakMap_default = WeakMap2;

// node_modules/lodash-es/_baseCreate.js
var objectCreate = Object.create;
var baseCreate = /* @__PURE__ */ (function() {
  function object() {
  }
  return function(proto) {
    if (!isObject_default(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object();
    object.prototype = void 0;
    return result;
  };
})();
var baseCreate_default = baseCreate;

// node_modules/lodash-es/_apply.js
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
var apply_default = apply;

// node_modules/lodash-es/noop.js
function noop() {
}
var noop_default = noop;

// node_modules/lodash-es/_copyArray.js
function copyArray(source, array2) {
  var index = -1, length = source.length;
  array2 || (array2 = Array(length));
  while (++index < length) {
    array2[index] = source[index];
  }
  return array2;
}
var copyArray_default = copyArray;

// node_modules/lodash-es/_shortOut.js
var HOT_COUNT = 800;
var HOT_SPAN = 16;
var nativeNow = Date.now;
function shortOut(func) {
  var count = 0, lastCalled = 0;
  return function() {
    var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(void 0, arguments);
  };
}
var shortOut_default = shortOut;

// node_modules/lodash-es/constant.js
function constant(value) {
  return function() {
    return value;
  };
}
var constant_default = constant;

// node_modules/lodash-es/_defineProperty.js
var defineProperty = (function() {
  try {
    var func = getNative_default(Object, "defineProperty");
    func({}, "", {});
    return func;
  } catch (e) {
  }
})();
var defineProperty_default = defineProperty;

// node_modules/lodash-es/_baseSetToString.js
var baseSetToString = !defineProperty_default ? identity_default : function(func, string3) {
  return defineProperty_default(func, "toString", {
    "configurable": true,
    "enumerable": false,
    "value": constant_default(string3),
    "writable": true
  });
};
var baseSetToString_default = baseSetToString;

// node_modules/lodash-es/_setToString.js
var setToString = shortOut_default(baseSetToString_default);
var setToString_default = setToString;

// node_modules/lodash-es/_arrayEach.js
function arrayEach(array2, iteratee) {
  var index = -1, length = array2 == null ? 0 : array2.length;
  while (++index < length) {
    if (iteratee(array2[index], index, array2) === false) {
      break;
    }
  }
  return array2;
}
var arrayEach_default = arrayEach;

// node_modules/lodash-es/_baseFindIndex.js
function baseFindIndex(array2, predicate, fromIndex, fromRight) {
  var length = array2.length, index = fromIndex + (fromRight ? 1 : -1);
  while (fromRight ? index-- : ++index < length) {
    if (predicate(array2[index], index, array2)) {
      return index;
    }
  }
  return -1;
}
var baseFindIndex_default = baseFindIndex;

// node_modules/lodash-es/_baseIsNaN.js
function baseIsNaN(value) {
  return value !== value;
}
var baseIsNaN_default = baseIsNaN;

// node_modules/lodash-es/_strictIndexOf.js
function strictIndexOf(array2, value, fromIndex) {
  var index = fromIndex - 1, length = array2.length;
  while (++index < length) {
    if (array2[index] === value) {
      return index;
    }
  }
  return -1;
}
var strictIndexOf_default = strictIndexOf;

// node_modules/lodash-es/_baseIndexOf.js
function baseIndexOf(array2, value, fromIndex) {
  return value === value ? strictIndexOf_default(array2, value, fromIndex) : baseFindIndex_default(array2, baseIsNaN_default, fromIndex);
}
var baseIndexOf_default = baseIndexOf;

// node_modules/lodash-es/_arrayIncludes.js
function arrayIncludes(array2, value) {
  var length = array2 == null ? 0 : array2.length;
  return !!length && baseIndexOf_default(array2, value, 0) > -1;
}
var arrayIncludes_default = arrayIncludes;

// node_modules/lodash-es/_isIndex.js
var MAX_SAFE_INTEGER = 9007199254740991;
var reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
}
var isIndex_default = isIndex;

// node_modules/lodash-es/_baseAssignValue.js
function baseAssignValue(object, key, value) {
  if (key == "__proto__" && defineProperty_default) {
    defineProperty_default(object, key, {
      "configurable": true,
      "enumerable": true,
      "value": value,
      "writable": true
    });
  } else {
    object[key] = value;
  }
}
var baseAssignValue_default = baseAssignValue;

// node_modules/lodash-es/eq.js
function eq(value, other) {
  return value === other || value !== value && other !== other;
}
var eq_default = eq;

// node_modules/lodash-es/_assignValue.js
var objectProto4 = Object.prototype;
var hasOwnProperty3 = objectProto4.hasOwnProperty;
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty3.call(object, key) && eq_default(objValue, value)) || value === void 0 && !(key in object)) {
    baseAssignValue_default(object, key, value);
  }
}
var assignValue_default = assignValue;

// node_modules/lodash-es/_copyObject.js
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});
  var index = -1, length = props.length;
  while (++index < length) {
    var key = props[index];
    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
    if (newValue === void 0) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue_default(object, key, newValue);
    } else {
      assignValue_default(object, key, newValue);
    }
  }
  return object;
}
var copyObject_default = copyObject;

// node_modules/lodash-es/_overRest.js
var nativeMax = Math.max;
function overRest(func, start, transform) {
  start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array2 = Array(length);
    while (++index < length) {
      array2[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array2);
    return apply_default(func, this, otherArgs);
  };
}
var overRest_default = overRest;

// node_modules/lodash-es/isLength.js
var MAX_SAFE_INTEGER2 = 9007199254740991;
function isLength(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER2;
}
var isLength_default = isLength;

// node_modules/lodash-es/isArrayLike.js
function isArrayLike(value) {
  return value != null && isLength_default(value.length) && !isFunction_default(value);
}
var isArrayLike_default = isArrayLike;

// node_modules/lodash-es/_isIterateeCall.js
function isIterateeCall(value, index, object) {
  if (!isObject_default(object)) {
    return false;
  }
  var type = typeof index;
  if (type == "number" ? isArrayLike_default(object) && isIndex_default(index, object.length) : type == "string" && index in object) {
    return eq_default(object[index], value);
  }
  return false;
}
var isIterateeCall_default = isIterateeCall;

// node_modules/lodash-es/_isPrototype.js
var objectProto5 = Object.prototype;
function isPrototype(value) {
  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto5;
  return value === proto;
}
var isPrototype_default = isPrototype;

// node_modules/lodash-es/_baseTimes.js
function baseTimes(n, iteratee) {
  var index = -1, result = Array(n);
  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}
var baseTimes_default = baseTimes;

// node_modules/lodash-es/_baseIsArguments.js
var argsTag = "[object Arguments]";
function baseIsArguments(value) {
  return isObjectLike_default(value) && baseGetTag_default(value) == argsTag;
}
var baseIsArguments_default = baseIsArguments;

// node_modules/lodash-es/isArguments.js
var objectProto6 = Object.prototype;
var hasOwnProperty4 = objectProto6.hasOwnProperty;
var propertyIsEnumerable = objectProto6.propertyIsEnumerable;
var isArguments = baseIsArguments_default(/* @__PURE__ */ (function() {
  return arguments;
})()) ? baseIsArguments_default : function(value) {
  return isObjectLike_default(value) && hasOwnProperty4.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
};
var isArguments_default = isArguments;

// node_modules/lodash-es/stubFalse.js
function stubFalse() {
  return false;
}
var stubFalse_default = stubFalse;

// node_modules/lodash-es/isBuffer.js
var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
var moduleExports = freeModule && freeModule.exports === freeExports;
var Buffer2 = moduleExports ? root_default.Buffer : void 0;
var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
var isBuffer = nativeIsBuffer || stubFalse_default;
var isBuffer_default = isBuffer;

// node_modules/lodash-es/_baseIsTypedArray.js
var argsTag2 = "[object Arguments]";
var arrayTag = "[object Array]";
var boolTag = "[object Boolean]";
var dateTag = "[object Date]";
var errorTag = "[object Error]";
var funcTag2 = "[object Function]";
var mapTag = "[object Map]";
var numberTag = "[object Number]";
var objectTag = "[object Object]";
var regexpTag = "[object RegExp]";
var setTag = "[object Set]";
var stringTag = "[object String]";
var weakMapTag = "[object WeakMap]";
var arrayBufferTag = "[object ArrayBuffer]";
var dataViewTag = "[object DataView]";
var float32Tag = "[object Float32Array]";
var float64Tag = "[object Float64Array]";
var int8Tag = "[object Int8Array]";
var int16Tag = "[object Int16Array]";
var int32Tag = "[object Int32Array]";
var uint8Tag = "[object Uint8Array]";
var uint8ClampedTag = "[object Uint8ClampedArray]";
var uint16Tag = "[object Uint16Array]";
var uint32Tag = "[object Uint32Array]";
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag2] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag2] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
function baseIsTypedArray(value) {
  return isObjectLike_default(value) && isLength_default(value.length) && !!typedArrayTags[baseGetTag_default(value)];
}
var baseIsTypedArray_default = baseIsTypedArray;

// node_modules/lodash-es/_baseUnary.js
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}
var baseUnary_default = baseUnary;

// node_modules/lodash-es/_nodeUtil.js
var freeExports2 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule2 = freeExports2 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports2 = freeModule2 && freeModule2.exports === freeExports2;
var freeProcess = moduleExports2 && freeGlobal_default.process;
var nodeUtil = (function() {
  try {
    var types = freeModule2 && freeModule2.require && freeModule2.require("util").types;
    if (types) {
      return types;
    }
    return freeProcess && freeProcess.binding && freeProcess.binding("util");
  } catch (e) {
  }
})();
var nodeUtil_default = nodeUtil;

// node_modules/lodash-es/isTypedArray.js
var nodeIsTypedArray = nodeUtil_default && nodeUtil_default.isTypedArray;
var isTypedArray = nodeIsTypedArray ? baseUnary_default(nodeIsTypedArray) : baseIsTypedArray_default;
var isTypedArray_default = isTypedArray;

// node_modules/lodash-es/_arrayLikeKeys.js
var objectProto7 = Object.prototype;
var hasOwnProperty5 = objectProto7.hasOwnProperty;
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_default(value), isArg = !isArr && isArguments_default(value), isBuff = !isArr && !isArg && isBuffer_default(value), isType = !isArr && !isArg && !isBuff && isTypedArray_default(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes_default(value.length, String) : [], length = result.length;
  for (var key in value) {
    if ((inherited || hasOwnProperty5.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
    (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
    isIndex_default(key, length)))) {
      result.push(key);
    }
  }
  return result;
}
var arrayLikeKeys_default = arrayLikeKeys;

// node_modules/lodash-es/_overArg.js
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}
var overArg_default = overArg;

// node_modules/lodash-es/_nativeKeys.js
var nativeKeys = overArg_default(Object.keys, Object);
var nativeKeys_default = nativeKeys;

// node_modules/lodash-es/_baseKeys.js
var objectProto8 = Object.prototype;
var hasOwnProperty6 = objectProto8.hasOwnProperty;
function baseKeys(object) {
  if (!isPrototype_default(object)) {
    return nativeKeys_default(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty6.call(object, key) && key != "constructor") {
      result.push(key);
    }
  }
  return result;
}
var baseKeys_default = baseKeys;

// node_modules/lodash-es/keys.js
function keys(object) {
  return isArrayLike_default(object) ? arrayLikeKeys_default(object) : baseKeys_default(object);
}
var keys_default = keys;

// node_modules/lodash-es/_nativeKeysIn.js
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}
var nativeKeysIn_default = nativeKeysIn;

// node_modules/lodash-es/_baseKeysIn.js
var objectProto9 = Object.prototype;
var hasOwnProperty7 = objectProto9.hasOwnProperty;
function baseKeysIn(object) {
  if (!isObject_default(object)) {
    return nativeKeysIn_default(object);
  }
  var isProto = isPrototype_default(object), result = [];
  for (var key in object) {
    if (!(key == "constructor" && (isProto || !hasOwnProperty7.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}
var baseKeysIn_default = baseKeysIn;

// node_modules/lodash-es/keysIn.js
function keysIn(object) {
  return isArrayLike_default(object) ? arrayLikeKeys_default(object, true) : baseKeysIn_default(object);
}
var keysIn_default = keysIn;

// node_modules/lodash-es/_isKey.js
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp = /^\w*$/;
function isKey(value, object) {
  if (isArray_default(value)) {
    return false;
  }
  var type = typeof value;
  if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol_default(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
}
var isKey_default = isKey;

// node_modules/lodash-es/_nativeCreate.js
var nativeCreate = getNative_default(Object, "create");
var nativeCreate_default = nativeCreate;

// node_modules/lodash-es/_hashClear.js
function hashClear() {
  this.__data__ = nativeCreate_default ? nativeCreate_default(null) : {};
  this.size = 0;
}
var hashClear_default = hashClear;

// node_modules/lodash-es/_hashDelete.js
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}
var hashDelete_default = hashDelete;

// node_modules/lodash-es/_hashGet.js
var HASH_UNDEFINED = "__lodash_hash_undefined__";
var objectProto10 = Object.prototype;
var hasOwnProperty8 = objectProto10.hasOwnProperty;
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate_default) {
    var result = data[key];
    return result === HASH_UNDEFINED ? void 0 : result;
  }
  return hasOwnProperty8.call(data, key) ? data[key] : void 0;
}
var hashGet_default = hashGet;

// node_modules/lodash-es/_hashHas.js
var objectProto11 = Object.prototype;
var hasOwnProperty9 = objectProto11.hasOwnProperty;
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate_default ? data[key] !== void 0 : hasOwnProperty9.call(data, key);
}
var hashHas_default = hashHas;

// node_modules/lodash-es/_hashSet.js
var HASH_UNDEFINED2 = "__lodash_hash_undefined__";
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate_default && value === void 0 ? HASH_UNDEFINED2 : value;
  return this;
}
var hashSet_default = hashSet;

// node_modules/lodash-es/_Hash.js
function Hash(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
Hash.prototype.clear = hashClear_default;
Hash.prototype["delete"] = hashDelete_default;
Hash.prototype.get = hashGet_default;
Hash.prototype.has = hashHas_default;
Hash.prototype.set = hashSet_default;
var Hash_default = Hash;

// node_modules/lodash-es/_listCacheClear.js
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}
var listCacheClear_default = listCacheClear;

// node_modules/lodash-es/_assocIndexOf.js
function assocIndexOf(array2, key) {
  var length = array2.length;
  while (length--) {
    if (eq_default(array2[length][0], key)) {
      return length;
    }
  }
  return -1;
}
var assocIndexOf_default = assocIndexOf;

// node_modules/lodash-es/_listCacheDelete.js
var arrayProto = Array.prototype;
var splice = arrayProto.splice;
function listCacheDelete(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}
var listCacheDelete_default = listCacheDelete;

// node_modules/lodash-es/_listCacheGet.js
function listCacheGet(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  return index < 0 ? void 0 : data[index][1];
}
var listCacheGet_default = listCacheGet;

// node_modules/lodash-es/_listCacheHas.js
function listCacheHas(key) {
  return assocIndexOf_default(this.__data__, key) > -1;
}
var listCacheHas_default = listCacheHas;

// node_modules/lodash-es/_listCacheSet.js
function listCacheSet(key, value) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}
var listCacheSet_default = listCacheSet;

// node_modules/lodash-es/_ListCache.js
function ListCache(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
ListCache.prototype.clear = listCacheClear_default;
ListCache.prototype["delete"] = listCacheDelete_default;
ListCache.prototype.get = listCacheGet_default;
ListCache.prototype.has = listCacheHas_default;
ListCache.prototype.set = listCacheSet_default;
var ListCache_default = ListCache;

// node_modules/lodash-es/_Map.js
var Map2 = getNative_default(root_default, "Map");
var Map_default = Map2;

// node_modules/lodash-es/_mapCacheClear.js
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    "hash": new Hash_default(),
    "map": new (Map_default || ListCache_default)(),
    "string": new Hash_default()
  };
}
var mapCacheClear_default = mapCacheClear;

// node_modules/lodash-es/_isKeyable.js
function isKeyable(value) {
  var type = typeof value;
  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
}
var isKeyable_default = isKeyable;

// node_modules/lodash-es/_getMapData.js
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable_default(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
var getMapData_default = getMapData;

// node_modules/lodash-es/_mapCacheDelete.js
function mapCacheDelete(key) {
  var result = getMapData_default(this, key)["delete"](key);
  this.size -= result ? 1 : 0;
  return result;
}
var mapCacheDelete_default = mapCacheDelete;

// node_modules/lodash-es/_mapCacheGet.js
function mapCacheGet(key) {
  return getMapData_default(this, key).get(key);
}
var mapCacheGet_default = mapCacheGet;

// node_modules/lodash-es/_mapCacheHas.js
function mapCacheHas(key) {
  return getMapData_default(this, key).has(key);
}
var mapCacheHas_default = mapCacheHas;

// node_modules/lodash-es/_mapCacheSet.js
function mapCacheSet(key, value) {
  var data = getMapData_default(this, key), size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}
var mapCacheSet_default = mapCacheSet;

// node_modules/lodash-es/_MapCache.js
function MapCache(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
MapCache.prototype.clear = mapCacheClear_default;
MapCache.prototype["delete"] = mapCacheDelete_default;
MapCache.prototype.get = mapCacheGet_default;
MapCache.prototype.has = mapCacheHas_default;
MapCache.prototype.set = mapCacheSet_default;
var MapCache_default = MapCache;

// node_modules/lodash-es/memoize.js
var FUNC_ERROR_TEXT = "Expected a function";
function memoize(func, resolver) {
  if (typeof func != "function" || resolver != null && typeof resolver != "function") {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache_default)();
  return memoized;
}
memoize.Cache = MapCache_default;
var memoize_default = memoize;

// node_modules/lodash-es/_memoizeCapped.js
var MAX_MEMOIZE_SIZE = 500;
function memoizeCapped(func) {
  var result = memoize_default(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });
  var cache = result.cache;
  return result;
}
var memoizeCapped_default = memoizeCapped;

// node_modules/lodash-es/_stringToPath.js
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var reEscapeChar = /\\(\\)?/g;
var stringToPath = memoizeCapped_default(function(string3) {
  var result = [];
  if (string3.charCodeAt(0) === 46) {
    result.push("");
  }
  string3.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
  });
  return result;
});
var stringToPath_default = stringToPath;

// node_modules/lodash-es/toString.js
function toString2(value) {
  return value == null ? "" : baseToString_default(value);
}
var toString_default = toString2;

// node_modules/lodash-es/_castPath.js
function castPath(value, object) {
  if (isArray_default(value)) {
    return value;
  }
  return isKey_default(value, object) ? [value] : stringToPath_default(toString_default(value));
}
var castPath_default = castPath;

// node_modules/lodash-es/_toKey.js
var INFINITY3 = 1 / 0;
function toKey(value) {
  if (typeof value == "string" || isSymbol_default(value)) {
    return value;
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY3 ? "-0" : result;
}
var toKey_default = toKey;

// node_modules/lodash-es/_baseGet.js
function baseGet(object, path) {
  path = castPath_default(path, object);
  var index = 0, length = path.length;
  while (object != null && index < length) {
    object = object[toKey_default(path[index++])];
  }
  return index && index == length ? object : void 0;
}
var baseGet_default = baseGet;

// node_modules/lodash-es/_arrayPush.js
function arrayPush(array2, values) {
  var index = -1, length = values.length, offset = array2.length;
  while (++index < length) {
    array2[offset + index] = values[index];
  }
  return array2;
}
var arrayPush_default = arrayPush;

// node_modules/lodash-es/_isFlattenable.js
var spreadableSymbol = Symbol_default ? Symbol_default.isConcatSpreadable : void 0;
function isFlattenable(value) {
  return isArray_default(value) || isArguments_default(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
}
var isFlattenable_default = isFlattenable;

// node_modules/lodash-es/_baseFlatten.js
function baseFlatten(array2, depth, predicate, isStrict, result) {
  var index = -1, length = array2.length;
  predicate || (predicate = isFlattenable_default);
  result || (result = []);
  while (++index < length) {
    var value = array2[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush_default(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}
var baseFlatten_default = baseFlatten;

// node_modules/lodash-es/flatten.js
function flatten(array2) {
  var length = array2 == null ? 0 : array2.length;
  return length ? baseFlatten_default(array2, 1) : [];
}
var flatten_default = flatten;

// node_modules/lodash-es/_flatRest.js
function flatRest(func) {
  return setToString_default(overRest_default(func, void 0, flatten_default), func + "");
}
var flatRest_default = flatRest;

// node_modules/lodash-es/_getPrototype.js
var getPrototype = overArg_default(Object.getPrototypeOf, Object);
var getPrototype_default = getPrototype;

// node_modules/lodash-es/isPlainObject.js
var objectTag2 = "[object Object]";
var funcProto3 = Function.prototype;
var objectProto12 = Object.prototype;
var funcToString3 = funcProto3.toString;
var hasOwnProperty10 = objectProto12.hasOwnProperty;
var objectCtorString = funcToString3.call(Object);
function isPlainObject(value) {
  if (!isObjectLike_default(value) || baseGetTag_default(value) != objectTag2) {
    return false;
  }
  var proto = getPrototype_default(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty10.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString3.call(Ctor) == objectCtorString;
}
var isPlainObject_default = isPlainObject;

// node_modules/lodash-es/_baseSlice.js
function baseSlice(array2, start, end) {
  var index = -1, length = array2.length;
  if (start < 0) {
    start = -start > length ? 0 : length + start;
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : end - start >>> 0;
  start >>>= 0;
  var result = Array(length);
  while (++index < length) {
    result[index] = array2[index + start];
  }
  return result;
}
var baseSlice_default = baseSlice;

// node_modules/lodash-es/_castSlice.js
function castSlice(array2, start, end) {
  var length = array2.length;
  end = end === void 0 ? length : end;
  return !start && end >= length ? array2 : baseSlice_default(array2, start, end);
}
var castSlice_default = castSlice;

// node_modules/lodash-es/_hasUnicode.js
var rsAstralRange = "\\ud800-\\udfff";
var rsComboMarksRange = "\\u0300-\\u036f";
var reComboHalfMarksRange = "\\ufe20-\\ufe2f";
var rsComboSymbolsRange = "\\u20d0-\\u20ff";
var rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange;
var rsVarRange = "\\ufe0e\\ufe0f";
var rsZWJ = "\\u200d";
var reHasUnicode = RegExp("[" + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + "]");
function hasUnicode(string3) {
  return reHasUnicode.test(string3);
}
var hasUnicode_default = hasUnicode;

// node_modules/lodash-es/_asciiToArray.js
function asciiToArray(string3) {
  return string3.split("");
}
var asciiToArray_default = asciiToArray;

// node_modules/lodash-es/_unicodeToArray.js
var rsAstralRange2 = "\\ud800-\\udfff";
var rsComboMarksRange2 = "\\u0300-\\u036f";
var reComboHalfMarksRange2 = "\\ufe20-\\ufe2f";
var rsComboSymbolsRange2 = "\\u20d0-\\u20ff";
var rsComboRange2 = rsComboMarksRange2 + reComboHalfMarksRange2 + rsComboSymbolsRange2;
var rsVarRange2 = "\\ufe0e\\ufe0f";
var rsAstral = "[" + rsAstralRange2 + "]";
var rsCombo = "[" + rsComboRange2 + "]";
var rsFitz = "\\ud83c[\\udffb-\\udfff]";
var rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")";
var rsNonAstral = "[^" + rsAstralRange2 + "]";
var rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}";
var rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]";
var rsZWJ2 = "\\u200d";
var reOptMod = rsModifier + "?";
var rsOptVar = "[" + rsVarRange2 + "]?";
var rsOptJoin = "(?:" + rsZWJ2 + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*";
var rsSeq = rsOptVar + reOptMod + rsOptJoin;
var rsSymbol = "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
function unicodeToArray(string3) {
  return string3.match(reUnicode) || [];
}
var unicodeToArray_default = unicodeToArray;

// node_modules/lodash-es/_stringToArray.js
function stringToArray(string3) {
  return hasUnicode_default(string3) ? unicodeToArray_default(string3) : asciiToArray_default(string3);
}
var stringToArray_default = stringToArray;

// node_modules/lodash-es/_createCaseFirst.js
function createCaseFirst(methodName) {
  return function(string3) {
    string3 = toString_default(string3);
    var strSymbols = hasUnicode_default(string3) ? stringToArray_default(string3) : void 0;
    var chr = strSymbols ? strSymbols[0] : string3.charAt(0);
    var trailing = strSymbols ? castSlice_default(strSymbols, 1).join("") : string3.slice(1);
    return chr[methodName]() + trailing;
  };
}
var createCaseFirst_default = createCaseFirst;

// node_modules/lodash-es/upperFirst.js
var upperFirst = createCaseFirst_default("toUpperCase");
var upperFirst_default = upperFirst;

// node_modules/lodash-es/capitalize.js
function capitalize(string3) {
  return upperFirst_default(toString_default(string3).toLowerCase());
}
var capitalize_default = capitalize;

// node_modules/lodash-es/_arrayReduce.js
function arrayReduce(array2, iteratee, accumulator, initAccum) {
  var index = -1, length = array2 == null ? 0 : array2.length;
  if (initAccum && length) {
    accumulator = array2[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array2[index], index, array2);
  }
  return accumulator;
}
var arrayReduce_default = arrayReduce;

// node_modules/lodash-es/_basePropertyOf.js
function basePropertyOf(object) {
  return function(key) {
    return object == null ? void 0 : object[key];
  };
}
var basePropertyOf_default = basePropertyOf;

// node_modules/lodash-es/_deburrLetter.js
var deburredLetters = {
  // Latin-1 Supplement block.
  "\xC0": "A",
  "\xC1": "A",
  "\xC2": "A",
  "\xC3": "A",
  "\xC4": "A",
  "\xC5": "A",
  "\xE0": "a",
  "\xE1": "a",
  "\xE2": "a",
  "\xE3": "a",
  "\xE4": "a",
  "\xE5": "a",
  "\xC7": "C",
  "\xE7": "c",
  "\xD0": "D",
  "\xF0": "d",
  "\xC8": "E",
  "\xC9": "E",
  "\xCA": "E",
  "\xCB": "E",
  "\xE8": "e",
  "\xE9": "e",
  "\xEA": "e",
  "\xEB": "e",
  "\xCC": "I",
  "\xCD": "I",
  "\xCE": "I",
  "\xCF": "I",
  "\xEC": "i",
  "\xED": "i",
  "\xEE": "i",
  "\xEF": "i",
  "\xD1": "N",
  "\xF1": "n",
  "\xD2": "O",
  "\xD3": "O",
  "\xD4": "O",
  "\xD5": "O",
  "\xD6": "O",
  "\xD8": "O",
  "\xF2": "o",
  "\xF3": "o",
  "\xF4": "o",
  "\xF5": "o",
  "\xF6": "o",
  "\xF8": "o",
  "\xD9": "U",
  "\xDA": "U",
  "\xDB": "U",
  "\xDC": "U",
  "\xF9": "u",
  "\xFA": "u",
  "\xFB": "u",
  "\xFC": "u",
  "\xDD": "Y",
  "\xFD": "y",
  "\xFF": "y",
  "\xC6": "Ae",
  "\xE6": "ae",
  "\xDE": "Th",
  "\xFE": "th",
  "\xDF": "ss",
  // Latin Extended-A block.
  "\u0100": "A",
  "\u0102": "A",
  "\u0104": "A",
  "\u0101": "a",
  "\u0103": "a",
  "\u0105": "a",
  "\u0106": "C",
  "\u0108": "C",
  "\u010A": "C",
  "\u010C": "C",
  "\u0107": "c",
  "\u0109": "c",
  "\u010B": "c",
  "\u010D": "c",
  "\u010E": "D",
  "\u0110": "D",
  "\u010F": "d",
  "\u0111": "d",
  "\u0112": "E",
  "\u0114": "E",
  "\u0116": "E",
  "\u0118": "E",
  "\u011A": "E",
  "\u0113": "e",
  "\u0115": "e",
  "\u0117": "e",
  "\u0119": "e",
  "\u011B": "e",
  "\u011C": "G",
  "\u011E": "G",
  "\u0120": "G",
  "\u0122": "G",
  "\u011D": "g",
  "\u011F": "g",
  "\u0121": "g",
  "\u0123": "g",
  "\u0124": "H",
  "\u0126": "H",
  "\u0125": "h",
  "\u0127": "h",
  "\u0128": "I",
  "\u012A": "I",
  "\u012C": "I",
  "\u012E": "I",
  "\u0130": "I",
  "\u0129": "i",
  "\u012B": "i",
  "\u012D": "i",
  "\u012F": "i",
  "\u0131": "i",
  "\u0134": "J",
  "\u0135": "j",
  "\u0136": "K",
  "\u0137": "k",
  "\u0138": "k",
  "\u0139": "L",
  "\u013B": "L",
  "\u013D": "L",
  "\u013F": "L",
  "\u0141": "L",
  "\u013A": "l",
  "\u013C": "l",
  "\u013E": "l",
  "\u0140": "l",
  "\u0142": "l",
  "\u0143": "N",
  "\u0145": "N",
  "\u0147": "N",
  "\u014A": "N",
  "\u0144": "n",
  "\u0146": "n",
  "\u0148": "n",
  "\u014B": "n",
  "\u014C": "O",
  "\u014E": "O",
  "\u0150": "O",
  "\u014D": "o",
  "\u014F": "o",
  "\u0151": "o",
  "\u0154": "R",
  "\u0156": "R",
  "\u0158": "R",
  "\u0155": "r",
  "\u0157": "r",
  "\u0159": "r",
  "\u015A": "S",
  "\u015C": "S",
  "\u015E": "S",
  "\u0160": "S",
  "\u015B": "s",
  "\u015D": "s",
  "\u015F": "s",
  "\u0161": "s",
  "\u0162": "T",
  "\u0164": "T",
  "\u0166": "T",
  "\u0163": "t",
  "\u0165": "t",
  "\u0167": "t",
  "\u0168": "U",
  "\u016A": "U",
  "\u016C": "U",
  "\u016E": "U",
  "\u0170": "U",
  "\u0172": "U",
  "\u0169": "u",
  "\u016B": "u",
  "\u016D": "u",
  "\u016F": "u",
  "\u0171": "u",
  "\u0173": "u",
  "\u0174": "W",
  "\u0175": "w",
  "\u0176": "Y",
  "\u0177": "y",
  "\u0178": "Y",
  "\u0179": "Z",
  "\u017B": "Z",
  "\u017D": "Z",
  "\u017A": "z",
  "\u017C": "z",
  "\u017E": "z",
  "\u0132": "IJ",
  "\u0133": "ij",
  "\u0152": "Oe",
  "\u0153": "oe",
  "\u0149": "'n",
  "\u017F": "s"
};
var deburrLetter = basePropertyOf_default(deburredLetters);
var deburrLetter_default = deburrLetter;

// node_modules/lodash-es/deburr.js
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
var rsComboMarksRange3 = "\\u0300-\\u036f";
var reComboHalfMarksRange3 = "\\ufe20-\\ufe2f";
var rsComboSymbolsRange3 = "\\u20d0-\\u20ff";
var rsComboRange3 = rsComboMarksRange3 + reComboHalfMarksRange3 + rsComboSymbolsRange3;
var rsCombo2 = "[" + rsComboRange3 + "]";
var reComboMark = RegExp(rsCombo2, "g");
function deburr(string3) {
  string3 = toString_default(string3);
  return string3 && string3.replace(reLatin, deburrLetter_default).replace(reComboMark, "");
}
var deburr_default = deburr;

// node_modules/lodash-es/_asciiWords.js
var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
function asciiWords(string3) {
  return string3.match(reAsciiWord) || [];
}
var asciiWords_default = asciiWords;

// node_modules/lodash-es/_hasUnicodeWord.js
var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
function hasUnicodeWord(string3) {
  return reHasUnicodeWord.test(string3);
}
var hasUnicodeWord_default = hasUnicodeWord;

// node_modules/lodash-es/_unicodeWords.js
var rsAstralRange3 = "\\ud800-\\udfff";
var rsComboMarksRange4 = "\\u0300-\\u036f";
var reComboHalfMarksRange4 = "\\ufe20-\\ufe2f";
var rsComboSymbolsRange4 = "\\u20d0-\\u20ff";
var rsComboRange4 = rsComboMarksRange4 + reComboHalfMarksRange4 + rsComboSymbolsRange4;
var rsDingbatRange = "\\u2700-\\u27bf";
var rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff";
var rsMathOpRange = "\\xac\\xb1\\xd7\\xf7";
var rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf";
var rsPunctuationRange = "\\u2000-\\u206f";
var rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000";
var rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde";
var rsVarRange3 = "\\ufe0e\\ufe0f";
var rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
var rsApos = "['\u2019]";
var rsBreak = "[" + rsBreakRange + "]";
var rsCombo3 = "[" + rsComboRange4 + "]";
var rsDigits = "\\d+";
var rsDingbat = "[" + rsDingbatRange + "]";
var rsLower = "[" + rsLowerRange + "]";
var rsMisc = "[^" + rsAstralRange3 + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]";
var rsFitz2 = "\\ud83c[\\udffb-\\udfff]";
var rsModifier2 = "(?:" + rsCombo3 + "|" + rsFitz2 + ")";
var rsNonAstral2 = "[^" + rsAstralRange3 + "]";
var rsRegional2 = "(?:\\ud83c[\\udde6-\\uddff]){2}";
var rsSurrPair2 = "[\\ud800-\\udbff][\\udc00-\\udfff]";
var rsUpper = "[" + rsUpperRange + "]";
var rsZWJ3 = "\\u200d";
var rsMiscLower = "(?:" + rsLower + "|" + rsMisc + ")";
var rsMiscUpper = "(?:" + rsUpper + "|" + rsMisc + ")";
var rsOptContrLower = "(?:" + rsApos + "(?:d|ll|m|re|s|t|ve))?";
var rsOptContrUpper = "(?:" + rsApos + "(?:D|LL|M|RE|S|T|VE))?";
var reOptMod2 = rsModifier2 + "?";
var rsOptVar2 = "[" + rsVarRange3 + "]?";
var rsOptJoin2 = "(?:" + rsZWJ3 + "(?:" + [rsNonAstral2, rsRegional2, rsSurrPair2].join("|") + ")" + rsOptVar2 + reOptMod2 + ")*";
var rsOrdLower = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])";
var rsOrdUpper = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])";
var rsSeq2 = rsOptVar2 + reOptMod2 + rsOptJoin2;
var rsEmoji = "(?:" + [rsDingbat, rsRegional2, rsSurrPair2].join("|") + ")" + rsSeq2;
var reUnicodeWord = RegExp([
  rsUpper + "?" + rsLower + "+" + rsOptContrLower + "(?=" + [rsBreak, rsUpper, "$"].join("|") + ")",
  rsMiscUpper + "+" + rsOptContrUpper + "(?=" + [rsBreak, rsUpper + rsMiscLower, "$"].join("|") + ")",
  rsUpper + "?" + rsMiscLower + "+" + rsOptContrLower,
  rsUpper + "+" + rsOptContrUpper,
  rsOrdUpper,
  rsOrdLower,
  rsDigits,
  rsEmoji
].join("|"), "g");
function unicodeWords(string3) {
  return string3.match(reUnicodeWord) || [];
}
var unicodeWords_default = unicodeWords;

// node_modules/lodash-es/words.js
function words(string3, pattern, guard) {
  string3 = toString_default(string3);
  pattern = guard ? void 0 : pattern;
  if (pattern === void 0) {
    return hasUnicodeWord_default(string3) ? unicodeWords_default(string3) : asciiWords_default(string3);
  }
  return string3.match(pattern) || [];
}
var words_default = words;

// node_modules/lodash-es/_createCompounder.js
var rsApos2 = "['\u2019]";
var reApos = RegExp(rsApos2, "g");
function createCompounder(callback) {
  return function(string3) {
    return arrayReduce_default(words_default(deburr_default(string3).replace(reApos, "")), callback, "");
  };
}
var createCompounder_default = createCompounder;

// node_modules/lodash-es/camelCase.js
var camelCase = createCompounder_default(function(result, word, index) {
  word = word.toLowerCase();
  return result + (index ? capitalize_default(word) : word);
});
var camelCase_default = camelCase;

// node_modules/lodash-es/_createRound.js
var nativeIsFinite = root_default.isFinite;
var nativeMin = Math.min;
function createRound(methodName) {
  var func = Math[methodName];
  return function(number, precision) {
    number = toNumber_default(number);
    precision = precision == null ? 0 : nativeMin(toInteger_default(precision), 292);
    if (precision && nativeIsFinite(number)) {
      var pair = (toString_default(number) + "e").split("e"), value = func(pair[0] + "e" + (+pair[1] + precision));
      pair = (toString_default(value) + "e").split("e");
      return +(pair[0] + "e" + (+pair[1] - precision));
    }
    return func(number);
  };
}
var createRound_default = createRound;

// node_modules/lodash-es/chunk.js
var nativeCeil = Math.ceil;
var nativeMax2 = Math.max;
function chunk(array2, size, guard) {
  if (guard ? isIterateeCall_default(array2, size, guard) : size === void 0) {
    size = 1;
  } else {
    size = nativeMax2(toInteger_default(size), 0);
  }
  var length = array2 == null ? 0 : array2.length;
  if (!length || size < 1) {
    return [];
  }
  var index = 0, resIndex = 0, result = Array(nativeCeil(length / size));
  while (index < length) {
    result[resIndex++] = baseSlice_default(array2, index, index += size);
  }
  return result;
}
var chunk_default = chunk;

// node_modules/lodash-es/_baseClamp.js
function baseClamp(number, lower, upper) {
  if (number === number) {
    if (upper !== void 0) {
      number = number <= upper ? number : upper;
    }
    if (lower !== void 0) {
      number = number >= lower ? number : lower;
    }
  }
  return number;
}
var baseClamp_default = baseClamp;

// node_modules/lodash-es/clamp.js
function clamp(number, lower, upper) {
  if (upper === void 0) {
    upper = lower;
    lower = void 0;
  }
  if (upper !== void 0) {
    upper = toNumber_default(upper);
    upper = upper === upper ? upper : 0;
  }
  if (lower !== void 0) {
    lower = toNumber_default(lower);
    lower = lower === lower ? lower : 0;
  }
  return baseClamp_default(toNumber_default(number), lower, upper);
}
var clamp_default = clamp;

// node_modules/lodash-es/_stackClear.js
function stackClear() {
  this.__data__ = new ListCache_default();
  this.size = 0;
}
var stackClear_default = stackClear;

// node_modules/lodash-es/_stackDelete.js
function stackDelete(key) {
  var data = this.__data__, result = data["delete"](key);
  this.size = data.size;
  return result;
}
var stackDelete_default = stackDelete;

// node_modules/lodash-es/_stackGet.js
function stackGet(key) {
  return this.__data__.get(key);
}
var stackGet_default = stackGet;

// node_modules/lodash-es/_stackHas.js
function stackHas(key) {
  return this.__data__.has(key);
}
var stackHas_default = stackHas;

// node_modules/lodash-es/_stackSet.js
var LARGE_ARRAY_SIZE = 200;
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache_default) {
    var pairs = data.__data__;
    if (!Map_default || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache_default(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}
var stackSet_default = stackSet;

// node_modules/lodash-es/_Stack.js
function Stack(entries) {
  var data = this.__data__ = new ListCache_default(entries);
  this.size = data.size;
}
Stack.prototype.clear = stackClear_default;
Stack.prototype["delete"] = stackDelete_default;
Stack.prototype.get = stackGet_default;
Stack.prototype.has = stackHas_default;
Stack.prototype.set = stackSet_default;
var Stack_default = Stack;

// node_modules/lodash-es/_baseAssign.js
function baseAssign(object, source) {
  return object && copyObject_default(source, keys_default(source), object);
}
var baseAssign_default = baseAssign;

// node_modules/lodash-es/_baseAssignIn.js
function baseAssignIn(object, source) {
  return object && copyObject_default(source, keysIn_default(source), object);
}
var baseAssignIn_default = baseAssignIn;

// node_modules/lodash-es/_cloneBuffer.js
var freeExports3 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule3 = freeExports3 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports3 = freeModule3 && freeModule3.exports === freeExports3;
var Buffer3 = moduleExports3 ? root_default.Buffer : void 0;
var allocUnsafe = Buffer3 ? Buffer3.allocUnsafe : void 0;
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
  buffer.copy(result);
  return result;
}
var cloneBuffer_default = cloneBuffer;

// node_modules/lodash-es/_arrayFilter.js
function arrayFilter(array2, predicate) {
  var index = -1, length = array2 == null ? 0 : array2.length, resIndex = 0, result = [];
  while (++index < length) {
    var value = array2[index];
    if (predicate(value, index, array2)) {
      result[resIndex++] = value;
    }
  }
  return result;
}
var arrayFilter_default = arrayFilter;

// node_modules/lodash-es/stubArray.js
function stubArray() {
  return [];
}
var stubArray_default = stubArray;

// node_modules/lodash-es/_getSymbols.js
var objectProto13 = Object.prototype;
var propertyIsEnumerable2 = objectProto13.propertyIsEnumerable;
var nativeGetSymbols = Object.getOwnPropertySymbols;
var getSymbols = !nativeGetSymbols ? stubArray_default : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter_default(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable2.call(object, symbol);
  });
};
var getSymbols_default = getSymbols;

// node_modules/lodash-es/_copySymbols.js
function copySymbols(source, object) {
  return copyObject_default(source, getSymbols_default(source), object);
}
var copySymbols_default = copySymbols;

// node_modules/lodash-es/_getSymbolsIn.js
var nativeGetSymbols2 = Object.getOwnPropertySymbols;
var getSymbolsIn = !nativeGetSymbols2 ? stubArray_default : function(object) {
  var result = [];
  while (object) {
    arrayPush_default(result, getSymbols_default(object));
    object = getPrototype_default(object);
  }
  return result;
};
var getSymbolsIn_default = getSymbolsIn;

// node_modules/lodash-es/_copySymbolsIn.js
function copySymbolsIn(source, object) {
  return copyObject_default(source, getSymbolsIn_default(source), object);
}
var copySymbolsIn_default = copySymbolsIn;

// node_modules/lodash-es/_baseGetAllKeys.js
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_default(object) ? result : arrayPush_default(result, symbolsFunc(object));
}
var baseGetAllKeys_default = baseGetAllKeys;

// node_modules/lodash-es/_getAllKeys.js
function getAllKeys(object) {
  return baseGetAllKeys_default(object, keys_default, getSymbols_default);
}
var getAllKeys_default = getAllKeys;

// node_modules/lodash-es/_getAllKeysIn.js
function getAllKeysIn(object) {
  return baseGetAllKeys_default(object, keysIn_default, getSymbolsIn_default);
}
var getAllKeysIn_default = getAllKeysIn;

// node_modules/lodash-es/_DataView.js
var DataView = getNative_default(root_default, "DataView");
var DataView_default = DataView;

// node_modules/lodash-es/_Promise.js
var Promise2 = getNative_default(root_default, "Promise");
var Promise_default = Promise2;

// node_modules/lodash-es/_Set.js
var Set2 = getNative_default(root_default, "Set");
var Set_default = Set2;

// node_modules/lodash-es/_getTag.js
var mapTag2 = "[object Map]";
var objectTag3 = "[object Object]";
var promiseTag = "[object Promise]";
var setTag2 = "[object Set]";
var weakMapTag2 = "[object WeakMap]";
var dataViewTag2 = "[object DataView]";
var dataViewCtorString = toSource_default(DataView_default);
var mapCtorString = toSource_default(Map_default);
var promiseCtorString = toSource_default(Promise_default);
var setCtorString = toSource_default(Set_default);
var weakMapCtorString = toSource_default(WeakMap_default);
var getTag = baseGetTag_default;
if (DataView_default && getTag(new DataView_default(new ArrayBuffer(1))) != dataViewTag2 || Map_default && getTag(new Map_default()) != mapTag2 || Promise_default && getTag(Promise_default.resolve()) != promiseTag || Set_default && getTag(new Set_default()) != setTag2 || WeakMap_default && getTag(new WeakMap_default()) != weakMapTag2) {
  getTag = function(value) {
    var result = baseGetTag_default(value), Ctor = result == objectTag3 ? value.constructor : void 0, ctorString = Ctor ? toSource_default(Ctor) : "";
    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString:
          return dataViewTag2;
        case mapCtorString:
          return mapTag2;
        case promiseCtorString:
          return promiseTag;
        case setCtorString:
          return setTag2;
        case weakMapCtorString:
          return weakMapTag2;
      }
    }
    return result;
  };
}
var getTag_default = getTag;

// node_modules/lodash-es/_initCloneArray.js
var objectProto14 = Object.prototype;
var hasOwnProperty11 = objectProto14.hasOwnProperty;
function initCloneArray(array2) {
  var length = array2.length, result = new array2.constructor(length);
  if (length && typeof array2[0] == "string" && hasOwnProperty11.call(array2, "index")) {
    result.index = array2.index;
    result.input = array2.input;
  }
  return result;
}
var initCloneArray_default = initCloneArray;

// node_modules/lodash-es/_Uint8Array.js
var Uint8Array2 = root_default.Uint8Array;
var Uint8Array_default = Uint8Array2;

// node_modules/lodash-es/_cloneArrayBuffer.js
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array_default(result).set(new Uint8Array_default(arrayBuffer));
  return result;
}
var cloneArrayBuffer_default = cloneArrayBuffer;

// node_modules/lodash-es/_cloneDataView.js
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer_default(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}
var cloneDataView_default = cloneDataView;

// node_modules/lodash-es/_cloneRegExp.js
var reFlags = /\w*$/;
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}
var cloneRegExp_default = cloneRegExp;

// node_modules/lodash-es/_cloneSymbol.js
var symbolProto2 = Symbol_default ? Symbol_default.prototype : void 0;
var symbolValueOf = symbolProto2 ? symbolProto2.valueOf : void 0;
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}
var cloneSymbol_default = cloneSymbol;

// node_modules/lodash-es/_cloneTypedArray.js
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer_default(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}
var cloneTypedArray_default = cloneTypedArray;

// node_modules/lodash-es/_initCloneByTag.js
var boolTag2 = "[object Boolean]";
var dateTag2 = "[object Date]";
var mapTag3 = "[object Map]";
var numberTag2 = "[object Number]";
var regexpTag2 = "[object RegExp]";
var setTag3 = "[object Set]";
var stringTag2 = "[object String]";
var symbolTag2 = "[object Symbol]";
var arrayBufferTag2 = "[object ArrayBuffer]";
var dataViewTag3 = "[object DataView]";
var float32Tag2 = "[object Float32Array]";
var float64Tag2 = "[object Float64Array]";
var int8Tag2 = "[object Int8Array]";
var int16Tag2 = "[object Int16Array]";
var int32Tag2 = "[object Int32Array]";
var uint8Tag2 = "[object Uint8Array]";
var uint8ClampedTag2 = "[object Uint8ClampedArray]";
var uint16Tag2 = "[object Uint16Array]";
var uint32Tag2 = "[object Uint32Array]";
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag2:
      return cloneArrayBuffer_default(object);
    case boolTag2:
    case dateTag2:
      return new Ctor(+object);
    case dataViewTag3:
      return cloneDataView_default(object, isDeep);
    case float32Tag2:
    case float64Tag2:
    case int8Tag2:
    case int16Tag2:
    case int32Tag2:
    case uint8Tag2:
    case uint8ClampedTag2:
    case uint16Tag2:
    case uint32Tag2:
      return cloneTypedArray_default(object, isDeep);
    case mapTag3:
      return new Ctor();
    case numberTag2:
    case stringTag2:
      return new Ctor(object);
    case regexpTag2:
      return cloneRegExp_default(object);
    case setTag3:
      return new Ctor();
    case symbolTag2:
      return cloneSymbol_default(object);
  }
}
var initCloneByTag_default = initCloneByTag;

// node_modules/lodash-es/_initCloneObject.js
function initCloneObject(object) {
  return typeof object.constructor == "function" && !isPrototype_default(object) ? baseCreate_default(getPrototype_default(object)) : {};
}
var initCloneObject_default = initCloneObject;

// node_modules/lodash-es/_baseIsMap.js
var mapTag4 = "[object Map]";
function baseIsMap(value) {
  return isObjectLike_default(value) && getTag_default(value) == mapTag4;
}
var baseIsMap_default = baseIsMap;

// node_modules/lodash-es/isMap.js
var nodeIsMap = nodeUtil_default && nodeUtil_default.isMap;
var isMap = nodeIsMap ? baseUnary_default(nodeIsMap) : baseIsMap_default;
var isMap_default = isMap;

// node_modules/lodash-es/_baseIsSet.js
var setTag4 = "[object Set]";
function baseIsSet(value) {
  return isObjectLike_default(value) && getTag_default(value) == setTag4;
}
var baseIsSet_default = baseIsSet;

// node_modules/lodash-es/isSet.js
var nodeIsSet = nodeUtil_default && nodeUtil_default.isSet;
var isSet = nodeIsSet ? baseUnary_default(nodeIsSet) : baseIsSet_default;
var isSet_default = isSet;

// node_modules/lodash-es/_baseClone.js
var CLONE_DEEP_FLAG = 1;
var CLONE_FLAT_FLAG = 2;
var CLONE_SYMBOLS_FLAG = 4;
var argsTag3 = "[object Arguments]";
var arrayTag2 = "[object Array]";
var boolTag3 = "[object Boolean]";
var dateTag3 = "[object Date]";
var errorTag2 = "[object Error]";
var funcTag3 = "[object Function]";
var genTag2 = "[object GeneratorFunction]";
var mapTag5 = "[object Map]";
var numberTag3 = "[object Number]";
var objectTag4 = "[object Object]";
var regexpTag3 = "[object RegExp]";
var setTag5 = "[object Set]";
var stringTag3 = "[object String]";
var symbolTag3 = "[object Symbol]";
var weakMapTag3 = "[object WeakMap]";
var arrayBufferTag3 = "[object ArrayBuffer]";
var dataViewTag4 = "[object DataView]";
var float32Tag3 = "[object Float32Array]";
var float64Tag3 = "[object Float64Array]";
var int8Tag3 = "[object Int8Array]";
var int16Tag3 = "[object Int16Array]";
var int32Tag3 = "[object Int32Array]";
var uint8Tag3 = "[object Uint8Array]";
var uint8ClampedTag3 = "[object Uint8ClampedArray]";
var uint16Tag3 = "[object Uint16Array]";
var uint32Tag3 = "[object Uint32Array]";
var cloneableTags = {};
cloneableTags[argsTag3] = cloneableTags[arrayTag2] = cloneableTags[arrayBufferTag3] = cloneableTags[dataViewTag4] = cloneableTags[boolTag3] = cloneableTags[dateTag3] = cloneableTags[float32Tag3] = cloneableTags[float64Tag3] = cloneableTags[int8Tag3] = cloneableTags[int16Tag3] = cloneableTags[int32Tag3] = cloneableTags[mapTag5] = cloneableTags[numberTag3] = cloneableTags[objectTag4] = cloneableTags[regexpTag3] = cloneableTags[setTag5] = cloneableTags[stringTag3] = cloneableTags[symbolTag3] = cloneableTags[uint8Tag3] = cloneableTags[uint8ClampedTag3] = cloneableTags[uint16Tag3] = cloneableTags[uint32Tag3] = true;
cloneableTags[errorTag2] = cloneableTags[funcTag3] = cloneableTags[weakMapTag3] = false;
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== void 0) {
    return result;
  }
  if (!isObject_default(value)) {
    return value;
  }
  var isArr = isArray_default(value);
  if (isArr) {
    result = initCloneArray_default(value);
    if (!isDeep) {
      return copyArray_default(value, result);
    }
  } else {
    var tag = getTag_default(value), isFunc = tag == funcTag3 || tag == genTag2;
    if (isBuffer_default(value)) {
      return cloneBuffer_default(value, isDeep);
    }
    if (tag == objectTag4 || tag == argsTag3 || isFunc && !object) {
      result = isFlat || isFunc ? {} : initCloneObject_default(value);
      if (!isDeep) {
        return isFlat ? copySymbolsIn_default(value, baseAssignIn_default(result, value)) : copySymbols_default(value, baseAssign_default(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag_default(value, tag, isDeep);
    }
  }
  stack || (stack = new Stack_default());
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);
  if (isSet_default(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });
  } else if (isMap_default(value)) {
    value.forEach(function(subValue, key2) {
      result.set(key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
    });
  }
  var keysFunc = isFull ? isFlat ? getAllKeysIn_default : getAllKeys_default : isFlat ? keysIn_default : keys_default;
  var props = isArr ? void 0 : keysFunc(value);
  arrayEach_default(props || value, function(subValue, key2) {
    if (props) {
      key2 = subValue;
      subValue = value[key2];
    }
    assignValue_default(result, key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
  });
  return result;
}
var baseClone_default = baseClone;

// node_modules/lodash-es/compact.js
function compact(array2) {
  var index = -1, length = array2 == null ? 0 : array2.length, resIndex = 0, result = [];
  while (++index < length) {
    var value = array2[index];
    if (value) {
      result[resIndex++] = value;
    }
  }
  return result;
}
var compact_default = compact;

// node_modules/lodash-es/_setCacheAdd.js
var HASH_UNDEFINED3 = "__lodash_hash_undefined__";
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED3);
  return this;
}
var setCacheAdd_default = setCacheAdd;

// node_modules/lodash-es/_setCacheHas.js
function setCacheHas(value) {
  return this.__data__.has(value);
}
var setCacheHas_default = setCacheHas;

// node_modules/lodash-es/_SetCache.js
function SetCache(values) {
  var index = -1, length = values == null ? 0 : values.length;
  this.__data__ = new MapCache_default();
  while (++index < length) {
    this.add(values[index]);
  }
}
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd_default;
SetCache.prototype.has = setCacheHas_default;
var SetCache_default = SetCache;

// node_modules/lodash-es/_cacheHas.js
function cacheHas(cache, key) {
  return cache.has(key);
}
var cacheHas_default = cacheHas;

// node_modules/lodash-es/_setToArray.js
function setToArray(set) {
  var index = -1, result = Array(set.size);
  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}
var setToArray_default = setToArray;

// node_modules/lodash-es/_baseHasIn.js
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}
var baseHasIn_default = baseHasIn;

// node_modules/lodash-es/_hasPath.js
function hasPath(object, path, hasFunc) {
  path = castPath_default(path, object);
  var index = -1, length = path.length, result = false;
  while (++index < length) {
    var key = toKey_default(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength_default(length) && isIndex_default(key, length) && (isArray_default(object) || isArguments_default(object));
}
var hasPath_default = hasPath;

// node_modules/lodash-es/hasIn.js
function hasIn(object, path) {
  return object != null && hasPath_default(object, path, baseHasIn_default);
}
var hasIn_default = hasIn;

// node_modules/lodash-es/_baseProperty.js
function baseProperty(key) {
  return function(object) {
    return object == null ? void 0 : object[key];
  };
}
var baseProperty_default = baseProperty;

// node_modules/lodash-es/_arrayIncludesWith.js
function arrayIncludesWith(array2, value, comparator) {
  var index = -1, length = array2 == null ? 0 : array2.length;
  while (++index < length) {
    if (comparator(value, array2[index])) {
      return true;
    }
  }
  return false;
}
var arrayIncludesWith_default = arrayIncludesWith;

// node_modules/lodash-es/last.js
function last(array2) {
  var length = array2 == null ? 0 : array2.length;
  return length ? array2[length - 1] : void 0;
}
var last_default = last;

// node_modules/lodash-es/endsWith.js
function endsWith(string3, target, position) {
  string3 = toString_default(string3);
  target = baseToString_default(target);
  var length = string3.length;
  position = position === void 0 ? length : baseClamp_default(toInteger_default(position), 0, length);
  var end = position;
  position -= target.length;
  return position >= 0 && string3.slice(position, end) == target;
}
var endsWith_default = endsWith;

// node_modules/lodash-es/_baseHas.js
var objectProto15 = Object.prototype;
var hasOwnProperty12 = objectProto15.hasOwnProperty;
function baseHas(object, key) {
  return object != null && hasOwnProperty12.call(object, key);
}
var baseHas_default = baseHas;

// node_modules/lodash-es/has.js
function has(object, path) {
  return object != null && hasPath_default(object, path, baseHas_default);
}
var has_default = has;

// node_modules/lodash-es/_baseInRange.js
var nativeMax3 = Math.max;
var nativeMin2 = Math.min;
function baseInRange(number, start, end) {
  return number >= nativeMin2(start, end) && number < nativeMax3(start, end);
}
var baseInRange_default = baseInRange;

// node_modules/lodash-es/inRange.js
function inRange(number, start, end) {
  start = toFinite_default(start);
  if (end === void 0) {
    end = start;
    start = 0;
  } else {
    end = toFinite_default(end);
  }
  number = toNumber_default(number);
  return baseInRange_default(number, start, end);
}
var inRange_default = inRange;

// node_modules/lodash-es/_parent.js
function parent(object, path) {
  return path.length < 2 ? object : baseGet_default(object, baseSlice_default(path, 0, -1));
}
var parent_default = parent;

// node_modules/lodash-es/isFinite.js
var nativeIsFinite2 = root_default.isFinite;
function isFinite2(value) {
  return typeof value == "number" && nativeIsFinite2(value);
}
var isFinite_default = isFinite2;

// node_modules/lodash-es/_baseIsRegExp.js
var regexpTag4 = "[object RegExp]";
function baseIsRegExp(value) {
  return isObjectLike_default(value) && baseGetTag_default(value) == regexpTag4;
}
var baseIsRegExp_default = baseIsRegExp;

// node_modules/lodash-es/isRegExp.js
var nodeIsRegExp = nodeUtil_default && nodeUtil_default.isRegExp;
var isRegExp = nodeIsRegExp ? baseUnary_default(nodeIsRegExp) : baseIsRegExp_default;
var isRegExp_default = isRegExp;

// node_modules/lodash-es/kebabCase.js
var kebabCase = createCompounder_default(function(result, word, index) {
  return result + (index ? "-" : "") + word.toLowerCase();
});
var kebabCase_default = kebabCase;

// node_modules/lodash-es/_baseSum.js
function baseSum(array2, iteratee) {
  var result, index = -1, length = array2.length;
  while (++index < length) {
    var current = iteratee(array2[index]);
    if (current !== void 0) {
      result = result === void 0 ? current : result + current;
    }
  }
  return result;
}
var baseSum_default = baseSum;

// node_modules/lodash-es/_baseUnset.js
var objectProto16 = Object.prototype;
var hasOwnProperty13 = objectProto16.hasOwnProperty;
function baseUnset(object, path) {
  path = castPath_default(path, object);
  var index = -1, length = path.length;
  if (!length) {
    return true;
  }
  while (++index < length) {
    var key = toKey_default(path[index]);
    if (key === "__proto__" && !hasOwnProperty13.call(object, "__proto__")) {
      return false;
    }
    if ((key === "constructor" || key === "prototype") && index < length - 1) {
      return false;
    }
  }
  var obj = parent_default(object, path);
  return obj == null || delete obj[toKey_default(last_default(path))];
}
var baseUnset_default = baseUnset;

// node_modules/lodash-es/_customOmitClone.js
function customOmitClone(value) {
  return isPlainObject_default(value) ? void 0 : value;
}
var customOmitClone_default = customOmitClone;

// node_modules/lodash-es/omit.js
var CLONE_DEEP_FLAG2 = 1;
var CLONE_FLAT_FLAG2 = 2;
var CLONE_SYMBOLS_FLAG2 = 4;
var omit = flatRest_default(function(object, paths) {
  var result = {};
  if (object == null) {
    return result;
  }
  var isDeep = false;
  paths = arrayMap_default(paths, function(path) {
    path = castPath_default(path, object);
    isDeep || (isDeep = path.length > 1);
    return path;
  });
  copyObject_default(object, getAllKeysIn_default(object), result);
  if (isDeep) {
    result = baseClone_default(result, CLONE_DEEP_FLAG2 | CLONE_FLAT_FLAG2 | CLONE_SYMBOLS_FLAG2, customOmitClone_default);
  }
  var length = paths.length;
  while (length--) {
    baseUnset_default(result, paths[length]);
  }
  return result;
});
var omit_default = omit;

// node_modules/lodash-es/_baseSet.js
function baseSet(object, path, value, customizer) {
  if (!isObject_default(object)) {
    return object;
  }
  path = castPath_default(path, object);
  var index = -1, length = path.length, lastIndex = length - 1, nested = object;
  while (nested != null && ++index < length) {
    var key = toKey_default(path[index]), newValue = value;
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return object;
    }
    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : void 0;
      if (newValue === void 0) {
        newValue = isObject_default(objValue) ? objValue : isIndex_default(path[index + 1]) ? [] : {};
      }
    }
    assignValue_default(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}
var baseSet_default = baseSet;

// node_modules/lodash-es/_basePickBy.js
function basePickBy(object, paths, predicate) {
  var index = -1, length = paths.length, result = {};
  while (++index < length) {
    var path = paths[index], value = baseGet_default(object, path);
    if (predicate(value, path)) {
      baseSet_default(result, castPath_default(path, object), value);
    }
  }
  return result;
}
var basePickBy_default = basePickBy;

// node_modules/lodash-es/_asciiSize.js
var asciiSize = baseProperty_default("length");
var asciiSize_default = asciiSize;

// node_modules/lodash-es/_unicodeSize.js
var rsAstralRange4 = "\\ud800-\\udfff";
var rsComboMarksRange5 = "\\u0300-\\u036f";
var reComboHalfMarksRange5 = "\\ufe20-\\ufe2f";
var rsComboSymbolsRange5 = "\\u20d0-\\u20ff";
var rsComboRange5 = rsComboMarksRange5 + reComboHalfMarksRange5 + rsComboSymbolsRange5;
var rsVarRange4 = "\\ufe0e\\ufe0f";
var rsAstral2 = "[" + rsAstralRange4 + "]";
var rsCombo4 = "[" + rsComboRange5 + "]";
var rsFitz3 = "\\ud83c[\\udffb-\\udfff]";
var rsModifier3 = "(?:" + rsCombo4 + "|" + rsFitz3 + ")";
var rsNonAstral3 = "[^" + rsAstralRange4 + "]";
var rsRegional3 = "(?:\\ud83c[\\udde6-\\uddff]){2}";
var rsSurrPair3 = "[\\ud800-\\udbff][\\udc00-\\udfff]";
var rsZWJ4 = "\\u200d";
var reOptMod3 = rsModifier3 + "?";
var rsOptVar3 = "[" + rsVarRange4 + "]?";
var rsOptJoin3 = "(?:" + rsZWJ4 + "(?:" + [rsNonAstral3, rsRegional3, rsSurrPair3].join("|") + ")" + rsOptVar3 + reOptMod3 + ")*";
var rsSeq3 = rsOptVar3 + reOptMod3 + rsOptJoin3;
var rsSymbol2 = "(?:" + [rsNonAstral3 + rsCombo4 + "?", rsCombo4, rsRegional3, rsSurrPair3, rsAstral2].join("|") + ")";
var reUnicode2 = RegExp(rsFitz3 + "(?=" + rsFitz3 + ")|" + rsSymbol2 + rsSeq3, "g");
function unicodeSize(string3) {
  var result = reUnicode2.lastIndex = 0;
  while (reUnicode2.test(string3)) {
    ++result;
  }
  return result;
}
var unicodeSize_default = unicodeSize;

// node_modules/lodash-es/_stringSize.js
function stringSize(string3) {
  return hasUnicode_default(string3) ? unicodeSize_default(string3) : asciiSize_default(string3);
}
var stringSize_default = stringSize;

// node_modules/lodash-es/_basePick.js
function basePick(object, paths) {
  return basePickBy_default(object, paths, function(value, path) {
    return hasIn_default(object, path);
  });
}
var basePick_default = basePick;

// node_modules/lodash-es/pick.js
var pick = flatRest_default(function(object, paths) {
  return object == null ? {} : basePick_default(object, paths);
});
var pick_default = pick;

// node_modules/lodash-es/round.js
var round = createRound_default("round");
var round_default = round;

// node_modules/lodash-es/snakeCase.js
var snakeCase = createCompounder_default(function(result, word, index) {
  return result + (index ? "_" : "") + word.toLowerCase();
});
var snakeCase_default = snakeCase;

// node_modules/lodash-es/startsWith.js
function startsWith(string3, target, position) {
  string3 = toString_default(string3);
  position = position == null ? 0 : baseClamp_default(toInteger_default(position), 0, string3.length);
  target = baseToString_default(target);
  return string3.slice(position, position + target.length) == target;
}
var startsWith_default = startsWith;

// node_modules/lodash-es/sum.js
function sum(array2) {
  return array2 && array2.length ? baseSum_default(array2, identity_default) : 0;
}
var sum_default = sum;

// node_modules/lodash-es/truncate.js
var DEFAULT_TRUNC_LENGTH = 30;
var DEFAULT_TRUNC_OMISSION = "...";
var reFlags2 = /\w*$/;
function truncate(string3, options) {
  var length = DEFAULT_TRUNC_LENGTH, omission = DEFAULT_TRUNC_OMISSION;
  if (isObject_default(options)) {
    var separator = "separator" in options ? options.separator : separator;
    length = "length" in options ? toInteger_default(options.length) : length;
    omission = "omission" in options ? baseToString_default(options.omission) : omission;
  }
  string3 = toString_default(string3);
  var strLength = string3.length;
  if (hasUnicode_default(string3)) {
    var strSymbols = stringToArray_default(string3);
    strLength = strSymbols.length;
  }
  if (length >= strLength) {
    return string3;
  }
  var end = length - stringSize_default(omission);
  if (end < 1) {
    return omission;
  }
  var result = strSymbols ? castSlice_default(strSymbols, 0, end).join("") : string3.slice(0, end);
  if (separator === void 0) {
    return result + omission;
  }
  if (strSymbols) {
    end += result.length - end;
  }
  if (isRegExp_default(separator)) {
    if (string3.slice(end).search(separator)) {
      var match, substring = result;
      if (!separator.global) {
        separator = RegExp(separator.source, toString_default(reFlags2.exec(separator)) + "g");
      }
      separator.lastIndex = 0;
      while (match = separator.exec(substring)) {
        var newEnd = match.index;
      }
      result = result.slice(0, newEnd === void 0 ? end : newEnd);
    }
  } else if (string3.indexOf(baseToString_default(separator), end) != end) {
    var index = result.lastIndexOf(separator);
    if (index > -1) {
      result = result.slice(0, index);
    }
  }
  return result + omission;
}
var truncate_default = truncate;

// node_modules/lodash-es/_createSet.js
var INFINITY4 = 1 / 0;
var createSet = !(Set_default && 1 / setToArray_default(new Set_default([, -0]))[1] == INFINITY4) ? noop_default : function(values) {
  return new Set_default(values);
};
var createSet_default = createSet;

// node_modules/lodash-es/_baseUniq.js
var LARGE_ARRAY_SIZE2 = 200;
function baseUniq(array2, iteratee, comparator) {
  var index = -1, includes = arrayIncludes_default, length = array2.length, isCommon = true, result = [], seen = result;
  if (comparator) {
    isCommon = false;
    includes = arrayIncludesWith_default;
  } else if (length >= LARGE_ARRAY_SIZE2) {
    var set = iteratee ? null : createSet_default(array2);
    if (set) {
      return setToArray_default(set);
    }
    isCommon = false;
    includes = cacheHas_default;
    seen = new SetCache_default();
  } else {
    seen = iteratee ? [] : result;
  }
  outer:
    while (++index < length) {
      var value = array2[index], computed = iteratee ? iteratee(value) : value;
      value = comparator || value !== 0 ? value : 0;
      if (isCommon && computed === computed) {
        var seenIndex = seen.length;
        while (seenIndex--) {
          if (seen[seenIndex] === computed) {
            continue outer;
          }
        }
        if (iteratee) {
          seen.push(computed);
        }
        result.push(value);
      } else if (!includes(seen, computed, comparator)) {
        if (seen !== result) {
          seen.push(computed);
        }
        result.push(value);
      }
    }
  return result;
}
var baseUniq_default = baseUniq;

// node_modules/lodash-es/uniq.js
function uniq(array2) {
  return array2 && array2.length ? baseUniq_default(array2) : [];
}
var uniq_default = uniq;

// node_modules/@dinilmusick/gutts/dist/arrays/array-operations.js
function compact2(values) {
  return compact_default(values);
}
function unique(values) {
  return uniq_default(values);
}
function chunk2(values, size) {
  if (!Number.isInteger(size) || size <= 0)
    throw new RangeError("size must be a positive integer");
  return chunk_default(values, size);
}
function flatten2(values) {
  return flatten_default(values);
}
function last2(values) {
  return last_default(values);
}

// node_modules/@dinilmusick/gutts/dist/json/json-value.js
function isJsonValue(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return true;
  if (typeof value === "number")
    return Number.isFinite(value);
  if (Array.isArray(value))
    return value.every(isJsonValue);
  if (typeof value === "object")
    return Object.values(value).every(isJsonValue);
  return false;
}

// node_modules/@dinilmusick/gutts/dist/json/json-parse.js
function parseJson(text) {
  return JSON.parse(text);
}
function tryParseJson(text) {
  try {
    return parseJson(text);
  } catch {
    return void 0;
  }
}
function stringifyJson(value, space) {
  const result = JSON.stringify(value, null, space);
  if (result === void 0)
    throw new TypeError("Value could not be serialized as JSON");
  return result;
}

// node_modules/@dinilmusick/gutts/dist/numbers/number-operations.js
function clamp2(value, min, max) {
  if (min > max)
    throw new RangeError("min must not exceed max");
  return clamp_default(value, min, max);
}
function inRange2(value, min, max) {
  if (min > max)
    throw new RangeError("min must not exceed max");
  return inRange_default(value, min, max);
}
function roundTo(value, decimals = 0) {
  if (!Number.isInteger(decimals) || decimals < 0)
    throw new RangeError("decimals must be a non-negative integer");
  return round_default(value, decimals);
}
function isFiniteNumber(value) {
  return typeof value === "number" && isFinite_default(value);
}
function sum2(values) {
  return sum_default(values);
}

// node_modules/@dinilmusick/gutts/dist/objects/object-operations.js
function hasOwn(value, key) {
  return has_default(value, key);
}
function pick2(value, keys2) {
  return pick_default(value, keys2);
}
function omit2(value, keys2) {
  return omit_default(value, keys2);
}
function isPlainObject2(value) {
  return isPlainObject_default(value);
}

// node_modules/@dinilmusick/gutts/dist/strings/string-predicates.js
var import_validator = __toESM(require_validator(), 1);
function isBlank(value) {
  return value.trim().length === 0;
}
function isNonBlank(value) {
  return !isBlank(value);
}
function isEmail(value) {
  return import_validator.default.isEmail(value);
}
function startsWithAny(value, prefixes) {
  return prefixes.some((prefix) => startsWith_default(value, prefix));
}
function endsWithAny(value, suffixes) {
  return suffixes.some((suffix) => endsWith_default(value, suffix));
}

// node_modules/@dinilmusick/gutts/dist/strings/string-transform.js
function capitalize2(value) {
  return capitalize_default(value);
}
function camelCase2(value) {
  return camelCase_default(value);
}
function kebabCase2(value) {
  return kebabCase_default(value);
}
function snakeCase2(value) {
  return snakeCase_default(value);
}
function truncate2(value, maxLength, suffix = "\u2026") {
  if (maxLength < 0)
    throw new RangeError("maxLength must be non-negative");
  return truncate_default(value, { length: maxLength, omission: suffix });
}

// node_modules/@dinilmusick/gutts/dist/strings/string-truncate-words.js
function truncateWords(value, maxWords, suffix = "\u2026") {
  if (maxWords < 0)
    throw new RangeError("maxWords must be non-negative");
  if (!value)
    return "";
  const words2 = value.trim().split(/\s+/);
  if (words2.length <= maxWords)
    return value;
  return `${words2.slice(0, maxWords).join(" ")}${suffix}`;
}

// node_modules/@dinilmusick/gutts/dist/urls/url-operations.js
function isUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
function joinUrl(base, ...parts) {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedParts = parts.map((part) => part.replace(/^\/+|\/+$/g, ""));
  return [normalizedBase, ...normalizedParts].filter(Boolean).join("/");
}
function getQueryParam(url, key) {
  return new URL(url).searchParams.get(key);
}
function setQueryParam(url, key, value) {
  const result = new URL(url);
  result.searchParams.set(key, value);
  return result.toString();
}

// node_modules/@dinilmusick/gutts/dist/api/fod-runtime.js
var utilityFunctions = {
  compact: (i) => compact2(i.values),
  unique: (i) => unique(i.values),
  chunk: (i) => chunk2(i.values, i.size),
  flatten: (i) => flatten2(i.values),
  last: (i) => last2(i.values),
  isJsonValue: (i) => isJsonValue(i.value),
  parseJson: (i) => parseJson(i.text),
  tryParseJson: (i) => tryParseJson(i.text),
  stringifyJson: (i) => stringifyJson(i.value, i.space),
  clamp: (i) => clamp2(i.value, i.min, i.max),
  inRange: (i) => inRange2(i.value, i.min, i.max),
  roundTo: (i) => roundTo(i.value, i.decimals),
  isFiniteNumber: (i) => isFiniteNumber(i.value),
  sum: (i) => sum2(i.values),
  hasOwn: (i) => hasOwn(i.value, i.key),
  pick: (i) => pick2(i.value, i.keys),
  omit: (i) => omit2(i.value, i.keys),
  isPlainObject: (i) => isPlainObject2(i.value),
  isBlank: (i) => isBlank(i.value),
  isNonBlank: (i) => isNonBlank(i.value),
  isEmail: (i) => isEmail(i.value),
  startsWithAny: (i) => startsWithAny(i.value, i.prefixes),
  endsWithAny: (i) => endsWithAny(i.value, i.suffixes),
  capitalize: (i) => capitalize2(i.value),
  camelCase: (i) => camelCase2(i.value),
  kebabCase: (i) => kebabCase2(i.value),
  snakeCase: (i) => snakeCase2(i.value),
  truncate: (i) => truncate2(i.value, i.maxLength, i.suffix),
  truncateWords: (i) => truncateWords(i.value, i.maxWords, i.suffix),
  isUrl: (i) => isUrl(i.value),
  joinUrl: (i) => joinUrl(i.base, ...i.parts),
  getQueryParam: (i) => getQueryParam(i.url, i.key),
  setQueryParam: (i) => setQueryParam(i.url, i.key, i.value)
};
async function executeGuttsApi(apiId, input) {
  const api = guttsApiById[apiId];
  if (!api)
    throw new Error(`Unknown GutTS API '${apiId}'.`);
  const fn = utilityFunctions[api.name];
  if (!fn)
    throw new Error(`GutTS API '${apiId}' has metadata but no embedded runtime adapter.`);
  return await fn(input);
}

// node_modules/@ultrst-armada/kloks/packages/aiko/dist/index.js
var AikoRuntime = class {
  options;
  agents = /* @__PURE__ */ new Map();
  constructor(options) {
    this.options = options;
    for (const agent of options.customAgents ?? []) this.agents.set(agent.id, agent);
  }
  async listCapabilities() {
    const caps = this.options.capabilities;
    return typeof caps === "function" ? await caps() : caps;
  }
  async refreshAgents() {
    const capabilities = await this.listCapabilities();
    const next = /* @__PURE__ */ new Map();
    for (const agent of this.agents.values()) {
      if (agent.custom || agent.sourceKind === "custom") next.set(agent.id, agent);
    }
    for (const capability of capabilities) {
      const tool = { id: capability.id, name: capability.name, description: capability.description, inputSchema: capability.inputSchema, execute: capability.execute, sourceKind: capability.sourceKind, sourceId: capability.sourceId };
      const resolved = await this.options.resolver.resolve(void 0, { tool });
      const agent = {
        schemaVersion: "1.0.0",
        id: "aiko-" + capability.sourceKind + "-" + capability.sourceId,
        name: capability.name + " Agent",
        description: capability.description ?? "Aiko agent for " + capability.name,
        agentType: capability.sourceKind === "endpoint" ? "ENDPOINT" : "TOOL",
        tool,
        intelligenceSpec: resolved.spec,
        intelligenceSpecId: resolved.specId,
        sourceKind: capability.sourceKind,
        sourceId: capability.sourceId
      };
      next.set(agent.id, agent);
    }
    this.agents.clear();
    for (const agent of next.values()) this.agents.set(agent.id, agent);
    return [...this.agents.values()];
  }
  async listAgents() {
    return this.agents.size ? [...this.agents.values()] : this.refreshAgents();
  }
  async executeAgent(agentId, input) {
    const agent = this.agents.get(agentId) ?? (await this.refreshAgents()).find((item) => item.id === agentId);
    if (!agent) throw new Error("Aiko agent not found: " + agentId);
    const resolvedInput = typeof input === "string" && this.options.resolveNaturalLanguage ? await this.options.resolveNaturalLanguage(agent, input) : input;
    return agent.tool.execute(resolvedInput);
  }
  async createCustomAgent(name, capabilityIds, specId) {
    const capabilities = await this.listCapabilities();
    const allowed = capabilities.filter((item) => capabilityIds.includes(item.id));
    if (allowed.length === 0) throw new Error("A custom Aiko agent requires at least one permitted capability.");
    const resolved = await this.options.resolver.resolve(specId, {});
    const tool = { id: "custom-" + name, name, description: "Custom Aiko capability set", execute: async (input) => {
      const request = input;
      if (!request?.toolId || !capabilityIds.includes(request.toolId)) throw new Error("Capability is not permitted for this custom agent.");
      const capability = allowed.find((item) => item.id === request.toolId);
      if (!capability) throw new Error("Capability not found.");
      return capability.execute(request.input);
    }, sourceKind: "custom", sourceId: name };
    const agent = { schemaVersion: "1.0.0", id: "aiko-custom-" + name.toLowerCase().replace(/\s+/g, "-"), name, description: "Custom Aiko agent", agentType: "AIKO", tool, intelligenceSpec: resolved.spec, intelligenceSpecId: resolved.specId, sourceKind: "custom", sourceId: name, allowedToolIds: capabilityIds, custom: true };
    this.agents.set(agent.id, agent);
    return agent;
  }
  listKeys() {
    return this.options.keys.listKeys();
  }
  getActiveKey(providerId) {
    return this.options.keys.getActiveKey(providerId);
  }
  rotateKey(providerId) {
    return this.options.keys.rotateKey(providerId);
  }
  syncFromAikoEngine() {
    return this.options.keys.syncFromAikoEngine();
  }
  addKey(input) {
    if (!this.options.keys.addKey) throw new Error("Local Aiko key storage is unavailable.");
    return this.options.keys.addKey(input);
  }
};

// node_modules/@ultrst-armada/kloks/packages/backend/dist/chunk-MAMK4GDH.js
var AITransportClient = class {
  defaultTimeoutMs;
  fetchImpl;
  constructor(config) {
    this.defaultTimeoutMs = config?.defaultTimeoutMs ?? 3e4;
    this.fetchImpl = config?.customFetch ?? globalThis.fetch;
  }
  async request(req) {
    const timeoutMs = req.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, timeoutMs);
    if (req.signal) {
      if (req.signal.aborted) {
        clearTimeout(timeoutId);
        throw new Error("Request was aborted prior to execution");
      }
      req.signal.addEventListener("abort", () => controller.abort());
    }
    const headers = {
      Accept: "application/json",
      ...req.headers || {}
    };
    let bodyPayload;
    if (req.body !== void 0 && req.body !== null && req.method !== "GET" && req.method !== "HEAD") {
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
      bodyPayload = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }
    try {
      const response = await this.fetchImpl(req.url, {
        method: req.method || "GET",
        headers,
        body: bodyPayload,
        signal: controller.signal
      });
      const resHeaders = {};
      response.headers.forEach((v2, k) => {
        resHeaders[k.toLowerCase()] = v2;
      });
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
      return {
        status: response.status,
        ok: response.ok,
        headers: resHeaders,
        data,
        rawText
      };
    } catch (err) {
      if (isTimedOut) {
        throw new Error(`AI request timed out after ${timeoutMs}ms against ${req.url}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

// node_modules/@ultrst-armada/kloks/packages/backend/dist/chunk-JSQZAFBU.js
var PROVIDERS_META = {
  google: {
    id: "google",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    modelsEndpoint: "/v1beta/models",
    defaultHeaderKey: "x-goog-api-key",
    supportsCreditsCheck: true,
    docUrl: "https://ai.google.dev",
    description: "Gemini 2.5/3.0 Flash, Gemini Pro, Multimodal AI",
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 1048576
    }
  },
  cerebras: {
    id: "cerebras",
    name: "Cerebras Systems",
    baseUrl: "https://api.cerebras.ai",
    modelsEndpoint: "/v1/models",
    defaultHeaderKey: "Authorization",
    supportsCreditsCheck: true,
    docUrl: "https://cerebras.ai",
    description: "Wafer-scale ultra-fast Llama inference engine",
    capabilities: {
      supportsTools: true,
      supportsVision: false,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 131072
    }
  },
  groq: {
    id: "groq",
    name: "Groq LPU",
    baseUrl: "https://api.groq.com/openai",
    modelsEndpoint: "/v1/models",
    defaultHeaderKey: "Authorization",
    supportsCreditsCheck: true,
    docUrl: "https://groq.com",
    description: "Ultra-low latency LPU hardware inference",
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 131072
    }
  },
  huggingface: {
    id: "huggingface",
    name: "Hugging Face Hub",
    baseUrl: "https://api-inference.huggingface.co",
    modelsEndpoint: "/models",
    defaultHeaderKey: "Authorization",
    supportsCreditsCheck: false,
    docUrl: "https://huggingface.co",
    description: "Open source models & Inference Endpoints",
    capabilities: {
      supportsTools: false,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: false,
      supportsCreditsCheck: false,
      maxContextWindow: 32768
    }
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api",
    modelsEndpoint: "/v1/models",
    defaultHeaderKey: "Authorization",
    supportsCreditsCheck: true,
    docUrl: "https://openrouter.ai",
    description: "Unified gateway to 100+ multi-vendor models",
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 2e6
    }
  },
  together: {
    id: "together",
    name: "Together AI",
    baseUrl: "https://api.together.xyz",
    modelsEndpoint: "/v1/models",
    defaultHeaderKey: "Authorization",
    supportsCreditsCheck: true,
    docUrl: "https://together.ai",
    description: "High-throughput open source models",
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 131072
    }
  },
  nvidia: {
    id: "nvidia",
    name: "NVIDIA NIM",
    baseUrl: "https://integrate.api.nvidia.com",
    modelsEndpoint: "/v1/models",
    defaultHeaderKey: "Authorization",
    supportsCreditsCheck: true,
    docUrl: "https://build.nvidia.com",
    description: "NVIDIA NIM Enterprise & Open Models",
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 131072
    }
  }
};
function getProviderMeta(providerId) {
  return PROVIDERS_META[providerId];
}
function listProviders() {
  return Object.values(PROVIDERS_META);
}

// node_modules/@ultrst-armada/kloks/packages/backend/dist/chunk-SLR6SIEU.js
var AIProviderService = class {
  client;
  customProviders = /* @__PURE__ */ new Map();
  constructor(client) {
    this.client = client ?? new AITransportClient();
  }
  listProviders() {
    const builtin = listProviders();
    const custom = Array.from(this.customProviders.values());
    return [...builtin, ...custom];
  }
  getProvider(id) {
    return this.customProviders.get(id) ?? getProviderMeta(id);
  }
  registerCustomProvider(meta) {
    this.customProviders.set(meta.id, meta);
  }
  async checkHealth(id, apiKey) {
    const meta = this.getProvider(id);
    const start = Date.now();
    if (!meta) {
      return {
        id,
        isOnline: false,
        latencyMs: 0,
        lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString(),
        error: `Unknown provider ${id}`
      };
    }
    try {
      const url = `${meta.baseUrl}${meta.modelsEndpoint}`;
      const headers = {};
      if (apiKey) {
        if (meta.defaultHeaderKey === "Authorization") {
          headers["Authorization"] = `Bearer ${apiKey.trim()}`;
        } else {
          headers[meta.defaultHeaderKey] = apiKey.trim();
        }
      }
      const res = await this.client.request({
        url,
        method: "GET",
        headers,
        timeoutMs: 8e3
      });
      return {
        id,
        isOnline: res.status < 500,
        latencyMs: Date.now() - start,
        lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (err) {
      return {
        id,
        isOnline: false,
        latencyMs: Date.now() - start,
        lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString(),
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
};
var aiProviderService = new AIProviderService();

// node_modules/@ultrst-armada/kloks/packages/backend/dist/chunk-P7H6TIEA.js
var KeysStorage = class {
  inMemoryKeys = /* @__PURE__ */ new Map();
  loadKeys() {
    return Array.from(this.inMemoryKeys.values());
  }
  saveKey(entry) {
    this.inMemoryKeys.set(entry.id, entry);
  }
  saveKeys(entries) {
    for (const e of entries) {
      this.inMemoryKeys.set(e.id, e);
    }
  }
  deleteKey(id) {
    this.inMemoryKeys.delete(id);
  }
  clear() {
    this.inMemoryKeys.clear();
  }
};
var keysStorage = new KeysStorage();
async function validateApiKey(providerId, apiKey) {
  const meta = getProviderMeta(providerId);
  const start = Date.now();
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      valid: false,
      status: "invalid",
      error: "Empty API key provided",
      latencyMs: 0
    };
  }
  if (!meta) {
    return {
      valid: true,
      status: "valid",
      latencyMs: 0
    };
  }
  try {
    const url = `${meta.baseUrl}${meta.modelsEndpoint}`;
    const headers = {};
    if (meta.defaultHeaderKey === "Authorization") {
      headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    } else {
      headers[meta.defaultHeaderKey] = apiKey.trim();
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8e3);
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal
    }).finally(() => clearTimeout(timer));
    const latencyMs = Date.now() - start;
    if (res.status === 401 || res.status === 403) {
      return {
        valid: false,
        status: "invalid",
        error: `Authentication failed (HTTP ${res.status})`,
        latencyMs
      };
    }
    if (res.status === 429) {
      return {
        valid: false,
        status: "rate-limited",
        error: "Rate limit or quota exceeded",
        latencyMs
      };
    }
    return {
      valid: res.status < 500,
      status: "valid",
      latencyMs
    };
  } catch (err) {
    return {
      valid: false,
      status: "invalid",
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start
    };
  }
}
var KeyStoreService = class {
  strategy = "lowest-latency";
  roundRobinIndices = /* @__PURE__ */ new Map();
  forcedNextKeys = /* @__PURE__ */ new Map();
  permanentKeys = /* @__PURE__ */ new Map();
  getKeys(providerId, _modelId) {
    const all = keysStorage.loadKeys();
    if (!providerId) return all;
    return all.filter((k) => k.providerId === providerId);
  }
  getKey(id) {
    return keysStorage.loadKeys().find((k) => k.id === id);
  }
  getActiveKey(providerId) {
    const valid = this.getKeys(providerId).filter(
      (k) => k.isActive && (k.status === "active" || k.status === "valid")
    );
    if (valid.length === 0) return void 0;
    if (this.strategy === "lowest-latency") {
      return [...valid].sort((a2, b2) => a2.lastLatencyMs - b2.lastLatencyMs)[0];
    }
    if (this.strategy === "round-robin") {
      const idx = this.roundRobinIndices.get(providerId) ?? 0;
      const nextIdx = (idx + 1) % valid.length;
      this.roundRobinIndices.set(providerId, nextIdx);
      return valid[idx % valid.length];
    }
    if (this.strategy === "failover-priority") {
      return [...valid].sort((a2, b2) => (b2.weight ?? 1) - (a2.weight ?? 1))[0];
    }
    return valid[0];
  }
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  getStrategy() {
    return this.strategy;
  }
  addKey(entry) {
    const full = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastLatencyMs: 0,
      errorCount: 0,
      status: "active",
      isActive: true,
      remainingCreditsUsd: null,
      weight: 5,
      ...entry
    };
    keysStorage.saveKey(full);
    return full;
  }
  getPermanentKey(providerId) {
    return this.permanentKeys.get(providerId) ?? null;
  }
  getPermanentKeysMap() {
    return Object.fromEntries(this.permanentKeys.entries());
  }
  setPermanentKey(providerId, keyId) {
    if (keyId) this.permanentKeys.set(providerId, keyId);
    else this.permanentKeys.delete(providerId);
  }
  setForcedNextKey(providerId, keyId) {
    this.forcedNextKeys.set(providerId, keyId);
  }
  peekNextKey(providerId, _modelId) {
    const keys2 = this.getKeys(providerId).filter((key) => key.status !== "invalid" && key.isActive);
    const forced = this.forcedNextKeys.get(providerId);
    const permanent = this.permanentKeys.get(providerId);
    return forced && this.getKey(forced) || permanent && this.getKey(permanent) || keys2[0] || null;
  }
  getNextKey(providerId, modelId) {
    const key = this.peekNextKey(providerId, modelId);
    this.forcedNextKeys.delete(providerId);
    return key;
  }
  selectNextKey(providerId, _modelId) {
    return this.getActiveKey(providerId);
  }
  rotateKey(providerId) {
    return this.getNextKey(providerId);
  }
  updateKeyLabel(id, label) {
    const key = this.getKey(id);
    if (!key) return void 0;
    key.label = label;
    keysStorage.saveKey(key);
    return key;
  }
  deleteKey(id) {
    const existed = Boolean(this.getKey(id));
    keysStorage.deleteKey(id);
    return existed;
  }
  resetKeyProbabilities(id) {
    const key = this.getKey(id);
    if (!key) return void 0;
    key.weight = 5;
    key.errorCount = 0;
    key.status = "active";
    key.isActive = true;
    keysStorage.saveKey(key);
    return key;
  }
  resetAllFailures() {
    for (const key of this.getKeys()) {
      key.errorCount = 0;
      key.status = "active";
      key.isActive = true;
      keysStorage.saveKey(key);
    }
  }
  getUsageStats(_keyId, _modelId) {
    return [];
  }
  updateKeyStatus(id, status) {
    const key = this.getKey(id);
    if (!key) return;
    key.status = status;
    keysStorage.saveKey(key);
  }
  recordUsage(keyId, successOrLatency, latencyOrSuccess, _costUsd = 0, _modelId, error) {
    const key = this.getKey(keyId);
    if (!key) return;
    const success = typeof successOrLatency === "boolean" ? successOrLatency : Boolean(latencyOrSuccess);
    const latencyMs = typeof successOrLatency === "number" ? successOrLatency : Number(latencyOrSuccess);
    key.totalCalls++;
    key.lastLatencyMs = latencyMs;
    key.lastUsedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (success) key.successfulCalls++;
    else {
      key.failedCalls++;
      key.errorCount++;
      key.validationError = error ?? key.validationError;
    }
    keysStorage.saveKey(key);
  }
  exportKeysStructured() {
    return { version: 1, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), keys: this.getKeys() };
  }
  async importKeys(payload) {
    const raw = payload?.keys ?? payload;
    if (!Array.isArray(raw)) throw new Error("Invalid key backup payload.");
    const keys2 = raw.filter(
      (entry) => Boolean(entry && typeof entry.id === "string" && typeof entry.providerId === "string" && typeof entry.key === "string")
    );
    keysStorage.saveKeys(keys2);
    return { importedCount: keys2.length, keys: keys2 };
  }
  async verifyKey(id) {
    const entry = this.getKey(id);
    if (!entry) return false;
    const res = await validateApiKey(entry.providerId, entry.key);
    entry.status = res.status;
    entry.lastLatencyMs = res.latencyMs;
    entry.validationError = res.error;
    keysStorage.saveKey(entry);
    return res.valid;
  }
};
var keyStore = new KeyStoreService();

// node_modules/@ultrst-armada/kloks/packages/backend/dist/chunk-EREYT3WJ.js
var STATIC_MODELS_CATALOG = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    providerId: "google",
    contextWindow: 1048576,
    inputCostPer1k: 15e-5,
    outputCostPer1k: 6e-4,
    supportsTools: true,
    supportsVision: true,
    supportsJson: true,
    isFree: true,
    latencyRatingMs: 250,
    qualityRating: 92,
    status: "active"
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    providerId: "google",
    contextWindow: 2097152,
    inputCostPer1k: 125e-5,
    outputCostPer1k: 5e-3,
    supportsTools: true,
    supportsVision: true,
    supportsJson: true,
    isFree: false,
    latencyRatingMs: 800,
    qualityRating: 97,
    status: "active"
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    providerId: "groq",
    contextWindow: 131072,
    inputCostPer1k: 59e-5,
    outputCostPer1k: 79e-5,
    supportsTools: true,
    supportsVision: false,
    supportsJson: true,
    isFree: true,
    latencyRatingMs: 120,
    qualityRating: 89,
    status: "active"
  },
  {
    id: "llama3.1-8b",
    name: "Llama 3.1 8B Instant",
    providerId: "groq",
    contextWindow: 131072,
    inputCostPer1k: 5e-5,
    outputCostPer1k: 8e-5,
    supportsTools: true,
    supportsVision: false,
    supportsJson: true,
    isFree: true,
    latencyRatingMs: 80,
    qualityRating: 82,
    status: "active"
  },
  {
    id: "llama3.1-70b",
    name: "Llama 3.1 70B (Wafer-scale)",
    providerId: "cerebras",
    contextWindow: 131072,
    inputCostPer1k: 6e-4,
    outputCostPer1k: 6e-4,
    supportsTools: true,
    supportsVision: false,
    supportsJson: true,
    isFree: true,
    latencyRatingMs: 90,
    qualityRating: 88,
    status: "active"
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B Instruct (Free)",
    providerId: "openrouter",
    contextWindow: 131072,
    inputCostPer1k: 0,
    outputCostPer1k: 0,
    supportsTools: true,
    supportsVision: false,
    supportsJson: true,
    isFree: true,
    latencyRatingMs: 350,
    qualityRating: 88,
    status: "active"
  },
  {
    id: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    name: "Llama 3.1 70B Turbo",
    providerId: "together",
    contextWindow: 131072,
    inputCostPer1k: 88e-5,
    outputCostPer1k: 88e-5,
    supportsTools: true,
    supportsVision: false,
    supportsJson: true,
    isFree: false,
    latencyRatingMs: 180,
    qualityRating: 88,
    status: "active"
  },
  {
    id: "meta/llama-3.1-70b-instruct",
    name: "NVIDIA NIM Llama 3.1 70B",
    providerId: "nvidia",
    contextWindow: 131072,
    inputCostPer1k: 0,
    outputCostPer1k: 0,
    supportsTools: true,
    supportsVision: false,
    supportsJson: true,
    isFree: true,
    latencyRatingMs: 220,
    qualityRating: 88,
    status: "active"
  }
];
var EndpointRefresher = class {
  client;
  constructor(client) {
    this.client = client ?? new AITransportClient();
  }
  async fetchRemoteModels(providerId, apiKey) {
    const meta = getProviderMeta(providerId);
    if (!meta) throw new Error(`Unknown provider ${providerId}`);
    const url = `${meta.baseUrl}${meta.modelsEndpoint}`;
    const headers = {};
    if (meta.defaultHeaderKey === "Authorization") {
      headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    } else {
      headers[meta.defaultHeaderKey] = apiKey.trim();
    }
    const res = await this.client.request({
      url,
      method: "GET",
      headers,
      timeoutMs: 12e3
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch models from ${providerId}: HTTP ${res.status}`);
    }
    const rawList = res.data.data || res.data.models || [];
    return rawList.map((item) => ({
      id: item.id || item.name || "",
      name: item.display_name || item.name || item.id || "",
      providerId,
      contextWindow: item.context_window || item.input_token_limit || 131072,
      supportsTools: true,
      supportsVision: Boolean(item.architecture?.modality?.includes("image")),
      supportsJson: true,
      status: "active"
    }));
  }
};
var endpointRefresher = new EndpointRefresher();
var ModelHealthService = class {
  healthMap = /* @__PURE__ */ new Map();
  recordSuccess(providerId, modelId, latencyMs) {
    const key = `${providerId}:${modelId}`;
    this.healthMap.set(key, {
      modelId,
      providerId,
      isHealthy: true,
      latencyMs,
      consecutiveFailures: 0,
      lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  recordFailure(providerId, modelId, error) {
    const key = `${providerId}:${modelId}`;
    const existing = this.healthMap.get(key);
    const consecutive = (existing?.consecutiveFailures ?? 0) + 1;
    this.healthMap.set(key, {
      modelId,
      providerId,
      isHealthy: consecutive < 3,
      latencyMs: existing?.latencyMs ?? 0,
      consecutiveFailures: consecutive,
      lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastError: error
    });
  }
  isModelAvailable(providerId, modelId) {
    const status = this.healthMap.get(`${providerId}:${modelId}`);
    return status ? status.isHealthy : true;
  }
  getHealth(providerId, modelId) {
    return this.healthMap.get(`${providerId}:${modelId}`);
  }
  getAllHealth() {
    return Array.from(this.healthMap.values());
  }
};
var modelHealthService = new ModelHealthService();
var ModelCatalogService = class {
  providerStatuses = {};
  customModels = /* @__PURE__ */ new Map();
  getCatalog(providerId) {
    return providerId ? this.getAllModels().filter((model) => model.providerId === providerId) : this.getAllModels();
  }
  getProviderStatuses() {
    const providers = new Set(this.getAllModels().map((model) => model.providerId));
    for (const providerId of providers) {
      const modelsCount = this.getModelsByProvider(providerId).length;
      this.providerStatuses[providerId] ??= { providerId, status: "online", modelsCount };
      this.providerStatuses[providerId].modelsCount = modelsCount;
    }
    return Object.values(this.providerStatuses);
  }
  async refreshCatalogFromEndpoints() {
    const errors = [];
    let updated = 0;
    for (const providerId of Array.from(new Set(this.getAllModels().map((model) => model.providerId)))) {
      const key = keyStore.getActiveKey(providerId);
      if (!key) continue;
      try {
        const models = await endpointRefresher.fetchRemoteModels(providerId, key.key);
        for (const model of models) this.registerModel(model);
        updated += models.length;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    return { updated, errors };
  }
  getAllModels() {
    const list = [...STATIC_MODELS_CATALOG, ...Array.from(this.customModels.values())];
    return list;
  }
  getModelsByProvider(providerId) {
    return this.getAllModels().filter((m2) => m2.providerId === providerId);
  }
  getModelById(id) {
    return this.getModel(id);
  }
  recordModelSuccess(id) {
    const model = this.getModel(id);
    if (model) model.status = "active";
  }
  recordModelFailure(id) {
    const model = this.getModel(id);
    if (model) model.status = "offline";
  }
  createExecutionContract(modelId, providerId, keyId, intelligenceSpec) {
    return {
      contractId: `contract-${Date.now()}-${providerId}-${modelId}-${keyId}`
    };
  }
  getModel(id) {
    return this.customModels.get(id) ?? this.getAllModels().find((m2) => m2.id === id || m2.id.endsWith(id));
  }
  registerModel(model) {
    this.customModels.set(model.id, model);
  }
  getAvailableModels() {
    return this.getAllModels().filter(
      (m2) => modelHealthService.isModelAvailable(m2.providerId, m2.id)
    );
  }
};
var modelCatalog = new ModelCatalogService();

// node_modules/@ultrst-armada/kloks/packages/backend/dist/chunk-LMAU62ZG.js
var MetricsLogger = class {
  records = [];
  maxRecords = 2e3;
  logRequest(record) {
    this.log({
      providerId: record.providerId,
      modelId: record.modelId,
      durationMs: record.latencyMs,
      success: record.status !== "failure"
    });
  }
  getLogs(limit = 50) {
    return this.records.slice(-limit);
  }
  getMetricsSummary() {
    const totalRequests = this.records.length;
    const successes = this.records.filter((record) => record.success).length;
    const averageLatencyMs = totalRequests ? Math.round(this.records.reduce((sum3, record) => sum3 + record.durationMs, 0) / totalRequests) : 0;
    return {
      totalRequests,
      successRatePercent: totalRequests ? Math.round(successes / totalRequests * 100) : 100,
      averageLatencyMs,
      totalFailovers: 0
    };
  }
  log(record) {
    const full = {
      id: `met_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...record
    };
    this.records.push(full);
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }
  }
  getRecent(limit = 50) {
    return this.records.slice(-limit);
  }
  getAverageLatency(providerId, modelId) {
    const matches = this.records.filter(
      (r) => r.providerId === providerId && (modelId ? r.modelId === modelId : true) && r.success
    );
    if (matches.length === 0) return 0;
    const sum3 = matches.reduce((acc, r) => acc + r.durationMs, 0);
    return Math.round(sum3 / matches.length);
  }
  getSuccessRate(providerId) {
    const matches = this.records.filter((r) => r.providerId === providerId);
    if (matches.length === 0) return 100;
    const successes = matches.filter((r) => r.success).length;
    return Math.round(successes / matches.length * 100);
  }
};
var metricsLogger = new MetricsLogger();
var HealthCheckService = class {
  async runRoutineCheck() {
    const keys2 = keyStore.getKeys();
    const catalog = modelCatalog.getAllModels();
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      keysTotal: keys2.length,
      keysValid: keys2.filter((key) => key.status === "active" || key.status === "valid").length,
      modelsCatalogTotal: catalog.length,
      status: "healthy"
    };
  }
  async checkProvider(providerId, apiKey) {
    const status = await aiProviderService.checkHealth(providerId, apiKey);
    return status.isOnline;
  }
  isRouteAvailable(providerId, modelId) {
    return modelHealthService.isModelAvailable(providerId, modelId);
  }
  recordRouteFailure(providerId, modelId, error) {
    modelHealthService.recordFailure(providerId, modelId, error);
  }
  recordRouteSuccess(providerId, modelId, latencyMs) {
    modelHealthService.recordSuccess(providerId, modelId, latencyMs);
  }
};
var healthCheckService = new HealthCheckService();
var FailoverExecutionEngine = class {
  defaultRetryPolicy = {
    maxRetries: 3,
    backoffMs: 250
  };
  async executeWithFailover(candidates, executeCandidate, policy) {
    const start = Date.now();
    const effectivePolicy = { ...this.defaultRetryPolicy, ...policy };
    const failoverHistory = [];
    const healthyCandidates = candidates.filter(
      (c) => healthCheckService.isRouteAvailable(c.providerId, c.modelId)
    );
    const candidateQueue = healthyCandidates.length > 0 ? healthyCandidates : candidates;
    let attempts = 0;
    for (const candidate of candidateQueue) {
      if (attempts >= effectivePolicy.maxRetries) break;
      attempts++;
      const attemptStart = Date.now();
      try {
        const result = await executeCandidate(candidate);
        const duration = Date.now() - attemptStart;
        healthCheckService.recordRouteSuccess(candidate.providerId, candidate.modelId, duration);
        metricsLogger.log({
          providerId: candidate.providerId,
          modelId: candidate.modelId,
          durationMs: duration,
          success: true
        });
        return {
          success: true,
          selectedCandidate: candidate,
          attempts,
          result,
          totalDurationMs: Date.now() - start,
          failoverHistory
        };
      } catch (err) {
        const duration = Date.now() - attemptStart;
        const errMessage = err instanceof Error ? err.message : String(err);
        healthCheckService.recordRouteFailure(candidate.providerId, candidate.modelId, errMessage);
        metricsLogger.log({
          providerId: candidate.providerId,
          modelId: candidate.modelId,
          durationMs: duration,
          success: false,
          error: errMessage
        });
        failoverHistory.push({
          candidate,
          error: errMessage,
          durationMs: duration
        });
        if (effectivePolicy.backoffMs > 0 && attempts < effectivePolicy.maxRetries) {
          await new Promise((r) => setTimeout(r, effectivePolicy.backoffMs));
        }
      }
    }
    return {
      success: false,
      attempts,
      error: `All ${attempts} candidate execution attempts failed`,
      totalDurationMs: Date.now() - start,
      failoverHistory
    };
  }
};
var failoverExecutionEngine = new FailoverExecutionEngine();

// node_modules/@ultrst-armada/kloks/packages/backend/dist/chunk-U4HUGPRH.js
var MCPEngine = class {
  servers = /* @__PURE__ */ new Map();
  registeredTools = /* @__PURE__ */ new Map();
  toolHandlers = /* @__PURE__ */ new Map();
  getSystemTools() {
    return this.listTools();
  }
  async handleJsonRpc(payload) {
    const { id, method, params } = payload ?? {};
    if (method === "tools/list") {
      return { jsonrpc: "2.0", id, result: { tools: this.listTools() } };
    }
    if (method === "tools/call") {
      const toolName = params?.name;
      if (!toolName) return { jsonrpc: "2.0", id, error: { code: -32602, message: "Tool name is required." } };
      const result = await this.executeTool(toolName, params?.arguments ?? {});
      return {
        jsonrpc: "2.0",
        id,
        result: result.success ? { content: [{ type: "text", text: JSON.stringify(result.output ?? "") }] } : { content: [{ type: "text", text: result.error ?? "Tool execution failed" }], isError: true }
      };
    }
    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method "${method}" not found.` } };
  }
  registerServer(config) {
    this.servers.set(config.id, config);
  }
  getServer(id) {
    return this.servers.get(id);
  }
  listServers() {
    return Array.from(this.servers.values());
  }
  registerTool(tool, handler) {
    this.registeredTools.set(tool.name, tool);
    if (handler) {
      this.toolHandlers.set(tool.name, handler);
    }
  }
  listTools() {
    return Array.from(this.registeredTools.values());
  }
  async executeTool(toolName, args) {
    const start = Date.now();
    const handler = this.toolHandlers.get(toolName);
    if (!handler) {
      return {
        toolName,
        success: false,
        error: `No local handler registered for MCP tool: ${toolName}`,
        durationMs: Date.now() - start
      };
    }
    try {
      const output = await handler(args);
      return {
        toolName,
        success: true,
        output,
        durationMs: Date.now() - start
      };
    } catch (err) {
      return {
        toolName,
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start
      };
    }
  }
};
var mcpEngine = new MCPEngine();
var ToolManagerService = class {
  registerTool(tool, handler) {
    mcpEngine.registerTool(tool, handler);
  }
  listTools() {
    return mcpEngine.listTools();
  }
  async execute(toolName, args) {
    return mcpEngine.executeTool(toolName, args);
  }
};
var toolManagerService = new ToolManagerService();

// node_modules/@ultrst-armada/kloks/packages/backend/dist/chunk-GCTQY24J.js
function parseErrorJson(rawMsg) {
  try {
    if (typeof rawMsg === "string") {
      const trimmed = rawMsg.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
        return JSON.parse(trimmed);
      }
    }
  } catch {
  }
  return null;
}
function classifyAndFormatError(providerId, modelId, rawError, httpStatus) {
  const rawMsg = rawError instanceof Error ? rawError.message : String(rawError || "");
  const parsedJson = parseErrorJson(rawMsg);
  const errorObj = parsedJson?.error || parsedJson;
  const statusNumber = httpStatus || (typeof errorObj?.code === "number" ? errorObj.code : void 0) || (typeof rawError?.status === "number" ? rawError.status : void 0);
  const statusStr = String(errorObj?.status || rawError?.status || "");
  const detailedMsg = typeof errorObj?.message === "string" ? errorObj.message : typeof errorObj === "string" ? errorObj : rawMsg;
  const combinedLower = (detailedMsg + " " + statusStr + " " + (rawError?.name || "")).toLowerCase();
  let classification = "UNKNOWN";
  let suggestion = "Check network connectivity or retry request.";
  let isModelSpecific = false;
  let isKeySpecific = false;
  if (statusNumber === 404 || statusStr === "NOT_FOUND" || combinedLower.includes("not found") || combinedLower.includes("deprecated")) {
    classification = "MODEL_UNAVAILABLE";
    isModelSpecific = true;
    suggestion = "Auto-failover router will bypass this model for subsequent calls.";
  } else if (statusNumber === 401 || statusNumber === 403 || combinedLower.includes("unauthorized") || combinedLower.includes("invalid api key")) {
    classification = "AUTH_FAILURE";
    isKeySpecific = true;
    suggestion = "Check key validity in Key Manager or rotate key.";
  } else if (statusNumber === 429 || combinedLower.includes("rate limit") || combinedLower.includes("quota exceeded")) {
    classification = "RATE_LIMITED";
    isKeySpecific = true;
    suggestion = "Failover router will immediately switch to alternate keys/models.";
  } else if (statusNumber === 402 || combinedLower.includes("insufficient credits") || combinedLower.includes("billing")) {
    classification = "PAYMENT_REQUIRED";
    isKeySpecific = true;
    suggestion = "Add funds or switch to a free tier provider.";
  } else if (combinedLower.includes("maximum context length") || combinedLower.includes("too many tokens")) {
    classification = "CONTEXT_OVERFLOW";
    isModelSpecific = true;
    suggestion = "Enable compression or route to a larger context model.";
  } else if (statusNumber === 400 || combinedLower.includes("bad request")) {
    classification = "PARAMETER_MISMATCH";
    isModelSpecific = true;
    suggestion = "Re-check model ID in catalog or verify API key syntax.";
  } else if (statusNumber && statusNumber >= 500) {
    classification = "SERVER_ERROR";
  }
  const formatted = `[${providerId.toUpperCase()} ${classification}${statusNumber ? ` (${statusNumber})` : ""}]: ${detailedMsg}`;
  return {
    error: new Error(formatted),
    details: {
      classification,
      providerId,
      modelId,
      statusCode: statusNumber,
      message: formatted,
      suggestion,
      isModelSpecific,
      isKeySpecific
    }
  };
}
var PROVIDER_BASE_URLS = {
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
  cerebras: "https://api.cerebras.ai/v1",
  together: "https://api.together.xyz/v1",
  nvidia: "https://integrate.api.nvidia.com/v1",
  huggingface: "https://api-inference.huggingface.co/v1"
};
async function executeGoogleInference(modelId, apiKey, prompt, options) {
  const normModel = modelId.startsWith("models/") ? modelId.replace("models/", "") : modelId;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${normModel}:generateContent?key=${apiKey}`;
  const reqBody = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  if (options?.tools && options.tools.length > 0) {
    reqBody.tools = [{
      functionDeclarations: options.tools.map((t) => ({
        name: t.function?.name || t.name,
        description: t.function?.description || t.description || "",
        parameters: t.function?.parameters || t.parameters || { type: "OBJECT", properties: {} }
      }))
    }];
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reqBody),
    signal: options?.signal
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw classifyAndFormatError("google", normModel, txt, res.status).error;
  }
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const textParts = parts.filter((p2) => p2.text).map((p2) => p2.text).join("\n");
  const fcList = parts.filter((p2) => p2.functionCall).map((p2) => p2.functionCall);
  let toolCalls;
  if (fcList.length > 0) {
    toolCalls = fcList.map((fc, i) => ({
      id: `call_gemini_${Date.now()}_${i}`,
      type: "function",
      function: { name: fc.name, arguments: JSON.stringify(fc.args || {}) }
    }));
  }
  return { text: textParts || (toolCalls ? `Invoked tool(s)` : ""), toolCalls };
}
async function performInference(providerId, modelId, apiKey, prompt, options) {
  const start = Date.now();
  const normModel = modelId.startsWith("models/") ? modelId.replace("models/", "") : modelId;
  if (providerId === "google") {
    const res2 = await executeGoogleInference(normModel, apiKey, prompt, options);
    res2.durationMs = Date.now() - start;
    return res2;
  }
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(`[${providerId.toUpperCase()} AUTH]: Missing API key for ${providerId}`);
  }
  const baseUrl = PROVIDER_BASE_URLS[providerId] || "https://api.groq.com/openai/v1";
  const reqBody = {
    model: normModel,
    messages: options?.messages || [{ role: "user", content: prompt }],
    temperature: options?.temperature ?? 0.7
  };
  if (options?.maxTokens) reqBody.max_tokens = options.maxTokens;
  if (options?.tools && options.tools.length > 0) {
    reqBody.tools = options.tools;
    if (options.tool_choice) reqBody.tool_choice = options.tool_choice;
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey.trim().replace(/[\r\n\t]/g, "")}`
  };
  if (providerId === "openrouter") {
    headers["HTTP-Referer"] = "https://kloks-ai.dev";
    headers["X-Title"] = "Kloks AI Gateway";
  }
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(reqBody),
    signal: options?.signal
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw classifyAndFormatError(providerId, normModel, txt, res.status).error;
  }
  const data = await res.json();
  const choice = data.choices?.[0]?.message;
  let toolCalls;
  if (choice?.tool_calls && Array.isArray(choice.tool_calls) && choice.tool_calls.length > 0) {
    toolCalls = choice.tool_calls.map((tc, i) => ({
      id: tc.id || `call_${Date.now()}_${i}`,
      type: "function",
      function: {
        name: tc.function?.name || "unknown_tool",
        arguments: typeof tc.function?.arguments === "string" ? tc.function.arguments : JSON.stringify(tc.function?.arguments || {})
      }
    }));
  }
  return {
    text: choice?.content || (toolCalls ? `Tool usage invoked` : ""),
    toolCalls,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    } : void 0,
    durationMs: Date.now() - start
  };
}
var InferenceExecutorService = class {
  async execute(providerId, modelId, apiKey, prompt, options) {
    return performInference(providerId, modelId, apiKey, prompt, options);
  }
};
var inferenceExecutor = new InferenceExecutorService();

// node_modules/@ultrst-armada/kloks/packages/backend/dist/chunk-RFPGUJAZ.js
var AIProviderServiceDefinition = createServiceDefinition({
  id: "kloks.backend.aiProvider",
  name: "AIProviderService",
  version: "1.0.0",
  operations: {
    listProviders: {
      id: "AIProviderService.listProviders",
      name: "listProviders",
      handler: async () => aiProviderService.listProviders()
    },
    getProvider: {
      id: "AIProviderService.getProvider",
      name: "getProvider",
      handler: async (input) => aiProviderService.getProvider(input.id)
    },
    checkHealth: {
      id: "AIProviderService.checkHealth",
      name: "checkHealth",
      handler: async (input) => aiProviderService.checkHealth(input.id, input.apiKey)
    }
  }
});
var aiProviderInstance = createService(AIProviderServiceDefinition);
var AIProviderServiceFacade = {
  id: AIProviderServiceDefinition.id,
  name: AIProviderServiceDefinition.name,
  version: AIProviderServiceDefinition.version,
  runtime: "server",
  deployment: "local",
  definition: AIProviderServiceDefinition,
  createInstance: () => createService(AIProviderServiceDefinition),
  execute: async (op, input) => {
    await aiProviderInstance.start();
    return aiProviderInstance.call(op, input);
  }
};
var AIInferenceServiceDefinition = createServiceDefinition({
  id: "kloks.backend.aiInference",
  name: "AIInferenceService",
  version: "1.0.0",
  operations: {
    execute: {
      id: "AIInferenceService.execute",
      name: "execute",
      handler: async (input) => inferenceExecutor.execute(input.providerId, input.modelId, input.apiKey, input.prompt, input.options)
    }
  }
});
var aiInferenceInstance = createService(AIInferenceServiceDefinition);
var AIInferenceServiceFacade = {
  id: AIInferenceServiceDefinition.id,
  name: AIInferenceServiceDefinition.name,
  version: AIInferenceServiceDefinition.version,
  runtime: "server",
  deployment: "local",
  definition: AIInferenceServiceDefinition,
  createInstance: () => createService(AIInferenceServiceDefinition),
  execute: async (op, input) => {
    await aiInferenceInstance.start();
    return aiInferenceInstance.call(op, input);
  }
};
var AIModelCatalogServiceDefinition = createServiceDefinition({
  id: "kloks.backend.aiModels",
  name: "AIModelCatalogService",
  version: "1.0.0",
  operations: {
    getAllModels: {
      id: "AIModelCatalogService.getAllModels",
      name: "getAllModels",
      handler: async () => modelCatalog.getAllModels()
    },
    getModel: {
      id: "AIModelCatalogService.getModel",
      name: "getModel",
      handler: async (input) => modelCatalog.getModel(input.id)
    }
  }
});
var aiModelCatalogInstance = createService(AIModelCatalogServiceDefinition);
var AIModelCatalogServiceFacade = {
  id: AIModelCatalogServiceDefinition.id,
  name: AIModelCatalogServiceDefinition.name,
  version: AIModelCatalogServiceDefinition.version,
  runtime: "server",
  deployment: "local",
  getCatalog: (providerId) => modelCatalog.getCatalog(providerId),
  getProviderStatuses: () => modelCatalog.getProviderStatuses(),
  refreshCatalogFromEndpoints: () => modelCatalog.refreshCatalogFromEndpoints(),
  definition: AIModelCatalogServiceDefinition,
  createInstance: () => createService(AIModelCatalogServiceDefinition),
  execute: async (op, input) => {
    await aiModelCatalogInstance.start();
    return aiModelCatalogInstance.call(op, input);
  }
};
var AIRoutingServiceDefinition = createServiceDefinition({
  id: "kloks.backend.aiRouting",
  name: "AIRoutingService",
  version: "1.0.0",
  operations: {
    executeWithFailover: {
      id: "AIRoutingService.executeWithFailover",
      name: "executeWithFailover",
      handler: async (input) => failoverExecutionEngine.executeWithFailover(input.candidates, input.executeFn, input.policy)
    }
  }
});
var aiRoutingInstance = createService(AIRoutingServiceDefinition);
var AIRoutingServiceFacade = {
  id: AIRoutingServiceDefinition.id,
  name: AIRoutingServiceDefinition.name,
  version: AIRoutingServiceDefinition.version,
  runtime: "server",
  deployment: "local",
  definition: AIRoutingServiceDefinition,
  createInstance: () => createService(AIRoutingServiceDefinition),
  execute: async (op, input) => {
    await aiRoutingInstance.start();
    return aiRoutingInstance.call(op, input);
  }
};
var AIKeyServiceDefinition = createServiceDefinition({
  id: "kloks.backend.aiKeys",
  name: "AIKeyService",
  version: "1.0.0",
  operations: {
    getKeys: {
      id: "AIKeyService.getKeys",
      name: "getKeys",
      handler: async (input) => keyStore.getKeys(input?.providerId)
    },
    getActiveKey: {
      id: "AIKeyService.getActiveKey",
      name: "getActiveKey",
      handler: async (input) => keyStore.getActiveKey(input.providerId)
    },
    verifyKey: {
      id: "AIKeyService.verifyKey",
      name: "verifyKey",
      handler: async (input) => keyStore.verifyKey(input.id)
    }
  }
});
var aiKeyInstance = createService(AIKeyServiceDefinition);
var AIKeyServiceFacade = {
  id: AIKeyServiceDefinition.id,
  name: AIKeyServiceDefinition.name,
  version: AIKeyServiceDefinition.version,
  runtime: "server",
  deployment: "local",
  getKeys: (providerId, modelId) => keyStore.getKeys(providerId, modelId),
  getStrategy: () => keyStore.getStrategy(),
  addKey: (input) => keyStore.addKey(input),
  getActiveKey: (providerId) => keyStore.getActiveKey(providerId),
  rotateKey: (providerId) => keyStore.rotateKey(providerId),
  importKeys: (payload) => keyStore.importKeys(payload),
  exportKeysStructured: () => keyStore.exportKeysStructured(),
  definition: AIKeyServiceDefinition,
  createInstance: () => createService(AIKeyServiceDefinition),
  execute: async (op, input) => {
    await aiKeyInstance.start();
    return aiKeyInstance.call(op, input);
  }
};
var AIToolServiceDefinition = createServiceDefinition({
  id: "kloks.backend.aiTools",
  name: "AIToolService",
  version: "1.0.0",
  operations: {
    listTools: {
      id: "AIToolService.listTools",
      name: "listTools",
      handler: async () => toolManagerService.listTools()
    },
    execute: {
      id: "AIToolService.execute",
      name: "execute",
      handler: async (input) => toolManagerService.execute(input.toolName, input.args)
    }
  }
});
var aiToolInstance = createService(AIToolServiceDefinition);
var AIToolServiceFacade = {
  id: AIToolServiceDefinition.id,
  name: AIToolServiceDefinition.name,
  version: AIToolServiceDefinition.version,
  runtime: "server",
  deployment: "local",
  definition: AIToolServiceDefinition,
  createInstance: () => createService(AIToolServiceDefinition),
  execute: async (op, input) => {
    await aiToolInstance.start();
    return aiToolInstance.call(op, input);
  }
};

// src/backend/aikoRuntime.ts
import { queryUnifiedDb as queryUnifiedDb2 } from "@ultrst-armada/kloks/backend/node";
var aikoSettingsCache = null;
async function getAikoEngineSettings() {
  if (aikoSettingsCache && Date.now() < aikoSettingsCache.expiresAt) return aikoSettingsCache.value;
  let value = { url: "", moduleToken: "" };
  try {
    const result = await queryUnifiedDb2(
      `SELECT credentials FROM public."ultrst-credentials" WHERE id = 'system' LIMIT 1`
    );
    const raw = result.rows[0]?.credentials;
    const credentials = typeof raw === "string" ? JSON.parse(raw) : raw || {};
    const aiko = credentials.aiko || {};
    value = {
      url: String(aiko.deploymentUrl || aiko.engineUrl || aiko.url || "").trim().replace(/\/+$/, ""),
      moduleToken: String(aiko.moduleToken || "")
    };
  } catch {
  }
  aikoSettingsCache = { value, expiresAt: Date.now() + 3e4 };
  return value;
}
function createAikoRuntime(workspaceId, input) {
  const { fod, backend } = input;
  const host = scanBackendFacadeToNodes(backend);
  const resolve = async (specId, context) => {
    const settings = await getAikoEngineSettings();
    if (!settings.url) return { spec: { mode: "application-router", ...context }, specId: specId || "default-spec" };
    const response = await fetch(settings.url + "/api/module/resolve-intelligence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...settings.moduleToken ? { "x-aiko-module-token": settings.moduleToken } : {}
      },
      body: JSON.stringify({ specId, ...context })
    });
    if (!response.ok) throw new Error("Aiko Engine intelligence resolver request failed.");
    return response.json();
  };
  const capabilities = async () => {
    const endpointCapabilities = (host?.endpoints ?? []).filter((endpoint) => !String(endpoint.id).toLowerCase().includes("aiko") && !String(endpoint.serviceId).toLowerCase().includes("aiko")).map((endpoint) => ({
      id: String(endpoint.id),
      name: endpoint.operationName || endpoint.id,
      description: endpoint.description,
      sourceKind: "endpoint",
      sourceId: String(endpoint.id),
      inputSchema: endpoint.inputSchema,
      execute: (input2) => endpoint.invoke(input2)
    }));
    const flowCapabilities = (await fod.listFlows()).map((flow) => ({
      id: String(flow.id),
      name: flow.name,
      description: flow.description,
      sourceKind: "fod-flow",
      sourceId: String(flow.id),
      inputSchema: flow.inputSchema,
      execute: async (input2) => {
        const result = await fod.executeFlow(String(flow.id), input2);
        if (!result.success) throw new Error(result.errors?.[0]?.message || "Flow execution failed");
        return result.output;
      }
    }));
    const guttsCapabilities = guttsFodNodeDefinitions.map((node) => ({
      id: String(node.metadata.apiId),
      name: node.label,
      description: node.description,
      sourceKind: "gutts-api",
      sourceId: String(node.metadata.apiId),
      inputSchema: node.inputSchema,
      execute: (input2) => executeGuttsApi(String(node.metadata.apiId), input2)
    }));
    return [...endpointCapabilities, ...flowCapabilities, ...guttsCapabilities];
  };
  const resolveNaturalLanguage = async (agent, inputText) => {
    const settings = await getAikoEngineSettings();
    if (!settings.url) {
      const allCaps = await capabilities();
      const matched = allCaps.find(
        (c) => inputText.toLowerCase().includes(c.name.toLowerCase()) || inputText.toLowerCase().includes(c.id.toLowerCase())
      ) ?? allCaps[0];
      return { capabilityId: matched?.id ?? "default", input: { value: inputText, message: inputText } };
    }
    const response = await fetch(settings.url + "/api/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: inputText }],
        intelligenceSpec: agent.intelligenceSpec,
        tools: [{ type: "function", function: {
          name: agent.tool.id,
          description: agent.tool.description || agent.tool.name,
          parameters: agent.tool.inputSchema || { type: "object" }
        } }],
        tool_choice: { type: "function", function: { name: agent.tool.id } }
      })
    });
    if (!response.ok) throw new Error("Aiko Engine natural-language resolution failed.");
    const payload = await response.json();
    const argumentsText = payload.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argumentsText) throw new Error("Aiko Engine did not return a structured tool payload.");
    return JSON.parse(argumentsText);
  };
  const applicationAgent = {
    schemaVersion: "1.0.0",
    id: "skipo-application-agent",
    name: "Application Agent",
    description: "Universal conversational application router",
    agentType: "AIKO",
    intelligenceSpec: { mode: "application-router" },
    sourceKind: "custom",
    sourceId: "application",
    custom: true,
    tool: {
      id: "skipo.application",
      name: "Application Agent",
      description: "Route a natural-language request to an application capability.",
      sourceKind: "custom",
      sourceId: "application",
      inputSchema: { type: "object", properties: { capabilityId: { type: "string" }, input: {} }, required: ["capabilityId", "input"] },
      execute: async (value) => {
        const request = value;
        const capability = (await capabilities()).find((item) => item.id === request.capabilityId);
        if (!capability) throw new Error("Application Agent resolved an unknown capability: " + request.capabilityId);
        return capability.execute(request.input);
      }
    }
  };
  return new AikoRuntime({
    customAgents: [applicationAgent],
    capabilities,
    resolver: { resolve },
    resolveNaturalLanguage,
    keys: {
      listKeys: async () => AIKeyServiceFacade.getKeys().map((key) => ({
        id: key.id,
        providerId: key.providerId,
        label: key.label,
        status: key.status,
        isActive: key.isActive,
        emailGroup: key.emailGroup,
        expiresAt: key.expiresAt
      })),
      getActiveKey: async (providerId) => {
        const facade = AIKeyServiceFacade;
        return typeof facade.getActiveKey === "function" ? facade.getActiveKey(providerId) ?? null : null;
      },
      rotateKey: async (providerId) => {
        const facade = AIKeyServiceFacade;
        return typeof facade.rotateKey === "function" ? facade.rotateKey(providerId) ?? null : null;
      },
      addKey: async (input2) => AIKeyServiceFacade.addKey(input2),
      syncFromAikoEngine: async () => {
        const settings = await getAikoEngineSettings();
        if (!settings.url) throw new Error("Aiko Engine deployment URL is not configured in system credentials.");
        const response = await fetch(settings.url + "/api/module/keys/export", {
          headers: settings.moduleToken ? { "x-aiko-module-token": settings.moduleToken } : void 0
        });
        if (!response.ok) throw new Error("Aiko Engine key synchronization failed.");
        const payload = await response.json();
        const importer = AIKeyServiceFacade.importKeys.bind(AIKeyServiceFacade);
        const imported = await importer(payload.backup);
        return { synced: imported.importedCount, message: "Aiko Engine keys synchronized." };
      }
    }
  });
}
function createAikoServiceFacade(createRuntime) {
  return {
    id: "kloks.aiko",
    name: "AikoService",
    version: "1.0.0",
    runtime: "server",
    deployment: "local",
    execute: async (operation, input) => {
      const runtime9 = createRuntime(String(input?.workspaceId || "default"));
      if (operation === "listAgents") return runtime9.listAgents();
      if (operation === "executeAgent") return runtime9.executeAgent(String(input?.agentId), input?.query);
      if (operation === "listKeys") return runtime9.listKeys();
      if (operation === "syncFromAikoEngine") return runtime9.syncFromAikoEngine();
      if (operation === "listCapabilities") return runtime9.listCapabilities();
      if (operation === "createCustomAgent") return runtime9.createCustomAgent(String(input?.name), input?.capabilityIds, input?.specId);
      throw new Error("Unsupported Aiko operation: " + operation);
    }
  };
}

// src/backend/SrklBackend.ts
var orchestrations = {
  serviceSyncOrchestration,
  clusterScanOrchestration
};
var createFodRuntime = (workspaceId) => {
  const wsService = remoteWorkspaceService || workingWorkspaceService;
  const runtime9 = new FodRuntime({ workspaceId, workspaceService: wsService });
  const host = scanBackendFacadeToNodes({ services, orchestrations });
  const guttsEndpoints = guttsFodNodeDefinitions.map((node) => ({
    id: String(node.metadata.apiId),
    serviceId: "@dinilmusick/gutts",
    serviceName: "GutTS",
    operationId: String(node.metadata.apiId),
    operationName: node.label,
    description: node.description,
    invoke: (input) => executeGuttsApi(String(node.metadata.apiId), input)
  }));
  runtime9.setEndpoints([...host.endpoints, ...guttsEndpoints], [...host.nodes, ...guttsFodNodeDefinitions]);
  return runtime9;
};
var FodServiceFacade2 = createFodServiceFacadeForWorkspace(createFodRuntime);
async function getKrusblDeploymentUrl() {
  try {
    const result = await queryUnifiedDb(
      `SELECT credentials FROM public."ultrst-credentials" WHERE id = 'system' LIMIT 1`
    );
    const raw = result.rows[0]?.credentials;
    const credentials = typeof raw === "string" ? JSON.parse(raw) : raw || {};
    const registry2 = credentials.applicationDeployments || credentials.deployments || {};
    const entry = registry2.krusbl || credentials.krusbl || {};
    let url = String(entry.url || entry.deploymentUrl || entry.endpoint || "").trim();
    while (url.endsWith("/")) url = url.slice(0, -1);
    if (url) return url;
  } catch {
  }
  return "https://krusbl-engine.dextro1n1laevo.workers.dev";
}
var bugReportService = {
  report: async (input, options) => {
    const authToken = options?.authToken ?? options?.auth?.token ?? "";
    const authId = options?.session?.userId ?? options?.auth?.user?.id ?? "";
    const baseUrl = await getKrusblDeploymentUrl();
    if (!authId && !authToken) throw new Error("[Skipo:Bug] Authenticated session is required.");
    const response = await fetch(baseUrl.replace(/\/$/, "") + "/api/bugs", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + authToken },
      body: JSON.stringify({
        ...input,
        reporterId: authId,
        context: { applicationId: "srkl-engine", applicationType: "skipo", ...input?.context }
      })
    });
    if (!response.ok) throw new Error("[Skipo:Bug] Krusbl returned HTTP " + response.status + ": " + await response.text());
    return response.json();
  }
};
var createAikoRuntime2 = (workspaceId) => {
  const rt2 = createAikoRuntime(workspaceId, {
    fod: createFodRuntime(workspaceId),
    backend: { services, orchestrations }
  });
  rt2.reportBug = (report, authToken) => bugReportService.report(report, { authToken });
  return rt2;
};
var AikoServiceFacade = createAikoServiceFacade(createAikoRuntime2);
var services = {
  backblaze: backblazeService,
  gemini: geminiService,
  github: githubService,
  vercel: vercelService,
  cloudflare: cloudflareService,
  oracle: oracleService,
  auth: authService,
  audit: auditService,
  coreDb: { query: queryUnifiedDb },
  coreAuth: authCore_exports,
  coreBackblaze: backblazeCore_exports,
  coreWorkspaces: workspaceCore_exports,
  coreEcosystem: ecosystemCore_exports,
  fod: FodServiceFacade2,
  aiko: AikoServiceFacade,
  bugReport: bugReportService
};
var SrklBackend = {
  services,
  orchestrations,
  createFodRuntime,
  createAikoRuntime: createAikoRuntime2,
  FodServiceFacade: FodServiceFacade2,
  AikoServiceFacade,
  bugReportService
};

// src/backend/adapters/aikoRoutes.ts
async function handleAikoRoutes(request) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/aiko") return null;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  try {
    const body = await request.json();
    const runtime9 = createAikoRuntime2(String(body.workspaceId || "default"));
    let result;
    switch (String(body.action)) {
      case "listAgents":
        result = await runtime9.listAgents();
        break;
      case "executeAgent":
        result = await runtime9.executeAgent(String(body.agentId), body.query);
        break;
      case "listKeys":
        result = await runtime9.listKeys();
        break;
      case "getActiveKey":
        result = await runtime9.getActiveKey(String(body.providerId));
        break;
      case "rotateKey":
        result = await runtime9.rotateKey(String(body.providerId));
        break;
      case "addKey":
        result = await runtime9.addKey(body.input);
        break;
      case "syncFromAikoEngine":
        result = await runtime9.syncFromAikoEngine();
        break;
      case "listCapabilities":
        result = await runtime9.listCapabilities();
        break;
      case "createCustomAgent":
        result = await runtime9.createCustomAgent(String(body.name), body.capabilityIds || [], body.specId);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unsupported Aiko action" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// src/backend/adapters/fodRoutes.ts
async function handleFodRoutes(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/fod")) return null;
  const workspaceId = url.searchParams.get("workspaceId") || "default";
  const runtime9 = createFodRuntime(workspaceId);
  if (url.pathname === "/api/fod/nodes" && request.method === "GET") {
    return new Response(JSON.stringify(runtime9.getNodeDefinitions()), { headers: { "Content-Type": "application/json" } });
  }
  if (request.method === "GET") {
    const flowId = url.searchParams.get("flowId");
    return new Response(JSON.stringify(flowId ? await runtime9.getFlow(flowId) : await runtime9.listFlows()), { headers: { "Content-Type": "application/json" } });
  }
  const body = await request.json();
  const result = body.action === "save" ? await runtime9.saveFlow(body.flow) : body.action === "delete" ? await runtime9.deleteFlow(String(body.flowId)) : body.action === "execute" ? await runtime9.executeFlow(String(body.flowId)) : { error: "Unsupported FOD action" };
  return new Response(JSON.stringify(result), { status: "error" in result ? 400 : 200, headers: { "Content-Type": "application/json" } });
}

// src/backend/adapters/httpsAdapter.ts
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id, X-Workspace-Id, X-Requested-With"
};
function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
}
async function parseBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
function getUserId(req, _url) {
  const authorization = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return match ? match[1].split(".")[1] || "" : "";
}
async function authenticateRequest(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization.trim())) {
    return jsonRes({ success: false, error: "A verified Luth session is required." }, 401);
  }
  try {
    const res = await fetch(`${DEFAULT_LUTH_URL}/api/session`, {
      headers: { authorization, "x-app-id": "srkl", "cache-control": "no-store" }
    });
    if (!res.ok) return jsonRes({ success: false, error: "The Luth session is invalid or expired." }, 401);
    const payload = await res.json();
    if (payload.authenticated !== true || !payload.user?.id || !payload.user?.email) {
      return jsonRes({ success: false, error: "The Luth session is invalid or expired." }, 401);
    }
    return { id: String(payload.user.id), email: String(payload.user.email) };
  } catch {
    return jsonRes({ success: false, error: "Canonical Luth authentication service unavailable." }, 503);
  }
}
async function fetchHandler(request, env = {}) {
  const url = new URL(request.url);
  const { pathname } = url;
  const { method } = request;
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (method === "GET" && pathname.endsWith(".wasm") && env.ASSETS) {
    const gzRes = await env.ASSETS.fetch(new Request(`${url.origin}${pathname}.gz`, request));
    if (gzRes.ok) {
      const h = new Headers(gzRes.headers);
      h.set("Content-Type", "application/wasm");
      h.set("Cache-Control", "public, max-age=31536000, immutable");
      h.delete("Content-Encoding");
      h.delete("Content-Length");
      return new Response(gzRes.body?.pipeThrough(new DecompressionStream("gzip")), { status: 200, headers: h });
    }
  }
  if (env.ASSETS && typeof env.ASSETS.fetch === "function" && !pathname.startsWith("/api/") && pathname !== "/health") {
    return await env.ASSETS.fetch(request);
  }
  if (pathname === "/api/health" || pathname === "/health") {
    return jsonRes({ status: "ok", runtime: "cloudflare-worker", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  }
  const deploymentCandidate = typeof env.APP_URL === "string" && env.APP_URL.trim() ? env.APP_URL.trim() : url.origin;
  if (deploymentCandidate && !deploymentCandidate.includes("localhost") && !deploymentCandidate.includes("127.0.0.1")) {
    try {
      const { registerSrklDeployment: registerSrklDeployment2 } = await Promise.resolve().then(() => (init_SrklDeploymentRegistry(), SrklDeploymentRegistry_exports));
      await registerSrklDeployment2(env, deploymentCandidate);
    } catch {
    }
  }
  if (pathname === "/api/registry/deployments") {
    const { getRegisteredSrklDeployments: getRegisteredSrklDeployments2 } = await Promise.resolve().then(() => (init_SrklDeploymentRegistry(), SrklDeploymentRegistry_exports));
    const deployments = await getRegisteredSrklDeployments2(env);
    return jsonRes({ ok: true, deployments });
  }
  const luthPrincipal = await authenticateRequest(request);
  if (luthPrincipal instanceof Response) return luthPrincipal;
  try {
    const aikoRes = await handleAikoRoutes(request);
    if (aikoRes) return aikoRes;
    const fodRes = await handleFodRoutes(request);
    if (fodRes) return fodRes;
    if (pathname === "/api/backblaze/buckets" && method === "POST") {
      const b2 = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.listB2Buckets(b2.keyId, b2.applicationKey, b2.bucketId));
    }
    if (pathname === "/api/backblaze/files" && method === "POST") {
      const b2 = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.listB2Files(b2.keyId, b2.applicationKey, b2.bucketId, b2.prefix, b2.delimiter, b2.maxFileCount));
    }
    if (pathname === "/api/backblaze/create-bucket" && method === "POST") {
      const b2 = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.createB2Bucket(b2.keyId, b2.applicationKey, b2.bucketName, b2.bucketType));
    }
    if (pathname === "/api/backblaze/delete-bucket" && method === "POST") {
      const b2 = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.deleteB2Bucket(b2.keyId, b2.applicationKey, b2.bucketId));
    }
    if (pathname === "/api/backblaze/upload" && method === "POST") {
      const b2 = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.uploadB2File(b2.keyId, b2.applicationKey, b2.bucketId, b2.fileName, b2.fileBase64, b2.contentType, b2.sha1));
    }
    if (pathname === "/api/backblaze/delete-file" && method === "POST") {
      const b2 = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.deleteB2FileVersion(b2.keyId, b2.applicationKey, b2.fileName, b2.fileId));
    }
    if (pathname === "/api/workspaces") {
      const uId = getUserId(request, url);
      if (method === "GET") return jsonRes(await SrklBackend.services.coreWorkspaces.getWorkspaces(uId, env));
      if (method === "POST") return jsonRes(await SrklBackend.services.coreWorkspaces.createWorkspace(uId, await parseBody(request), env));
    }
    if (pathname === "/api/workspaces/storage-connections") {
      const uId = getUserId(request, url);
      if (method === "POST") return jsonRes(await SrklBackend.services.coreWorkspaces.saveStorageConnection(uId, await parseBody(request), env));
      if (method === "DELETE") {
        const b2 = await parseBody(request);
        const cId = b2.id || url.searchParams.get("id") || "";
        return jsonRes(await SrklBackend.services.coreWorkspaces.deleteStorageConnection(uId, cId, env));
      }
    }
    if (pathname === "/api/ecosystem/health") return jsonRes(SrklBackend.services.coreEcosystem.getEcosystemHealth());
    if (pathname === "/api/ecosystem/apps") return jsonRes(await SrklBackend.services.coreEcosystem.getEcosystemApps(env));
    if (pathname === "/api/ecosystem/services") return jsonRes(await SrklBackend.services.coreEcosystem.getEcosystemServices(getUserId(request, url), env));
    if (pathname === "/api/services/sync") {
      const uId = getUserId(request, url) || "guest";
      return jsonRes({ success: true, ...await SrklBackend.orchestrations.serviceSyncOrchestration(uId) });
    }
    if (pathname === "/api/cluster/scan") {
      const targetIp = request.headers.get("x-target-ip") || "127.0.0.1";
      return jsonRes({ success: true, cluster: await SrklBackend.orchestrations.clusterScanOrchestration(targetIp) });
    }
    return jsonRes({ success: false, error: "Not Found", target: "SrklBackend-HTTPS-Adapter", path: pathname }, 404);
  } catch (err) {
    return jsonRes({ success: false, error: err.message || "Internal Server Error" }, 500);
  }
}

// src/backend/adapters/universalEntry.ts
function normalizeEnv(env = {}, requestUrl) {
  const appUrl = typeof env.APP_URL === "string" && env.APP_URL.trim() ? env.APP_URL.trim() : requestUrl ? new URL(requestUrl).origin : void 0;
  return {
    ...env,
    SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL,
    SYSTEM_DATABASE_URL_2: env.SYSTEM_DATABASE_URL_2,
    SYSTEM_DATABASE_URL_3: env.SYSTEM_DATABASE_URL_3,
    APP_URL: appUrl
  };
}
var universalEntry_default = {
  async fetch(request, env = {}, ctx) {
    return fetchHandler(request, normalizeEnv(env, request.url));
  }
};
export {
  universalEntry_default as default,
  fetchHandler,
  normalizeEnv
};
/*! Bundled license information:

@neondatabase/serverless/index.mjs:
  (*! Bundled license information:
  
  ieee754/index.js:
    (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)
  
  buffer/index.js:
    (*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     *)
  *)

lodash-es/lodash.js:
  (**
   * @license
   * Lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="es" --repo lodash/lodash#4.18.1 -o ./`
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *)
*/
