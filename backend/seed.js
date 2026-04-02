const accounts = [
  { name: 'Master Admin', email: 'admin19122005@gmail.com', password: 'password19122005', role: 'admin' },
  { name: 'Test Student', email: 'student@hostel.com', password: 'password123', role: 'student', roomNumber: '101' },
  { name: 'Test Worker', email: 'worker@hostel.com', password: 'password123', role: 'worker', skills: 'general' }
];

const seed = async () => {
  for (let acc of accounts) {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acc)
    });
    const text = await res.text();
    console.log(`Created: ${acc.email} | Status: ${res.status} | response: ${text}`);
  }
};
seed();
