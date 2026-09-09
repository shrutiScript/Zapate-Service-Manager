const path = require('path');
const mongoose = require(path.join(__dirname, '../server/node_modules/mongoose'));
const bcrypt = require(path.join(__dirname, '../server/node_modules/bcryptjs'));

async function resetPass() {
  await mongoose.connect('mongodb://127.0.0.1:27017/repairflow_db');
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const hashed = await bcrypt.hash('123456', 10);
  await User.updateOne({ email: 'abhi@gmail.com' }, { $set: { password: hashed } });
  console.log('Password for abhi@gmail.com updated to 123456');
  await mongoose.disconnect();
}

resetPass();
