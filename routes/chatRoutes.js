// routes/chatRoutes.js
const express = require('express');
const { chatMessage, sendMessage } = require('../controllers/chatController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Route to fetch chat messages for a specific friend
router.get('/chats/:friendId', authenticateToken, chatMessage);

// Route to send a new message to a friend
router.post('/chats/:friendId', authenticateToken, sendMessage);

module.exports = router;
