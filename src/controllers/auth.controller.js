"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUsers = exports.getAnalysts = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const email_service_1 = require("../services/email.service");
const register = async (req, res) => {
    const { name, email, password, role, gestorId, cargo } = req.body;
    if (!name || !email || !password) {
        res.status(400).json({ error: 'Preencha todos os campos obrigatorios' });
        return;
    }
    const existingUser = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
        res.status(400).json({ error: 'E-mail ja esta em uso' });
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: {
            name: name.toUpperCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            gestorId: gestorId || null,
            cargo: cargo ? cargo.toUpperCase() : null
        }
    });
    email_service_1.EmailService.sendUserWelcomeEmail(user.id, password).catch(err => console.error('[EmailService Error]:', err));
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
        res.status(401).json({ error: 'Credenciais invalidas' });
        return;
    }
    const isValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isValid) {
        res.status(401).json({ error: 'Credenciais invalidas' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'super_secret_jwt_key_123', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
};
exports.login = login;
const getAnalysts = async (req, res) => {
    try {
        const analysts = await prisma_1.default.user.findMany({
            where: { role: 'ANALYST' },
            select: { id: true, name: true, email: true }
        });
        res.json(analysts);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar analistas' });
    }
};
exports.getAnalysts = getAnalysts;
const getUsers = async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                gestorId: true,
                cargo: true,
                gestor: { select: { id: true, name: true, email: true } }
            }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
};
exports.getUsers = getUsers;
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role, isActive, gestorId, cargo } = req.body;
    try {
        const data = {};
        if (name !== undefined)
            data.name = name.toUpperCase();
        if (email !== undefined)
            data.email = email.toLowerCase();
        if (role !== undefined)
            data.role = role;
        if (isActive !== undefined)
            data.isActive = isActive;
        if (gestorId !== undefined)
            data.gestorId = gestorId || null;
        if (cargo !== undefined)
            data.cargo = cargo ? cargo.toUpperCase() : null;
        if (password) {
            data.password = await bcryptjs_1.default.hash(password, 10);
        }
        const updated = await prisma_1.default.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                gestorId: true,
                cargo: true,
                gestor: { select: { id: true, name: true, email: true } }
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Erro ao atualizar usuário' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        if (req.user && req.user.id === id) {
            res.status(400).json({ error: 'Você não pode excluir a si mesmo' });
            return;
        }
        await prisma_1.default.user.delete({ where: { id } });
        res.json({ message: 'Usuário excluído com sucesso' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao excluir usuário (talvez ele possua projetos ou tarefas vinculadas)' });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=auth.controller.js.map