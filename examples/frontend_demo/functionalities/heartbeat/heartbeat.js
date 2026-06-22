export const heartbeatAtom = {
  id: "heartbeat",
  method: "GET",
  visibility: "public",
  api: async (input, context) => {
    return { status: "ok", time: Date.now() };
  }
};

export default heartbeatAtom;
