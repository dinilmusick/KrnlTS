import { krnlSystemEntityBase } from "../../../src/krnl/core/K_ENT_Krnl_System_Entity_Base.js";

/**
 * AIServerSystem
 * 
 * Showcase for the Universal Service Suite.
 * Automatically exposes REST, MCP, and ACP on its primary port.
 */
export class AIServerSystem extends krnlSystemEntityBase {
    constructor(port = 10111) {
        // Use port 10111 for this example
        super("AIServerSystem", null, port);

        // 1. A logical tool for calculations
        this.addLocal({
            id: "calculator",
            description: "Performs basic math. Input: { a: number, b: number, op: 'add'|'sub'|'mul'|'div' }",
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

        // 2. A tool for text processing
        this.addLocal({
            id: "textProcessor",
            description: "Processes text strings. Input: { text: string, action: 'uppercase'|'lowercase'|'reverse' }",
            api: async (input) => {
                const { text, action } = input;
                if (action === 'uppercase') return text.toUpperCase();
                if (action === 'lowercase') return text.toLowerCase();
                if (action === 'reverse') return text.split('').reverse().join('');
                return text;
            }
        });

        // 3. A capability sensor (Simulating status)
        this.addLocal({
            id: "getSystemStatus",
            description: "Returns health and runtime metrics of the AIServerSystem.",
            api: async () => {
                return {
                    status: "online",
                    memoryUsage: process.memoryUsage().heapUsed,
                    uptime: process.uptime(),
                    activeProtocols: ["REST", "MCP", "ACP", "WebSocket"]
                };
            }
        });

        console.log(`[AIServerSystem] Active and listening on port ${port}`);
        console.log(`[AIServerSystem] -> REST: http://localhost:${port}/call/:fid`);
        console.log(`[AIServerSystem] -> MCP:  http://localhost:${port}/mcp`);
        console.log(`[AIServerSystem] -> ACP:  http://localhost:${port}/acp`);
    }
}
