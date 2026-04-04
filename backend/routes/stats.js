const express = require('express');
const router = express.Router();
const Stats = require('../models/Stats');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/stats
// @desc    Get hostel stats
// @access  Private (any user)
router.get('/', protect, async (req, res) => {
    try {
        let stats = await Stats.findOne();
        if (!stats) {
            stats = { year1: 0, year1Total: 0, year2: 0, year2Total: 0, year3: 0, year3Total: 0, year4: 0, year4Total: 0 };
        }
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/stats
// @desc    Update hostel stats
// @access  Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        let stats = await Stats.findOne();
        if (!stats) {
            stats = new Stats(req.body);
        } else {
            stats.year1 = req.body.year1 !== undefined ? req.body.year1 : stats.year1;
            stats.year1Total = req.body.year1Total !== undefined ? req.body.year1Total : stats.year1Total;
            stats.year2 = req.body.year2 !== undefined ? req.body.year2 : stats.year2;
            stats.year2Total = req.body.year2Total !== undefined ? req.body.year2Total : stats.year2Total;
            stats.year3 = req.body.year3 !== undefined ? req.body.year3 : stats.year3;
            stats.year3Total = req.body.year3Total !== undefined ? req.body.year3Total : stats.year3Total;
            stats.year4 = req.body.year4 !== undefined ? req.body.year4 : stats.year4;
            stats.year4Total = req.body.year4Total !== undefined ? req.body.year4Total : stats.year4Total;
        }
        await stats.save();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
