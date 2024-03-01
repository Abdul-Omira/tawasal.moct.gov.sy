/**
 * TAWASAL Form Builder Platform - Database Configuration
 * Syrian Ministry of Communication Platform
 * 
 * This module establishes and exports the SQLite database connection
 * using Drizzle ORM and better-sqlite3 for the form builder platform.
 * 
 * @author Abdulwahab Omira <abdulwahab.omira@moct.gov.sy>
 * @version 1.0.0
 * @license Government of Syria - Ministry of Communications
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema-form-builder";
import "dotenv/config";

// Create SQLite database file for form builder
const sqlite = new Database("./form-builder-dev.db");

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

// Enable foreign key constraints
sqlite.pragma("foreign_keys = ON");

// Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Test database connection
console.log("✅ Successfully connected to Form Builder SQLite database: form-builder-dev.db");

// Export the SQLite instance for potential direct access
export { sqlite };

// Database health check function
export async function checkDatabaseHealth() {
  try {
    const result = await db.run("SELECT 1 as health_check");
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: "unhealthy", error: error.message, timestamp: new Date().toISOString() };
  }
}

// Database statistics function
export async function getDatabaseStats() {
  try {
    const formsCount = await db.run("SELECT COUNT(*) as count FROM forms");
    const componentsCount = await db.run("SELECT COUNT(*) as count FROM form_components");
    const responsesCount = await db.run("SELECT COUNT(*) as count FROM form_responses");
    const templatesCount = await db.run("SELECT COUNT(*) as count FROM form_templates");
    
    return {
      forms: formsCount.count || 0,
      components: componentsCount.count || 0,
      responses: responsesCount.count || 0,
      templates: templatesCount.count || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting database stats:", error);
    return null;
  }
}
