const fs = require('fs');

async function testUpload() {
  const fileBlob = new Blob([fs.readFileSync('./test_resume.txt')], { type: 'application/pdf' });
  
  const form = new FormData();
  form.append('message', 'Analyze this resume');
  form.append('file', fileBlob, 'test_resume.pdf');

  try {
    const res = await fetch('https://ai-agent-v01.onrender.com/chat', {
      method: 'POST',
      body: form
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
  } catch (e) {
    console.error(e);
  }
}

testUpload();
