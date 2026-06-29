const fs = require('fs');
let code = fs.readFileSync('src/server.ts', 'utf8');
code = code.replace("import path from 'path';", "");
code = code.replace(/path\.join/g, "require('path').join");
fs.writeFileSync('src/server.ts', code);
