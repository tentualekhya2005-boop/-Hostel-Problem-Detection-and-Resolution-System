const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   POST /api/menu
// @desc    Admin sets or updates menu for a specific date
// @access  Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { date, breakfast, lunch, snacks, dinner } = req.body;
        
        // Find if menu exists for this date
        let menu = await Menu.findOne({ date: new Date(date) });

        if (menu) {
            menu.breakfast = breakfast;
            menu.lunch = lunch;
            menu.snacks = snacks;
            menu.dinner = dinner;
            const updatedMenu = await menu.save();
            return res.json(updatedMenu);
        } else {
            menu = await Menu.create({
                date: new Date(date),
                breakfast,
                lunch,
                snacks,
                dinner
            });
            return res.status(201).json(menu);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/menu/today
// @desc    Get menu for today
// @access  Public (or protected, let's say public so anyone can view on login screen or protected for users)
// Let's protect it so only logged in users see it
router.get('/today', protect, async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const menu = await Menu.findOne({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (menu) {
            res.json(menu);
        } else {
            res.status(404).json({ message: 'Menu not updated for today' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/menu/date/:date
// @desc    Get menu for a specific date (YYYY-MM-DD)
// @access  Protected
router.get('/date/:date', protect, async (req, res) => {
    try {
        const queryDate = new Date(req.params.date);
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);

        const menu = await Menu.findOne({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (menu) {
            res.json(menu);
        } else {
            res.status(404).json({ message: 'Menu not found for this date' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
