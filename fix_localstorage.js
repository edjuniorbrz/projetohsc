const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

const oldCode = `    if (token && storedUser) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(storedUser));
    }`;

const newCode = `    if (token && storedUser) {
      try {
        if (storedUser === 'undefined') throw new Error('Invalid user');
        const parsed = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('frontend/src/App.tsx', code);
