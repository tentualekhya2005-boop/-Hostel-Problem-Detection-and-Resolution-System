const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();
const app = express();

// Route Imports
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const menuRoutes = require('./routes/menu');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const announcementRoutes = require('./routes/announcements');
const statsRoutes = require('./routes/stats');
const attendanceRoutes = require('./routes/attendance');

app.use(cors({ origin: true, credentials: true })); // Allow all origins with credentials
app.use(express.json());

// 📡 Ping test
app.get('/api/ping', (req, res) => res.json({ status: 'Alive', server: 'Super-Server' }));

// Models
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Complaint = require('./models/Complaint');

const start = async () => {
    console.log('🚀 SUPER SERVER STARTING...');
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    // Seed the user Sreeja
    const sreeja = await User.create({
        name: 'sreeja',
        email: 'tentualekhya2005@gmail.com',
        password: 'anitha12345',
        role: 'student',
        biometricRegistered: true,
        biometricKey: 'simulation-key' // Pre-enrolled for testing
    });
    
    // Seed Admin account
    await User.create({
        name: 'Main Admin',
        email: 'admin19122005@gmail.com',
        password: '1912005',
        role: 'admin'
    });
    console.log('🌱 Seeded Sreeja and Admin accounts');

    // 📁 Static File Serving (Photos)
    const uploadsPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
    app.use('/uploads', express.static(uploadsPath, {
        setHeaders: (res) => {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        }
    }));

    // 🛡️ BIOMETRIC ENROLLMENT
    app.post('/api/users/biometric/register', async (req, res) => {
        const { deviceSignature } = req.body;
        await User.findOneAndUpdate({ email: 'tentualekhya2005@gmail.com' }, { 
            biometricRegistered: true, 
            biometricKey: deviceSignature 
        });
        res.json({ message: 'Success', biometricRegistered: true });
    });

    app.get('/api/users/profile', async (req, res) => {
        const user = await User.findOne({ email: 'tentualekhya2005@gmail.com' });
        res.json(user);
    });

    // 📅 ATTENDANCE MARKING
    app.post('/api/attendance/mark', async (req, res) => {
        const { lat, lon, deviceSignature } = req.body;
        const today = new Date().toISOString().split('T')[0];
        await Attendance.create({ studentId: sreeja._id, date: today, status: 'Present', location: { lat, lon } });
        res.json({ message: 'Attendance Marked ✅' });
    });

    app.get('/api/attendance/my-record', async (req, res) => {
        const records = await Attendance.find({ studentId: sreeja._id });
        res.json(records);
    });

    // 📝 COMPLAINTS Logic is now fully handled by complaintRoutes fallback

    // Routes fallbacks
    app.use('/api/auth', authRoutes);
    app.use('/api/complaints', complaintRoutes);
    app.use('/api/menu', menuRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/announcements', announcementRoutes);
    app.use('/api/stats', statsRoutes);
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api', (req, res) => res.json({ message: 'Super Server Mode' }));

    const PORT = 5001;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`📡 SUPER SERVER LISTENING ON PORT ${PORT}`);
    });
};

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

start();
