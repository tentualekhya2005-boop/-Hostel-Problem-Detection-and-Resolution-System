const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['electrical', 'carpentry', 'plumbing', 'cleaning', 'other'], required: true },
    imageUrl: { type: String },
    resolvedImageUrl: { type: String },
    status: { type: String, enum: ['Pending', 'Assigned', 'Needs Verification', 'Student Verified', 'Student Rejected', 'Resolved'], default: 'Pending' },
    assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    roomNumber: { type: String, required: true },
    isDeletedByStudent: { type: Boolean, default: false },
    isDeletedByWorker: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
