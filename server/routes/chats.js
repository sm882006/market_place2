import express from 'express';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const toChatJson = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
  };
};

// GET /api/chats
router.get('/', verifyToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.username,
    }).sort({ lastMessageAt: -1 });

    return res.json(chats.map(toChatJson));
  } catch (err) {
    console.error('[CHATS] Error fetching chats:', err);
    return res.status(500).json({ message: 'Error fetching chats' });
  }
});

// GET /api/chats/:chatId
router.get('/:chatId', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user.username) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to view this conversation' });
    }

    // Mark messages sent by others as read
    let updated = false;
    chat.messages.forEach((m) => {
      if (m.sender !== req.user.username && !m.read) {
        m.read = true;
        updated = true;
      }
    });
    if (updated) {
      await chat.save();
    }

    return res.json(toChatJson(chat));
  } catch (err) {
    console.error('[CHATS] Error fetching chat:', err);
    return res.status(500).json({ message: 'Error fetching chat details' });
  }
});

// POST /api/chats/:chatId/message
router.post('/:chatId/message', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user.username) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to message in this chat' });
    }

    const recipient = chat.participants.find((p) => p !== req.user.username);

    const newMsg = {
      sender: req.user.username,
      text: text.trim(),
      timestamp: new Date(),
      read: false,
    };

    chat.messages.push(newMsg);
    chat.lastMessage = newMsg.text;
    chat.lastMessageAt = new Date();
    await chat.save();
    const savedMsg = chat.messages[chat.messages.length - 1];

    if (recipient) {
      req.io?.to(`user_${recipient}`).emit('new_message', {
        chatId: chat._id.toString(),
        message: savedMsg.toObject(),
      });
    }

    if (recipient) {
      await Notification.create({
        recipient,
        sender: req.user.username,
        title: `Message from @${req.user.username}`,
        message: text.length > 60 ? `${text.substring(0, 60)}...` : text,
        type: 'chat',
        link: `/profile?tab=messages&chatId=${chat._id}`,
        data: { chatId: chat._id },
      });
    }

    return res.json(toChatJson(chat));
  } catch (err) {
    console.error('[CHATS] Error sending message:', err);
    return res.status(500).json({ message: 'Error sending message' });
  }
});

// POST /api/chats/find-or-create
router.post('/find-or-create', verifyToken, async (req, res) => {
  try {
    const { targetUsername, productId, productTitle } = req.body;
    if (!targetUsername) {
      return res.status(400).json({ message: 'targetUsername is required' });
    }

    let query = {
      participants: { $all: [req.user.username, targetUsername] },
    };
    if (productId) {
      query.productId = productId;
    }

    let chat = await Chat.findOne(query);
    if (!chat) {
      chat = await Chat.create({
        participants: [req.user.username, targetUsername],
        productId: productId || null,
        productTitle: productTitle || '',
        messages: [],
        lastMessage: 'Conversation started',
        lastMessageAt: new Date(),
      });
    }

    return res.json(toChatJson(chat));
  } catch (err) {
    console.error('[CHATS] Error finding or creating chat:', err);
    return res.status(500).json({ message: 'Error creating chat' });
  }
});

export default router;
