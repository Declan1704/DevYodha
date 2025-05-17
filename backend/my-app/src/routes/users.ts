import { Hono } from "hono";
import { getPrisma } from "../db/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface Bindings {
  DATABASE_URL: string;
  DIRECT_URL: string;
  JWT_SECRET: string;
}
const users = new Hono<{ Bindings: Bindings }>();

users.post("/signup", async (c) => {
  const { name, email, password, phone } = await c.req.json();
  const prisma = getPrisma(c.env);
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },
    });
    const token = jwt.sign(
      { userId: user.id, name: user.name },
      c.env.JWT_SECRET!,
      {
        expiresIn: "1d",
      }
    );
    return c.json({ user: { id: user.id, name, email, phone }, token }, 201);
  } catch (error) {
    return c.json({ error: "Email or phone already exists" }, 400);
  }
});

users.post("/signin", async (c) => {
  const { email, password } = await c.req.json();
  const prisma = getPrisma(c.env);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = jwt.sign(
    { userId: user.id, username: user.name },
    c.env.JWT_SECRET!,
    {
      expiresIn: "1d",
    }
  );
  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email,
      phone: user.phone,
    },
    token,
  });
});

export default users;
