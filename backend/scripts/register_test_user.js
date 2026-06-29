(async ()=>{
  try{
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'CopilotTest', email: 'copilottest1@example.com', password: 'Password123' }),
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();
