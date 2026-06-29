import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

dotenv.config({ path: './.env' });

const API = process.env.API_TEST_URL || 'http://localhost:5000';

async function run() {
  try {
    // create a unique email per run
    const email = `copilot_test_${Date.now()}@example.com`;
    console.log('Registering test user', email);
    const reg = await axios.post(`${API}/api/auth/register`, { name: 'Copilot Test', email, password: 'Password123' }, { headers: { 'Content-Type': 'application/json' } });
    const { accessToken, refreshToken, user } = reg.data;
    console.log('Registered. User id:', user._id);

    const headers = { Authorization: `Bearer ${accessToken}` };

    // create chat session
    console.log('Creating chat session...');
    const create = await axios.post(`${API}/api/chat/sessions`, { title: 'E2E Test Session' }, { headers });
    const session = create.data.session;
    console.log('Session created:', session._id);

    // post message
    const msg = 'I have three things due today: finish report, prepare slides, and send a meeting summary. Help me prioritize.';
    console.log('Posting user message:', msg);
    const post = await axios.post(`${API}/api/chat/sessions/${session._id}/messages`, { content: msg }, { headers });
    const assistant = post.data.assistantMessage;
    console.log('Assistant reply:\n', assistant?.content || post.data);
  } catch (err) {
    console.error('E2E failed:', err?.message || err);
    if (err?.response) {
      try {
        console.error('Response data:', JSON.stringify(err.response.data));
      } catch (e) {
        console.error('Response data (raw):', err.response.data);
      }
    }
    process.exitCode = 1;
  }
}

run();
