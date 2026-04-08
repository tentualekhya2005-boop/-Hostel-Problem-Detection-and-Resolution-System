const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');

// ─── CONFIGURATION ───
// Hostel location (GMRIT College Rajam coordinates)
const HOSTEL_LAT = parseFloat(process.env.HOSTEL_LAT || '18.46646'); 
const HOSTEL_LON = parseFloat(process.env.HOSTEL_LON || '83.66078');
const ALLOWED_RADIUS_METERS = parseInt(process.env.ALLOWED_RADIUS || '300'); // 300m range for college campus

// ─── Helper: Distance Calculator (Haversine) ───
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
};

// ─── Helper: Get Current IST Date/Time (Asia/Kolkata) ───
const getIST = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const p = (type) => parts.find(part => part.type === type).value;
    
    const hour = parseInt(p('hour'));
    const minute = parseInt(p('minute'));
    const day = p('day').padStart(2, '0');
    const month = p('month').padStart(2, '0');
    const year = p('year');

    return {
        hour,
        minute,
        dateStr: `${year}-${month}-${day}`
    };
};

// @route   POST /api/attendance/mark
// @desc    Student marks daily attendance within geofence 6PM - 9:30PM
// @access  Student
router.post('/mark', protect, async (req, res) => {
    try {
        const { lat, lon } = req.body;
        const ist = getIST();
        
        // 1. Time Check (6:00 PM to 9:30 PM)
        const timeValue = ist.hour * 60 + ist.minute;
        const startWindow = 18 * 60; // 18:00 (6:00 PM)
        const endWindow = 21 * 60 + 30; // 21:30 (9:30 PM)

        if (timeValue < startWindow || timeValue > endWindow) {
            return res.status(403).json({ 
                message: `Attendance window closed. It is currently ${ist.hour}:${ist.minute.toString().padStart(2, '0')} IST. Open between 6:00 PM and 9:30 PM only.` 
            });
        }

        // 2. Geofence Check
        if (!lat || !lon) {
            return res.status(400).json({ message: 'GPS location required for attendance' });
        }

        const distance = getDistanceInMeters(lat, lon, HOSTEL_LAT, HOSTEL_LON);
        const isWithinRange = distance <= ALLOWED_RADIUS_METERS;

        if (!isWithinRange) {
            return res.status(403).json({ 
                message: `Out of range (${Math.round(distance)}m). You must be inside the hostel to mark attendance.`,
                isWithinRange: false
            });
        }

        // 3. Create Attendance Record
        const todayDate = ist.dateStr;
        const existing = await Attendance.findOne({ studentId: req.user._id, date: todayDate });
        
        if (existing) {
            return res.status(400).json({ message: 'Attendance already marked for today' });
        }

        const attendance = await Attendance.create({
            studentId: req.user._id,
            date: todayDate,
            location: { lat, lon },
            isWithinRange: true,
            status: 'Present'
        });

        res.json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/attendance/daily-report
// @desc    Admin gets attendance report for today with absentees
// @access  Admin
router.get('/daily-report', protect, admin, async (req, res) => {
    try {
        const ist = getIST();
        const todayDate = ist.dateStr;
        const allStudents = await User.find({ role: 'student' }).select('name roomNumber year block email');
        const presentRecords = await Attendance.find({ date: todayDate }).populate('studentId', 'name roomNumber year block');
        
        const presentIds = presentRecords.map(r => r.studentId?._id ? r.studentId._id.toString() : '');
        
        // Find absentees
        const absentees = allStudents.filter(s => !presentIds.includes(s._id.toString()));

        // Year-wise stats
        const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        const yearStats = years.map(y => {
            const total = allStudents.filter(s => s.year === y).length;
            const present = presentRecords.filter(r => r.studentId?.year === y).length;
            return { year: y, present, total };
        });

        res.json({ 
            date: todayDate, 
            presentCount: presentRecords.length, 
            totalStudents: allStudents.length, 
            presentRecords, 
            absentees,
            yearStats 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/attendance/my-record
// @desc    Student gets their recent attendance record
// @access  Student
router.get('/my-record', protect, async (req, res) => {
    try {
        const records = await Attendance.find({ studentId: req.user._id }).sort({ date: -1 }).limit(7);
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
