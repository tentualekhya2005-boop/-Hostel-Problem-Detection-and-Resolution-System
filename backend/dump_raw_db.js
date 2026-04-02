const mongoose = require('mongoose');
require('dotenv').config();

async function dumpRaw() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-portal');
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        for (let col of collections) {
            console.log(`\n=== COLLECTION: ${col.name} ===`);
            const data = await db.collection(col.name).find({}).toArray();
            console.log(JSON.stringify(data, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error("Dump error:", err);
        process.exit(1);
    }
}

dumpRaw();
