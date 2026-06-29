const fs = require('fs');

console.log('Fixing src/middlewares/auth.middleware.ts final...');
const mwPath = 'src/middlewares/auth.middleware.ts';
let mw = fs.readFileSync(mwPath, 'utf8');

// Replace any jwt.verify call with the String casting to satisfy typescript
mw = mw.replace(
  /jwt\.verify\(token, .*\);/,
  "jwt.verify(token, String(process.env.JWT_SECRET || 'super_secret_jwt_key_123'));"
);

fs.writeFileSync(mwPath, mw);
console.log('src/middlewares/auth.middleware.ts final fix completed!');
