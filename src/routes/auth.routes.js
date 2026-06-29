"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.get('/analysts', auth_middleware_1.authMiddleware, auth_controller_1.getAnalysts);
router.get('/users', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), auth_controller_1.getUsers);
router.patch('/users/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), auth_controller_1.updateUser);
router.delete('/users/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), auth_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map