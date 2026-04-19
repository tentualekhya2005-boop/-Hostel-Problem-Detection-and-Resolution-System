const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin', 'worker'], default: 'student' },
    roomNumber: { type: String }, // For students
    year: { type: String, enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'], default: '1st Year' },
    block: { type: String, enum: ['Nagavalli', 'Vamsadara'], default: 'Nagavalli' },
    skills: [{ type: String }], // For workers
    favorites: [{ type: String }], // Quick heart items (meals)
    otp: { type: String },
    otpExpires: { type: Date },
    biometricRegistered: { type: Boolean, default: false },
    biometricKey: { type: String }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
