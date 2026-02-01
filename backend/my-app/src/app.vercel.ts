/**
 * Vercel-compatible Hono app entry.
 * - Injects env from process.env (no Cloudflare bindings on Vercel).
 * - WebSocket (/ws) is not supported on Vercel serverless; returns 501.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import requestsRoute from "./routes/requests";
import usersRoute from "./routes/users";
import hospitalsRoute from "./routes/hospitals";
import { wsServer } from "./routes/ws";

export interface Bindings {
  DATABASE_URL: string;
  JWT_SECRET: string;
  DIRECT_URL?: string;
}

export interface Variables {
  wsServer: typeof wsServer;
  user: { userId: number; name: string };
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Inject env from process.env on Vercel (no Cloudflare bindings)
app.use("*", async (c, next) => {
  if (typeof process !== "undefined" && process.env && (process.env.VERCEL === "1" || !(c.env && (c.env as any).DATABASE_URL))) {
    (c as any).env = {
      DATABASE_URL: process.env.DATABASE_URL || "",
      JWT_SECRET: process.env.JWT_SECRET || "",
      DIRECT_URL: process.env.DIRECT_URL,
    };
  }
  await next();
});

// CORS middleware for all /api routes
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// WebSocket server in context (broadcasts are no-ops when no WS clients on Vercel)
app.use("*", async (c, next) => {
  if (!c.get("wsServer")) {
    c.set("wsServer", wsServer);
  }
  await next();
});

app.route("/api/users", usersRoute);
app.route("/api/requests", requestsRoute);
app.route("/api/hospitals", hospitalsRoute);

// WebSocket not supported on Vercel serverless
app.get("/ws", (c) => {
  return c.json(
    {
      error: "WebSocket is not available on this deployment.",
      hint: "Use Cloudflare Workers for WebSocket support, or rely on HTTP polling.",
    },
    501
  );
});

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

app.get("/", (c) => {
  return c.text("Emergency Response API is running!");
});

export default app;
