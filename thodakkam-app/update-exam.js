const fs = require('fs');

let content = fs.readFileSync('src/app/student-exam.tsx', 'utf8');

const apiCall = `    if (assessmentId) {
      await AsyncStorage.setItem(\`assessment_completed_\${assessmentId}\`, 'true');
      
      const userStr = await AsyncStorage.getItem('userData');
      if (userStr) {
         const user = JSON.parse(userStr);
         const passThreshold = assessment.mcqConfig?.passPercentage || 60;
         
         const payload = {
           studentId: user.id,
           jobId: assessment.jobId,
           score: score,
           totalQuestions: totalScore,
           percent: percent,
           status: percent >= passThreshold ? 'PASSED' : 'FAILED'
         };

         try {
           const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-1.onrender.com' : 'https://thodakkam-1.onrender.com';
           await fetch(\`\${baseUrl}/api/assessments/\${assessmentId}/submit-mcq\`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload)
           });
         } catch (err) {
           console.error('Error submitting assessment:', err);
         }
      }
    }`;

content = content.replace(
  /if \(assessmentId\) \{\s+await AsyncStorage\.setItem\(`assessment_completed_\$\{assessmentId\}`,\s+'true'\);\s+const userStr = await AsyncStorage\.getItem\('userData'\);\s+if \(userStr && assessment\.jobId\) \{[\s\S]+?\}\s+\}/,
  apiCall
);

fs.writeFileSync('src/app/student-exam.tsx', content, 'utf8');
console.log('Successfully updated student-exam.tsx!');
