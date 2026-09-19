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

    // Attempt connecting to the cloud database cluster
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    console.error(`❌ Database Connection Failure: ${error.message}`);
    // Exit application with an error state (1) if database connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
