const fs = require('fs');
let code = fs.readFileSync('tsconfig.json', 'utf8');
code = code.replace('"verbatimModuleSyntax": true,', '"verbatimModuleSyntax": false,');
fs.writeFileSync('tsconfig.json', code);
