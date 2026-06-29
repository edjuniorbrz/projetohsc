const fs = require('fs');

console.log('Patching tsconfig.json...');
const configPath = 'tsconfig.json';
let config = fs.readFileSync(configPath, 'utf8');

// Replace "exactOptionalPropertyTypes": true with false
config = config.replace(
  '"exactOptionalPropertyTypes": true,',
  '"exactOptionalPropertyTypes": false,'
);

fs.writeFileSync(configPath, config);
console.log('tsconfig.json patched successfully!');
