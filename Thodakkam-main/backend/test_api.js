const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 110, role: 'startup', email: 'test@startup.local' }, 'ai-internship-platform-jwt-secret-key-2026', { expiresIn: '1h' });
const body = {
  content: 'good',
  tags: ['Project'],
  media_base64: null,
  media_type: null
};

fetch('http://localhost:5000/api/community/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(body)
})
.then(async (res) => {
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
})
.catch(console.error);
