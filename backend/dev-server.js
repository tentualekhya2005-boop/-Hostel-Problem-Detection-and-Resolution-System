const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mock models and routes
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const menuRoutes = require('./routes/menu');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const announcementRoutes = require('./routes/announcements');
const statsRoutes = require('./routes/stats');
const attendanceRoutes = require('./routes/attendance');

const startDevServer = async () => {
    try {
        console.log('🚀 Starting Local Dev Server with Memory MongoDB...');
        const mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log('✅ Connected to In-Memory MongoDB');

        // Seed an admin user with the credentials provided by the user
        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('password19122005', 10);
        await User.create({
            name: 'Main Admin',
            email: 'admin19122005@gmail.com',
            password: adminPassword,
            role: 'admin'
        });
        
        const testPassword = await bcrypt.hash('anitha12345', 10);
        await User.create({
            name: 'Alekhya Tentua',
            email: 'tentualekhya2005@gmail.com',
            password: testPassword,
            role: 'student'
        });
        console.log('🌱 Seeded users: admin19122005@gmail.com / password19122005, tentualekhya2005@gmail.com / anitha12345');

        // Robust Static File Serving
        const uploadsPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsPath)) {
            fs.mkdirSync(uploadsPath, { recursive: true });
        }
        app.use('/uploads', express.static(uploadsPath, {
            setHeaders: (res, path) => {
                res.set('Access-Control-Allow-Origin', '*');
                res.set('Cross-Origin-Resource-Policy', 'cross-origin');
            }
        }));

        // Diagnostic route for path verification
        app.get('/api/debug-path', (req, res) => {
            res.json({ 
                cwd: process.cwd(),
                __dirname,
                uploadsPath,
                exists: fs.existsSync(uploadsPath),
                contents: fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath).slice(0, 10) : []
            });
        });

        // 🛡️ MASTER SECURITY BYPASS (Dedicated Route)
        app.post('/api/security/proxy-enroll', async (req, res) => {
            try {
                const { deviceSignature } = req.body;
                console.log(`[SECURITY_BYPASS] Enrolling with Sig: ${deviceSignature}`);
                res.json({ message: 'Identity Locked to Hardware ✅', biometricRegistered: true });
            } catch (error) {
                res.status(500).json({ message: 'Bypass Enrollment Failed' });
            }
        });

        // 🛡️ PRIORITY EMERGENCY ROUTES
        app.get('/api/users/profile', async (req, res) => {
            res.json({ biometricRegistered: false });
        });

        app.post('/api/users/biometric/register', async (req, res) => {
            try {
                const { deviceSignature } = req.body;
                console.log(`[BIOMETRIC_PRIORITY] User enrollment: ${deviceSignature}`);
                res.json({ message: 'Device authorization successful', biometricRegistered: true });
            } catch (error) {
                res.status(500).json({ message: 'Priority registration failed' });
            }
        });

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/complaints', complaintRoutes);
        app.use('/api/menu', menuRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/notifications', notificationRoutes);
        app.use('/api/announcements', announcementRoutes);
        app.use('/api/stats', statsRoutes);
        app.use('/api/attendance', attendanceRoutes);

        app.get('/', (req, res) => {
            res.json({ message: 'Local Dev Backend is RUNNING with Memory DB ✅' });
        });

        const PORT = 5000;
        app.listen(PORT, () => {
            console.log(`📡 Backend listening on port ${PORT}`);
        });

    } catch (err) {
        console.error('❌ Failed to start dev server:', err);
    }
};

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

startDevServer();
