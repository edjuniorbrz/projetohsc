import { Router } from 'express';
import multer from 'multer';
import { uploadDocument, downloadDocument, listDocuments } from '../controllers/document.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import path from 'path';

const upload = multer({ dest: path.join(__dirname, '../../uploads') });
const router = Router();

router.use(authMiddleware);

router.get('/', listDocuments);
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/:id/download', downloadDocument);

export default router;
