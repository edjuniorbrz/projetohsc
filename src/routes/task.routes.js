"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const comment_controller_1 = require("../controllers/comment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const upload = (0, multer_1.default)({ dest: path_1.default.join(__dirname, '../../uploads') });
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', task_controller_1.listTasks);
router.post('/', (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), task_controller_1.createTask);
router.patch('/:id/status', task_controller_1.updateTaskStatus);
router.patch('/:id/progress', task_controller_1.updateTaskProgress);
router.patch('/:id/claim', task_controller_1.claimTask);
router.delete('/:id', (0, auth_middleware_1.requireRole)(['SUPER_ADMIN', 'MANAGER']), task_controller_1.deleteTask);
router.post('/:taskId/comments', upload.single('file'), comment_controller_1.createComment);
router.get('/comments/download/:filename', comment_controller_1.downloadCommentAttachment);
exports.default = router;
//# sourceMappingURL=task.routes.js.map