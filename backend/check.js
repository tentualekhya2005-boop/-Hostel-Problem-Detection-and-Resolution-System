const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:58178/');
  const Complaint = require('./models/Complaint');
  const count = await Complaint.countDocuments();
  console.log(`Total complaints: ${count}`);
  const users = await require('./models/User').countDocuments();
  console.log(`Total users: ${users}`);
  process.exit();
}
check();
