import { readCollection, writeCollection } from '../storage/jsonStore.js';

export const getLostFound = () => readCollection('lostfound');
export const saveLostFound = (items) => writeCollection('lostfound', items);
