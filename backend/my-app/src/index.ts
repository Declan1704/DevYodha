import { Hono } from "hono";
import { cors } from "hono/cors";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import requests from "./routes/requests";
import users from "./routes/users";
import { WebSocketServer, wsServer } from "./routes/ws";

type Variables = {
  wsServer: WebSocketServer;
  user: { userId: string; name: string };
};

const app = new Hono<{ Variables: Variables }>();

app.use("/api/*", cors({ origin: "*" }));

app.route("/api/requests", requests);
app.route("/api/users", users);

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    console.log("WebSocket upgrade requested");
    return {
      onMessage(event, ws: any) {
        console.log("Message received:", event.data);
        if (!wsServer.has(ws)) {
          wsServer.add(ws);
        }
        wsServer.broadcast(
          JSON.stringify({ event: "update", data: event.data })
        );
      },
      onClose(event, ws: any) {
        console.log("WebSocket closed");
        wsServer.remove(ws); // Clean up closed WebSocket
      },
      onError(err) {
        console.error("WebSocket error:", err);
        // Unable to remove ws here because ws is not available in onError
      },
    };
  })
);

app.use("*", async (c, next) => {
  c.set("wsServer", wsServer);
  await next();
});

app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal server error", details: err.message }, 500);
});

export default app;
