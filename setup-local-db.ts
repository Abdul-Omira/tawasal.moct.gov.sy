/**
 * TAWASAL.MOCT.GOV.SY - Local Database Setup Script
 * Syrian Ministry of Communication Platform
 * 
 * This script creates the local SQLite database and sets up the necessary tables
 * for local development.
 * 
 * @author Abdulwahab Omira <abdulwahab.omira@moct.gov.sy>
 * @version 1.0.0
 * @license Government of Syria - Ministry of Communications
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./shared/schema-local";
import bcrypt from "bcrypt";

async function setupLocalDatabase() {
  console.log("🚀 Setting up local SQLite database...");
  
  try {
    // Create SQLite database
    const sqlite = new Database("./local-dev.db");
    const db = drizzle(sqlite, { schema });
    
    console.log("✅ Database connection established");
    
    // Create tables
    console.log("📋 Creating database tables...");
    
    // Create users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Create citizen_communications table
    await db.run(`
      CREATE TABLE IF NOT EXISTS citizen_communications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        governorate TEXT,
        communication_type TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        attachment_url TEXT,
        attachment_type TEXT,
        attachment_name TEXT,
        attachment_size INTEGER,
        captcha_answer TEXT NOT NULL,
        consent_to_data_use INTEGER NOT NULL,
        wants_updates INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        ip_address TEXT,
        geolocation TEXT,
        isp_info TEXT,
        vpn_detection TEXT,
        hosting_provider TEXT,
        user_agent TEXT,
        browser_info TEXT,
        device_type TEXT,
        language TEXT,
        screen_resolution TEXT,
        timezone TEXT,
        touch_support INTEGER,
        battery_status TEXT,
        installed_fonts TEXT,
        referrer_url TEXT,
        page_url TEXT,
        page_load_time INTEGER,
        javascript_enabled INTEGER,
        cookies_enabled INTEGER,
        do_not_track INTEGER,
        browser_plugins TEXT,
        webgl_fingerprint TEXT
      )
    `);
    
    // Create business_submissions table
    await db.run(`
      CREATE TABLE IF NOT EXISTS business_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_name TEXT,
        business_type TEXT,
        establishment_date TEXT,
        employees_count TEXT NOT NULL,
        address TEXT NOT NULL,
        governorate TEXT NOT NULL,
        registration_number TEXT,
        contact_name TEXT NOT NULL,
        position TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        alternative_contact TEXT,
        website TEXT,
        challenges TEXT NOT NULL,
        challenge_details TEXT NOT NULL,
        tech_needs TEXT NOT NULL,
        tech_details TEXT,
        consent_to_data_use INTEGER NOT NULL,
        wants_updates INTEGER NOT NULL DEFAULT 0,
        additional_comments TEXT,
        sanctioned_company_name TEXT,
        sanctioned_company_link TEXT,
        captcha_answer TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        ip_address TEXT,
        geolocation TEXT,
        isp_info TEXT,
        vpn_detection TEXT,
        hosting_provider TEXT,
        user_agent TEXT,
        browser_info TEXT,
        device_type TEXT,
        language TEXT,
        screen_resolution TEXT,
        timezone TEXT,
        touch_support INTEGER,
        battery_status TEXT,
        installed_fonts TEXT,
        referrer_url TEXT,
        page_url TEXT,
        page_load_time INTEGER,
        javascript_enabled INTEGER,
        cookies_enabled INTEGER,
        do_not_track INTEGER,
        browser_plugins TEXT,
        webgl_fingerprint TEXT
      )
    `);
    
    // Create sessions table
    await db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      )
    `);
    
    // Create login_attempts table
    await db.run(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        ip_address TEXT,
        user_agent TEXT,
        device_fingerprint TEXT,
        success INTEGER NOT NULL DEFAULT 0,
        attempt_time INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    console.log("✅ Database tables created successfully");
    
    // Create default admin and employee users
    console.log("👤 Creating default users...");
    
    const adminPassword = await bcrypt.hash("admin123", 10);
    const employeePassword = await bcrypt.hash("employee123", 10);
    
    // Insert admin user using Drizzle ORM
    try {
      await db.insert(schema.users).values({
        username: "admin",
        password: adminPassword,
        name: "Development Admin",
        isAdmin: true
      });
      console.log("✅ Admin user created");
    } catch (error) {
      console.log("ℹ️ Admin user already exists");
    }
    
    // Insert employee user using Drizzle ORM
    try {
      await db.insert(schema.users).values({
        username: "employee",
        password: employeePassword,
        name: "Development Employee",
        isAdmin: false
      });
      console.log("✅ Employee user created");
    } catch (error) {
      console.log("ℹ️ Employee user already exists");
    }
    
    console.log("✅ Default users setup completed");
    console.log("   👑 Admin: admin / admin123");
    console.log("   👷 Employee: employee / employee123");
    
    console.log("\n🎉 Local database setup completed successfully!");
    console.log("📁 Database file: ./local-dev.db");
    
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  }
}

// Run the setup
setupLocalDatabase();
