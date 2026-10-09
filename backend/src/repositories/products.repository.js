import { readCollection, writeCollection } from '../storage/jsonStore.js';

export const getProducts = () => readCollection('products');
export const saveProducts = (items) => writeCollection('products', items);
