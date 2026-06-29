const fs = require('fs');

console.log('Patching frontend/src/services/api.ts...');
const apiServicePath = 'frontend/src/services/api.ts';
let apiContent = fs.readFileSync(apiServicePath, 'utf8');

// Replace baseURL: 'http://localhost:3333' with dynamic window.location.hostname
apiContent = apiContent.replace(
  "baseURL: 'http://localhost:3333'",
  "baseURL: `http://${window.location.hostname}:3333`"
);

fs.writeFileSync(apiServicePath, apiContent);
console.log('frontend/src/services/api.ts patched successfully!');
