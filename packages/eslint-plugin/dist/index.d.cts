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
        'top-level-purity': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                };
                messages: {
                    topLevelRawMarkup: string;
                    topLevelHook: string;
                    topLevelBackendRoute: string;
                };
            };
            create(context: any): {
                JSXOpeningElement?: undefined;
                JSXSelfClosingElement?: undefined;
                CallExpression?: undefined;
            } | {
                JSXOpeningElement(node: any): void;
                JSXSelfClosingElement(node: any): void;
                CallExpression(node: any): void;
            };
        };
        'one-component-per-file': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    recommended: boolean;
                };
                messages: {
                    multipleComponents: string;
                };
            };
            create(context: any): {
                FunctionDeclaration?: undefined;
                VariableDeclarator?: undefined;
                ClassDeclaration?: undefined;
                'Program:exit'?: undefined;
            } | {
                FunctionDeclaration(node: any): void;
                VariableDeclarator(node: any): void;
                ClassDeclaration(node: any): void;
                'Program:exit'(): void;
            };
        };
    };
    configs: {
        recommended: {
            plugins: {
                '@ultrst-armada/krnl': {
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
                        'top-level-purity': {
                            meta: {
                                type: string;
                                docs: {
                                    description: string;
                                    recommended: boolean;
                                };
                                messages: {
                                    topLevelRawMarkup: string;
                                    topLevelHook: string;
                                    topLevelBackendRoute: string;
                                };
                            };
                            create(context: any): {
                                JSXOpeningElement?: undefined;
                                JSXSelfClosingElement?: undefined;
                                CallExpression?: undefined;
                            } | {
                                JSXOpeningElement(node: any): void;
                                JSXSelfClosingElement(node: any): void;
                                CallExpression(node: any): void;
                            };
                        };
                        'one-component-per-file': {
                            meta: {
                                type: string;
                                docs: {
                                    description: string;
                                    recommended: boolean;
                                };
                                messages: {
                                    multipleComponents: string;
                                };
                            };
                            create(context: any): {
                                FunctionDeclaration?: undefined;
                                VariableDeclarator?: undefined;
                                ClassDeclaration?: undefined;
                                'Program:exit'?: undefined;
                            } | {
                                FunctionDeclaration(node: any): void;
                                VariableDeclarator(node: any): void;
                                ClassDeclaration(node: any): void;
                                'Program:exit'(): void;
                            };
                        };
                    };
                };
            };
            rules: {
                '@ultrst-armada/krnl/file-line-limit': string;
                '@ultrst-armada/krnl/import-suffix': string;
                '@ultrst-armada/krnl/helper-purity': string;
                '@ultrst-armada/krnl/no-polling': string;
                '@ultrst-armada/krnl/context-destructuring': string;
                '@ultrst-armada/krnl/no-server-in-subapp': string;
                '@ultrst-armada/krnl/top-level-purity': string;
                '@ultrst-armada/krnl/one-component-per-file': string;
            };
        };
    };
};

export { plugin as default };
