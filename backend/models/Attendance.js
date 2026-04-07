const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
    ssidVerified: { type: String, required: true }, // The WiFi network they connected from
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent duplicate attendance for the same student on the same day
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
