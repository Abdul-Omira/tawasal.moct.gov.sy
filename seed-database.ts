/**
 * Database Seeding Script
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { db } from './server/db-local';
import { users } from './shared/schema-local';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  console.log('🌱 Seeding database with test users...');
  
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      username: 'admin',
      password: adminPassword,
      name: 'System Administrator',
      isAdmin: true,
      createdAt: new Date()
    });

    // Create employee user
    const employeePassword = await bcrypt.hash('employee123', 10);
    await db.insert(users).values({
      username: 'employee',
      password: employeePassword,
      name: 'Test Employee',
      isAdmin: false,
      createdAt: new Date()
    });

    console.log('✅ Database seeded successfully!');
    console.log('Admin credentials: admin / admin123');
    console.log('Employee credentials: employee / employee123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedDatabase();
