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
      console.log('❌ Admin already exists!');
      console.log('To recreate, delete first with:');
      console.log('node -e "const mongoose = require(\'mongoose\'); const User = require(\'./models/User\'); mongoose.connect(\'mongodb://localhost:27017/rabta\').then(async () => { await User.deleteOne({ email: \'admin@rabta.com\' }); console.log(\'Admin deleted\'); process.exit(0); });"');
      process.exit(0);
    }

    // Create admin - password will be hashed automatically by the User model
    const admin = new User({
      firstName: 'Admin',
      lastName: 'RABTA',
      email: 'admin@rabta.com',
      password: 'admin123',  // Will be hashed by pre('save') hook
      role: 'ADMIN'
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('Email: admin@rabta.com');
    console.log('Password: admin123');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
