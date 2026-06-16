const fs = require('fs');
let c = fs.readFileSync('app.json', 'utf8');
const data = JSON.parse(c);

data.expo.updates = {
  url: "https://u.expo.dev/41c97160-db4c-4fe3-a46b-6bd2921acce1"
};

data.expo.runtimeVersion = {
  policy: "appVersion"
};

fs.writeFileSync('app.json', JSON.stringify(data, null, 2));
