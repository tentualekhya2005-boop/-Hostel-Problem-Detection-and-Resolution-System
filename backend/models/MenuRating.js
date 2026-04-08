const mongoose = require('mongoose');

const menuRatingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    // Legacy fields
    breakfast: { type: Number, min: 1, max: 5 },
    lunch: { type: Number, min: 1, max: 5 },
    snacks: { type: Number, min: 1, max: 5 },
    dinner: { type: Number, min: 1, max: 5 },
    // New granular ratings
    itemRatings: [
        {
            itemName: { type: String, required: true },
            category: { type: String, required: true },
            rating: { type: Number, min: 1, max: 5, required: true }
        }
    ]
}, { timestamps: true });

// Ensure one rating record per student per day (containing all item ratings)
menuRatingSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MenuRating', menuRatingSchema);
