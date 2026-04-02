const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetRole: { type: String, enum: ['all', 'student', 'worker', 'admin'], default: 'all' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
