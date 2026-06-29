"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGestor = exports.updateGestor = exports.createGestor = exports.getGestores = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const getGestores = async (req, res) => {
    try {
        const gestores = await prisma_1.default.user.findMany({
            where: {
                role: { in: ['MANAGER', 'SUPER_ADMIN'] }
            },
            include: {
                _count: {
                    select: { subordinates: true, managedProjects: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        const mapped = gestores.map(g => ({
            id: g.id,
            name: g.name,
            email: g.email,
            cargo: g.cargo,
            isActive: g.isActive,
            _count: {
                users: g._count?.subordinates || 0,
                projects: g._count?.managedProjects || 0
            }
        }));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar gestores' });
    }
};
exports.getGestores = getGestores;
const createGestor = async (req, res) => {
    const { name, email, isActive, cargo } = req.body;
    if (!name || !email) {
        res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
        return;
    }
    try {
        const existing = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existing) {
            res.status(400).json({ error: 'E-mail de gestor/usuário já está em uso' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash('Mudar@123', 10);
        const gestor = await prisma_1.default.user.create({
            data: {
                name: name.toUpperCase(),
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'MANAGER',
                cargo: cargo ? cargo.toUpperCase() : null,
                isActive: isActive !== undefined ? isActive : true
            }
        });
        res.status(201).json({
            id: gestor.id,
            name: gestor.name,
            email: gestor.email,
            cargo: gestor.cargo,
            isActive: gestor.isActive,
            _count: { users: 0, projects: 0 }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Erro ao criar gestor' });
    }
};
exports.createGestor = createGestor;
const updateGestor = async (req, res) => {
    const { id } = req.params;
    const { name, email, isActive, cargo } = req.body;
    try {
        const existing = await prisma_1.default.user.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Gestor não encontrado' });
            return;
        }
        if (email && email !== existing.email) {
            const duplicate = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
            if (duplicate) {
                res.status(400).json({ error: 'E-mail já está em uso por outro usuário' });
                return;
            }
        }
        const updated = await prisma_1.default.user.update({
            where: { id },
            data: {
                name: name !== undefined ? name.toUpperCase() : undefined,
                email: email !== undefined ? email.toLowerCase() : undefined,
                cargo: cargo !== undefined ? (cargo ? cargo.toUpperCase() : null) : undefined,
                isActive: isActive !== undefined ? isActive : undefined
            }
        });
        res.json({
            id: updated.id,
            name: updated.name,
            email: updated.email,
            cargo: updated.cargo,
            isActive: updated.isActive
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Erro ao atualizar gestor' });
    }
};
exports.updateGestor = updateGestor;
const deleteGestor = async (req, res) => {
    const { id } = req.params;
    try {
        const gestor = await prisma_1.default.user.findUnique({
            where: { id },
            include: {
                subordinates: { select: { id: true, name: true } },
                managedProjects: { select: { id: true, title: true } }
            }
        });
        if (!gestor) {
            res.status(404).json({ error: 'Gestor não encontrado' });
            return;
        }
        if (gestor.subordinates.length > 0 || gestor.managedProjects.length > 0) {
            res.status(400).json({
                error: 'Este gestor possui vínculos ativos com colaboradores ou projetos e não pode ser excluído. Recomenda-se inativá-lo.'
            });
            return;
        }
        await prisma_1.default.user.delete({ where: { id } });
        res.json({ message: 'Gestor excluído com sucesso!' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao excluir gestor' });
    }
};
exports.deleteGestor = deleteGestor;
//# sourceMappingURL=gestor.controller.js.map