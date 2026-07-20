import mongoose from 'mongoose';

/** Connect to MongoDB. Exits the process on failure so the platform can restart it. */
export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not set.');
    console.error('   Create backend/.env (copy .env.example) and set MONGO_URI, e.g.:');
    console.error('   MONGO_URI=mongodb://127.0.0.1:27017/luxora');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    console.error('   Is MongoDB running? Start it locally or point MONGO_URI at MongoDB Atlas.');
    process.exit(1);
  }
};
