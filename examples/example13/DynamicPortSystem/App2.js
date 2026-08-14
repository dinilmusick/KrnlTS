import { Entity, krnlUnifiedHttpAdapter } from "../../../dist/index.js";
import net from 'net';

function isPortTaken(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(true));
        server.once('listening', () => {
            server.close();
            resolve(false);
        });
        server.listen(port);
    });
}

async function findFreePort(startPort) {
    let port = startPort;
    while (await isPortTaken(port)) {
        port++;
    }
    return port;
}

export class App2 extends Entity {
    constructor(basePort = 11050) {
        super("App2", null);
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, basePort));
    }
    async start() {
        await this.finalize();
        const port = await findFreePort(13000);
        console.log(`[App2] Server started on ${port}`);
        this.addLocal({ id: "server1", api: async () => ({ port }) });
        return { port };
    }
}
