import { storage } from './storage';
import { hashPassword } from './auth';
import crypto from 'crypto';

/**
 * Generates a cryptographically secure random password
 * Uses a mix of uppercase, lowercase, numbers, and special characters
 * @returns A secure random password string
 */
function generateSecurePassword(): string {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed similar looking characters
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // Removed similar looking characters
  const numberChars = '23456789'; // Removed 0 and 1 (look similar to O and l)
  const specialChars = '!@#$%^&*-_=+';
  
  // Ensure at least one character from each set
  let password = '';
  password += uppercaseChars.charAt(Math.floor(crypto.randomInt(0, uppercaseChars.length)));
  password += lowercaseChars.charAt(Math.floor(crypto.randomInt(0, lowercaseChars.length)));
  password += numberChars.charAt(Math.floor(crypto.randomInt(0, numberChars.length)));
  password += specialChars.charAt(Math.floor(crypto.randomInt(0, specialChars.length)));
  
  // Add more random characters to reach desired length (12-16 characters)
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  const remainingLength = 8 + Math.floor(crypto.randomInt(0, 5)); // Random length between 12-16
  
  for (let i = 0; i < remainingLength; i++) {
    password += allChars.charAt(Math.floor(crypto.randomInt(0, allChars.length)));
  }
  
  // Shuffle the password characters to avoid predictable patterns
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Script to create test users with correct password hashing
 * Uses secure passwords that are not hardcoded directly in the code
 * If environment variables are present, they will be used
 * Otherwise, fallback to default values for development
 */
async function createTestUsers() {
  try {
    console.log('Creating test users...');

    // Check for environment mode
    const isProd = process.env.NODE_ENV === 'production';
    
    // Admin credentials
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    
    // In production, ADMIN_PASSWORD is required as an environment variable
    if (isProd && !process.env.ADMIN_PASSWORD) {
      console.error('ERROR: ADMIN_PASSWORD environment variable is required in production');
      process.exit(1);
    }
    
    // Generate a random password if in development and no password is provided
    const adminPassword = process.env.ADMIN_PASSWORD || 
      (isProd ? '' : generateSecurePassword());
      
    const adminName = process.env.ADMIN_NAME || 'مدير النظام';

    // Employee credentials
    const employeeUsername = process.env.EMPLOYEE_USERNAME || 'employee';
    
    // In production, EMPLOYEE_PASSWORD is required as an environment variable
    if (isProd && !process.env.EMPLOYEE_PASSWORD) {
      console.error('ERROR: EMPLOYEE_PASSWORD environment variable is required in production');
      process.exit(1);
    }
    
    // Generate a random password if in development and no password is provided
    const employeePassword = process.env.EMPLOYEE_PASSWORD || 
      (isProd ? '' : generateSecurePassword());
      
    const employeeName = process.env.EMPLOYEE_NAME || 'موظف منصة';
    
    // Never log actual passwords for security reasons
    if (!isProd) {
      if (!process.env.ADMIN_PASSWORD) {
        console.log(`Generated admin password for development: [HIDDEN FOR SECURITY]`);
      }
      if (!process.env.EMPLOYEE_PASSWORD) {
        console.log(`Generated employee password for development: [HIDDEN FOR SECURITY]`);
      }
    }
    
    // Hash passwords
    const hashedAdminPassword = await hashPassword(adminPassword);
    const hashedEmployeePassword = await hashPassword(employeePassword);
    
    console.log('Passwords hashed successfully');
    
    // Check existing users
    console.log('Checking existing test users...');
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    const existingEmployee = await storage.getUserByUsername(employeeUsername);
    
    // Create or update admin user
    if (!existingAdmin) {
      console.log('Creating admin user...');
      await storage.createUser({
        username: adminUsername,
        password: hashedAdminPassword,
        name: adminName,
        isAdmin: true
      });
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists, updating password...');
      await storage.updateUserPassword(adminUsername, adminPassword);
      console.log('Admin password updated successfully');
    }
    
    // Create or update employee user
    if (!existingEmployee) {
      console.log('Creating employee user...');
      await storage.createUser({
        username: employeeUsername,
        password: hashedEmployeePassword,
        name: employeeName,
        isAdmin: false
      });
      console.log('Employee user created successfully');
    } else {
      console.log('Employee user already exists, updating password...');
      await storage.updateUserPassword(employeeUsername, employeePassword);
      console.log('Employee password updated successfully');
    }
    
    console.log('Test users setup complete!');
    
    // Print credentials for reference (masked for security)
    console.log("Test users created successfully. Use:");
    console.log(`1. Admin: username='${adminUsername}', password='[HIDDEN FOR SECURITY]'`);
    console.log(`2. Employee: username='${employeeUsername}', password='[HIDDEN FOR SECURITY]'`);
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

// Export the function
export { createTestUsers };