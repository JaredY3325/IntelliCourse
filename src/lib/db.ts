import "server-only";
import { PrismaClient } from "@prisma/client";

declare global {
  var globalForPrisma: {
    prisma: PrismaClient;
  };
}

// limits prisma connection to one
export const prisma: PrismaClient =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
