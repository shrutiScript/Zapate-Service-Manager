// Test verification script for SafeStorage sanitization
import { sanitizeForStorage } from '../../client/src/utils/storage.js';

console.log('Testing sanitizeForStorage with large base64 logo...');

const largeBase64 = 'data:image/png;base64,' + 'A'.repeat(5 * 1024 * 1024); // 5MB string

const mockUser = {
  id: 'usr_123',
  name: 'Rajesh Workshop',
  email: 'rajesh@workshop.com',
  mobile: '9845012345',
  role: 'SHOP_OWNER',
  shopName: 'Super Repair Lab',
  shop: {
    id: 'shp_123',
    name: 'Super Repair Lab',
    address: '123 MG Road, Bengaluru',
    logo: largeBase64,
  }
};

const sanitized = sanitizeForStorage(mockUser);
const jsonString = JSON.stringify(sanitized);

console.log('Original user logo size:', (mockUser.shop.logo.length / 1024 / 1024).toFixed(2), 'MB');
console.log('Sanitized payload JSON string length:', jsonString.length, 'bytes');

if (jsonString.length < 5000) {
  console.log('SUCCESS: Payload stripped of multi-megabyte base64 string for storage!');
} else {
  console.error('FAILURE: Payload still too large!');
  process.exit(1);
}
