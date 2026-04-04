const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const LIVE_URL = 'https://hostel-problem-detection-and-resolution-1c61.onrender.com';

async function testLive() {
    try {
        console.log('Registering test user...');
        const email = `testuser_${Date.now()}@test.com`;
        const regRes = await axios.post(`${LIVE_URL}/api/auth/register`, {
            name: 'Test Agent',
            email: email,
            password: 'password123',
            role: 'student',
            roomNumber: '101'
        });
        
        const token = regRes.data.token;
        console.log('Got token:', token.substring(0, 20) + '...');

        console.log('Submitting complaint...');
        const form = new FormData();
        form.append('title', 'doors lock problem');
        form.append('description', 'doors lock problem');
        form.append('category', 'carpentry');
        
        fs.writeFileSync('test.jpeg', 'fake image data');
        form.append('image', fs.createReadStream('test.jpeg'));

        const response = await axios.post(`${LIVE_URL}/api/complaints`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });
        
        console.log('SUCCESS!', response.status, response.data);
    } catch (e) {
        console.error('FAILED!');
        console.error('Status:', e.response?.status);
        console.error('Headers:', e.response?.headers);
        console.error('Data:', typeof e.response?.data === 'string' ? e.response?.data.substring(0, 500) : e.response?.data);
    }
}

testLive();
