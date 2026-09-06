import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SALT_LEN = 16;
const KEY_LEN = 64;

// Хэш пароля: salt + scrypt → строка "salt:hash"
export function hashPassword(password) {
  const salt = randomBytes(SALT_LEN).toString('hex');
  const hash = scryptSync(password, salt, KEY_LEN).toString('hex');
  return `${salt}:${hash}`;
}

// Проверка пароля: поблочное сравнение (timing-safe)
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, KEY_LEN);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function generateToken() {
  return randomBytes(32).toString('hex');
}