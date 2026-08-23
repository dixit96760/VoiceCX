

async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });
    
    console.log('STATUS:', res.status);
    const data = await res.json();
    console.log('RESPONSE:', data);
  } catch (err) {
    console.error('NETWORK ERROR:', err);
  }
}

test();
