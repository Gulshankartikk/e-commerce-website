import mongoose from 'mongoose';

/** Connect to MongoDB. Supports MONGODB_URI or MONGO_URI for Atlas and local dev. Caches connection for serverless/Vercel. */
export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI (or MONGO_URI) is not set.');
    console.error('   Please provide a connection string in environment settings or backend/.env, e.g.:');
    console.error('   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/flashshop?retryWrites=true&w=majority');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    console.error('   Please verify MongoDB Atlas credentials, network IP whitelist (0.0.0.0/0), or local service.');
    process.exit(1);
  }
};
