import { readCollection, writeCollection } from '../storage/jsonStore.js';

export const getChats = () => readCollection('chats');
export const saveChats = (items) => writeCollection('chats', items);
