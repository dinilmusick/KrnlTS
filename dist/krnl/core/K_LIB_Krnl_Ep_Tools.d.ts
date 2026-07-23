export declare const KrnlEpTools: {
    calculator: {
        id: string;
        description: string;
        schema: {
            input: {
                expression: string;
            };
            output: string;
        };
        examples: {
            input: {
                expression: string;
            };
            output: number;
        }[];
        execute: (expression: string) => number;
    };
    jsonCreator: {
        id: string;
        description: string;
        schema: {
            input: {
                jsonStr: string;
                mergeWith: string;
            };
            output: string;
        };
        examples: ({
            input: {
                jsonStr: string;
                mergeWith?: undefined;
            };
            output: {
                a: number;
                b?: undefined;
            };
        } | {
            input: {
                jsonStr: string;
                mergeWith: {
                    a: number;
                };
            };
            output: {
                a: number;
                b: number;
            };
        })[];
        execute: (jsonStr: string, mergeWith?: any) => any;
    };
    textFormatter: {
        id: string;
        description: string;
        schema: {
            input: {
                template: string;
                variables: string;
            };
            output: string;
        };
        examples: {
            input: {
                template: string;
                variables: {
                    name: string;
                };
            };
            output: string;
        }[];
        execute: (template: string, variables: Record<string, any>) => string;
    };
    endpointCaller: {
        id: string;
        description: string;
        schema: {
            input: {
                endpointId: string;
                payload: string;
            };
            output: string;
        };
        examples: {
            input: {
                endpointId: string;
                payload: {
                    name: string;
                    value: string;
                };
            };
            output: {
                status: string;
            };
        }[];
        execute: (system: any, endpointId: string, payload: any) => Promise<any>;
    };
    healthChecker: {
        id: string;
        description: string;
        schema: {
            input: {
                peerId: string;
            };
            output: string;
        };
        examples: {
            input: {
                peerId: string;
            };
            output: {
                status: string;
            };
        }[];
        execute: (system: any, peerId: string) => Promise<any>;
    };
};
//# sourceMappingURL=K_LIB_Krnl_Ep_Tools.d.ts.map