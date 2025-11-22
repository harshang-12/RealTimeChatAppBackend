// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// WebSocket initializer
const initializeWebSocket = require('./websocket');

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/upload');

// Express App
const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middlewares =====
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.1.2:5173",
      "https://realtimechatapp-drab.vercel.app"
    ],
    credentials: true,
  })
);

// Static folder
app.use("/uploads", express.static("uploads"));

// ===== Routes =====
app.get('/', (_, res) => res.send('Hello! This is Harshang chat server.'));
app.use("/api/upload", uploadRoutes);
app.use('/api', authRoutes);
app.use('/api', chatRoutes);
app.use('/api/user', userRoutes);

// ===== Database Connection =====
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected ✔'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ===== Server Start =====
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ===== WebSocket =====
initializeWebSocket(server);

module.exports = app;
