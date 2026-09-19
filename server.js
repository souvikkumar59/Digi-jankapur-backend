const express = require('express');
const cors = require('cors');
const http = require('http'); // Built-in Node module to construct basic network servers
const { Server } = require('socket.io'); // Import Socket.io server engine
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();

// 💡 1. Wrap our Express instance inside a unified HTTP Server wrapper
const server = http.createServer(app);

// 💡 2. Initialize the global WebSocket gateway engine with relaxed cross-port CORS laws
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"], // Admits both local frontend development servers
    methods: ["GET", "POST"]
  }
});

// Initialize Cloud Database Connection
connectDB();

// Global Middlewares
app.use(express.json());
app.use(cors());

// Make our raw live 'io' object accessible to all our endpoint controllers by binding it to the request block
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- LINK UP API ROUTER CHANNELS ---
// --- LINK UP EVERY INTEGRATED ROUTER CHANNEL ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes')); // 👈 MAKE ABSOLUTELY SURE THIS HAS AN 's' AT THE END!
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));


// 💡 3. Setup the live radio event listeners
io.on('connection', (socket) => {
  console.log(`📡 A student device connected to the live socket: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 A student device disconnected from live stream.`);
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
  res.send('Server core operational and Real-time Socket nodes armed!');
});

// 💡 4. VERCEL SERVERLESS COMPATIBILITY
// Run standard server initialization ONLY when testing locally, not on Vercel production.
// 💡 Setup port and start HTTP / Socket.io server
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Server & Socket.io executing smoothly on port ${PORT}`);
});

// Export app (useful for testing or serverless setups)
module.exports = app;

// 💡 CRITICAL FOR VERCEL: Export the raw express application instance
module.exports = app;
