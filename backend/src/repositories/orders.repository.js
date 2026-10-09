import { readCollection, writeCollection } from '../storage/jsonStore.js';

export const getOrders = () => readCollection('orders');
export const saveOrders = (items) => writeCollection('orders', items);
