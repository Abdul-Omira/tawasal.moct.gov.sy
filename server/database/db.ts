/**
 * Database Configuration Module
 *
 * This module establishes and exports the PostgreSQL database connection
 * using Drizzle ORM and a native Postgres (pg) client.
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres"; // for native Postgres use
import * as schema from "@shared/schema"; // adjust the path if needed
import "dotenv/config";

const { Pool } = pg;

// Validate database connection string
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not defined. Please provide a valid PostgreSQL connection string."
  );
}

// Create a connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Handle connection errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
  process.exit(-1);
});

// Test database connection
(async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to PostgreSQL database");
    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to database:", err);
  }
})();
