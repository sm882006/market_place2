import { readCollection, writeCollection } from '../storage/jsonStore.js';

export const getRents = () => readCollection('rents');
export const saveRents = (items) => writeCollection('rents', items);
