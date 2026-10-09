import { readCollection, writeCollection } from '../storage/jsonStore.js';

export const getNotifications = () => readCollection('notifications');
export const saveNotifications = (items) => writeCollection('notifications', items);
