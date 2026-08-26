import * as $protobuf from "protobufjs";
import Long = require("long");

/** Namespace krnl. */
export namespace krnl {

    /** MessageKind enum. */
    enum MessageKind {

        /** UNKNOWN value */
        UNKNOWN = 0,

        /** REGISTER_INGRESS value */
        REGISTER_INGRESS = 1,

        /** ROUTE_DATA value */
        ROUTE_DATA = 2,

        /** RPC_REQUEST value */
        RPC_REQUEST = 3,

        /** RPC_RESPONSE value */
        RPC_RESPONSE = 4,

        /** INTROSPECT value */
        INTROSPECT = 5,

        /** INTROSPECT_RESPONSE value */
        INTROSPECT_RESPONSE = 6
    }

    /**
     * Properties of a KrnlMessage.
     * @deprecated Use krnl.KrnlMessage.$Properties instead.
     */
    interface IKrnlMessage extends krnl.KrnlMessage.$Properties {
    }

    /** Represents a KrnlMessage. */
    class KrnlMessage {

        /**
         * Constructs a new KrnlMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: krnl.KrnlMessage.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** KrnlMessage kind. */
        kind: krnl.MessageKind;

        /** KrnlMessage routeId. */
        routeId: string;

        /** KrnlMessage requestId. */
        requestId: string;

        /** KrnlMessage traceCorrelationId. */
        traceCorrelationId: string;

        /** KrnlMessage originSystemAddress. */
        originSystemAddress: string;

        /** KrnlMessage timestamp. */
        timestamp: (number|Long);

        /** KrnlMessage method. */
        method: string;

        /** KrnlMessage collectorName. */
        collectorName: string;

        /** KrnlMessage jsonPayload. */
        jsonPayload: string;

        /** KrnlMessage binaryPayload. */
        binaryPayload: Uint8Array;

        /**
         * Creates a new KrnlMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns KrnlMessage instance
         */
        static create(properties: krnl.KrnlMessage.$Shape): krnl.KrnlMessage & krnl.KrnlMessage.$Shape;
        static create(properties?: krnl.KrnlMessage.$Properties): krnl.KrnlMessage;

        /**
         * Encodes the specified KrnlMessage message. Does not implicitly {@link krnl.KrnlMessage.verify|verify} messages.
         * @param message KrnlMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: krnl.KrnlMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified KrnlMessage message, length delimited. Does not implicitly {@link krnl.KrnlMessage.verify|verify} messages.
         * @param message KrnlMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: krnl.KrnlMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a KrnlMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {krnl.KrnlMessage & krnl.KrnlMessage.$Shape} KrnlMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): krnl.KrnlMessage & krnl.KrnlMessage.$Shape;

        /**
         * Decodes a KrnlMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {krnl.KrnlMessage & krnl.KrnlMessage.$Shape} KrnlMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): krnl.KrnlMessage & krnl.KrnlMessage.$Shape;

        /**
         * Verifies a KrnlMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a KrnlMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns KrnlMessage
         */
        static fromObject(object: { [k: string]: any }): krnl.KrnlMessage;

        /**
         * Creates a plain object from a KrnlMessage message. Also converts values to other types if specified.
         * @param message KrnlMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: krnl.KrnlMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this KrnlMessage to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for KrnlMessage
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace KrnlMessage {

        /** Properties of a KrnlMessage. */
        interface $Properties {

            /** KrnlMessage kind */
            kind?: (krnl.MessageKind|null);

            /** KrnlMessage routeId */
            routeId?: (string|null);

            /** KrnlMessage requestId */
            requestId?: (string|null);

            /** KrnlMessage traceCorrelationId */
            traceCorrelationId?: (string|null);

            /** KrnlMessage originSystemAddress */
            originSystemAddress?: (string|null);

            /** KrnlMessage timestamp */
            timestamp?: (number|Long|null);

            /** KrnlMessage method */
            method?: (string|null);

            /** KrnlMessage collectorName */
            collectorName?: (string|null);

            /** KrnlMessage jsonPayload */
            jsonPayload?: (string|null);

            /** KrnlMessage binaryPayload */
            binaryPayload?: (Uint8Array|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a KrnlMessage. */
        type $Shape = krnl.KrnlMessage.$Properties;
    }

    /**
     * Properties of a RpcResponse.
     * @deprecated Use krnl.RpcResponse.$Properties instead.
     */
    interface IRpcResponse extends krnl.RpcResponse.$Properties {
    }

    /** Represents a RpcResponse. */
    class RpcResponse {

        /**
         * Constructs a new RpcResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: krnl.RpcResponse.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** RpcResponse requestId. */
        requestId: string;

        /** RpcResponse ok. */
        ok: boolean;

        /** RpcResponse error. */
        error: string;

        /** RpcResponse jsonResult. */
        jsonResult: string;

        /** RpcResponse errorDocumentation. */
        errorDocumentation: string;

        /**
         * Creates a new RpcResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RpcResponse instance
         */
        static create(properties: krnl.RpcResponse.$Shape): krnl.RpcResponse & krnl.RpcResponse.$Shape;
        static create(properties?: krnl.RpcResponse.$Properties): krnl.RpcResponse;

        /**
         * Encodes the specified RpcResponse message. Does not implicitly {@link krnl.RpcResponse.verify|verify} messages.
         * @param message RpcResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: krnl.RpcResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RpcResponse message, length delimited. Does not implicitly {@link krnl.RpcResponse.verify|verify} messages.
         * @param message RpcResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: krnl.RpcResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RpcResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {krnl.RpcResponse & krnl.RpcResponse.$Shape} RpcResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): krnl.RpcResponse & krnl.RpcResponse.$Shape;

        /**
         * Decodes a RpcResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {krnl.RpcResponse & krnl.RpcResponse.$Shape} RpcResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): krnl.RpcResponse & krnl.RpcResponse.$Shape;

        /**
         * Verifies a RpcResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RpcResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RpcResponse
         */
        static fromObject(object: { [k: string]: any }): krnl.RpcResponse;

        /**
         * Creates a plain object from a RpcResponse message. Also converts values to other types if specified.
         * @param message RpcResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: krnl.RpcResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RpcResponse to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for RpcResponse
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace RpcResponse {

        /** Properties of a RpcResponse. */
        interface $Properties {

            /** RpcResponse requestId */
            requestId?: (string|null);

            /** RpcResponse ok */
            ok?: (boolean|null);

            /** RpcResponse error */
            error?: (string|null);

            /** RpcResponse jsonResult */
            jsonResult?: (string|null);

            /** RpcResponse errorDocumentation */
            errorDocumentation?: (string|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a RpcResponse. */
        type $Shape = krnl.RpcResponse.$Properties;
    }
}
