process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { execSync } = require('child_process');
console.log("Pushing to production branch...");
execSync('npx eas update --branch production --message "Fix Android Unmount Crash" --environment production --non-interactive', { stdio: 'inherit' });
console.log("Pushing to apk branch...");
execSync('npx eas update --branch apk --message "Fix Android Unmount Crash" --environment production --non-interactive', { stdio: 'inherit' });
