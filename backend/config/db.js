const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('\n⚠️  MongoDB is not available. Please install and start MongoDB:');
    console.log('   1. Download from: https://www.mongodb.com/try/download/community');
    console.log('   2. Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas');
    console.log('   3. Or run: winget install MongoDB.Server (as Administrator)\n');
    console.log('Server will continue but database operations will fail.\n');
    // Don't exit in development mode
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
