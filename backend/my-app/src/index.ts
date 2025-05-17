import { Hono } from "hono";
import { cors } from "hono/cors";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import requests from "./routes/requests";
import { WebSocketServer, wsServer } from "./routes/ws";

import users from "./routes/users";
type Variables = {
  wsServer: WebSocketServer;
  user: { userId: string; name: string };
};
const app = new Hono<{ Variables: Variables }>();

app.use("*", cors({ origin: "*" }));
app.route("/api/requests", requests);
app.route("/api/users", users);

//Web sockets
app.get(
  "/ws",
  upgradeWebSocket((c) => {
    const ws = c.get("ws");
    wsServer.add(ws);
    return {
      onMessage(event, ws) {
        wsServer.broadcast(
          JSON.stringify({ event: "update", data: event.data })
        );
      },
      onClose() {
        console.log("WebSocket closed");
      },
      onError(err) {
        console.error("WebSocket error:", err);
      },
    };
  })
);

// Pass wsServer to context
app.use("*", async (c, next) => {
  c.set("wsServer", wsServer);
  await next();
});
export default app;
