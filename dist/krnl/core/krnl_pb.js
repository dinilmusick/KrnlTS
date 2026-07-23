/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
import $protobuf from "protobufjs/minimal.js";
// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
const $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $TypeError = $util.global.TypeError, $String = $util.global.String, $Number = $util.global.Number, $parseInt = $util.global.parseInt, $BigInt = $util.global.BigInt, $Array = $util.global.Array, $Boolean = $util.global.Boolean;
// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});
export const krnl = $root.krnl = (() => {
    /**
     * Namespace krnl.
     * @exports krnl
     * @namespace
     */
    const krnl = {};
    /**
     * MessageKind enum.
     * @name krnl.MessageKind
     * @enum {number}
     * @property {number} UNKNOWN=0 UNKNOWN value
     * @property {number} REGISTER_INGRESS=1 REGISTER_INGRESS value
     * @property {number} ROUTE_DATA=2 ROUTE_DATA value
     * @property {number} RPC_REQUEST=3 RPC_REQUEST value
     * @property {number} RPC_RESPONSE=4 RPC_RESPONSE value
     * @property {number} INTROSPECT=5 INTROSPECT value
     * @property {number} INTROSPECT_RESPONSE=6 INTROSPECT_RESPONSE value
     */
    krnl.MessageKind = (function () {
        const valuesById = $Object.create(null), values = $Object.create(valuesById);
        values[valuesById[0] = "UNKNOWN"] = 0;
        values[valuesById[1] = "REGISTER_INGRESS"] = 1;
        values[valuesById[2] = "ROUTE_DATA"] = 2;
        values[valuesById[3] = "RPC_REQUEST"] = 3;
        values[valuesById[4] = "RPC_RESPONSE"] = 4;
        values[valuesById[5] = "INTROSPECT"] = 5;
        values[valuesById[6] = "INTROSPECT_RESPONSE"] = 6;
        return values;
    })();
    krnl.KrnlMessage = (function () {
        /**
         * Properties of a KrnlMessage.
         * @typedef {Object} krnl.KrnlMessage.$Properties
         * @property {krnl.MessageKind|null} [kind] KrnlMessage kind
         * @property {string|null} [routeId] KrnlMessage routeId
         * @property {string|null} [requestId] KrnlMessage requestId
         * @property {string|null} [traceCorrelationId] KrnlMessage traceCorrelationId
         * @property {string|null} [originSystemAddress] KrnlMessage originSystemAddress
         * @property {number|Long|null} [timestamp] KrnlMessage timestamp
         * @property {string|null} [method] KrnlMessage method
         * @property {string|null} [collectorName] KrnlMessage collectorName
         * @property {string|null} [jsonPayload] KrnlMessage jsonPayload
         * @property {Uint8Array|null} [binaryPayload] KrnlMessage binaryPayload
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        /**
         * Properties of a KrnlMessage.
         * @memberof krnl
         * @interface IKrnlMessage
         * @augments krnl.KrnlMessage.$Properties
         * @deprecated Use krnl.KrnlMessage.$Properties instead.
         */
        /**
         * Shape of a KrnlMessage.
         * @typedef {krnl.KrnlMessage.$Properties} krnl.KrnlMessage.$Shape
         */
        /**
         * Constructs a new KrnlMessage.
         * @memberof krnl
         * @classdesc Represents a KrnlMessage.
         * @constructor
         * @param {krnl.KrnlMessage.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const KrnlMessage = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };
        /**
         * KrnlMessage kind.
         * @member {krnl.MessageKind} kind
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.kind = 0;
        /**
         * KrnlMessage routeId.
         * @member {string} routeId
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.routeId = "";
        /**
         * KrnlMessage requestId.
         * @member {string} requestId
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.requestId = "";
        /**
         * KrnlMessage traceCorrelationId.
         * @member {string} traceCorrelationId
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.traceCorrelationId = "";
        /**
         * KrnlMessage originSystemAddress.
         * @member {string} originSystemAddress
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.originSystemAddress = "";
        /**
         * KrnlMessage timestamp.
         * @member {number|Long} timestamp
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.timestamp = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
        /**
         * KrnlMessage method.
         * @member {string} method
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.method = "";
        /**
         * KrnlMessage collectorName.
         * @member {string} collectorName
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.collectorName = "";
        /**
         * KrnlMessage jsonPayload.
         * @member {string} jsonPayload
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.jsonPayload = "";
        /**
         * KrnlMessage binaryPayload.
         * @member {Uint8Array} binaryPayload
         * @memberof krnl.KrnlMessage
         * @instance
         */
        KrnlMessage.prototype.binaryPayload = $util.newBuffer([]);
        /**
         * Creates a new KrnlMessage instance using the specified properties.
         * @function create
         * @memberof krnl.KrnlMessage
         * @static
         * @param {krnl.KrnlMessage.$Properties=} [properties] Properties to set
         * @returns {krnl.KrnlMessage} KrnlMessage instance
         * @type {{
         *   (properties: krnl.KrnlMessage.$Shape): krnl.KrnlMessage & krnl.KrnlMessage.$Shape;
         *   (properties?: krnl.KrnlMessage.$Properties): krnl.KrnlMessage;
         * }}
         */
        KrnlMessage.create = function (properties) {
            return new KrnlMessage(properties);
        };
        /**
         * Encodes the specified KrnlMessage message. Does not implicitly {@link krnl.KrnlMessage.verify|verify} messages.
         * @function encode
         * @memberof krnl.KrnlMessage
         * @static
         * @param {krnl.KrnlMessage.$Properties} message KrnlMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        KrnlMessage.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.kind != null && $Object.hasOwnProperty.call(message, "kind") && message.kind !== 0)
                writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.kind);
            if (message.routeId != null && $Object.hasOwnProperty.call(message, "routeId") && message.routeId !== "")
                writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.routeId);
            if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId") && message.requestId !== "")
                writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.requestId);
            if (message.traceCorrelationId != null && $Object.hasOwnProperty.call(message, "traceCorrelationId") && message.traceCorrelationId !== "")
                writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.traceCorrelationId);
            if (message.originSystemAddress != null && $Object.hasOwnProperty.call(message, "originSystemAddress") && message.originSystemAddress !== "")
                writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.originSystemAddress);
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp") && (typeof message.timestamp === "object" ? message.timestamp.low || message.timestamp.high : message.timestamp !== 0))
                writer.uint32(/* id 6, wireType 0 =*/ 48).int64(message.timestamp);
            if (message.method != null && $Object.hasOwnProperty.call(message, "method") && message.method !== "")
                writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.method);
            if (message.collectorName != null && $Object.hasOwnProperty.call(message, "collectorName") && message.collectorName !== "")
                writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.collectorName);
            if (message.jsonPayload != null && $Object.hasOwnProperty.call(message, "jsonPayload") && message.jsonPayload !== "")
                writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.jsonPayload);
            if (message.binaryPayload != null && $Object.hasOwnProperty.call(message, "binaryPayload") && message.binaryPayload.length)
                writer.uint32(/* id 10, wireType 2 =*/ 82).bytes(message.binaryPayload);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };
        /**
         * Encodes the specified KrnlMessage message, length delimited. Does not implicitly {@link krnl.KrnlMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof krnl.KrnlMessage
         * @static
         * @param {krnl.KrnlMessage.$Properties} message KrnlMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        KrnlMessage.encodeDelimited = function (message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };
        /**
         * Decodes a KrnlMessage message from the specified reader or buffer.
         * @function decode
         * @memberof krnl.KrnlMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {krnl.KrnlMessage & krnl.KrnlMessage.$Shape} KrnlMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        KrnlMessage.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.krnl.KrnlMessage(), value;
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                    case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.kind = value;
                        else
                            delete message.kind;
                        continue;
                    }
                    case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.routeId = value;
                        else
                            delete message.routeId;
                        continue;
                    }
                    case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.requestId = value;
                        else
                            delete message.requestId;
                        continue;
                    }
                    case 4: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.traceCorrelationId = value;
                        else
                            delete message.traceCorrelationId;
                        continue;
                    }
                    case 5: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.originSystemAddress = value;
                        else
                            delete message.originSystemAddress;
                        continue;
                    }
                    case 6: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.timestamp = value;
                        else
                            delete message.timestamp;
                        continue;
                    }
                    case 7: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.method = value;
                        else
                            delete message.method;
                        continue;
                    }
                    case 8: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.collectorName = value;
                        else
                            delete message.collectorName;
                        continue;
                    }
                    case 9: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.jsonPayload = value;
                        else
                            delete message.jsonPayload;
                        continue;
                    }
                    case 10: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.bytes()).length)
                            message.binaryPayload = value;
                        else
                            delete message.binaryPayload;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };
        /**
         * Decodes a KrnlMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof krnl.KrnlMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {krnl.KrnlMessage & krnl.KrnlMessage.$Shape} KrnlMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        KrnlMessage.decodeDelimited = function (reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };
        /**
         * Verifies a KrnlMessage message.
         * @function verify
         * @memberof krnl.KrnlMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        KrnlMessage.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.kind != null && $Object.hasOwnProperty.call(message, "kind"))
                if (typeof message.kind !== "number" || (message.kind | 0) !== message.kind)
                    return "kind: enum value expected";
            if (message.routeId != null && $Object.hasOwnProperty.call(message, "routeId"))
                if (!$util.isString(message.routeId))
                    return "routeId: string expected";
            if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId"))
                if (!$util.isString(message.requestId))
                    return "requestId: string expected";
            if (message.traceCorrelationId != null && $Object.hasOwnProperty.call(message, "traceCorrelationId"))
                if (!$util.isString(message.traceCorrelationId))
                    return "traceCorrelationId: string expected";
            if (message.originSystemAddress != null && $Object.hasOwnProperty.call(message, "originSystemAddress"))
                if (!$util.isString(message.originSystemAddress))
                    return "originSystemAddress: string expected";
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
                if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                    return "timestamp: integer|Long expected";
            if (message.method != null && $Object.hasOwnProperty.call(message, "method"))
                if (!$util.isString(message.method))
                    return "method: string expected";
            if (message.collectorName != null && $Object.hasOwnProperty.call(message, "collectorName"))
                if (!$util.isString(message.collectorName))
                    return "collectorName: string expected";
            if (message.jsonPayload != null && $Object.hasOwnProperty.call(message, "jsonPayload"))
                if (!$util.isString(message.jsonPayload))
                    return "jsonPayload: string expected";
            if (message.binaryPayload != null && $Object.hasOwnProperty.call(message, "binaryPayload"))
                if (!(message.binaryPayload && typeof message.binaryPayload.length === "number" || $util.isString(message.binaryPayload)))
                    return "binaryPayload: buffer expected";
            return null;
        };
        /**
         * Creates a KrnlMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof krnl.KrnlMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {krnl.KrnlMessage} KrnlMessage
         */
        KrnlMessage.fromObject = function (object, _depth) {
            if (object instanceof $root.krnl.KrnlMessage)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".krnl.KrnlMessage: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.krnl.KrnlMessage();
            if (object.kind !== 0 && (typeof object.kind !== "string" || $root.krnl.MessageKind[object.kind] !== 0))
                switch (object.kind) {
                    case "UNKNOWN":
                    case 0:
                        message.kind = 0;
                        break;
                    case "REGISTER_INGRESS":
                    case 1:
                        message.kind = 1;
                        break;
                    case "ROUTE_DATA":
                    case 2:
                        message.kind = 2;
                        break;
                    case "RPC_REQUEST":
                    case 3:
                        message.kind = 3;
                        break;
                    case "RPC_RESPONSE":
                    case 4:
                        message.kind = 4;
                        break;
                    case "INTROSPECT":
                    case 5:
                        message.kind = 5;
                        break;
                    case "INTROSPECT_RESPONSE":
                    case 6:
                        message.kind = 6;
                        break;
                    default:
                        if (typeof object.kind === "number" && (object.kind | 0) === object.kind)
                            message.kind = object.kind;
                }
            if (object.routeId != null)
                if (typeof object.routeId !== "string" || object.routeId.length)
                    message.routeId = $String(object.routeId);
            if (object.requestId != null)
                if (typeof object.requestId !== "string" || object.requestId.length)
                    message.requestId = $String(object.requestId);
            if (object.traceCorrelationId != null)
                if (typeof object.traceCorrelationId !== "string" || object.traceCorrelationId.length)
                    message.traceCorrelationId = $String(object.traceCorrelationId);
            if (object.originSystemAddress != null)
                if (typeof object.originSystemAddress !== "string" || object.originSystemAddress.length)
                    message.originSystemAddress = $String(object.originSystemAddress);
            if (object.timestamp != null)
                if (typeof object.timestamp === "object" ? object.timestamp.low || object.timestamp.high : $Number(object.timestamp) !== 0)
                    if ($util.Long)
                        message.timestamp = $util.Long.fromValue(object.timestamp, false);
                    else if (typeof object.timestamp === "string")
                        message.timestamp = $parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
            if (object.method != null)
                if (typeof object.method !== "string" || object.method.length)
                    message.method = $String(object.method);
            if (object.collectorName != null)
                if (typeof object.collectorName !== "string" || object.collectorName.length)
                    message.collectorName = $String(object.collectorName);
            if (object.jsonPayload != null)
                if (typeof object.jsonPayload !== "string" || object.jsonPayload.length)
                    message.jsonPayload = $String(object.jsonPayload);
            if (object.binaryPayload != null)
                if (object.binaryPayload.length)
                    if (typeof object.binaryPayload === "string")
                        $util.base64.decode(object.binaryPayload, message.binaryPayload = $util.newBuffer($util.base64.length(object.binaryPayload)), 0);
                    else if (object.binaryPayload.length >= 0)
                        message.binaryPayload = object.binaryPayload;
            return message;
        };
        /**
         * Creates a plain object from a KrnlMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof krnl.KrnlMessage
         * @static
         * @param {krnl.KrnlMessage} message KrnlMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        KrnlMessage.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.kind = options.enums === $String ? "UNKNOWN" : 0;
                object.routeId = "";
                object.requestId = "";
                object.traceCorrelationId = "";
                object.originSystemAddress = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestamp = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                }
                else
                    object.timestamp = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                object.method = "";
                object.collectorName = "";
                object.jsonPayload = "";
                if (options.bytes === $String)
                    object.binaryPayload = "";
                else {
                    object.binaryPayload = [];
                    if (options.bytes !== $Array)
                        object.binaryPayload = $util.newBuffer(object.binaryPayload);
                }
            }
            if (message.kind != null && $Object.hasOwnProperty.call(message, "kind"))
                object.kind = options.enums === $String ? $root.krnl.MessageKind[message.kind] === $undefined ? message.kind : $root.krnl.MessageKind[message.kind] : message.kind;
            if (message.routeId != null && $Object.hasOwnProperty.call(message, "routeId"))
                object.routeId = message.routeId;
            if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId"))
                object.requestId = message.requestId;
            if (message.traceCorrelationId != null && $Object.hasOwnProperty.call(message, "traceCorrelationId"))
                object.traceCorrelationId = message.traceCorrelationId;
            if (message.originSystemAddress != null && $Object.hasOwnProperty.call(message, "originSystemAddress"))
                object.originSystemAddress = message.originSystemAddress;
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.timestamp = typeof message.timestamp === "number" ? $BigInt(message.timestamp) : $util.Long.fromBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0, false).toBigInt();
                else if (typeof message.timestamp === "number")
                    object.timestamp = options.longs === $String ? $String(message.timestamp) : message.timestamp;
                else
                    object.timestamp = options.longs === $String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === $Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
            if (message.method != null && $Object.hasOwnProperty.call(message, "method"))
                object.method = message.method;
            if (message.collectorName != null && $Object.hasOwnProperty.call(message, "collectorName"))
                object.collectorName = message.collectorName;
            if (message.jsonPayload != null && $Object.hasOwnProperty.call(message, "jsonPayload"))
                object.jsonPayload = message.jsonPayload;
            if (message.binaryPayload != null && $Object.hasOwnProperty.call(message, "binaryPayload"))
                object.binaryPayload = options.bytes === $String ? $util.base64.encode(message.binaryPayload, 0, message.binaryPayload.length) : options.bytes === $Array ? $Array.prototype.slice.call(message.binaryPayload) : message.binaryPayload;
            return object;
        };
        /**
         * Converts this KrnlMessage to JSON.
         * @function toJSON
         * @memberof krnl.KrnlMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        KrnlMessage.prototype.toJSON = function () {
            return KrnlMessage.toObject(this, $protobuf.util.toJSONOptions);
        };
        /**
         * Gets the type url for KrnlMessage
         * @function getTypeUrl
         * @memberof krnl.KrnlMessage
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        KrnlMessage.getTypeUrl = function (prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/krnl.KrnlMessage";
        };
        return KrnlMessage;
    })();
    krnl.RpcResponse = (function () {
        /**
         * Properties of a RpcResponse.
         * @typedef {Object} krnl.RpcResponse.$Properties
         * @property {string|null} [requestId] RpcResponse requestId
         * @property {boolean|null} [ok] RpcResponse ok
         * @property {string|null} [error] RpcResponse error
         * @property {string|null} [jsonResult] RpcResponse jsonResult
         * @property {string|null} [errorDocumentation] RpcResponse errorDocumentation
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        /**
         * Properties of a RpcResponse.
         * @memberof krnl
         * @interface IRpcResponse
         * @augments krnl.RpcResponse.$Properties
         * @deprecated Use krnl.RpcResponse.$Properties instead.
         */
        /**
         * Shape of a RpcResponse.
         * @typedef {krnl.RpcResponse.$Properties} krnl.RpcResponse.$Shape
         */
        /**
         * Constructs a new RpcResponse.
         * @memberof krnl
         * @classdesc Represents a RpcResponse.
         * @constructor
         * @param {krnl.RpcResponse.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        const RpcResponse = function (properties) {
            if (properties)
                for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };
        /**
         * RpcResponse requestId.
         * @member {string} requestId
         * @memberof krnl.RpcResponse
         * @instance
         */
        RpcResponse.prototype.requestId = "";
        /**
         * RpcResponse ok.
         * @member {boolean} ok
         * @memberof krnl.RpcResponse
         * @instance
         */
        RpcResponse.prototype.ok = false;
        /**
         * RpcResponse error.
         * @member {string} error
         * @memberof krnl.RpcResponse
         * @instance
         */
        RpcResponse.prototype.error = "";
        /**
         * RpcResponse jsonResult.
         * @member {string} jsonResult
         * @memberof krnl.RpcResponse
         * @instance
         */
        RpcResponse.prototype.jsonResult = "";
        /**
         * RpcResponse errorDocumentation.
         * @member {string} errorDocumentation
         * @memberof krnl.RpcResponse
         * @instance
         */
        RpcResponse.prototype.errorDocumentation = "";
        /**
         * Creates a new RpcResponse instance using the specified properties.
         * @function create
         * @memberof krnl.RpcResponse
         * @static
         * @param {krnl.RpcResponse.$Properties=} [properties] Properties to set
         * @returns {krnl.RpcResponse} RpcResponse instance
         * @type {{
         *   (properties: krnl.RpcResponse.$Shape): krnl.RpcResponse & krnl.RpcResponse.$Shape;
         *   (properties?: krnl.RpcResponse.$Properties): krnl.RpcResponse;
         * }}
         */
        RpcResponse.create = function (properties) {
            return new RpcResponse(properties);
        };
        /**
         * Encodes the specified RpcResponse message. Does not implicitly {@link krnl.RpcResponse.verify|verify} messages.
         * @function encode
         * @memberof krnl.RpcResponse
         * @static
         * @param {krnl.RpcResponse.$Properties} message RpcResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RpcResponse.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId") && message.requestId !== "")
                writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.requestId);
            if (message.ok != null && $Object.hasOwnProperty.call(message, "ok") && message.ok !== false)
                writer.uint32(/* id 2, wireType 0 =*/ 16).bool(message.ok);
            if (message.error != null && $Object.hasOwnProperty.call(message, "error") && message.error !== "")
                writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.error);
            if (message.jsonResult != null && $Object.hasOwnProperty.call(message, "jsonResult") && message.jsonResult !== "")
                writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.jsonResult);
            if (message.errorDocumentation != null && $Object.hasOwnProperty.call(message, "errorDocumentation") && message.errorDocumentation !== "")
                writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.errorDocumentation);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (let i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };
        /**
         * Encodes the specified RpcResponse message, length delimited. Does not implicitly {@link krnl.RpcResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof krnl.RpcResponse
         * @static
         * @param {krnl.RpcResponse.$Properties} message RpcResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RpcResponse.encodeDelimited = function (message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };
        /**
         * Decodes a RpcResponse message from the specified reader or buffer.
         * @function decode
         * @memberof krnl.RpcResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {krnl.RpcResponse & krnl.RpcResponse.$Shape} RpcResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RpcResponse.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.krnl.RpcResponse(), value;
            while (reader.pos < end) {
                let start = reader.pos;
                let tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                let wireType = tag & 7;
                switch (tag >>>= 3) {
                    case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.requestId = value;
                        else
                            delete message.requestId;
                        continue;
                    }
                    case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.ok = value;
                        else
                            delete message.ok;
                        continue;
                    }
                    case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.error = value;
                        else
                            delete message.error;
                        continue;
                    }
                    case 4: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.jsonResult = value;
                        else
                            delete message.jsonResult;
                        continue;
                    }
                    case 5: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.errorDocumentation = value;
                        else
                            delete message.errorDocumentation;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };
        /**
         * Decodes a RpcResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof krnl.RpcResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {krnl.RpcResponse & krnl.RpcResponse.$Shape} RpcResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RpcResponse.decodeDelimited = function (reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };
        /**
         * Verifies a RpcResponse message.
         * @function verify
         * @memberof krnl.RpcResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RpcResponse.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId"))
                if (!$util.isString(message.requestId))
                    return "requestId: string expected";
            if (message.ok != null && $Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.error != null && $Object.hasOwnProperty.call(message, "error"))
                if (!$util.isString(message.error))
                    return "error: string expected";
            if (message.jsonResult != null && $Object.hasOwnProperty.call(message, "jsonResult"))
                if (!$util.isString(message.jsonResult))
                    return "jsonResult: string expected";
            if (message.errorDocumentation != null && $Object.hasOwnProperty.call(message, "errorDocumentation"))
                if (!$util.isString(message.errorDocumentation))
                    return "errorDocumentation: string expected";
            return null;
        };
        /**
         * Creates a RpcResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof krnl.RpcResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {krnl.RpcResponse} RpcResponse
         */
        RpcResponse.fromObject = function (object, _depth) {
            if (object instanceof $root.krnl.RpcResponse)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".krnl.RpcResponse: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let message = new $root.krnl.RpcResponse();
            if (object.requestId != null)
                if (typeof object.requestId !== "string" || object.requestId.length)
                    message.requestId = $String(object.requestId);
            if (object.ok != null)
                if (object.ok)
                    message.ok = $Boolean(object.ok);
            if (object.error != null)
                if (typeof object.error !== "string" || object.error.length)
                    message.error = $String(object.error);
            if (object.jsonResult != null)
                if (typeof object.jsonResult !== "string" || object.jsonResult.length)
                    message.jsonResult = $String(object.jsonResult);
            if (object.errorDocumentation != null)
                if (typeof object.errorDocumentation !== "string" || object.errorDocumentation.length)
                    message.errorDocumentation = $String(object.errorDocumentation);
            return message;
        };
        /**
         * Creates a plain object from a RpcResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof krnl.RpcResponse
         * @static
         * @param {krnl.RpcResponse} message RpcResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RpcResponse.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.requestId = "";
                object.ok = false;
                object.error = "";
                object.jsonResult = "";
                object.errorDocumentation = "";
            }
            if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId"))
                object.requestId = message.requestId;
            if (message.ok != null && $Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.error != null && $Object.hasOwnProperty.call(message, "error"))
                object.error = message.error;
            if (message.jsonResult != null && $Object.hasOwnProperty.call(message, "jsonResult"))
                object.jsonResult = message.jsonResult;
            if (message.errorDocumentation != null && $Object.hasOwnProperty.call(message, "errorDocumentation"))
                object.errorDocumentation = message.errorDocumentation;
            return object;
        };
        /**
         * Converts this RpcResponse to JSON.
         * @function toJSON
         * @memberof krnl.RpcResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RpcResponse.prototype.toJSON = function () {
            return RpcResponse.toObject(this, $protobuf.util.toJSONOptions);
        };
        /**
         * Gets the type url for RpcResponse
         * @function getTypeUrl
         * @memberof krnl.RpcResponse
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        RpcResponse.getTypeUrl = function (prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/krnl.RpcResponse";
        };
        return RpcResponse;
    })();
    return krnl;
})();
export { $root as default };
//# sourceMappingURL=krnl_pb.js.map