const fs = require('fs');

let code = fs.readFileSync('src/app/startup-create-assessment.tsx', 'utf8');

const newEffects = `  // Auto-calculate MCQ End Time
  React.useEffect(() => {
    // 1. Sync Date
    if (mcqStartDate && !mcqEndDate) {
      setMcqEndDate(mcqStartDate);
    }
    
    // 2. Sync Time (independent of date)
    if (mcqStartTime && mcqDuration) {
      try {
        const dummyDate = mcqStartDate || new Date().toISOString().split('T')[0];
        // Ensure time format is HH:mm. HTML time input might sometimes add seconds (HH:mm:ss).
        const timePart = mcqStartTime.length === 5 ? mcqStartTime + ':00' : mcqStartTime;
        
        const start = new Date(\`\${dummyDate}T\${timePart}\`);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + Number(mcqDuration) * 60000);
          
          if (mcqStartDate) {
            const y = end.getFullYear();
            const m = String(end.getMonth() + 1).padStart(2, '0');
            const d = String(end.getDate()).padStart(2, '0');
            setMcqEndDate(\`\${y}-\${m}-\${d}\`);
          }
          
          const hh = String(end.getHours()).padStart(2, '0');
          const mm = String(end.getMinutes()).padStart(2, '0');
          setMcqEndTime(\`\${hh}:\${mm}\`);
        }
      } catch (e) {}
    }
  }, [mcqStartDate, mcqStartTime, mcqDuration]);

  // Auto-calculate Interview End Time
  React.useEffect(() => {
    // 1. Sync Date
    if (interviewStartDate && !interviewEndDate) {
      setInterviewEndDate(interviewStartDate);
    }
    
    // 2. Sync Time
    if (interviewStartTime && interviewDuration) {
      try {
        const dummyDate = interviewStartDate || new Date().toISOString().split('T')[0];
        const timePart = interviewStartTime.length === 5 ? interviewStartTime + ':00' : interviewStartTime;
        
        const start = new Date(\`\${dummyDate}T\${timePart}\`);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + Number(interviewDuration) * 60000);
          
          if (interviewStartDate) {
            const y = end.getFullYear();
            const m = String(end.getMonth() + 1).padStart(2, '0');
            const d = String(end.getDate()).padStart(2, '0');
            setInterviewEndDate(\`\${y}-\${m}-\${d}\`);
          }
          
          const hh = String(end.getHours()).padStart(2, '0');
          const mm = String(end.getMinutes()).padStart(2, '0');
          setInterviewEndTime(\`\${hh}:\${mm}\`);
        }
      } catch (e) {}
    }
  }, [interviewStartDate, interviewStartTime, interviewDuration]);`;

const oldEffectsRegex = /\/\/ Auto-calculate MCQ End Time[\s\S]*?\]\);\s*\/\/ Auto-calculate Interview End Time[\s\S]*?\]\);/;

code = code.replace(oldEffectsRegex, newEffects);

fs.writeFileSync('src/app/startup-create-assessment.tsx', code);
console.log('Fixed time auto-calculation independency');
