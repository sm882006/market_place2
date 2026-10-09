import { readCollection, writeCollection } from '../storage/jsonStore.js';

export const getUsers = () => readCollection('users');
export const saveUsers = (items) => writeCollection('users', items);
