import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

let prisma: ReturnType<typeof getPrismaClient>;

function getPrismaClient(DATABASE_URL: string) {
  return new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());
}

export const getPrisma = (env: { DATABASE_URL?: string }) => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured in the environment");
  }

  if (!prisma) {
    prisma = getPrismaClient(env.DATABASE_URL);
  }

  return prisma;
};
