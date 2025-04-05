const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const initializeWebSocket = require('./websocket'); // Import WebSocket logic

// Import routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Database connection error:', err));

// Use routes
app.use('/api', authRoutes);
app.use('/api', chatRoutes);
app.use('/api/user', userRoutes);

// Start HTTP server
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Initialize WebSocket server
initializeWebSocket(server);
