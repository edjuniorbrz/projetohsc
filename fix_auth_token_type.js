const fs = require('fs');

console.log('Fixing src/middlewares/auth.middleware.ts token type checking...');
const mwPath = 'src/middlewares/auth.middleware.ts';
let mw = fs.readFileSync(mwPath, 'utf8');

const newAuthMiddleware = `export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
  const token = parts[1];
  if (!token) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
  try {
    const decoded = jwt.verify(token, String(process.env.JWT_SECRET || 'super_secret_jwt_key_123'));
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
};`;

// Replace the old authMiddleware block
const startIdx = mw.indexOf('export const authMiddleware');
const endIdx = mw.indexOf('export const requireRole');

if (startIdx !== -1 && endIdx !== -1) {
  mw = mw.substring(0, startIdx) + newAuthMiddleware + '\n\n' + mw.substring(endIdx);
  fs.writeFileSync(mwPath, mw);
  console.log('authMiddleware replaced successfully!');
} else {
  console.error('Could not locate authMiddleware or requireRole!');
}
