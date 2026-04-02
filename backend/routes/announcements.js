const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, admin } = require('../middleware/authMiddleware');

// Get announcements for the current user's role
router.get('/', protect, async (req, res) => {
    try {
        const role = req.user.role;
        const announcements = await Announcement.find({
            $or: [{ targetRole: 'all' }, { targetRole: role }]
        }).sort({ createdAt: -1 }).limit(5);
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin creates a new announcement
router.post('/broadcast', protect, admin, async (req, res) => {
    try {
        const { title, message, targetRole } = req.body;
        const announcement = await Announcement.create({ title, message, targetRole });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin deletes an announcement
router.delete('/:id', protect, async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
