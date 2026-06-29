const fs = require('fs');

console.log('Patching src/server.ts to explicitly bind to 0.0.0.0...');
const serverPath = 'src/server.ts';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Replace app.listen(PORT, () => { with app.listen(Number(PORT), '0.0.0.0', () => {
serverContent = serverContent.replace(
  'app.listen(PORT, () => {',
  "app.listen(Number(PORT), '0.0.0.0', () => {"
);

fs.writeFileSync(serverPath, serverContent);
console.log('src/server.ts patched successfully!');
