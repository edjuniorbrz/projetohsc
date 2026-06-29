const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');
code = code.replace(/currentUser\?\.name\.substring\(0, 2\)\.toUpperCase\(\)/g, "(currentUser?.name || 'US').substring(0, 2).toUpperCase()");
fs.writeFileSync('frontend/src/App.tsx', code);
