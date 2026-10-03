async function testOptions() {
  try {
    const res = await fetch('https://solar-manager-three.vercel.app/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://solarerp-gamma.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    console.log("STATUS:", res.status);
    console.log("HEADERS:", Object.fromEntries(res.headers.entries()));
  } catch (err) {
    console.error(err);
  }
}
testOptions();
