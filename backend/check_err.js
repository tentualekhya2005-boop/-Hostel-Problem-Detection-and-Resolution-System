async function test() {
  // Login as student
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@hostel.com', password: 'password123' })
  });
  const { token } = await loginRes.json();
  console.log('Login:', loginRes.ok ? 'OK' : 'FAIL');

  // Submit complaint (no image, plain JSON)
  const res = await fetch('http://localhost:5000/api/complaints', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: 'Test', description: 'Test desc', category: 'electrical', roomNumber: '101' })
  });
  console.log('Submit complaint:', res.status, res.ok ? 'SUCCESS' : 'FAILED');
  if (!res.ok) console.log(await res.text());
  else console.log(await res.json());
}
test();
