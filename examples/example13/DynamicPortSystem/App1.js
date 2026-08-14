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

export class App1 extends Entity {
    constructor(basePort = 11000) {
        super("App1", null);
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, basePort));
    }
    async start() {
        await this.finalize();
        const port1 = await findFreePort(12000);
        const port2 = await findFreePort(port1 + 1);
        console.log(`[App1] Servers started on ${port1} and ${port2}`);
        this.addLocal({ id: "server1", api: async () => ({ port: port1 }) });
        this.addLocal({ id: "server2", api: async () => ({ port: port2 }) });
        return { port1, port2 };
    }
}
