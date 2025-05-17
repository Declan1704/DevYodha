import { Hono } from "hono";
import { getPrisma } from "../db/db";
import { sign } from "jsonwebtoken";
import { hash, compare } from "bcryptjs";

const users = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    DIRECT_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    user: { userId: string; name: string };
  };
}>();

users.post("/signup", async (c) => {
  const prisma = getPrisma(c.env);
  const { name, email, password, phone } = await c.req.json();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ message: "User already exists" }, 409);
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
      },
    });

    // Generate JWT
    const token = sign(
      { userId: user.id, username: user.name },
      c.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return c.json(
      { user: { id: user.id, name: user.name, email: user.email }, token },
      201
    );
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ message: "Signup failed. Please try again." }, 500);
  }
});

users.post("/signin", async (c) => {
  const prisma = getPrisma(c.env);
  const { email, password } = await c.req.json();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    // Verify password
    const isValid = await compare(password, user.password);
    if (!isValid) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    // Generate JWT
    const token = sign(
      { userId: user.id, username: user.name },
      c.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return c.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Signin error:", error);
    return c.json({ message: "Signin failed. Please try again." }, 500);
  }
});

export default users;
