import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
const envPath = resolve(backendRoot, '.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);
const port = Number(process.env.PORT || 5001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Set JWT_SECRET to at least 32 characters in backend/.env. See backend/.env.example.');
}
export const config = Object.freeze({
  port,
  jwtSecret: process.env.JWT_SECRET,
  dataDir: resolve(backendRoot, process.env.DATA_DIR || 'data'),
  distDir: resolve(backendRoot, '../dist'),
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : '*',
});
