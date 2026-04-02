const fs = require('fs');

async function run() {
  console.log('Logging in as student...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@hostel.com', password: 'password123' })
  });
  
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    return;
  }
  console.log('Login success! Token acquired.');

  console.log('Submitting complaint...');
  // The route uses multer (upload.single('image')), so we should ideally use FormData
  // But let's try just sending a normal form data without an image first
  const form = new FormData();
  form.append('title', 'Test Complaint');
  form.append('description', 'This is a test complaint to trigger the email');
  form.append('category', 'electrical');
  form.append('roomNumber', '101');
  
  const complaintRes = await fetch('http://localhost:5000/api/complaints', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${loginData.token}`
    },
    body: form
  });

  if (complaintRes.ok) {
    console.log('Complaint submitted successfully!');
    console.log(await complaintRes.json());
  } else {
    console.error('Complaint submission failed!');
    console.log(`Status: ${complaintRes.status}`);
    console.log(await complaintRes.text());
  }
}
run();
