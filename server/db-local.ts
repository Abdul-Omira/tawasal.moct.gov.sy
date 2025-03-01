/**
 * TAWASAL.MOCT.GOV.SY - Local Development Database Configuration
 * Syrian Ministry of Communication Platform
 * 
 * This module establishes and exports the SQLite database connection
 * using Drizzle ORM and better-sqlite3 for local development.
 * 
 * @author Abdulwahab Omira <abdulwahab.omira@moct.gov.sy>
 * @version 1.0.0
 * @license Government of Syria - Ministry of Communications
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema-local";
import "dotenv/config";

// Create SQLite database file
const sqlite = new Database("./local-dev.db");

// Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Test database connection
console.log("✅ Successfully connected to SQLite database: local-dev.db");

// Export the SQLite instance for potential direct access
export { sqlite };
