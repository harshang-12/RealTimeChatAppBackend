const { WebSocketServer } = require('ws');
const Chat = require('./Models/Chat');

const connectedUsers = new Map();

const initializeWebSocket = (server) => {
  const wss = new WebSocketServer({ server });
  console.log('⚡ WebSocket server initialized');

  wss.on('connection', (ws) => {
    console.log('🔌 Client connected');
    let currentUserId = null;

    ws.on('message', async (data) => {
      let payload;
      try {
        payload = JSON.parse(data);
      } catch {
        return sendError(ws, 'Invalid JSON format');
      }

      const { type } = payload;

      switch (type) {
        case 'authenticate':
          return handleAuthentication(ws, payload);

        case 'chat':
          return handleIncomingMessage(ws, payload);

        case 'typing':
          return handleTypingEvent(payload, true);

        case 'stop_typing':
          return handleTypingEvent(payload, false);

        default:
          return sendError(ws, 'Unknown event type');
      }
    });

    ws.on('close', () => {
      console.log('🔌 Client disconnected');
      if (currentUserId) {
        connectedUsers.delete(currentUserId);
        console.log(`👋 User disconnected: ${currentUserId}`);
      }
    });

    // ===== Event Handlers =====
    function handleAuthentication(ws, { userId }) {
      if (!userId) return sendError(ws, 'Authentication failed: Missing userId');
      currentUserId = userId;
      connectedUsers.set(userId, ws);
      sendSuccess(ws, 'Authenticated');
      console.log(`🔐 Authenticated user: ${userId}`);
    }

    async function handleIncomingMessage(ws, { chatId, senderId, content, messageType, fileType }) {
      if (!chatId || !senderId || !content) return sendError(ws, 'Invalid chat message fields');

      const chat = await Chat.findById(chatId);
      if (!chat) return sendError(ws, 'Chat not found');

      const message = {
        sender: senderId,
        content,
        messageType: messageType || 'text',
        fileType: fileType || null,
        timestamp: new Date(),
      };

      chat.messages.push(message);
      await chat.save();

      broadcastToParticipants(chat.participants, {
        type: 'chat',
        chatId,
        message,
      });
    }

    // ===== Typing Indicator Events =====
    function handleTypingEvent({ chatId, senderId }, isTyping) {
      if (!chatId || !senderId) return;

      Chat.findById(chatId)
        .then((chat) => {
          if (!chat) return;
          broadcastToParticipants(chat.participants, {
            type: isTyping ? 'typing' : 'stop_typing',
            chatId,
            senderId,
          });
        })
        .catch(() => {});
    }

    // ===== Helper Functions =====
    function sendError(ws, error) {
      ws.send(JSON.stringify({ status: 'error', error }));
    }

    function sendSuccess(ws, message) {
      ws.send(JSON.stringify({ status: 'success', message }));
    }

    function broadcastToParticipants(participants, payload) {
      participants.forEach((participantId) => {
        const socket = connectedUsers.get(participantId.toString());
        if (socket && socket.readyState === ws.OPEN) {
          socket.send(JSON.stringify(payload));
        }
      });
    }
  });
};

module.exports = initializeWebSocket;
