const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/startup-register.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix pickImage to use file URI instead of base64
content = content.replace(
  /const base64Image = `data:image\/jpeg;base64,\$\{result\.assets\[0\]\.base64\}`;[\s\S]*?setImage\(base64Image\);/g,
  'setImage(result.assets[0].uri);'
);

// 2. Rewrite handleSendOtp to use FormData and call /api/startup/auth/register
const sendOtpRegex = /const handleSendOtp = async \(\) => \{[\s\S]*?const handleVerifyAndRegister/g;

const newSendOtp = `const handleSendOtp = async () => {
    if (!founderName || !companyName || !registrationId || !email || !password || !category) {
      setErrorMessage('Please fill out all fields.');
      return;
    }
    if (!agreed) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }
    if (!companyLogo) {
      setErrorMessage('Company Logo is required.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('founderName', founderName);
      formData.append('companyName', companyName);
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('category', category);
      formData.append('certificateId', registrationId);
      
      // Required by backend
      formData.append('regType', 'MSME');
      formData.append('linkedinUrl', 'https://linkedin.com');
      formData.append('websiteUrl', 'https://example.com');
      
      formData.append('companyLogo', { uri: companyLogo, name: 'logo.jpg', type: 'image/jpeg' } as any);
      // Duplicate companyLogo for other required files
      formData.append('certificateFile', { uri: companyLogo, name: 'cert.jpg', type: 'image/jpeg' } as any);
      formData.append('physicalPhotos', { uri: companyLogo, name: 'photo1.jpg', type: 'image/jpeg' } as any);
      formData.append('physicalPhotos', { uri: companyLogo, name: 'photo2.jpg', type: 'image/jpeg' } as any);

      const response = await fetch(\`\${BASE_URL}/api/startup/auth/register\`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok || data.success) {
        setShowOtpScreen(true);
        alert(\`\${data.message}\${data.otp ? \`\\n\\nFor testing: Your OTP is \${data.otp}\` : ''}\`);
      } else {
        setErrorMessage(data.message || 'Failed to register. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Network error. Make sure backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister`;

content = content.replace(sendOtpRegex, newSendOtp);

// 3. Rewrite handleVerifyAndRegister to call /api/startup/auth/verify-otp
const verifyOtpRegex = /const handleVerifyAndRegister = async \(\) => \{[\s\S]*?const handleOtpChange/g;

const newVerifyOtp = `const handleVerifyAndRegister = async () => {
    const fullOtp = otpVal.join('');
    if (fullOtp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(\`\${BASE_URL}/api/startup/auth/verify-otp\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullOtp
        })
      });

      const data = await response.json();

      if (response.ok || data.success) {
        setShowSuccessModal(true);
      } else {
        setErrorMessage(data.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error. Make sure backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange`;

content = content.replace(verifyOtpRegex, newVerifyOtp);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed startup-register.tsx to match backend flow.');
