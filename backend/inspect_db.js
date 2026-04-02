const mongoose = require('mongoose');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Menu = require('./models/Menu');
const Notification = require('./models/Notification');
require('dotenv').config();

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-portal');
        console.log("Connected to MongoDB for inspection.\n");

        const users = await User.find({});
        const complaints = await Complaint.find({});
        const menuItems = await Menu.find({});
        const notifications = await Notification.find({});

        console.log("--- USERS ---");
        users.forEach(u => {
            console.log(`[${u.role.toUpperCase()}] ${u.name} (${u.email}) Room: ${u.roomNumber || 'N/A'}`);
        });

        console.log("\n--- COMPLAINTS ---");
        complaints.forEach(c => {
            console.log(`[${c.status}] ${c.title} - Category: ${c.category} - Room: ${c.roomNumber}`);
        });

        console.log("\n--- MENU ---");
        menuItems.forEach(m => {
            console.log(`${m.date.toDateString()}: B: ${m.breakfast}, L: ${m.lunch}, S: ${m.snacks}, D: ${m.dinner}`);
        });

        console.log("\n--- NOTIFICATIONS ---");
        notifications.forEach(n => {
            console.log(`[${n.read ? 'READ' : 'UNREAD'}] ${n.title}: ${n.message}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("Inspection error:", err);
        process.exit(1);
    }
}

inspect();
