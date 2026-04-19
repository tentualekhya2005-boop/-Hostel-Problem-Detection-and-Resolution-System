const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { sendEmailNotification } = require('../utils/emailService');
const Notification = require('../models/Notification');
const { protect, admin, worker } = require('../middleware/authMiddleware');
const cloudinary = require('../utils/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const ExifReader = require('exifreader');


// Use Cloudinary storage if credentials are set, otherwise memory storage (fallback)
const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

const storage = hasCloudinary
    ? new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'hostel-complaints',
            allowed_formats: ['jpg', 'jpeg', 'png'],
            resource_type: 'image',
        },
    })
    : multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpg|jpeg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) return cb(null, true);
        cb(new Error('Images only! (invalid extension)'));
    }
});

// Helper: Sanitize filenames for Windows and URL compatibility
function sanitizeFilename(name) {
    if (!name) return 'file';
    return name
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9\.\-]/g, '') // Remove non-alphanumeric except dots and hyphens
        .replace(/\-+/g, '-') // Collapse multiple hyphens
        .replace(/^-+|-+$/g, ''); // Trim hyphens from ends
}

// Helper: get URL from uploaded file (works for both Cloudinary and memory storage)
function getImageUrl(file) {
    if (!file) return null;
    // Cloudinary attaches .path or .secure_url
    if (file.path) return file.path; 
    // Memory storage: save to local disk as fallback
    if (file.buffer) {
        try {
            const uploadsDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
            const sanitizedOriginal = sanitizeFilename(file.originalname);
            const filename = `${Date.now()}-${sanitizedOriginal}`;
            fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
            return `/uploads/${filename}`;
        } catch (e) {
            console.error('Local file write failed:', e.message);
            return null;
        }
    }
    return null;
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
            const { title, description, category, roomNumber, year, block, floor } = req.body;
            console.log('📋 New complaint fields received:', { title, category, year, block, floor, roomNumber });

            // Get image URL from Cloudinary (or local disk fallback)
            const imageUrl = getImageUrl(req.file);

            const complaint = await Complaint.create({
                studentId: req.user._id,
                title,
                description,
                category,
                roomNumber: roomNumber || req.user.roomNumber || 'Unknown',
                year: year || '1st Year',
                block: block || 'Nagavalli',
                floor: floor || '',
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
    // For resolution, we always use memory storage temporarily to check EXIF 
    // before syncing to Cloudinary/Disk
    const memUpload = multer({ storage: multer.memoryStorage() }).single('image');

    memUpload(req, res, async (err) => {
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

                // ─── FAKE IMAGE DETECTION (BASIC) ───
                let isSuspicious = false;
                let suspicionReason = '';
                let photoTimestamp = null;
                let photoLocation = '';

                try {
                    const tags = ExifReader.load(req.file.buffer);
                    
                    // 1. Check DateTaken (Time stamp)
                    if (tags['DateTimeOriginal']) {
                        const dateStr = tags['DateTimeOriginal'].description;
                        // Format: "YYYY:MM:DD HH:MM:SS"
                        const [datePart, timePart] = dateStr.split(' ');
                        const normalizedDate = datePart.replace(/:/g, '-') + 'T' + timePart;
                        photoTimestamp = new Date(normalizedDate);
                        
                        // If photo was taken more than 1 hour ago, it's suspicious for a live task
                        const now = new Date();
                        const diffInMinutes = (now - photoTimestamp) / (1000 * 60);
                        if (diffInMinutes > 60) {
                            isSuspicious = true;
                            suspicionReason += 'Photo taken too long ago (pre-taken). ';
                        }
                    } else {
                        // isSuspicious = true; // No timestamp is suspicious but common in some phones/apps
                        // suspicionReason += 'No original timestamp found in photo metadata. ';
                    }

                    // 2. Check Software (Screen shots usually have software names)
                    if (tags['Software']) {
                        const software = tags['Software'].description.toLowerCase();
                        if (software.includes('screenshot') || software.includes('snagit') || software.includes('adobe')) {
                            isSuspicious = true;
                            suspicionReason += 'Image appears to be a screenshot or edited. ';
                        }
                    }

                    // 3. Location match (Conceptual)
                    if (tags['GPSLatitude'] && tags['GPSLongitude']) {
                        photoLocation = `${tags['GPSLatitude'].description}, ${tags['GPSLongitude'].description}`;
                        // Here you could compare with hostel GPS coordinates if known
                    }

                } catch (exifErr) {
                    console.log('Exif analysis skipped (no tags or not a JPEG)');
                }

                // ─── UPLOAD TO CLOUDINARY MANUALLY ───
                let resolvedImageUrl = '';
                try {
                    // Convert buffer to data URI for Cloudinary
                    const fileContent = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                    const result = await cloudinary.uploader.upload(fileContent, {
                        folder: 'hostel-complaints/resolutions',
                    });
                    resolvedImageUrl = result.secure_url;
                } catch (uploadErr) {
                    // Fallback to local if Cloudinary fails
                    const fileName = Date.now() + '-' + req.file.originalname;
                    const uploadDir = path.join(__dirname, '../uploads');
                    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
                    fs.writeFileSync(path.join(uploadDir, fileName), req.file.buffer);
                    resolvedImageUrl = `/uploads/${fileName}`;
                }

                complaint.status = 'Needs Verification';
                complaint.resolvedImageUrl = resolvedImageUrl;
                
                // Save suspicion info
                complaint.isSuspicious = isSuspicious;
                complaint.suspicionReason = suspicionReason || 'Verified live photo';
                complaint.photoTimestamp = photoTimestamp;
                complaint.photoLocation = photoLocation;

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

                    // If SUSPICIOUS, notify Admins quietly
                    if (isSuspicious) {
                        const admins = await User.find({ role: 'admin' });
                        for (let adminUser of admins) {
                            await Notification.create({
                                userId: adminUser._id,
                                title: '⚠️ Suspicious Proof Detected',
                                message: `Worker uploaded a suspicious proof photo for task "${complaint.title}". Reason: ${suspicionReason}`,
                                type: 'suspicious_activity',
                                complaintId: complaint._id
                            });
                        }
                    }
                } catch (notifErr) { }

                res.json(updatedComplaint);
            } else {
                res.status(404).json({ message: 'Complaint not found or unauthorized' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }); // Close memUpload callback
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
                        sendEmailNotification({
                            to: studentUser.email,
                            subject: `Complaint Closed: ${complaint.title}`,
                            text: `Hello ${studentUser.name},\n\nThe admin has reviewed and finalized the resolution for your complaint "${complaint.title}". The complaint is now officially closed.\n\nThank you,\nHostel Management`
                        }).catch(e => console.error(e));

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
                        sendEmailNotification({
                            to: workerUser.email,
                            subject: `Task Re-assigned: ${complaint.title}`,
                            text: `Hello ${workerUser.name},\n\nThe admin has rejected the resolution and re-assigned this task back to you. Please check the dashboard and ensure the work is completed property.`
                        }).catch(e => console.error(e));

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
        console.log(`[Admin] Delete attempt: ID=${req.params.id} by Admin=${req.user.email}`);
        const complaint = await Complaint.findById(req.params.id);
        
        if (complaint) {
            await Complaint.findByIdAndDelete(req.params.id);
            console.log(`[Admin] Delete success: ID=${req.params.id}`);
            res.json({ message: 'Complaint permanently deleted' });
        } else {
            console.log(`[Admin] Delete fail: ID=${req.params.id} not found`);
            res.status(404).json({ message: 'Complaint not found' });
        }
    } catch (error) {
        console.error(`[Admin] Delete error:`, error.message);
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

module.exports = router;
