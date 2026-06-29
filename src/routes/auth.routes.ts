import { Router } from 'express';
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
