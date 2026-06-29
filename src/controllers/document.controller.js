"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDocuments = exports.downloadDocument = exports.uploadDocument = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const path_1 = __importDefault(require("path"));
const uploadDocument = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
    }
    const { taskId, isConfidential } = req.body;
    const document = await prisma_1.default.document.create({
        data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            isConfidential: isConfidential === 'true',
            taskId
        }
    });
    res.status(201).json(document);
};
exports.uploadDocument = uploadDocument;
const downloadDocument = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const document = await prisma_1.default.document.findUnique({
        where: { id },
        include: {
            task: {
                include: { project: true }
            }
        }
    });
    if (!document) {
        res.status(404).json({ error: 'Documento nao encontrado' });
        return;
    }
    if (document.isConfidential) {
        const isSuperAdmin = user.role === 'SUPER_ADMIN';
        const isProjectOwner = document.task.project ? document.task.project.ownerId === user.id : false;
        const isTaskAssignee = document.task.assigneeId === user.id;
        if (!isSuperAdmin && !isProjectOwner && !isTaskAssignee) {
            res.status(403).json({ error: 'Acesso negado pela LGPD' });
            return;
        }
    }
    const filePath = path_1.default.join(__dirname, '../../uploads', document.filename);
    res.download(filePath, document.originalName);
};
exports.downloadDocument = downloadDocument;
const listDocuments = async (req, res) => {
    const { id: userId, role } = req.user;
    try {
        let documents;
        if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
            documents = await prisma_1.default.document.findMany({
                include: {
                    task: {
                        include: { project: true }
                    }
                }
            });
        }
        else {
            documents = await prisma_1.default.document.findMany({
                where: {
                    OR: [
                        { isConfidential: false },
                        { task: { assigneeId: userId } }
                    ]
                },
                include: {
                    task: {
                        include: { project: true }
                    }
                }
            });
        }
        res.json(documents);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar documentos' });
    }
};
exports.listDocuments = listDocuments;
//# sourceMappingURL=document.controller.js.map