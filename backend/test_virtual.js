const test = async () => {
  // register
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'freelancer'
    })
  });
  const regData = await regRes.json();
  if (!regRes.ok) {
    console.error('Registration failed:', regData);
    return;
  }
  const token = regData.token;
  
  // issue virtual wallet
  const virtRes = await fetch('http://localhost:5000/api/wallet/virtual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  const virtData = await virtRes.text();
  console.log('Status:', virtRes.status);
  console.log('Response:', virtData);
};
test();
