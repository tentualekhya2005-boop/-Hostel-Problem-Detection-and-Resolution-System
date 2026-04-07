const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allow requests from Netlify, localhost (dev), and any other origins
const allowedOrigins = [
    'https://hostel12345.netlify.app',
    'https://hostel-problem-detection-and-resolu.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. curl, Postman, mobile)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        // Allow any netlify.app subdomain
        if (origin.endsWith('.netlify.app')) {
            return callback(null, true);
        }
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));

app.use(express.json());

const fs = require('fs');
// Create uploads directory if it doesn't exist (needed for cloud deployment)
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));

// ─── DATABASE ─────────────────────────────────────────────────────────────────
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            console.error('❌ MONGO_URI is not set in environment variables!');
            console.error('➡  Go to Render Dashboard → Your Service → Environment → Add MONGO_URI');
            console.error('➡  Get a free Atlas URI from https://cloud.mongodb.com');
            process.exit(1);
        }

        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri);
        console.log('🚀 CONNECTED TO MONGODB ATLAS CLOUD DATABASE');

    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
};
connectDB();

// ─── ROUTES ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const menuRoutes = require('./routes/menu');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const announcementRoutes = require('./routes/announcements');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Hostel Portal API v3 ✅ (year + block + floor fields enabled)' });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
