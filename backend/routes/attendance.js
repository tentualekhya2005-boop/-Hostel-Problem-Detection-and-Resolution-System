const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Hostel Authorized Networks / GPS constants
// Ideally stored in .env DB, but hardcoded here for logic demonstration
const AUTHORIZED_SSIDS = ['Hostel_WiFi_1', 'Hostel_WiFi_5G'];

// @route   POST /api/attendance/mark
// @desc    ESP32 sends fingerprint ID and connected WiFi SSID to mark attendance
// @access  Public (Hardware Endpoint - could be secured with a device token header)
router.post('/mark', async (req, res) => {
    try {
        const { fingerprintId, ssid } = req.body;

        if (!fingerprintId || !ssid) {
            return res.status(400).json({ success: false, message: 'Missing sensor data' });
        }

        // 1. Wifi Security (Location validation)
        if (!AUTHORIZED_SSIDS.includes(ssid)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Out of range. You must be connected to the Hostel WiFi to mark attendance.' 
            });
        }

        // 2. Identify Student
        const student = await User.findOne({ fingerprintId: parseInt(fingerprintId) });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Fingerprint ID not mapped to any student' });
        }

        // 3. Prevent duplicate attendance for today
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day

        const existingAttendance = await Attendance.findOne({
            studentId: student._id,
            date: today
        });

        if (existingAttendance) {
            return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
        }

        // 4. Mark Attendance
        await Attendance.create({
            studentId: student._id,
            date: today,
            ssidVerified: ssid
        });

        res.status(200).json({ 
            success: true, 
            message: `Attendance marked successfully for ${student.name}` 
        });

    } catch (error) {
        console.error('Attendance System Error:', error);
        res.status(500).json({ success: false, message: 'Server error marking attendance' });
    }
});

// @route   GET /api/attendance/daily
// @desc    Get today's attendance records (For Admin)
// @access  Admin (Would be protected by middleware in actual integration)
router.get('/daily', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const records = await Attendance.find({ date: today }).populate('studentId', 'name roomNumber');
        res.status(200).json({ success: true, count: records.length, data: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
