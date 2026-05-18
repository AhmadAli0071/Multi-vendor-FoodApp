import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodapp';
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    throw error;
  }
};

export default connectDB;
