const fs = require('fs');

let code = fs.readFileSync('src/app/startup-reschedule.tsx', 'utf8');

// 1. Add Auto-calc useEffect
const autoCalcCode = `  // Auto-calculate logic
  useEffect(() => {
    if (newStartDate && !newEndDate) {
      setNewEndDate(newStartDate);
    }
    
    if (newStartTime) {
      try {
        const dummyDate = newStartDate || new Date().toISOString().split('T')[0];
        const timePart = newStartTime.length === 5 ? newStartTime + ':00' : newStartTime;
        
        const start = new Date(\`\${dummyDate}T\${timePart}\`);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + 30 * 60000); // 30 mins default
          
          if (newStartDate) {
            const y = end.getFullYear();
            const m = String(end.getMonth() + 1).padStart(2, '0');
            const d = String(end.getDate()).padStart(2, '0');
            setNewEndDate(\`\${y}-\${m}-\${d}\`);
          }
          
          const hh = String(end.getHours()).padStart(2, '0');
          const mm = String(end.getMinutes()).padStart(2, '0');
          setNewEndTime(\`\${hh}:\${mm}\`);
        }
      } catch (e) {}
    }
  }, [newStartDate, newStartTime]);`;

if (!code.includes('Auto-calculate logic')) {
  code = code.replace(
    /const fetchRequests = async \(\) => \{/,
    `${autoCalcCode}\n\n  const fetchRequests = async () => {`
  );
}

// 2. Update Start Date Input
code = code.replace(
  /<TextInput style=\{\[styles\.input, \{ color: colors\.text \}\]\} value=\{newStartDate\} onChangeText=\{setNewStartDate\} placeholder="YYYY-MM-DD" placeholderTextColor=\{colors\.textSecondary\} \/>/,
  `{Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: newStartDate,
                    onChange: (e) => setNewStartDate(e.target.value),
                    style: { flex: 1, backgroundColor: 'transparent', border: 'none', color: colors.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit' }
                  })
                ) : (
                  <TextInput style={[styles.input, { color: colors.text }]} value={newStartDate} onChangeText={setNewStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
                )}`
);

// 3. Update End Date Input
code = code.replace(
  /<TextInput style=\{\[styles\.input, \{ color: colors\.text \}\]\} value=\{newEndDate\} onChangeText=\{setNewEndDate\} placeholder="YYYY-MM-DD" placeholderTextColor=\{colors\.textSecondary\} \/>/,
  `{Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: newEndDate,
                    onChange: (e) => setNewEndDate(e.target.value),
                    style: { flex: 1, backgroundColor: 'transparent', border: 'none', color: colors.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit' }
                  })
                ) : (
                  <TextInput style={[styles.input, { color: colors.text }]} value={newEndDate} onChangeText={setNewEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
                )}`
);

// 4. Update Start Time Input
code = code.replace(
  /<TextInput style=\{\[styles\.input, \{ color: colors\.text \}\]\} value=\{newStartTime\} onChangeText=\{setNewStartTime\} placeholder="HH:MM" placeholderTextColor=\{colors\.textSecondary\} \/>/,
  `{Platform.OS === 'web' ? (
                    React.createElement('input', {
                      type: 'time',
                      value: newStartTime,
                      onChange: (e) => setNewStartTime(e.target.value),
                      style: { flex: 1, backgroundColor: 'transparent', border: 'none', color: colors.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', colorScheme: isDark ? 'dark' : 'light' }
                    })
                  ) : (
                    <TextInput style={[styles.input, { color: colors.text }]} value={newStartTime} onChangeText={setNewStartTime} placeholder="HH:MM" placeholderTextColor={colors.textSecondary} />
                  )}`
);

// 5. Update End Time Input
code = code.replace(
  /<TextInput style=\{\[styles\.input, \{ color: colors\.text \}\]\} value=\{newEndTime\} onChangeText=\{setNewEndTime\} placeholder="HH:MM" placeholderTextColor=\{colors\.textSecondary\} \/>/,
  `{Platform.OS === 'web' ? (
                    React.createElement('input', {
                      type: 'time',
                      value: newEndTime,
                      onChange: (e) => setNewEndTime(e.target.value),
                      style: { flex: 1, backgroundColor: 'transparent', border: 'none', color: colors.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', colorScheme: isDark ? 'dark' : 'light' }
                    })
                  ) : (
                    <TextInput style={[styles.input, { color: colors.text }]} value={newEndTime} onChangeText={setNewEndTime} placeholder="HH:MM" placeholderTextColor={colors.textSecondary} />
                  )}`
);

fs.writeFileSync('src/app/startup-reschedule.tsx', code);
console.log('Fixed reschedule calendar and time logic');
