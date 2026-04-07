const mongoose = require('mongoose');

const menuRatingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    breakfast: { type: Number, min: 1, max: 5 },
    lunch: { type: Number, min: 1, max: 5 },
    snacks: { type: Number, min: 1, max: 5 },
    dinner: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

// Ensure one rating per student per day
menuRatingSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MenuRating', menuRatingSchema);
