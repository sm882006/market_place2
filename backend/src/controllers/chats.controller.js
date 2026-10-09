import { randomUUID } from 'node:crypto';
import { getChats, saveChats } from '../repositories/chats.repository.js';
import { createNotification } from '../services/notification.service.js';

export const listChats = (req, res) => {
  try {
    const userId = req.user.id;
    const chats = getChats();
    const userChats = chats
      .filter(c => c.buyerId === userId || c.sellerId === userId)
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    res.json(userChats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve chats.' });
  }
};

export const getChat = (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });

    if (chat.buyerId !== userId && chat.sellerId !== userId) {
      return res.status(403).json({ message: 'Access denied. This is a private conversation.' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve chat.' });
  }
};

export const sendMessage = (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const chats = getChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) return res.status(404).json({ message: 'Chat not found.' });

    const chat = chats[chatIndex];
    if (chat.buyerId !== userId && chat.sellerId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const newMsg = {
      id: 'msg_' + randomUUID() + '_' + Math.random().toString(36).slice(2, 6),
      senderId: userId,
      senderUsername: username,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    chats[chatIndex].messages.push(newMsg);
    chats[chatIndex].lastMessageAt = new Date().toISOString();
    saveChats(chats);

    const recipientId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
    createNotification({
      userId: recipientId,
      fromUserId: userId,
      fromUsername: username,
      type: 'chat_message',
      productId: chat.productId,
      rentId: chat.rentId,
      productName: chat.productName,
      message: `@${username}: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`,
    });

    res.json({ message: 'Message sent!', msg: newMsg });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message.' });
  }
};

