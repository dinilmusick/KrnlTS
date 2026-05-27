import { krnlSystemEntityBase } from "../../../dist/index.js";
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

export class App2 extends krnlSystemEntityBase {
    constructor(basePort = 11050) {
        super("App2", null, basePort);
    }
    async start() {
        // App 2 checks for occupied ports then assigns its own
        const port = await findFreePort(13000);
        console.log(`[App2] Server started on ${port}`);
        this.addLocal({ id: "server1", port: port });
        return { port };
    }
}
