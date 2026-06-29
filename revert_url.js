const fs = require('fs');
let code = fs.readFileSync('frontend/src/services/api.ts', 'utf8');
code = code.replace(/baseURL:.*/, "baseURL: 'http://localhost:3333'");
fs.writeFileSync('frontend/src/services/api.ts', code);
