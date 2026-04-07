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

const MenuRating = require('../models/MenuRating');

// Rate menu items
router.post('/rate', protect, async (req, res) => {
    try {
        const { date, meal, rating } = req.body;
        let record = await MenuRating.findOne({ userId: req.user._id, date });
        
        if (record) {
            record[meal] = rating;
        } else {
            record = new MenuRating({ 
                userId: req.user._id, 
                date,
                [meal]: rating 
            });
        }
        await record.save();
        res.status(201).json(record);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin stats: Aggregated ratings for today
router.get('/ratings/today', protect, admin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const ratings = await MenuRating.find({ date: today });
        
        const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];
        const stats = meals.map(m => {
            const valid = ratings.filter(r => r[m] > 0);
            const sum = valid.reduce((acc, current) => acc + current[m], 0);
            const avg = valid.length > 0 ? (sum / (valid.length * 5)) * 100 : 0;
            return { name: m.charAt(0).toUpperCase() + m.slice(1), value: Math.round(avg) };
        });
        res.json(stats);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get user's rating for a specific date
router.get('/my-rating/:date', protect, async (req, res) => {
    try {
        const record = await MenuRating.findOne({ userId: req.user._id, date: req.params.date });
        res.json(record || {});
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin stats: Aggregated ratings for the last 7 days
router.get('/ratings/weekly', protect, admin, async (req, res) => {
    try {
        const history = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const ratings = await MenuRating.find({ date: dateStr });
            const menu = await Menu.findOne({ date: { $gte: new Date(dateStr), $lte: new Date(dateStr + 'T23:59:59') } });
            
            if (menu) {
                ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(m => {
                    const valid = ratings.filter(r => r[m] > 0);
                    const avg = valid.length > 0 ? (valid.reduce((s, c) => s + c[m], 0) / (valid.length * 5)) * 100 : null;
                    if (avg !== null) {
                        history.push({
                            meal: m.charAt(0).toUpperCase() + m.slice(1),
                            dish: menu[m],
                            date: dateStr,
                            satisfaction: Math.round(avg),
                            count: valid.length
                        });
                    }
                });
            }
        }
        res.json(history);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
