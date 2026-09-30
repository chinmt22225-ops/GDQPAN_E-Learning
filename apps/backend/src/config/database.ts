import mongoose from 'mongoose';
import { ENV } from './env.config.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(ENV.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't kill process immediately in dev so app can recover or run with mock
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Reconnecting...');
});
