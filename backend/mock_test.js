const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
// //


// Imports
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const User = require('./models/User');

const app = express();
app.use(express.json());

// Setup uploads path as server.js does
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

app.use('/api/complaints', complaintRoutes);

async function runTest() {
    process.env.JWT_SECRET = 'testsecret';
    process.env.EMAIL_USER = 'dummy@test.com'; // avoid email crash
    
    // Start Mongo in memory
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    
    // Create student user
    const user = await User.create({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password',
        role: 'student'
    });
    
    // Start server
    const server = app.listen(5001, async () => {
        try {
            // Generate token
            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            
            // Create a fake image file
            const fs = require('fs');
            fs.writeFileSync('test.jpg', 'fake image content');
            
            // Replicate formData from frontend
            const axios = require('axios');
            const form = new FormData();
            form.append('title', 'doors problem');
            form.append('description', 'doors problem');
            form.append('category', 'carpentry'); // NOTE: lowercase! The frontend says value="carpentry".
            form.append('image', fs.createReadStream('test.jpg'));

            const response = await axios.post('http://localhost:5001/api/complaints', form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            });
            
            console.log('Success:', response.status);
            console.log(response.data);
            process.exit(0);
            
        } catch (error) {
            console.error('FAILED with status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            process.exit(1);
        }
    });
}

runTest();
