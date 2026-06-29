"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const subchapter_controller_1 = require("../controllers/subchapter.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Rota do Dashboard (deve vir antes das rotas parametrizadas se houver)
router.get('/dashboard', project_controller_1.getDashboardStats);
// Projetos normais
router.get('/', project_controller_1.listProjects);
router.post('/', (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), project_controller_1.createProject);
router.patch('/:id', (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), project_controller_1.updateProject);
router.delete('/:id', (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), project_controller_1.deleteProject);
// Sub-capítulos
router.post('/:projectId/subchapters', (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), subchapter_controller_1.createSubChapter);
router.delete('/subchapters/:id', (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), subchapter_controller_1.deleteSubChapter);
exports.default = router;
//# sourceMappingURL=project.routes.js.map