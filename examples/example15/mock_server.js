import http from 'http';
const port = process.env.PORT || 3000;
const delay = process.env.STARTUP_DELAY || 2000;

console.log(`[MockServer] Boot sequence initiated. Waiting ${delay}ms before binding port ${port}...`);

setTimeout(() => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  });
  server.listen(port, () => {
    console.log(`[MockServer] Listening on port ${port}`);
  });
}, parseInt(delay));
