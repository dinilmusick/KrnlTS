import { krnlSystemEntityBase } from "../../../../dist/index.js";

export class AIService extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10093, options = {}) {
        super("AIService", null, port, options.host || "0.0.0.0", options);

        this.addLocal({
            id: "generateText",
            visibility: "public",
            description: "Mock generating text responses.",
            api: async (input) => {
                const { prompt } = input || {};
                return {
                    prompt,
                    response: `This is a mock AI generation response to prompt: "${prompt || 'none'}"`
                };
            }
        });
    }
}
