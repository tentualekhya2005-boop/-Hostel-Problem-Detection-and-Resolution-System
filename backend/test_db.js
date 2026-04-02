const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');

const run = async () => {
    try {
        console.log("Creating memory server...");
        const mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        console.log("URI:", uri);
        
        await mongoose.connect(uri);
        console.log("Connected to mongoose");
        
        await User.create({ name: 'Test', email: 'test@test.com', password: 'password' });
        const user = await User.findOne({ email: 'test@test.com' });
        console.log("User:", user.name);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
