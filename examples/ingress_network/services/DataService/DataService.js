import { krnlSystemEntityBase } from "../../../../dist/index.js";

export class DataService extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10092, options = {}) {
        super("DataService", null, port, options.host || "0.0.0.0", options);

        this.addLocal({
            id: "fetchData",
            visibility: "public",
            description: "Retrieve items from in-memory data store.",
            api: async (input) => {
                const { category } = input || {};
                const items = [
                    { id: 1, name: "Product A", category: "electronics" },
                    { id: 2, name: "Product B", category: "books" },
                    { id: 3, name: "Product C", category: "electronics" }
                ];
                if (category) {
                    return items.filter(item => item.category === category);
                }
                return items;
            }
        });
    }
}
