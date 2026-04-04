const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://hostel-problem-detection-and-resolution-ic6i.onrender.com/api/users/login', {
      email: 'admin19122005@gmail.com',
      password: 'password19122005'
    });
    
    const token = res.data.token;
    
    const compRes = await axios.get('https://hostel-problem-detection-and-resolution-ic6i.onrender.com/api/complaints/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const images = compRes.data.map(c => c.imageUrl).filter(u => u);
    console.log(images);
  } catch (err) {
    console.error(err.message);
  }
}
test();
