const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['complaint_assigned', 'complaint_resolved', 'complaint_closed', 'complaint_rejected', 'general', 'announcement'], default: 'general' },
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
