process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { execSync } = require('child_process');
execSync('npx eas update --branch preview --message "Fix Android Unmount Crash" --non-interactive', { stdio: 'inherit' });
