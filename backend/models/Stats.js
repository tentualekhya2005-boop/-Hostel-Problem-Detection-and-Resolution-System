const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    year1: { type: Number, default: 0 },
    year2: { type: Number, default: 0 },
    year3: { type: Number, default: 0 },
    year4: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Stats', statsSchema);
