const fs = require('fs');

let content = fs.readFileSync('src/app/startup-create-assessment.tsx', 'utf8');

// 1. Add state variable
content = content.replace(
  /const \[testCases, setTestCases\] = useState\(\[\{ id: 1, input: '', output: '' \}\]\);/,
  `const [testCases, setTestCases] = useState([{ id: 1, input: '', output: '' }]);
  const [isGeneratingStarterCode, setIsGeneratingStarterCode] = useState(false);`
);

// 2. Add handleCodingLangChange function
const funcCode = `  const handleCodingLangChange = async (lang: string) => {
    setCodingLang(lang);
    setOpenCodingLang(false);
    setIsGeneratingStarterCode(true);

    try {
      const formData = new FormData();
      const prompt = \`System Instructions: You are a coding assistant. Provide ONLY the raw starter code template for \${lang}. Do not use markdown backticks, do not explain, just return the code. Ensure the function signature is generic.\n\nUser Message: Give me a starter code template for \${lang}\`;
      
      formData.append('message', prompt);

      const response = await fetch('https://ai-agent-v01.onrender.com/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      if (data.reply) {
        setStarterCode(data.reply.trim());
      }
    } catch (err) {
      console.error('Error generating starter code:', err);
    } finally {
      setIsGeneratingStarterCode(false);
    }
  };

  // Auto-calculate Coding End Time`;

content = content.replace(/\/\/ Auto-calculate Coding End Time/, funcCode);

// 3. Update dropdown onPress
content = content.replace(
  /onPress=\{\(\) => \{ setCodingLang\(lang\); setOpenCodingLang\(false\); \}\}/g,
  `onPress={() => handleCodingLangChange(lang)}`
);

// 4. Add loading indicator to Starter Code Template
content = content.replace(
  /<Text style=\{\[styles\.label, \{ color: colors\.textSecondary \}\]\}>Starter Code Template<\/Text>/,
  `<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>Starter Code Template</Text>
                      {isGeneratingStarterCode && <ActivityIndicator size="small" color={colors.primary} />}
                    </View>`
);

fs.writeFileSync('src/app/startup-create-assessment.tsx', content, 'utf8');
console.log('Successfully updated AI starter code logic!');
