import fs from 'fs';

const src = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\d4612ae9-5484-447c-8b6b-339996588c7d\\repair_workshop_hero_1788714548064.jpg';
const dest = 'c:\\Users\\HP\\Downloads\\repair-shop-mern-updated-changes\\client\\public\\repair_workshop_hero.jpg';

try {
  fs.copyFileSync(src, dest);
  console.log('Hero image copied to client/public/repair_workshop_hero.jpg');
} catch (e) {
  console.error('Copy error:', e.message);
}
