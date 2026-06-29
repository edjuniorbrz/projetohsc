const fs = require('fs');

// 1. Exclude frontend, dist, node_modules in tsconfig.json
console.log('Fixing tsconfig.json to exclude frontend and dist...');
const configPath = 'tsconfig.json';
let config = fs.readFileSync(configPath, 'utf8');

// Parse as JSON, add exclude, write back
try {
  let parsed = JSON.parse(config);
  parsed.exclude = ["node_modules", "dist", "frontend"];
  fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2));
  console.log('tsconfig.json exclude added successfully!');
} catch (e) {
  // Fallback string replacement if JSON parsing fails
  config = config.replace(
    '"compilerOptions": {',
    '"exclude": ["node_modules", "dist", "frontend"],\n  "compilerOptions": {'
  );
  fs.writeFileSync(configPath, config);
  console.log('tsconfig.json exclude added via string replacement!');
}

// 2. Fix auth.middleware.ts
console.log('Fixing src/middlewares/auth.middleware.ts...');
const mwPath = 'src/middlewares/auth.middleware.ts';
let mw = fs.readFileSync(mwPath, 'utf8');

mw = mw.replace(
  "process.env.JWT_SECRET || 'super_secret_jwt_key_123'",
  "(process.env.JWT_SECRET || 'super_secret_jwt_key_123') as string"
);

fs.writeFileSync(mwPath, mw);
console.log('src/middlewares/auth.middleware.ts fixed successfully!');
