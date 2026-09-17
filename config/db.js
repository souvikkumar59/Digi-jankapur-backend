const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt connecting to the cloud database cluster
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Failure: ${error.message}`);
    // Exit application with an error state (1) if database connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
