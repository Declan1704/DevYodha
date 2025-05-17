import { Hono } from "hono";
import { jwt, verify } from "hono/jwt";

export const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set("user", {
      userId: payload.userId as number,
      name: payload.username as string,
    });
    await next();
  } catch (error) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};
