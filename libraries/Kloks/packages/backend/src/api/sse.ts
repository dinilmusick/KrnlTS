function getSSEHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  };
}

export function createSSEResponse(
  setupStream: (send: (event: string, data: any) => void) => () => void,
  heartbeatMs = 15000
): Response {
  let timer: any = null;
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const cleanup = setupStream(send);

      const ping = () => {
        timer = setTimeout(() => {
          send('ping', { time: Date.now() });
          ping();
        }, heartbeatMs);
      };
      ping();

      (controller as any).cancel = () => {
        if (timer) clearTimeout(timer);
        cleanup();
      };
    }
  });

  return new Response(stream, { headers: getSSEHeaders() });
}
