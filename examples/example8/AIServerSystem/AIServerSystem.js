import { Entity, krnlUnifiedHttpAdapter } from "../../../dist/index.js";

/**
 * AIServerSystem
 * 
 * Showcase for the Universal Service Suite with Gross Architecture Entity.
 * Exposes REST, MCP, ACP, and Flows on its unified port.
 */
export class AIServerSystem extends Entity {
    constructor(port = 10111, options = {}) {
        super("AIServerSystem", null, options);

        // 1. Math calculation tool
        this.addLocal({
            id: "calculator",
            description: "Performs basic math. Input: { a: number, b: number, op: 'add'|'sub'|'mul'|'div' }",
            manifest: {
                version: "1.0.0",
                capabilities: ["math:calculator"]
            },
            api: async (input) => {
                const { a, b, op } = input;
                switch (op) {
                    case 'add': return a + b;
                    case 'sub': return a - b;
                    case 'mul': return a * b;
                    case 'div': return a / b;
                    default: throw new Error("Invalid operator");
                }
            }
        });

        // 2. Text processing tool
        this.addLocal({
            id: "textProcessor",
            description: "Processes text strings. Input: { text: string, action: 'uppercase'|'lowercase'|'reverse' }",
            manifest: {
                version: "1.0.0",
                capabilities: ["text:transform"]
            },
            api: async (input) => {
                const { text, action } = input;
                if (action === 'uppercase') return text.toUpperCase();
                if (action === 'lowercase') return text.toLowerCase();
                if (action === 'reverse') return text.split('').reverse().join('');
                return text;
            }
        });

        // 3. Capability sensor (Health metrics)
        this.addLocal({
            id: "getSystemStatus",
            description: "Returns health and runtime metrics of the AIServerSystem.",
            manifest: {
                version: "1.0.0",
                capabilities: ["system:status"]
            },
            api: async () => {
                return {
                    status: "online",
                    memoryUsage: process.memoryUsage().heapUsed,
                    uptime: process.uptime(),
                    activeProtocols: ["REST", "MCP", "ACP", "WebSocket"]
                };
            }
        });

        // 4. Flow definition as a first-class functionality
        this.flow("calculateAndFormat")
            .then("calculator")
            .register({
                visibility: "public",
                description: "Composite flow performing calculation and result packaging"
            });

        // 5. Attach Protocol Adapter
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, port, options.host || "0.0.0.0"));
    }
}
