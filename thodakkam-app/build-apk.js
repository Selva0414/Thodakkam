process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { execSync } = require('child_process');
execSync('npx eas build -p android --profile apk --non-interactive', { stdio: 'inherit' });
