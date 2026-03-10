import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Resolve the path to the PARENT .env (just like your server does)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Add a debug log to be 100% sure we have a secret
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET not found in .env, using fallback!");
}

const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev'; 
// Note: I matched this fallback to your index.js fallback exactly.

const payload = { id: "user_123", role: "admin" };
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log("\n--- NEW SYNCED TOKEN ---");
console.log(token);