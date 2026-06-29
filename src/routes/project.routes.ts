import { Router } from 'express';
import { createProject, listProjects, getDashboardStats, updateProject, deleteProject } from '../controllers/project.controller';
import { createSubChapter, deleteSubChapter } from '../controllers/subchapter.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Rota do Dashboard (deve vir antes das rotas parametrizadas se houver)
router.get('/dashboard', getDashboardStats);

// Projetos normais
router.get('/', listProjects);
router.post('/', requireRole(['SUPER_ADMIN', 'MANAGER']), createProject);
router.patch('/:id', requireRole(['SUPER_ADMIN', 'MANAGER']), updateProject);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'MANAGER']), deleteProject);

// Sub-capítulos
router.post('/:projectId/subchapters', requireRole(['SUPER_ADMIN', 'MANAGER']), createSubChapter);
router.delete('/subchapters/:id', requireRole(['SUPER_ADMIN', 'MANAGER']), deleteSubChapter);

export default router;
