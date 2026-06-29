"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.listTasks = exports.claimTask = exports.updateTaskProgress = exports.updateTaskStatus = exports.createTask = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const email_service_1 = require("../services/email.service");
const createTask = async (req, res) => {
    const { title, projectId, assigneeIds, // Array of assignee IDs
    why, where, how, howMuch, dataInicioProgramada, dataPrevistaFinalizar, subChapterId, isUrgent } = req.body;
    try {
        const task = await prisma_1.default.task.create({
            data: {
                title: title.toUpperCase(),
                projectId: projectId || null,
                why: why ? why.toUpperCase() : null,
                where: where ? where.toUpperCase() : null,
                how: how ? how.toUpperCase() : null,
                howMuch: howMuch ? parseFloat(howMuch) : null,
                dataInicioProgramada: dataInicioProgramada ? new Date(dataInicioProgramada) : null,
                dataPrevistaFinalizar: dataPrevistaFinalizar ? new Date(dataPrevistaFinalizar) : null,
                porcentagemExecucao: 0,
                subChapterId: subChapterId || null,
                isUrgent: isUrgent === true || isUrgent === 'true',
                assignees: {
                    connect: assigneeIds && Array.isArray(assigneeIds) ? assigneeIds.map((id) => ({ id })) : []
                }
            }
        });
        if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
            email_service_1.EmailService.sendTaskAssignmentEmail(assigneeIds, task.id).catch(err => console.error('[EmailService Error]:', err));
        }
        res.status(201).json(task);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Erro ao criar tarefa.' });
    }
};
exports.createTask = createTask;
const updateTaskStatus = async (req, res) => {
    const { id } = req.params;
    const { status, blockedReason } = req.body;
    try {
        const existing = await prisma_1.default.task.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Tarefa não encontrada.' });
            return;
        }
        const data = { status };
        if (status === 'DOING') {
            if (!existing.dataInicioReal) {
                data.dataInicioReal = new Date();
            }
            if (existing.porcentagemExecucao === 0) {
                data.porcentagemExecucao = 10;
            }
            data.blockedAt = null;
            data.blockedReason = null;
        }
        else if (status === 'DONE') {
            if (!existing.dataRealFinalizada) {
                data.dataRealFinalizada = new Date();
            }
            data.porcentagemExecucao = 100;
            data.blockedAt = null;
            data.blockedReason = null;
        }
        else if (status === 'TODO') {
            data.porcentagemExecucao = 0;
            data.dataRealFinalizada = null;
            data.blockedAt = null;
            data.blockedReason = null;
        }
        else if (status === 'BLOCKED') {
            if (existing.status !== 'BLOCKED') {
                data.blockedAt = new Date();
            }
            if (blockedReason !== undefined) {
                data.blockedReason = blockedReason;
            }
        }
        const task = await prisma_1.default.task.update({
            where: { id },
            data
        });
        if (status === 'DONE') {
            email_service_1.EmailService.sendTaskCompletionEmail(task.id, req.user.id).catch(err => console.error('[EmailService Error]:', err));
        }
        res.json(task);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Erro ao atualizar status da tarefa.' });
    }
};
exports.updateTaskStatus = updateTaskStatus;
const updateTaskProgress = async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;
    try {
        const progressVal = parseInt(progress);
        if (isNaN(progressVal) || progressVal < 0 || progressVal > 100) {
            res.status(400).json({ error: 'Progresso inválido. Deve ser de 0 a 100.' });
            return;
        }
        const existing = await prisma_1.default.task.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Tarefa não encontrada.' });
            return;
        }
        const data = { porcentagemExecucao: progressVal };
        if (progressVal === 100) {
            data.status = 'DONE';
            if (!existing.dataRealFinalizada) {
                data.dataRealFinalizada = new Date();
            }
            data.blockedAt = null;
            data.blockedReason = null;
        }
        else if (progressVal > 0) {
            data.status = 'DOING';
            if (!existing.dataInicioReal) {
                data.dataInicioReal = new Date();
            }
            data.dataRealFinalizada = null;
            data.blockedAt = null;
            data.blockedReason = null;
        }
        else {
            data.status = 'TODO';
            data.dataRealFinalizada = null;
            data.blockedAt = null;
            data.blockedReason = null;
        }
        const task = await prisma_1.default.task.update({
            where: { id },
            data
        });
        if (progressVal === 100) {
            email_service_1.EmailService.sendTaskCompletionEmail(task.id, req.user.id).catch(err => console.error('[EmailService Error]:', err));
        }
        res.json(task);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Erro ao atualizar progresso da tarefa.' });
    }
};
exports.updateTaskProgress = updateTaskProgress;
const claimTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const task = await prisma_1.default.task.findUnique({
            where: { id },
            include: { assignees: true }
        });
        if (!task) {
            res.status(404).json({ error: 'Tarefa não encontrada.' });
            return;
        }
        const alreadyAssigned = task.assignees.some((u) => u.id === userId);
        if (alreadyAssigned) {
            res.status(400).json({ error: 'Você já é um executor desta tarefa.' });
            return;
        }
        const updated = await prisma_1.default.task.update({
            where: { id },
            data: {
                assignees: {
                    connect: { id: userId }
                }
            },
            include: {
                assignees: { select: { id: true, name: true, email: true } }
            }
        });
        email_service_1.EmailService.sendTaskAssignmentEmail([userId], updated.id).catch(err => console.error('[EmailService Error]:', err));
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Erro ao reivindicar tarefa.' });
    }
};
exports.claimTask = claimTask;
const listTasks = async (req, res) => {
    const { id: userId, role } = req.user;
    try {
        let tasks;
        if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
            tasks = await prisma_1.default.task.findMany({
                include: {
                    project: true,
                    assignee: { select: { id: true, name: true, email: true } },
                    assignees: { select: { id: true, name: true, email: true } },
                    documents: true,
                    subChapter: { select: { id: true, title: true } },
                    comments: {
                        include: {
                            user: { select: { id: true, name: true } }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });
        }
        else {
            tasks = await prisma_1.default.task.findMany({
                where: {
                    OR: [
                        { assignees: { some: { id: userId } } },
                        { assignees: { none: {} } }
                    ]
                },
                include: {
                    project: true,
                    assignee: { select: { id: true, name: true, email: true } },
                    assignees: { select: { id: true, name: true, email: true } },
                    documents: true,
                    subChapter: { select: { id: true, title: true } },
                    comments: {
                        include: {
                            user: { select: { id: true, name: true } }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });
        }
        res.json(tasks);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar tarefas' });
    }
};
exports.listTasks = listTasks;
const deleteTask = async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await prisma_1.default.task.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Tarefa não encontrada.' });
            return;
        }
        await prisma_1.default.task.delete({ where: { id } });
        res.json({ message: 'Tarefa excluída com sucesso!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Erro ao excluir tarefa.' });
    }
};
exports.deleteTask = deleteTask;
//# sourceMappingURL=task.controller.js.map