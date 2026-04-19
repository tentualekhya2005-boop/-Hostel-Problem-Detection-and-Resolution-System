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
        // Use local date string instead of UTC to ensure "Today" matches user expectation
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const startOfDay = new Date(todayStr);
        const endOfDay = new Date(todayStr);
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

// Rate specific menu item
router.post('/rate', protect, async (req, res) => {
    try {
        const { date, meal, rating, itemName } = req.body;
        let record = await MenuRating.findOne({ userId: req.user._id, date });
        
        if (record) {
            // Check if item already rated
            const items = record.itemRatings || [];
            const existingIndex = items.findIndex(i => i.itemName === itemName);
            if (existingIndex > -1) {
                items[existingIndex].rating = rating;
            } else {
                items.push({ itemName, category: meal, rating });
            }
            record.itemRatings = items;
            // Maintain legacy field for backward compatibility if meal is a valid category
            if (['breakfast', 'lunch', 'snacks', 'dinner'].includes(meal)) {
                record[meal] = rating;
            }
        } else {
            record = new MenuRating({ 
                userId: req.user._id, 
                date,
                [meal]: rating,
                itemRatings: [{ itemName, category: meal, rating }]
            });
        }
        await record.save();
        res.status(201).json(record);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin stats: Aggregated ratings for today
// Admin stats: Aggregated ratings for today (item-level)
router.get('/ratings/today', protect, admin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const ratings = await MenuRating.find({ date: today });
        
        const itemStats = {};
        ratings.forEach(rec => {
            if (rec.itemRatings && rec.itemRatings.length > 0) {
                rec.itemRatings.forEach(ir => {
                    if (!itemStats[ir.itemName]) {
                        itemStats[ir.itemName] = { total: 0, count: 0 };
                    }
                    itemStats[ir.itemName].total += ir.rating;
                    itemStats[ir.itemName].count += 1;
                });
            } else {
                // Legacy fallback
                ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(m => {
                    if (rec[m] > 0) {
                        if (!itemStats[m]) itemStats[m] = { total: 0, count: 0 };
                        itemStats[m].total += rec[m];
                        itemStats[m].count += 1;
                    }
                });
            }
        });

        const stats = Object.keys(itemStats).map(name => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: Math.round((itemStats[name].total / (itemStats[name].count * 5)) * 100)
        }));
        
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

// Admin stats: Aggregated ratings for the last 7 days (including item-level details)
router.get('/ratings/weekly', protect, admin, async (req, res) => {
    try {
        const history = [];
        // Calculate the range for the last 7 days
        const labels = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toISOString().split('T')[0]);
        }

        const ratings = await MenuRating.find({ date: { $in: labels } });
        const menus = await Menu.find({ date: { $gte: new Date(labels[labels.length-1]), $lte: new Date(labels[0] + 'T23:59:59') } });

        // Aggregate by individual items found in itemRatings
        const itemStats = {};

        ratings.forEach(rec => {
            if (rec.itemRatings && rec.itemRatings.length > 0) {
                rec.itemRatings.forEach(ir => {
                    const key = `${ir.itemName}_${rec.date}`;
                    if (!itemStats[key]) {
                        itemStats[key] = {
                            dish: ir.itemName,
                            meal: ir.category,
                            date: rec.date,
                            totalRating: 0,
                            count: 0
                        };
                    }
                    itemStats[key].totalRating += ir.rating;
                    itemStats[key].count += 1;
                });
            } else {
                // Fallback to legacy fields if itemRatings is empty
                ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(m => {
                    if (rec[m] > 0) {
                        // Find dish name from menu for that date
                        const dayMenu = menus.find(menu => menu.date.toISOString().split('T')[0] === rec.date);
                        const dishName = dayMenu ? dayMenu[m] : m;
                        // For legacy, we might have multiple items in one string. Treat as one for now.
                        const key = `${dishName}_${rec.date}`;
                        if (!itemStats[key]) {
                            itemStats[key] = {
                                dish: dishName,
                                meal: m,
                                date: rec.date,
                                totalRating: 0,
                                count: 0
                            };
                        }
                        itemStats[key].totalRating += rec[m];
                        itemStats[key].count += 1;
                    }
                });
            }
        });

        const result = Object.values(itemStats).map(stat => ({
            ...stat,
            satisfaction: Math.round((stat.totalRating / (stat.count * 5)) * 100),
            avgStars: Number((stat.totalRating / stat.count).toFixed(1))
        }));

        res.json(result);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
