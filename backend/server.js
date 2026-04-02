const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

let globalMongoServer;

// Connect to MongoDB
const connectDB = async () => {
    try {
        if (process.env.MONGO_URI && process.env.MONGO_URI.includes('mongodb+srv')) {
            console.log('Connecting to MongoDB Atlas...');
            await mongoose.connect(process.env.MONGO_URI);
            console.log('🚀 CONNECTED TO MONGODB ATLAS CLOUD DATABASE');
        } else {
            console.log('Starting local MongoDB engine...');
            const dbPath = path.join(__dirname, 'database_data');
            if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

            globalMongoServer = await MongoMemoryServer.create({
                instance: {
                    port: 27017,
                    dbPath: dbPath,
                    storageEngine: 'wiredTiger'
                }
            });
            
            const uri = globalMongoServer.getUri() + 'hostel-portal';
            await mongoose.connect(uri);
            
            console.log(`\n======================================================`);
            console.log(`🚀 CONNECTED TO PERSISTENT DATABASE:`);
            console.log(`👉 ACTUAL URI: ${uri}`);
            console.log(`(Your data is now saved permanently in the /database_data folder!)`);
            console.log(`======================================================\n`);
        }
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};
connectDB();

// Graceful shutdown to release port 27017 and lock files
process.on('SIGINT', async () => {
    if (globalMongoServer) await globalMongoServer.stop();
    process.exit(0);
});

// Routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const menuRoutes = require('./routes/menu');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const announcementRoutes = require('./routes/announcements');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
