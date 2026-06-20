const fs = require('fs');

let content = fs.readFileSync('src/app/startup-create-assessment.tsx', 'utf8');

// 1. Add missing state variables for Coding
content = content.replace(
  /const \[codingDuration, setCodingDuration\] = useState\('60'\);\n\s*const \[codingPass, setCodingPass\] = useState\('60'\);/,
  `const [codingDuration, setCodingDuration] = useState('60');
  const [codingPass, setCodingPass] = useState('60');
  const [codingStartDate, setCodingStartDate] = useState('');
  const [codingStartTime, setCodingStartTime] = useState('');
  const [codingEndDate, setCodingEndDate] = useState('');
  const [codingEndTime, setCodingEndTime] = useState('');`
);

// 2. Add useEffect to auto-calculate coding end time
const codingEffect = `  // Auto-calculate Coding End Time
  React.useEffect(() => {
    if (codingStartDate && !codingEndDate) {
      setCodingEndDate(codingStartDate);
    }
    if (codingStartTime && codingDuration) {
      const dummyDate = codingStartDate || new Date().toISOString().split('T')[0];
      const timePart = codingStartTime.length === 5 ? codingStartTime + ':00' : codingStartTime;
      const start = new Date(\`\${dummyDate}T\${timePart}\`);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + Number(codingDuration) * 60000);
        if (codingStartDate) {
          const y = end.getFullYear();
          const m = String(end.getMonth() + 1).padStart(2, '0');
          const d = String(end.getDate()).padStart(2, '0');
          setCodingEndDate(\`\${y}-\${m}-\${d}\`);
        }
        const hh = String(end.getHours()).padStart(2, '0');
        const mm = String(end.getMinutes()).padStart(2, '0');
        setCodingEndTime(\`\${hh}:\${mm}\`);
      }
    }
  }, [codingStartDate, codingStartTime, codingDuration]);
`;
content = content.replace(/\/\/ Auto-calculate Interview End Time/, codingEffect + '\n  // Auto-calculate Interview End Time');

// 3. Populate existing assessment fetch data
content = content.replace(
  /setCodingLang\(a\.codingConfig\.programmingLanguage \|\| 'JavaScript'\);/,
  `setCodingLang(a.codingConfig.programmingLanguage || 'JavaScript');
          setCodingStartDate(a.codingConfig.startDate || '');
          setCodingStartTime(a.codingConfig.startTime || '');
          setCodingEndDate(a.codingConfig.endDate || '');
          setCodingEndTime(a.codingConfig.endTime || '');`
);

// 4. Update the payload sent to backend
content = content.replace(
  /codingConfig: \{\s*durationMin: Number\(codingDuration\),\s*passPercentage: Number\(codingPass\),\s*programmingLanguage: codingLang,\s*starterCode: starterCode,\s*testCases: testCases\s*\}/,
  `codingConfig: {
        durationMin: Number(codingDuration),
        passPercentage: Number(codingPass),
        startDate: codingStartDate,
        startTime: codingStartTime,
        endDate: codingEndDate,
        endTime: codingEndTime,
        programmingLanguage: codingLang,
        starterCode: starterCode,
        testCases: testCases
      }`
);

fs.writeFileSync('src/app/startup-create-assessment.tsx', content, 'utf8');
console.log('Update script 1 completed successfully');
