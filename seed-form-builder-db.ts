/**
 * Form Builder Database Seeding Script
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { db } from './server/db-form-builder';
import { users } from './shared/schema-form-builder';
import bcrypt from 'bcrypt';

async function seedFormBuilderDatabase() {
  console.log('🌱 Seeding form builder database with test users...');
  
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      id: 'admin-001',
      username: 'admin',
      email: 'admin@moct.gov.sy',
      name: 'System Administrator',
      password: adminPassword,
      is_admin: true,
      created_at: new Date()
    });

    // Create employee user
    const employeePassword = await bcrypt.hash('employee123', 10);
    await db.insert(users).values({
      id: 'employee-001',
      username: 'employee',
      email: 'employee@moct.gov.sy',
      name: 'Test Employee',
      password: employeePassword,
      is_admin: false,
      created_at: new Date()
    });

    console.log('✅ Form builder database seeded successfully!');
    console.log('Admin credentials: admin@moct.gov.sy / admin123');
    console.log('Employee credentials: employee@moct.gov.sy / employee123');
    
  } catch (error) {
    console.error('❌ Error seeding form builder database:', error);
  }
}

seedFormBuilderDatabase();
