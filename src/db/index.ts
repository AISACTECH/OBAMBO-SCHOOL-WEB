import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

// Keep the client constructible during `next build`, where dynamic routes are
// analysed without a live database. Requests still fail fast when the app is
// started without DATABASE_URL instead of silently connecting to a local
// database by accident.
const connectionString = databaseUrl || (isProductionBuild ? "postgresql://postgres:postgres@127.0.0.1:5432/app_db" : undefined);
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle({ client: pool });
