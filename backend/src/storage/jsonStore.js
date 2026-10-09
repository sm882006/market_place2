import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config/env.js';

const collections = new Set(['users', 'products', 'rents', 'orders', 'lostfound', 'notifications', 'chats']);
function fileFor(name) {
  if (!collections.has(name)) throw new Error('Unknown collection: ' + name);
  mkdirSync(config.dataDir, { recursive: true });
  return join(config.dataDir, name + '.json');
}
export function readCollection(name) {
  const file = fileFor(name);
  if (!existsSync(file)) writeCollection(name, []);
  const value = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(value)) throw new Error('Expected an array in ' + file);
  return value;
}
export function writeCollection(name, items) {
  if (!Array.isArray(items)) throw new Error('Collection must be an array.');
  const file = fileFor(name);
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {
    writeFileSync(temporary, JSON.stringify(items, null, 2), 'utf8');
    renameSync(temporary, file);
  } finally {
    if (existsSync(temporary)) rmSync(temporary);
  }
}
export function initializeStorage() {
  for (const collection of collections) readCollection(collection);
}
