import { Hono } from "hono";
import { cors } from "hono/cors";
import { upgradeWebSocket } from "hono/cloudflare-workers"; // Or hono/node if not on CF
import requestsRoute from "./routes/requests";
import usersRoute from "./routes/users";
import hospitalsRoute from "./routes/hospitals"; // Import new hospitals route
import { WebSocketServer, wsServer } from "./routes/ws";

// Define Bindings and Variables for Hono context
export interface Bindings {
  DATABASE_URL: string; // For Prisma connection
  JWT_SECRET: string; // For JWT authentication
  // Add other Cloudflare bindings if necessary (e.g., KV, R2)
}

export interface Variables {
  wsServer: WebSocketServer;
  user: { userId: number; name: string }; // Ensure userId is number
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware for all /api routes
app.use(
  "/api/*",
  cors({
    origin: "*", // Be more specific in production, e.g., 'http://localhost:3000' or your frontend domain
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Initialize WebSocket server and set it in context for all routes
app.use("*", async (c, next) => {
  if (!c.get("wsServer")) {
    // Initialize only once
    c.set("wsServer", wsServer);
  }
  await next();
});

// Route definitions
app.route("/api/users", usersRoute);
app.route("/api/requests", requestsRoute);
app.route("/api/hospitals", hospitalsRoute); // Add hospitals route

// WebSocket upgrade endpoint
app.get(
  "/ws",
  upgradeWebSocket((c) => {
    // Removed 'c' type annotation to infer from Hono app instance
    console.log("WebSocket upgrade requested from client");
    const server = c.get("wsServer"); // wsServer should be correctly typed now

    return {
      onOpen: (event: any, ws: any) => {
        // Correct onOpen signature
        console.log("WebSocket connection opened");
        server.add(ws);
      },
      onMessage: (event, ws) => {
        // Correct onMessage signature
        console.log("Raw message received on backend WebSocket:", event.data);
        // The backend's job for /ws is usually to handle messages FROM the client
        // and then decide what to broadcast or how to react.
        // A simple echo or specific command processing could go here.
        // For this app, most broadcasts are initiated by HTTP route handlers.
        // If clients need to send commands via WS (e.g., "subscribeToRequestUpdates:requestId"), handle here.

        // Example: If client sends structured JSON, parse it
        try {
          const messageData =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          console.log("Parsed WS message from client:", messageData);
          // Process messageData.type or messageData.action here
          // e.g., if (messageData.action === 'ping') ws.send(JSON.stringify({ action: 'pong'}));
        } catch (e) {
          console.warn(
            "Received non-JSON WS message or parse error:",
            event.data
          );
          // Fallback for simple string messages if needed
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
        // Correct onClose signature
        console.log("WebSocket connection closed");
        server.remove(ws); // Ensure client is removed from the set
      },
      onError: (event, ws) => {
        // Correct onError signature
        console.error("WebSocket error:", event);
        // ws might be undefined if error happens before connection fully established
        if (ws) server.remove(ws);
      },
    };
  })
);

// Global error handler
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

// Welcome route
app.get("/", (c) => {
  return c.text("Emergency Response API is running!");
});

export default app;
