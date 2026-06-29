"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gestor_controller_1 = require("../controllers/gestor.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, gestor_controller_1.getGestores);
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), gestor_controller_1.createGestor);
router.patch('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), gestor_controller_1.updateGestor);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), gestor_controller_1.deleteGestor);
exports.default = router;
//# sourceMappingURL=gestor.routes.js.map