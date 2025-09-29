const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.MONGO_URI ? 'Found' : 'Missing');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:');
    console.error(`- Error Name: ${error.name}`);
    console.error(`- Error Message: ${error.message}`);
    console.error('\nTroubleshooting Tips:');
    console.log('1. Check if MongoDB Atlas is running and accessible');
    console.log('2. Verify your IP is whitelisted in MongoDB Atlas Network Access');
    console.log('3. Check if the database user has correct permissions');
    console.log('4. Verify the connection string in .env file');
    
    // Force exit after a delay to ensure logs are printed
    setTimeout(() => process.exit(1), 1000);
  }
};

// Handle connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
