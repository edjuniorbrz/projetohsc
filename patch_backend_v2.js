const fs = require('fs');

// 1. Patch src/controllers/auth.controller.ts
console.log('Patching src/controllers/auth.controller.ts...');
let authCtrl = fs.readFileSync('src/controllers/auth.controller.ts', 'utf8');

// Replace register input and creation to handle gestorId
authCtrl = authCtrl.replace(
  "const { name, email, password, role } = req.body;",
  "const { name, email, password, role, gestorId } = req.body;"
);
authCtrl = authCtrl.replace(
  "data: { name, email, password: hashedPassword, role }",
  "data: { name, email, password: hashedPassword, role, gestorId: gestorId || null }"
);

// Replace getUsers to include gestor relation
authCtrl = authCtrl.replace(
  "select: { id: true, name: true, email: true, role: true, isActive: true }",
  "select: { id: true, name: true, email: true, role: true, isActive: true, gestorId: true, gestor: { select: { id: true, name: true, email: true } } }"
);

// Replace updateUser input and data handling
authCtrl = authCtrl.replace(
  "const { name, email, password, role, isActive } = req.body;",
  "const { name, email, password, role, isActive, gestorId } = req.body;"
);
authCtrl = authCtrl.replace(
  "if (isActive !== undefined) data.isActive = isActive;",
  "if (isActive !== undefined) data.isActive = isActive;\n    if (gestorId !== undefined) data.gestorId = gestorId || null;"
);
authCtrl = authCtrl.replace(
  "select: { id: true, name: true, email: true, role: true, isActive: true }",
  "select: { id: true, name: true, email: true, role: true, isActive: true, gestorId: true, gestor: { select: { id: true, name: true, email: true } } }"
);

fs.writeFileSync('src/controllers/auth.controller.ts', authCtrl);
console.log('auth.controller.ts patched!');

// 2. Patch src/controllers/project.controller.ts
console.log('Patching src/controllers/project.controller.ts...');
let projCtrl = fs.readFileSync('src/controllers/project.controller.ts', 'utf8');

projCtrl = projCtrl.replace(
  "const { title, description } = req.body;",
  "const { title, description, gestorId } = req.body;"
);
projCtrl = projCtrl.replace(
  `    data: {
      title,
      description,
      ownerId
    }`,
  `    data: {
      title,
      description,
      ownerId,
      gestorId: gestorId || null
    }`
);
projCtrl = projCtrl.replace(
  `      owner: {
        select: { id: true, name: true, email: true, role: true }
      },`,
  `      owner: {
        select: { id: true, name: true, email: true, role: true }
      },
      gestor: {
        select: { id: true, name: true, email: true, isActive: true }
      },`
);

fs.writeFileSync('src/controllers/project.controller.ts', projCtrl);
console.log('project.controller.ts patched!');

// 3. Patch src/server.ts to use gestorRoutes
console.log('Patching src/server.ts...');
let server = fs.readFileSync('src/server.ts', 'utf8');

if (!server.includes('gestor.routes')) {
  server = server.replace(
    "import authRoutes from './routes/auth.routes';",
    "import authRoutes from './routes/auth.routes';\nimport gestorRoutes from './routes/gestor.routes';"
  );
  server = server.replace(
    "app.use('/auth', authRoutes);",
    "app.use('/auth', authRoutes);\napp.use('/gestores', gestorRoutes);"
  );
  fs.writeFileSync('src/server.ts', server);
}
console.log('server.ts patched!');
