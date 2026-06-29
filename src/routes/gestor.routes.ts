import { Router } from 'express';
import { getGestores, createGestor, updateGestor, deleteGestor } from '../controllers/gestor.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', authMiddleware, getGestores);
router.post('/', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), createGestor);
router.patch('/:id', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), updateGestor);
router.delete('/:id', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), deleteGestor);

export default router;
