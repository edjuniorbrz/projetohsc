const fs = require('fs');

// Patch auth.controller.ts
let authCtrl = fs.readFileSync('src/controllers/auth.controller.ts', 'utf8');
if (!authCtrl.includes('export const getUsers')) {
  authCtrl += `
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};
`;
  fs.writeFileSync('src/controllers/auth.controller.ts', authCtrl);
}

// Patch auth.routes.ts
let authRoutes = fs.readFileSync('src/routes/auth.routes.ts', 'utf8');
if (!authRoutes.includes('getUsers')) {
  authRoutes = authRoutes.replace(
    'import { register, login, getAnalysts } from \'../controllers/auth.controller\';',
    'import { register, login, getAnalysts, getUsers } from \'../controllers/auth.controller\';'
  );
  authRoutes = authRoutes.replace(
    'router.get(\'/analysts\', getAnalysts);',
    'router.get(\'/analysts\', getAnalysts);\nrouter.get(\'/users\', getUsers);'
  );
  fs.writeFileSync('src/routes/auth.routes.ts', authRoutes);
}
