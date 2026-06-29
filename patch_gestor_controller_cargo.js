const fs = require('fs');

console.log('Patching src/controllers/gestor.controller.ts to support cargo column...');
const controllerPath = 'src/controllers/gestor.controller.ts';
let content = fs.readFileSync(controllerPath, 'utf8');

// 1. Update createGestor
content = content.replace(
  "const { name, email, isActive } = req.body;",
  "const { name, email, isActive, cargo } = req.body;"
);
content = content.replace(
  `      data: {
        name,
        email,
        isActive: isActive !== undefined ? isActive : true
      }`,
  `      data: {
        name,
        email,
        cargo: cargo || null,
        isActive: isActive !== undefined ? isActive : true
      }`
);

// 2. Update updateGestor
content = content.replace(
  "const { name, email, isActive } = req.body;",
  "const { name, email, isActive, cargo } = req.body;"
);
content = content.replace(
  `      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }`,
  `      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
        cargo: cargo !== undefined ? (cargo || null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }`
);

fs.writeFileSync(controllerPath, content);
console.log('src/controllers/gestor.controller.ts patched successfully with cargo!');
