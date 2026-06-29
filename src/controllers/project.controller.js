"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.getDashboardStats = exports.updateProject = exports.listProjects = exports.createProject = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createProject = async (req, res) => {
    const { title, description, gestorId, dataInicio, dataFim, responsibleIds } = req.body;
    const ownerId = req.user.id;
    if (!title) {
        res.status(400).json({ error: 'O titulo do projeto e obrigatorio.' });
        return;
    }
    const project = await prisma_1.default.project.create({
        data: {
            title: title.toUpperCase(),
            description: description ? description.toUpperCase() : null,
            ownerId,
            gestorId: gestorId || null,
            dataInicio: dataInicio ? new Date(dataInicio) : null,
            dataFim: dataFim ? new Date(dataFim) : null,
            responsibles: responsibleIds && Array.isArray(responsibleIds) ? {
                connect: responsibleIds.map((id) => ({ id }))
            } : undefined
        }
    });
    res.status(201).json(project);
};
exports.createProject = createProject;
const listProjects = async (req, res) => {
    const projects = await prisma_1.default.project.findMany({
        include: {
            owner: {
                select: { id: true, name: true, email: true, role: true }
            },
            gestor: {
                select: { id: true, name: true, email: true, isActive: true }
            },
            responsibles: {
                select: { id: true, name: true, email: true, isActive: true, cargo: true }
            },
            subChapters: {
                include: {
                    tasks: {
                        select: { id: true, title: true, status: true }
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            },
            _count: {
                select: { tasks: true }
            }
        }
    });
    res.json(projects);
};
exports.listProjects = listProjects;
const updateProject = async (req, res) => {
    const { id } = req.params;
    const { title, description, gestorId, dataInicio, dataFim, responsibleIds } = req.body;
    try {
        if (!title) {
            res.status(400).json({ error: 'O titulo do projeto e obrigatorio.' });
            return;
        }
        const project = await prisma_1.default.project.update({
            where: { id },
            data: {
                title: title.toUpperCase(),
                description: description ? description.toUpperCase() : null,
                gestorId: gestorId || null,
                dataInicio: dataInicio ? new Date(dataInicio) : null,
                dataFim: dataFim ? new Date(dataFim) : null,
                responsibles: responsibleIds && Array.isArray(responsibleIds) ? {
                    set: responsibleIds.map((id) => ({ id }))
                } : { set: [] }
            }
        });
        res.json(project);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    }
};
exports.updateProject = updateProject;
const getDashboardStats = async (req, res) => {
    const { id: userId, role } = req.user;
    try {
        if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
            const totalProjects = await prisma_1.default.project.count();
            const totalTasks = await prisma_1.default.task.count();
            const analysts = await prisma_1.default.user.findMany({
                where: { role: 'ANALYST' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    _count: {
                        select: { tasks: true }
                    }
                }
            });
            const analystWorkload = analysts.map(a => ({
                id: a.id,
                name: a.name,
                email: a.email,
                taskCount: a._count.tasks
            }));
            res.json({
                type: 'MACRO',
                totalProjects,
                totalTasks,
                analystWorkload
            });
            return;
        }
        else {
            const totalAssignedTasks = await prisma_1.default.task.count({
                where: { assigneeId: userId }
            });
            const todoTasks = await prisma_1.default.task.count({
                where: { assigneeId: userId, status: 'TODO' }
            });
            const doingTasks = await prisma_1.default.task.count({
                where: { assigneeId: userId, status: 'DOING' }
            });
            const doneTasks = await prisma_1.default.task.count({
                where: { assigneeId: userId, status: 'DONE' }
            });
            const assignedProjects = await prisma_1.default.project.findMany({
                where: {
                    tasks: {
                        some: { assigneeId: userId }
                    }
                },
                select: {
                    id: true,
                    title: true,
                    description: true
                }
            });
            res.json({
                type: 'MICRO',
                kpis: {
                    total: totalAssignedTasks,
                    todo: todoTasks,
                    doing: doingTasks,
                    done: doneTasks
                },
                assignedProjects
            });
            return;
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar dados do dashboard.' });
    }
};
exports.getDashboardStats = getDashboardStats;
const deleteProject = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await prisma_1.default.project.findUnique({
            where: { id },
            include: {
                tasks: {
                    select: { status: true }
                }
            }
        });
        if (!project) {
            res.status(404).json({ error: 'Projeto não encontrado.' });
            return;
        }
        const hasStarted = project.tasks.some(t => t.status === 'DOING' || t.status === 'DONE');
        if (hasStarted) {
            res.status(400).json({ error: 'Não é possível excluir um projeto que já possui ações em execução ou concluídas.' });
            return;
        }
        await prisma_1.default.project.delete({
            where: { id }
        });
        res.json({ message: 'Projeto excluído com sucesso!' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir projeto.' });
    }
};
exports.deleteProject = deleteProject;
//# sourceMappingURL=project.controller.js.map