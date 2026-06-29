const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Name
code = code.replace(
  'name="name"\n                  type="text"',
  'name="name"\n                  type="text"\n                  autoComplete="name"'
);

// Email
code = code.replace(
  'name="email"\n                type="email"',
  'name="email"\n                type="email"\n                autoComplete="email"'
);

// Password
code = code.replace(
  'name="password"\n                type="password"',
  'name="password"\n                type="password"\n                autoComplete={isRegistering ? "new-password" : "current-password"}'
);

fs.writeFileSync('frontend/src/App.tsx', code);
