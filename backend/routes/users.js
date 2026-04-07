const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/users/workers
// @desc    Get all workers
// @access  Admin
router.get('/workers', protect, admin, async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' }).select('-password');
        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/students
// @desc    Get all students
// @access  Admin
router.get('/students', protect, admin, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/users/worker
// @desc    Admin registers a new worker
// @access  Admin
router.post('/worker', protect, admin, async (req, res) => {
    const { name, email, password, skills } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const worker = await User.create({
            name, email, password, role: 'worker', skills
        });

        res.status(201).json({ _id: worker._id, name: worker.name, email: worker.email, role: worker.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Profile error" });
    }
});

// @route   PUT /api/users/favorites
// @desc    Toggle favorite item
// @access  Private
router.put('/favorites', protect, async (req, res) => {
    try {
        const { item } = req.body;
        const user = await User.findById(req.user._id);
        
        if (user.favorites.includes(item)) {
            user.favorites = user.favorites.filter(f => f !== item);
        } else {
            user.favorites.push(item);
        }
        
        await user.save();
        res.json(user.favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
