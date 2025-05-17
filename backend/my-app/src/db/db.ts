import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export const getPrisma = (env: { DATABASE_URL: string }) => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured in the environment");
  }

  const prisma = new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
  }).$extends(withAccelerate());

  return prisma;
};
