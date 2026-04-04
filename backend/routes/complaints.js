const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { sendEmailNotification } = require('../utils/emailService');
const Notification = require('../models/Notification');
const { protect, admin, worker } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('Images only! (invalid extension)'));
    }
}

// @route   POST /api/complaints
// @desc    Student submits a complaint
// @access  Student (or anyone logged in for simplicity, but logically student)
router.post('/', protect, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error("MULTER UPLOAD ERROR:", err.message || err);
            return res.status(500).json({ message: err.message || 'Multer processing error' });
        }

        try {
            const { title, description, category, roomNumber } = req.body;
            
            let imageUrl = null;
            if (req.file) {
                const filename = `${Date.now()}-${req.file.originalname}`;
                const targetPath = path.join(__dirname, '../uploads', filename);
                require('fs').writeFileSync(targetPath, req.file.buffer);
                imageUrl = `/uploads/${filename}`;
            }

            const complaint = await Complaint.create({
                studentId: req.user._id,
                title,
                description,
                category,
                roomNumber: roomNumber || req.user.roomNumber || 'Unknown',
                imageUrl
            });

            // Respond immediately to the student
            res.status(201).json(complaint);

            // Send emails in the background (non-blocking)
        try {
            const admins = await User.find({ role: 'admin' });
            for (let adminUser of admins) {
                sendEmailNotification({
                    to: adminUser.email,
                    subject: `New Complaint Logged: ${title}`,
                    text: `A new complaint has been submitted by a student (Room ${complaint.roomNumber}).\n\nCategory: ${category}\nDescription: ${description}\n\nPlease log in to assign a worker.`
                }).catch(() => { });

                await Notification.create({
                    userId: adminUser._id,
                    title: 'New Complaint',
                    message: `A new complaint "${title}" has been submitted by a student (Room ${complaint.roomNumber}).`,
                    type: 'general',
                    complaintId: complaint._id
                }).catch((e) => { console.error('Notification admin err:', e.message); });
            }
        } catch (emailErr) { }

        try {
            const studentUser = await User.findById(req.user._id);
            if (studentUser) {
                sendEmailNotification({
                    to: studentUser.email,
                    subject: `Complaint Logged Successfully: ${title}`,
                    text: `Hello ${studentUser.name},\n\nYour complaint "${title}" (${category}) has been successfully submitted to the admin team. You will be notified when a worker is assigned.\n\nThank you,\nHostel Management`
                }).catch((e) => { console.error('Email err:', e.message); });
            }
        } catch (emailErr) { console.error('Email block err:', emailErr.message); }
    } catch (error) {
        console.error("COMPLAINT POST ERROR (FULL):", error);
        res.status(500).json({ message: error.message || 'Internal error creating complaint' });
    }
    }); // Close upload.single callback
});

// @route   GET /api/complaints/student
// @desc    Get logged in student's complaints
// @access  Student
router.get('/student', protect, async (req, res) => {
    try {
        const complaints = await Complaint.find({ studentId: req.user._id, isDeletedByStudent: false }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/complaints/all
// @desc    Get all complaints
// @access  Admin
router.get('/all', protect, admin, async (req, res) => {
    try {
        const complaints = await Complaint.find({})
            .populate('studentId', 'name email roomNumber')
            .populate('assignedWorkerId', 'name')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/complaints/:id/assign
// @desc    Admin assigns a worker
// @access  Admin
router.put('/:id/assign', protect, admin, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (complaint) {
            complaint.assignedWorkerId = req.body.workerId;
            complaint.status = 'Assigned';
            const updatedComplaint = await complaint.save();

            // Send emails to the assigned worker and the student
            try {
                const workerUser = await User.findById(req.body.workerId);
                const studentUser = await User.findById(complaint.studentId);

                if (workerUser) {
                    sendEmailNotification({
                        to: workerUser.email,
                        subject: `New Task Assigned: ${complaint.title}`,
                        text: `You have been assigned a new task in Room ${complaint.roomNumber}.\n\nDescription: ${complaint.description}\n\nPlease log in to view details and update status.`
                    });

                    await Notification.create({
                        userId: workerUser._id,
                        title: 'New Task Assigned',
                        message: `You have been assigned a new task: "${complaint.title}" in Room ${complaint.roomNumber}.`,
                        type: 'complaint_assigned',
                        complaintId: complaint._id
                    }).catch(() => { });
                }

                if (studentUser) {
                    sendEmailNotification({
                        to: studentUser.email,
                        subject: `Complaint Status Updated: ${complaint.title}`,
                        text: `Your complaint has been assigned to a worker and is currently being processed. You will be notified when it is resolved.`
                    });

                    // In-app notification for student
                    await Notification.create({
                        userId: complaint.studentId,
                        title: 'Worker Assigned',
                        message: `A worker has been assigned to your complaint "${complaint.title}". It is now being processed.`,
                        type: 'complaint_assigned',
                        complaintId: complaint._id
                    });
                }
            } catch (emailErr) {
                console.error("Failed to send email", emailErr);
            }

            res.json(updatedComplaint);
        } else {
            res.status(404).json({ message: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/complaints/worker
// @desc    Worker views assigned tasks
// @access  Worker
router.get('/worker', protect, worker, async (req, res) => {
    try {
        const tasks = await Complaint.find({ assignedWorkerId: req.user._id, isDeletedByWorker: false })
            .populate('studentId', 'name roomNumber')
            .sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/complaints/:id/resolve
// @desc    Worker marks complaint as resolved and uploads proof photo
// @access  Worker
router.put('/:id/resolve', protect, worker, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error("MULTER RESOLVE ERROR:", err.message || err);
            return res.status(500).json({ message: err.message || 'Multer upload error' });
        }
        try {
            const complaint = await Complaint.findById(req.params.id);

            // Ensure this worker is actually assigned to this task
            if (complaint && complaint.assignedWorkerId.toString() === req.user._id.toString()) {
                if (!req.file) {
                    return res.status(400).json({ message: 'A completion photo is required to resolve this task' });
                }

                let resolvedImageUrl = null;
                if (req.file) {
                const filename = `${Date.now()}-${req.file.originalname}`;
                const targetPath = path.join(__dirname, '../uploads', filename);
                require('fs').writeFileSync(targetPath, req.file.buffer);
                resolvedImageUrl = `/uploads/${filename}`;
            }

            complaint.status = 'Needs Verification';
            complaint.resolvedImageUrl = resolvedImageUrl;

            const updatedComplaint = await complaint.save();

            // Notify student to verify
            try {
                const studentUser = await User.findById(complaint.studentId);
                if (studentUser) {
                    sendEmailNotification({
                        to: studentUser.email,
                        subject: `Action Required: Verify Complaint Resolution (${complaint.title})`,
                        text: `Your complaint has been marked as resolved by the assigned worker.\n\nPlease log in to your dashboard to view the completion photo and verify whether the issue is actually resolved. If it's not resolved, you can reject it.`
                    });

                    // In-app notification for student
                    await Notification.create({
                        userId: complaint.studentId,
                        title: '🎉 Your Problem is Solved!',
                        message: `The worker has completed the task for your complaint "${complaint.title}". Please check your dashboard to verify and confirm.`,
                        type: 'complaint_resolved',
                        complaintId: complaint._id
                    });
                }
            } catch (emailErr) {
                console.error("Failed to send email", emailErr);
            }

            res.json(updatedComplaint);
        } else {
            res.status(404).json({ message: 'Complaint not found or unauthorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    }); // Close upload callback
});

// @route   PUT /api/complaints/:id/verify-resolution
// @desc    Student verifies if the task was actually completed
// @access  Student
router.put('/:id/verify-resolution', protect, async (req, res) => {
    try {
        const { isResolved } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (complaint && complaint.studentId.toString() === req.user._id.toString()) {
            if (isResolved) {
                complaint.status = 'Student Verified';
                
                // Notify Admins
                try {
                    const admins = await User.find({ role: 'admin' });
                    for (let adminUser of admins) {
                        await Notification.create({
                            userId: adminUser._id,
                            title: 'Complaint Verified',
                            message: `Student has verified the resolution for complaint "${complaint.title}". It is ready to be closed.`,
                            type: 'complaint_verified',
                            complaintId: complaint._id
                        });
                    }
                } catch (err) {}
            } else {
                complaint.status = 'Student Rejected';
                
                // Notify Admins
                try {
                    const admins = await User.find({ role: 'admin' });
                    for (let adminUser of admins) {
                        await Notification.create({
                            userId: adminUser._id,
                            title: 'Complaint Rejected',
                            message: `Student rejected the resolution for complaint "${complaint.title}". Please review.`,
                            type: 'complaint_rejected',
                            complaintId: complaint._id
                        });
                    }
                } catch (err) {}
            }

            const updatedComplaint = await complaint.save();
            res.json(updatedComplaint);
        } else {
            res.status(404).json({ message: 'Complaint not found or unauthorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/complaints/:id/admin-resolve
// @desc    Admin takes final decision to Close or Reassign
// @access  Admin
router.put('/:id/admin-resolve', protect, admin, async (req, res) => {
    try {
        const { action } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (complaint) {
            if (action === 'Resolve') {
                complaint.status = 'Resolved';
                // Notify student
                try {
                    const studentUser = await User.findById(complaint.studentId);
                    if (studentUser) {
                        await sendEmailNotification({
                            to: studentUser.email,
                            subject: `Complaint Closed: ${complaint.title}`,
                            text: `Hello ${studentUser.name},\n\nThe admin has reviewed and finalized the resolution for your complaint "${complaint.title}". The complaint is now officially closed.\n\nThank you,\nHostel Management`
                        });

                        // In-app notification for student
                        await Notification.create({
                            userId: complaint.studentId,
                            title: '✅ Complaint Officially Closed',
                            message: `Your complaint "${complaint.title}" has been officially resolved and closed by the admin. Thank you for your patience!`,
                            type: 'complaint_closed',
                            complaintId: complaint._id
                        });
                    }
                } catch (emailErr) { }
            }
            else if (action === 'Reassign') {
                complaint.status = 'Assigned';
                complaint.isDeletedByWorker = false;
                // Notify worker
                try {
                    const workerUser = await User.findById(complaint.assignedWorkerId);
                    if (workerUser) {
                        await sendEmailNotification({
                            to: workerUser.email,
                            subject: `Task Re-assigned: ${complaint.title}`,
                            text: `Hello ${workerUser.name},\n\nThe admin has rejected the resolution and re-assigned this task back to you. Please check the dashboard and ensure the work is completed property.`
                        });

                        await Notification.create({
                            userId: workerUser._id,
                            title: 'Task Re-assigned',
                            message: `The admin has missing or rejected the resolution for "${complaint.title}" and re-assigned it to you. Please check the dashboard.`,
                            type: 'complaint_rejected',
                            complaintId: complaint._id
                        });
                    }
                } catch (emailErr) { }
            }

            const updatedComplaint = await complaint.save();
            res.json(updatedComplaint);
        } else {
            res.status(404).json({ message: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/complaints/:id
// @desc    Student soft-deletes resolved complaint
// @access  Student
router.delete('/:id', protect, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (complaint && complaint.studentId.toString() === req.user._id.toString()) {
            complaint.isDeletedByStudent = true;
            await complaint.save();
            res.json({ message: 'Complaint hidden for student' });
        } else {
            res.status(404).json({ message: 'Complaint not found or unauthorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/complaints/worker/:id
// @desc    Worker soft-deletes a complaint from their dashboard
// @access  Worker
router.delete('/worker/:id', protect, worker, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (complaint && complaint.assignedWorkerId && complaint.assignedWorkerId.toString() === req.user._id.toString()) {
            complaint.isDeletedByWorker = true;
            await complaint.save();
            res.json({ message: 'Complaint hidden for worker' });
        } else {
            res.status(404).json({ message: 'Complaint not found or unauthorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/complaints/admin/:id
// @desc    Admin permanently deletes a complaint
// @access  Admin
router.delete('/admin/:id', protect, admin, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (complaint) {
            await complaint.deleteOne();
            res.json({ message: 'Complaint permanently deleted' });
        } else {
            res.status(404).json({ message: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
