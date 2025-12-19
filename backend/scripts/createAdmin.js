const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@rabta.com' });
    
    if (adminExists) {
      console.log('Admin already exists');
      return;
    }

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Rabta',
      email: 'admin@rabta.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'ADMIN',
      isActive: true,
      isVerified: true
    });

    console.log('Admin created successfully!');
    console.log('Email: admin@rabta.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

module.exports = createAdmin;
