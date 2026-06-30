import { Router } from 'express';
import { register, login, getAnalysts, getUsers, updateUser, deleteUser, resetPassword, getAuditLogs, acceptLGPD, getPendingAcknowledgements, acknowledgeAssociations } from '../controllers/auth.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
router.post('/register', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), register);
router.post('/login', login);
router.get('/analysts', authMiddleware, getAnalysts);
router.get('/users', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), getUsers);
router.patch('/users/:id', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), updateUser);
router.delete('/users/:id', authMiddleware, requireRole(['SUPER_ADMIN', 'MANAGER']), deleteUser);

// New security/compliance routes
router.post('/reset-password', authMiddleware, resetPassword);
router.post('/accept-lgpd', authMiddleware, acceptLGPD);
router.get('/pending-acknowledgements', authMiddleware, getPendingAcknowledgements);
router.post('/acknowledge', authMiddleware, acknowledgeAssociations);
router.get('/audit-logs', authMiddleware, requireRole(['SUPER_ADMIN']), getAuditLogs);

export default router;
