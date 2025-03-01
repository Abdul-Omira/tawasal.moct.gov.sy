/**
 * TAWASAL Form Builder Platform - Database Setup Script
 * Syrian Ministry of Communication Platform
 * 
 * This script creates the form builder database tables and sets up the necessary
 * structure for the dynamic form builder platform.
 * 
 * @author Abdulwahab Omira <abdulwahab.omira@moct.gov.sy>
 * @version 1.0.0
 * @license Government of Syria - Ministry of Communications
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./shared/schema-form-builder";
import bcrypt from "bcrypt";

async function setupFormBuilderDatabase() {
  console.log("🚀 Setting up Form Builder SQLite database...");
  
  try {
    // Create SQLite database
    const sqlite = new Database("./form-builder-dev.db");
    const db = drizzle(sqlite, { schema });
    
    console.log("✅ Database connection established");
    
    // Create tables
    console.log("📋 Creating Form Builder database tables...");
    
    // Create forms table
    await db.run(`
      CREATE TABLE IF NOT EXISTS forms (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        settings TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'draft',
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        published_at INTEGER
      )
    `);
    
    // Create form_components table
    await db.run(`
      CREATE TABLE IF NOT EXISTS form_components (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT NOT NULL DEFAULT '{}',
        order_index INTEGER NOT NULL,
        conditional_logic TEXT DEFAULT '{}',
        validation_rules TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      )
    `);
    
    // Create form_responses table
    await db.run(`
      CREATE TABLE IF NOT EXISTS form_responses (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        response_data TEXT NOT NULL,
        submitted_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        user_info TEXT DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'completed',
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      )
    `);
    
    // Create form_analytics table
    await db.run(`
      CREATE TABLE IF NOT EXISTS form_analytics (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        date TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        submissions INTEGER DEFAULT 0,
        completion_rate REAL DEFAULT 0.0,
        avg_completion_time INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      )
    `);
    
    // Create form_templates table
    await db.run(`
      CREATE TABLE IF NOT EXISTS form_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        template_data TEXT NOT NULL,
        category TEXT NOT NULL,
        is_public INTEGER DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Create users table (if not exists)
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    console.log("✅ Database tables created successfully");
    
    // Create default admin and employee users
    console.log("👤 Creating default users...");
    
    const adminPassword = await bcrypt.hash("admin123", 10);
    const employeePassword = await bcrypt.hash("employee123", 10);
    
    // Insert admin user
    try {
      await db.insert(schema.users).values({
        id: crypto.randomUUID(),
        username: "admin",
        password: adminPassword,
        name: "Form Builder Admin",
        email: "admin@moct.gov.sy",
        isAdmin: true
      });
      console.log("✅ Admin user created");
    } catch (error) {
      console.log("ℹ️ Admin user already exists");
    }
    
    // Insert employee user
    try {
      await db.insert(schema.users).values({
        id: crypto.randomUUID(),
        username: "employee",
        password: employeePassword,
        name: "Form Builder Employee",
        email: "employee@moct.gov.sy",
        isAdmin: false
      });
      console.log("✅ Employee user created");
    } catch (error) {
      console.log("ℹ️ Employee user already exists");
    }
    
    // Create sample form templates
    console.log("📝 Creating sample form templates...");
    
    const sampleTemplates = [
      {
        id: crypto.randomUUID(),
        name: "Citizen Feedback Form",
        description: "Template for collecting citizen feedback and suggestions",
        category: "feedback",
        isPublic: true,
        createdBy: "admin",
        templateData: {
          title: "نموذج آراء المواطنين",
          description: "نرحب بآرائكم ومقترحاتكم لتحسين خدماتنا",
          components: [
            {
              type: "text",
              config: {
                label: "الاسم الكامل",
                required: true,
                placeholder: "أدخل اسمك الكامل"
              }
            },
            {
              type: "email",
              config: {
                label: "البريد الإلكتروني",
                required: true,
                placeholder: "example@email.com"
              }
            },
            {
              type: "dropdown",
              config: {
                label: "نوع الاستفسار",
                required: true,
                options: [
                  { value: "complaint", label: "شكوى" },
                  { value: "suggestion", label: "اقتراح" },
                  { value: "inquiry", label: "استفسار" }
                ]
              }
            },
            {
              type: "textarea",
              config: {
                label: "التعليق أو الاستفسار",
                required: true,
                placeholder: "اكتب تعليقك هنا...",
                maxLength: 1000
              }
            }
          ]
        }
      },
      {
        id: crypto.randomUUID(),
        name: "Business Registration Survey",
        description: "Survey for business registration and needs assessment",
        category: "application",
        isPublic: true,
        createdBy: "admin",
        templateData: {
          title: "استطلاع تسجيل الأعمال",
          description: "نموذج لتقييم احتياجات الشركات والمؤسسات",
          components: [
            {
              type: "text",
              config: {
                label: "اسم الشركة",
                required: true,
                placeholder: "أدخل اسم الشركة"
              }
            },
            {
              type: "dropdown",
              config: {
                label: "نوع النشاط",
                required: true,
                options: [
                  { value: "technology", label: "تقانة المعلومات" },
                  { value: "telecommunications", label: "الاتصالات" },
                  { value: "services", label: "الخدمات" },
                  { value: "manufacturing", label: "التصنيع" }
                ]
              }
            },
            {
              type: "multi-select",
              config: {
                label: "الخدمات المطلوبة",
                required: true,
                options: [
                  { value: "internet", label: "خدمات الإنترنت" },
                  { value: "phone", label: "خدمات الهاتف" },
                  { value: "data", label: "خدمات البيانات" },
                  { value: "support", label: "الدعم التقني" }
                ]
              }
            },
            {
              type: "rating",
              config: {
                label: "تقييم الخدمات الحالية",
                required: true,
                type: "scale",
                maxValue: 10,
                labels: {
                  min: "ضعيف جداً",
                  max: "ممتاز"
                }
              }
            }
          ]
        }
      }
    ];
    
    for (const template of sampleTemplates) {
      try {
        await db.insert(schema.formTemplates).values(template);
        console.log(`✅ Template "${template.name}" created`);
      } catch (error) {
        console.log(`ℹ️ Template "${template.name}" already exists`);
      }
    }
    
    console.log("✅ Sample templates created successfully");
    
    // Create indexes for better performance
    console.log("🔍 Creating database indexes...");
    
    await db.run(`CREATE INDEX IF NOT EXISTS idx_forms_created_by ON forms(created_by)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_form_components_form_id ON form_components(form_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_form_components_order ON form_components(form_id, order_index)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at ON form_responses(submitted_at)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_form_analytics_form_id ON form_analytics(form_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_form_analytics_date ON form_analytics(date)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_form_templates_public ON form_templates(is_public)`);
    
    console.log("✅ Database indexes created successfully");
    
    console.log("\n🎉 Form Builder database setup completed successfully!");
    console.log("📁 Database file: ./form-builder-dev.db");
    console.log("\n👤 Default Users:");
    console.log("   👑 Admin: admin / admin123");
    console.log("   👷 Employee: employee / employee123");
    console.log("\n📝 Sample Templates:");
    console.log("   📋 Citizen Feedback Form");
    console.log("   🏢 Business Registration Survey");
    
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  }
}

// Run the setup
setupFormBuilderDatabase();
