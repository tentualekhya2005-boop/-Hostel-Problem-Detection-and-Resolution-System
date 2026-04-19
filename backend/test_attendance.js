const axios = require('axios');

const test = async () => {
    try {
        // 1. Get Token
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'tentualekhya2005@gmail.com',
            password: 'anitha12345'
        });
        const token = loginRes.data.token;
        console.log('Token acquired');

        // 2. Test Attendance
        const res = await axios.post('http://localhost:5000/api/attendance/mark', {
            lat: 18.4663,
            lon: 83.6605
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Success:', res.data.message);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Message:', error.response.data.message);
        } else {
            console.log('Error:', error.message);
        }
    }
};

test();
