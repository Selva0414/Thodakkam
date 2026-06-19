const fs = require('fs');

let code = fs.readFileSync('src/app/student-apply.tsx', 'utf8');

const newEffect = `  React.useEffect(() => {
    const initData = async () => {
      try {
        const fallbackId = await AsyncStorage.getItem('studentUserId');
        const finalUserId = userStore.id || fallbackId;
        const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend-47rn.onrender.com' : 'https://thodakkam-backend-47rn.onrender.com';
        
        let fetchedEmail = userStore.email || form.email;

        // Fetch User Data to prefill form
        if (finalUserId) {
           const userRes = await fetch(\`\${baseUrl}/api/user/\${finalUserId}\`);
           const userJson = await userRes.json();
           if (userJson.success && userJson.user) {
             const u = userJson.user;
             let resumeName = '';
             if (u.resumeFile) {
                resumeName = u.resumeFile.split(/[/\\\\]/).pop() || 'resume.pdf';
             }
             setForm(prev => ({
               ...prev,
               fullName: u.fullName || prev.fullName,
               email: u.email || prev.email,
               phone: u.phone || prev.phone,
               resumeName: resumeName || prev.resumeName,
               resumeUri: u.resumeFile || prev.resumeUri
             }));
             if (u.email) fetchedEmail = u.email;
           }
        }

        // Check Application Status
        if (fetchedEmail) {
           const jId = jobId || "mock-job-id";
           const response = await fetch(\`\${baseUrl}/api/apply/check?jobId=\${jId}&email=\${fetchedEmail}\`);
           if (response.ok) {
             const resJson = await response.json();
             if (resJson.success && resJson.applied) {
               setAlreadyApplied(true);
             }
           }
        }
      } catch (err) {
        console.warn("Init data failed:", err);
      } finally {
        setIsChecking(false);
      }
    };
    initData();
  }, [jobId]);`;

// Find the old useEffect
const oldEffectRegex = /React\.useEffect\(\(\) => \{\s*const checkApplication = async \(\) => \{[\s\S]*?checkApplication\(\);\s*\}, \[jobId\]\);/;

code = code.replace(oldEffectRegex, newEffect);

fs.writeFileSync('src/app/student-apply.tsx', code);
console.log('Fixed auto-fill for student apply');
