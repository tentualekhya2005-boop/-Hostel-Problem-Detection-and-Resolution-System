const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-portal');
  const users = await User.find({});
  console.log(`Found ${users.length} users:`);
  users.forEach(u => {
    console.log(`- ${u.email} (Role: ${u.role}) | Hash: ${u.password}`);
  });
  
  // Test password match directly for admin
  const admin = await User.findOne({ email: 'admin19122005@gmail.com' });
  if (admin) {
     const match = await admin.matchPassword('password19122005');
     console.log('Direct match test for password19122005:', match);
  }
  
  process.exit(0);
}

check();
