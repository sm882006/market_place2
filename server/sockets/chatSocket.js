import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // User joins their personal room for direct notifications
    socket.on('join_user', (userIdOrUsername) => {
      if (userIdOrUsername) {
        socket.join(`user_${userIdOrUsername}`);
      }
    });

    // User joins specific chat conversation room
    socket.on('join_chat', (chatId) => {
      if (chatId) {
        socket.join(`chat_${chatId}`);
      }
    });

    // Real-time message exchange
    socket.on('send_message', async (data) => {
      try {
        const { chatId, sender, text, recipient } = data;
        if (!chatId || !text || !sender) return;

        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const messageObj = {
          sender,
          text,
          timestamp: new Date(),
          read: false,
        };

        chat.messages.push(messageObj);
        chat.lastMessage = text;
        chat.lastMessageAt = new Date();
        await chat.save();

        const savedMsg = chat.messages[chat.messages.length - 1];

        // Broadcast to chat room
        io.to(`chat_${chatId}`).emit('new_message', {
          chatId,
          message: savedMsg,
        });

        // Also push notification to recipient if provided
        if (recipient) {
          const notif = await Notification.create({
            recipient,
            sender,
            title: `New message from ${sender}`,
            message: text.length > 50 ? `${text.substring(0, 50)}...` : text,
            type: 'chat',
            link: `/profile?tab=messages&chatId=${chatId}`,
            data: { chatId },
          });

          io.to(`user_${recipient}`).emit('new_notification', notif);
        }
      } catch (err) {
        console.error('[Socket] Error handling send_message:', err.message);
      }
    });

    // Typing indicators
    socket.on('typing', ({ chatId, username, isTyping }) => {
      socket.to(`chat_${chatId}`).emit('user_typing', { chatId, username, isTyping });
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });
};
