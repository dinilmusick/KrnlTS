declare const plugin: {
    meta: {
        name: string;
        version: string;
    };
    rules: {
        'file-line-limit': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                };
                schema: {
                    type: string;
                    properties: {
                        max: {
                            type: string;
                            default: number;
                        };
                    };
                    additionalProperties: boolean;
                }[];
                messages: {
                    fileLineLimitExceeded: string;
                };
            };
            create(context: any): {
                Program(node: any): void;
            };
        };
        'import-suffix': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                };
                fixable: string;
                messages: {
                    missingSuffix: string;
                };
            };
            create(context: any): {
                ImportDeclaration(node: any): void;
            };
        };
        'helper-purity': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                };
                messages: {
                    impureImport: string;
                };
            };
            create(context: any): {
                ImportDeclaration?: undefined;
            } | {
                ImportDeclaration(node: any): void;
            };
        };
        'no-polling': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                };
                messages: {
                    noPolling: string;
                };
            };
            create(context: any): {
                CallExpression(node: any): void;
            };
        };
        'context-destructuring': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                };
                messages: {
                    destructureSystem: string;
                };
            };
            create(context: any): {
                FunctionDeclaration(node: any): void;
                ArrowFunctionExpression(node: any): void;
                FunctionExpression(node: any): void;
            };
        };
        'no-server-in-subapp': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                };
                messages: {
                    noServer: string;
                };
            };
            create(context: any): {
                CallExpression?: undefined;
            } | {
                CallExpression(node: any): void;
            };
        };
    };
    configs: {
        recommended: {
            plugins: {
                '@dinilmusick/krnl': {
                    rules: {
                        'file-line-limit': {
                            meta: {
                                type: string;
                                docs: {
                                    description: string;
                                    recommended: boolean;
                                };
                                schema: {
                                    type: string;
                                    properties: {
                                        max: {
                                            type: string;
                                            default: number;
                                        };
                                    };
                                    additionalProperties: boolean;
                                }[];
                                messages: {
                                    fileLineLimitExceeded: string;
                                };
                            };
                            create(context: any): {
                                Program(node: any): void;
                            };
                        };
                        'import-suffix': {
                            meta: {
                                type: string;
                                docs: {
                                    description: string;
                                    recommended: boolean;
                                };
                                fixable: string;
                                messages: {
                                    missingSuffix: string;
                                };
                            };
                            create(context: any): {
                                ImportDeclaration(node: any): void;
                            };
                        };
                        'helper-purity': {
                            meta: {
                                type: string;
                                docs: {
                                    description: string;
                                    recommended: boolean;
                                };
                                messages: {
                                    impureImport: string;
                                };
                            };
                            create(context: any): {
                                ImportDeclaration?: undefined;
                            } | {
                                ImportDeclaration(node: any): void;
                            };
                        };
                        'no-polling': {
                            meta: {
                                type: string;
                                docs: {
                                    description: string;
                                    recommended: boolean;
                                };
                                messages: {
                                    noPolling: string;
                                };
                            };
                            create(context: any): {
                                CallExpression(node: any): void;
                            };
                        };
                        'context-destructuring': {
                            meta: {
                                type: string;
                                docs: {
                                    description: string;
                                    recommended: boolean;
                                };
                                messages: {
                                    destructureSystem: string;
                                };
                            };
                            create(context: any): {
                                FunctionDeclaration(node: any): void;
                                ArrowFunctionExpression(node: any): void;
                                FunctionExpression(node: any): void;
                            };
                        };
                        'no-server-in-subapp': {
                            meta: {
                                type: string;
                                docs: {
                                    description: string;
                                    recommended: boolean;
                                };
                                messages: {
                                    noServer: string;
                                };
                            };
                            create(context: any): {
                                CallExpression?: undefined;
                            } | {
                                CallExpression(node: any): void;
                            };
                        };
                    };
                };
            };
            rules: {
                '@dinilmusick/krnl/file-line-limit': string;
                '@dinilmusick/krnl/import-suffix': string;
                '@dinilmusick/krnl/helper-purity': string;
                '@dinilmusick/krnl/no-polling': string;
                '@dinilmusick/krnl/context-destructuring': string;
                '@dinilmusick/krnl/no-server-in-subapp': string;
            };
        };
    };
};

export { plugin as default };
