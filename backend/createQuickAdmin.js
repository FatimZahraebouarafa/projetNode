const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/rabta');
    console.log('MongoDB Connected');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@rabta.com' });
    if (existingAdmin) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);

    // Create admin
    const admin = new User({
      firstName: 'Admin',
      lastName: 'RABTA',
      email: 'admin@rabta.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('Email: admin@rabta.com');
    console.log('Password: Admin123!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
