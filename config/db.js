const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoUri = (process.env.MONGO_URI || '').trim();

    // Strip accidental quotes if copied from .env or entered with quotes in Render UI
    if (
      (mongoUri.startsWith('"') && mongoUri.endsWith('"')) ||
      (mongoUri.startsWith("'") && mongoUri.endsWith("'"))
    ) {
      mongoUri = mongoUri.slice(1, -1).trim();
    }

    if (!mongoUri) {
      console.error('❌ Database Connection Error: process.env.MONGO_URI is undefined or empty.');
      process.exit(1);
    }

    const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 Attempting MongoDB connection: ${maskedUri}`);

    if (mongoUri) {
      const conn = await mongoose.connect(mongoUri);
      console.log(`✅ MongoDB Connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
      return;
    }
  } catch (error) {
    console.warn(`⚠️ Cloud MongoDB Connection Failure: ${error.message}. Attempting local MongoDB fallback...`);
    try {
      const localUri = 'mongodb://127.0.0.1:27017/smart-jankapur';
      const localConn = await mongoose.connect(localUri);
      console.log(`✅ Connected to Local MongoDB fallback: ${localConn.connection.host} (DB: ${localConn.connection.name})`);
      return;
    } catch (localErr) {
      console.error(`❌ Both Cloud and Local MongoDB connections failed: ${localErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
