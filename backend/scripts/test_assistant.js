import 'dotenv/config';
import { generateAssistantResponse } from '../utils/cohere.js';

(async () => {
  const history = [
    { role: 'user', content: 'Hi, can you help me plan my day?' },
  ];
  try {
    const res = await generateAssistantResponse(history, 'Test User', 'AI Assistant', { tasks: [], goals: [], habits: [] });
    console.log('Assistant reply:\n', res);
  } catch (err) {
    console.error('Test failed:', err?.message || err);
  }
})();
