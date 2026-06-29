"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadCommentAttachment = exports.createComment = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const createComment = async (req, res) => {
    const { taskId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    try {
        const data = {
            text,
            userId,
            taskId
        };
        if (req.file) {
            data.filename = req.file.filename;
            data.originalName = req.file.originalname;
        }
        const comment = await prisma_1.default.taskComment.create({
            data,
            include: {
                user: { select: { id: true, name: true } }
            }
        });
        res.status(201).json(comment);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Erro ao criar observação.' });
    }
};
exports.createComment = createComment;
const downloadCommentAttachment = async (req, res) => {
    const filename = req.params.filename;
    try {
        const comment = await prisma_1.default.taskComment.findFirst({
            where: { filename }
        });
        if (!comment) {
            res.status(404).json({ error: 'Arquivo não encontrado no registro de observações.' });
            return;
        }
        const filePath = path_1.default.join(__dirname, '../../uploads', filename);
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ error: 'Arquivo físico não encontrado no servidor.' });
            return;
        }
        res.download(filePath, (comment.originalName || filename));
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Erro ao baixar anexo.' });
    }
};
exports.downloadCommentAttachment = downloadCommentAttachment;
//# sourceMappingURL=comment.controller.js.map