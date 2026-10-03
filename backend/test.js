async function test() {
  try {
    const res = await fetch('https://solar-manager-three.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://solarerp-gamma.vercel.app'
      },
      body: JSON.stringify({
        email: 'platform@whereready.com',
        password: 'password123'
      })
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
  } catch (err) {
    console.error(err);
  }
}
test();
