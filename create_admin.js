// Simple script to create an admin user
// Run with: node create_admin.js

import bcrypt from 'bcrypt';
import { storage } from './server/storage.js';

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail('admin@admin.com');
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const admin = await storage.createUser({
      email: 'admin@admin.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@admin.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('ID:', admin.id);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin();