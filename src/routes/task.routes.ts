import { Router } from 'express';
import { createTask, updateTaskStatus, updateTaskProgress, claimTask, listTasks, deleteTask } from '../controllers/task.controller';
import { createComment, downloadCommentAttachment } from '../controllers/comment.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

const upload = multer({ dest: path.join(__dirname, '../../uploads') });
const router = Router();
router.use(authMiddleware);

router.get('/', listTasks);
router.post('/', requireRole(['SUPER_ADMIN', 'MANAGER']), createTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/progress', updateTaskProgress);
router.patch('/:id/claim', claimTask);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'MANAGER']), deleteTask);

router.post('/:taskId/comments', upload.single('file'), createComment);
router.get('/comments/download/:filename', downloadCommentAttachment);

export default router;
