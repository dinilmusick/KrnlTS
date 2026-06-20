import http from 'http';

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        appName: "Non-KrnlTS Express App",
        path: req.url,
        message: "Hello from non-KrnlTS service routed dynamically!",
        timestamp: new Date().toISOString()
    }));
});

server.listen(port, () => {
    console.log(`[Non-Krnl App] Listening on port ${port}`);
});
