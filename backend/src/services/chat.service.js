import { randomUUID } from 'node:crypto';
import { getChats, saveChats } from '../repositories/chats.repository.js';

// Both purchase and rental requests use the same conversation creation logic.
export function createRequestChat(details, text) {
  const chats = getChats();
  let chat = chats.find(c => c.productId === details.productId && c.rentId === details.rentId && c.buyerId === details.buyerId && c.sellerId === details.sellerId);
  const timestamp = new Date().toISOString();
  if (!chat) {
    chat = { id: 'chat_' + randomUUID(), ...details, messages: [], createdAt: timestamp, lastMessageAt: timestamp };
    chats.push(chat);
  }
  chat.messages.push({ id: 'msg_' + randomUUID(), senderId: details.buyerId, senderUsername: details.buyerUsername, text, timestamp });
  chat.lastMessageAt = timestamp;
  saveChats(chats);
  return chat;
}
