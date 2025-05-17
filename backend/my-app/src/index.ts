import { Hono } from "hono";
import { cors } from "hono/cors";

import users from "./routes/users";

const app = new Hono();

app.use("*", cors({ origin: "*" }));

app.route("/api/users", users);

export default app;
