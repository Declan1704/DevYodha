import { Hono } from "hono";
import { cors } from "hono/cors";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import requestsRoute from "./routes/requests";
import usersRoute from "./routes/users";
import hospitalsRoute from "./routes/hospitals";
import { WebSocketServer, wsServer } from "./routes/ws";

export interface Bindings {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

export interface Variables {
  wsServer: WebSocketServer;
  user: { userId: number; name: string };
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("*", async (c, next) => {
  if (!c.get("wsServer")) {
    c.set("wsServer", wsServer);
  }
  await next();
});

app.route("/api/users", usersRoute);
app.route("/api/requests", requestsRoute);
app.route("/api/hospitals", hospitalsRoute);

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    console.log("WebSocket upgrade requested from client");
    const server = c.get("wsServer");

    return {
      onOpen: (event: any, ws: any) => {
        console.log("WebSocket connection opened");
        server.add(ws);
      },
      onMessage: (event, ws) => {
        console.log("Raw message received on backend WebSocket:", event.data);
        try {
          const messageData =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          console.log("Parsed WS message from client:", messageData);
        } catch (e) {
          console.warn(
            "Received non-JSON WS message or parse error:",
            event.data
          );
          server.broadcast(
            JSON.stringify({
              event: "client_message",
              data: event.data,
              source: "direct_ws_echo_for_debug",
            })
          );
        }
      },
      onClose: (event, ws) => {
        console.log("WebSocket connection closed");
        server.remove(ws);
      },
      onError: (event, ws) => {
        console.error("WebSocket error:", event);
        if (ws) server.remove(ws);
      },
    };
  })
);

app.onError((err, c) => {
  console.error(`${c.req.method} ${c.req.url} - Server error:`, err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
    500
  );
});

app.get("/", (c) => {
  return c.text("Emergency Response API is running!");
});

export default app;
