export default {
  async fetch(request, env) {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade === "websocket") {
      const url = new URL(request.url);
      const host = url.searchParams.get("host") || "speed.cloudflare.com";
      
      const [client, server] = Object.values(new WebSocketPair());
      server.accept();
      
      const ws = new WebSocket(`wss://${host}`);
      ws.addEventListener("open", () => {
        server.addEventListener("message", e => ws.send(e.data));
        ws.addEventListener("message", e => server.send(e.data));
      });
      ws.addEventListener("close", () => server.close());
      server.addEventListener("close", () => ws.close());
      
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("OK");
  }
}