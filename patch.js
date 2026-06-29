const fs = require('fs');
let code = fs.readFileSync('src/server.ts', 'utf8');
code = code.replace(
  'app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {',
  `const frontendDistPath = require('path').join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));
app.get('*', (req, res) => res.sendFile(require('path').join(frontendDistPath, 'index.html')));
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {`
);
fs.writeFileSync('src/server.ts', code);
