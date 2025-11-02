const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");

require('dotenv').config();
const initializeWebSocket = require('./websocket'); // Import WebSocket logic

// Import routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173" , "http://192.168.1.2:5173", "https://realtimechatapp-drab.vercel.app"], // your frontend URL
    credentials: true, // allow cookies
  })
);

app.use(express.json());

// Database connection
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Database connection error:', err));


app.get('/', (req, res) => res.send('Hello this is Harshang chats server!'));
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
