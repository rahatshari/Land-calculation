/**
 * Client-side cryptographic security using standard Web Crypto API
 * Provides password hashing, salt generation, and AES-GCM local storage encryption
 */

const STORAGE_KEY = 'uttoradhikar_secure_data_v1';
const SECURITY_META_KEY = 'uttoradhikar_security_meta_v1';

export interface SecurityMeta {
  hasPasswordSet: boolean;
  saltHex: string;
  hashHex: string;
  hint: string;
  autoLockMinutes: number;
}

// Convert ArrayBuffer to Hex string
function buf2hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hex2buf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Derive SHA-256 hash with salt
export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = hex2buf(saltHex);
  const passBytes = enc.encode(password);
  
  // Combine salt + password
  const combined = new Uint8Array(salt.length + passBytes.length);
  combined.set(salt, 0);
  combined.set(passBytes, salt.length);

  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return buf2hex(hashBuffer);
}

// Generate random salt
export function generateSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return buf2hex(salt.buffer);
}

// Derive AES-GCM Key from password + salt via PBKDF2
async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 50000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt string data using password
export async function encryptData(data: string, password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = hex2buf(saltHex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(data)
  );

  return JSON.stringify({
    iv: buf2hex(iv.buffer),
    ciphertext: buf2hex(encrypted),
  });
}

// Decrypt string data using password
export async function decryptData(encryptedPayload: string, password: string, saltHex: string): Promise<string> {
  try {
    const { iv, ciphertext } = JSON.parse(encryptedPayload);
    const salt = hex2buf(saltHex);
    const key = await deriveAesKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: hex2buf(iv) as BufferSource },
      key,
      hex2buf(ciphertext) as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    throw new Error('পাসওয়ার্ড সঠিক নয় অথবা ডাটা ডিক্রিপ্ট করা সম্ভব হয়নি');
  }
}

// Storage helpers
export function loadSecurityMeta(): SecurityMeta | null {
  try {
    const raw = localStorage.getItem(SECURITY_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSecurityMeta(meta: SecurityMeta): void {
  localStorage.setItem(SECURITY_META_KEY, JSON.stringify(meta));
}

export function saveEncryptedData(cipherJson: string): void {
  localStorage.setItem(STORAGE_KEY, cipherJson);
}

export function loadEncryptedData(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearSecurityAndData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SECURITY_META_KEY);
}
