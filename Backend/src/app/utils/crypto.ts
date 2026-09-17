import crypto from 'crypto';
import { envVars } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
// Derive a consistent 32-byte (256-bit) key from the secret
const KEY = crypto
  .createHash('sha256')
  .update(envVars.ENCRYPTION_SECRET || 'default_secret_key_32_bytes_long!!')
  .digest();

export function encryptText(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptText(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  if (!ivHex || !authTagHex || !encrypted) throw new Error('Invalid encrypted string format');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
