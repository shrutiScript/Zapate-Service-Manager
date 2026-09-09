import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'rf_sec_device_access_key_32bytes!';

function getDerivedKey() {
  return crypto.createHash('sha256').update(String(SECRET_KEY)).digest();
}

/**
 * Encrypt plain text using AES-256-GCM
 * @param {string} text 
 * @returns {{ encryptedCredential: string, iv: string, authTag: string }}
 */
export function encryptCredential(text) {
  if (!text) return { encryptedCredential: '', iv: '', authTag: '' };
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedCredential: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypt AES-256-GCM cipher text
 * @param {string} encryptedData 
 * @param {string} ivHex 
 * @param {string} authTagHex 
 * @returns {string}
 */
export function decryptCredential(encryptedData, ivHex, authTagHex) {
  if (!encryptedData || !ivHex || !authTagHex) return '';
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
