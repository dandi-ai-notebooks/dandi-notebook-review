import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const MONGODB_URI: string = process.env.MONGODB_URI;

let cached = global as any;
cached.mongoose = cached.mongoose || {};

async function dbConnect() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  try {
    const opts = {
      bufferCommands: false,
    };

    const conn = await mongoose.connect(MONGODB_URI, opts);
    cached.mongoose.conn = conn;
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default dbConnect;
