const mongoose = require('mongoose');

async function findUsers() {
  await mongoose.connect('mongodb://127.0.0.1:27017/repairflow_db');
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find({}).limit(5);
  console.log('Users found:', users.map(u => ({ email: u.email, role: u.role, name: u.name, mobile: u.mobile })));
  await mongoose.disconnect();
}

findUsers();
