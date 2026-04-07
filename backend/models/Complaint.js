const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['electrical', 'carpentry', 'plumbing', 'cleaning', 'other'], required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }, // AI prediction
    imageUrl: { type: String },
    resolvedImageUrl: { type: String },
    workerImageMeta: {
        timestamp: { type: Date },
        latitude: { type: Number },
        longitude: { type: Number }
    }, // Fake image detection
    status: { type: String, enum: ['Pending', 'Assigned', 'Needs Verification', 'Student Verified', 'Student Rejected', 'Resolved', 'Delayed'], default: 'Pending' },
    assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    roomNumber: { type: String, required: true },
    isDeletedByStudent: { type: Boolean, default: false },
    isDeletedByWorker: { type: Boolean, default: false },
    slaDeadline: { type: Date }, // Time limit
    isDelayed: { type: Boolean, default: false }, // If SLA crossed
    escalationLevel: { type: Number, enum: [1, 2, 3], default: 1 }, // 1: Worker, 2: Admin, 3: Warden
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Group complaints
}, { timestamps: true });

// Auto set SLA Deadline based on category before saving
complaintSchema.pre('save', function(next) {
    if (this.isNew) {
        let hours = 24; // default
        if (this.category === 'electrical') hours = 24;
        else if (this.category === 'plumbing') hours = 12;
        else if (this.category === 'cleaning') hours = 6;
        else if (this.category === 'carpentry') hours = 48;
        
        this.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
    }
    next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
