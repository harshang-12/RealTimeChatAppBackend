const { WebSocketServer } = require('ws');
const Chat = require('./Models/Chat');

const connectedUsers = new Map();

const initializeWebSocket = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('🔌 New WebSocket connection established');
        let currentUserId = null;

        ws.on('message', async (data) => {
            try {
                const parsedData = JSON.parse(data);

                const { type } = parsedData;

                if (type === 'authenticate') {
                    const { userId } = parsedData;

                    if (!userId) {
                        ws.send(JSON.stringify({ error: 'Authentication failed: Missing userId' }));
                        ws.close();
                        return;
                    }

                    currentUserId = userId;
                    connectedUsers.set(userId, ws);
                    console.log(`✅ User authenticated: ${userId}`);
                    return;
                }

                if (type === 'chat') {
                    const { chatId, senderId, content } = parsedData;

                    // Validate message content
                    if (!chatId || !senderId || !content) {
                        ws.send(JSON.stringify({ error: 'Invalid message format' }));
                        return;
                    }

                    // Find chat
                    const chat = await Chat.findById(chatId);
                    if (!chat) {
                        ws.send(JSON.stringify({ error: 'Chat not found' }));
                        return;
                    }

                    // Create new message
                    const message = {
                        sender:  senderId,
                        content,
                        timestamp: new Date(),
                    };

                    chat.messages.push(message);
                    await chat.save();

                    console.log('💬 Message saved:', message);

                    // Broadcast to all participants
                    chat.participants.forEach((participantId) => {
                        const socket = connectedUsers.get(participantId.toString());
                        if (socket && socket.readyState === ws.OPEN) {
                            socket.send(JSON.stringify({
                                type: 'chat',
                                chatId,
                                message
                            }));
                        }
                    });
                }

            } catch (err) {
                console.error('❌ Error handling WebSocket message:', err);
                ws.send(JSON.stringify({ error: 'Invalid message format or internal error' }));
            }
        });

        ws.on('close', () => {
            console.log('🔌 WebSocket connection closed');
            if (currentUserId) {
                connectedUsers.delete(currentUserId);
                console.log(`👋 Disconnected user: ${currentUserId}`);
            }
        });
    });

    console.log('✅ WebSocket server initialized');
};

module.exports = initializeWebSocket;
