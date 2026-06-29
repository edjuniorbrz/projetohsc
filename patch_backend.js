const fs = require('fs');
const path = require('path');

// 1. Patch src/controllers/auth.controller.ts
console.log('Patching src/controllers/auth.controller.ts...');
let authCtrl = fs.readFileSync('src/controllers/auth.controller.ts', 'utf8');

// Find where getUsers starts, and remove everything from there to the end
const getUsersStart = authCtrl.indexOf('export const getUsers');
if (getUsersStart !== -1) {
  authCtrl = authCtrl.substring(0, getUsersStart);
}

authCtrl += `export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, password, role, isActive } = req.body;
  try {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar usuário' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (req.user && req.user.id === id) {
      res.status(400).json({ error: 'Você não pode excluir a si mesmo' });
      return;
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir usuário (talvez ele possua projetos ou tarefas vinculadas)' });
  }
};
`;

fs.writeFileSync('src/controllers/auth.controller.ts', authCtrl);
console.log('src/controllers/auth.controller.ts patched successfully!');

// 2. Patch src/routes/auth.routes.ts
console.log('Patching src/routes/auth.routes.ts...');
const newAuthRoutes = `import { Router } from 'express';
import { register, login, getAnalysts, getUsers, updateUser, deleteUser } from '../controllers/auth.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
router.post('/register', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), register);
router.post('/login', login);
router.get('/analysts', authMiddleware, getAnalysts);
router.get('/users', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), getUsers);
router.patch('/users/:id', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), updateUser);
router.delete('/users/:id', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), deleteUser);

export default router;
`;

fs.writeFileSync('src/routes/auth.routes.ts', newAuthRoutes);
console.log('src/routes/auth.routes.ts patched successfully!');
