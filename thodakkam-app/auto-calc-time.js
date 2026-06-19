const fs = require('fs');

let code = fs.readFileSync('src/app/startup-create-assessment.tsx', 'utf8');

const effects = `
  // Auto-calculate MCQ End Time
  React.useEffect(() => {
    if (mcqStartDate && mcqStartTime && mcqDuration) {
      try {
        const start = new Date(\`\${mcqStartDate}T\${mcqStartTime}\`);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + Number(mcqDuration) * 60000);
          const y = end.getFullYear();
          const m = String(end.getMonth() + 1).padStart(2, '0');
          const d = String(end.getDate()).padStart(2, '0');
          const hh = String(end.getHours()).padStart(2, '0');
          const mm = String(end.getMinutes()).padStart(2, '0');
          
          setMcqEndDate(\`\${y}-\${m}-\${d}\`);
          setMcqEndTime(\`\${hh}:\${mm}\`);
        }
      } catch (e) {}
    }
  }, [mcqStartDate, mcqStartTime, mcqDuration]);

  // Auto-calculate Interview End Time
  React.useEffect(() => {
    if (interviewStartDate && interviewStartTime && interviewDuration) {
      try {
        const start = new Date(\`\${interviewStartDate}T\${interviewStartTime}\`);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + Number(interviewDuration) * 60000);
          const y = end.getFullYear();
          const m = String(end.getMonth() + 1).padStart(2, '0');
          const d = String(end.getDate()).padStart(2, '0');
          const hh = String(end.getHours()).padStart(2, '0');
          const mm = String(end.getMinutes()).padStart(2, '0');
          
          setInterviewEndDate(\`\${y}-\${m}-\${d}\`);
          setInterviewEndTime(\`\${hh}:\${mm}\`);
        }
      } catch (e) {}
    }
  }, [interviewStartDate, interviewStartTime, interviewDuration]);
`;

code = code.replace(
  /const \[interviewNotes, setInterviewNotes\] = useState\(''\);/,
  `const [interviewNotes, setInterviewNotes] = useState('');\n${effects}`
);

fs.writeFileSync('src/app/startup-create-assessment.tsx', code);
console.log('Fixed time auto-calculation');
