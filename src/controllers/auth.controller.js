"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.deleteUser = exports.updateUser = exports.getUsers = exports.getAnalysts = exports.resetPassword = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const email_service_1 = require("../services/email.service");
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const COMPLEXITY_ERROR_MSG = 'A senha não atende aos requisitos de complexidade: mínimo 8 caracteres, contendo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&#).';
const register = async (req, res) => {
    const { name, email, role, gestorId, cargo } = req.body;
    if (!name || !email) {
        res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
        return;
    }
    const existingUser = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
        res.status(400).json({ error: 'E-mail já está em uso' });
        return;
    }
    const defaultPassword = '123';
    const hashedPassword = await bcryptjs_1.default.hash(defaultPassword, 10);
    const user = await prisma_1.default.user.create({
        data: {
            name: name.toUpperCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            gestorId: gestorId || null,
            cargo: cargo ? cargo.toUpperCase() : null,
            passwordNeedsReset: true // Force reset on first access
        }
    });
    email_service_1.EmailService.sendUserWelcomeEmail(user.id, defaultPassword).catch(err => console.error('[EmailService Error]:', err));
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        return;
    }
    const user = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
    }
    // Check Lockout status
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
        const minutesLeft = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / (1000 * 60));
        res.status(401).json({ error: `Conta suspensa temporariamente por excesso de tentativas. Tente novamente em ${minutesLeft} minuto(s).` });
        return;
    }
    const isValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isValid) {
        const failedAttempts = user.failedLoginAttempts + 1;
        const data = { failedLoginAttempts: failedAttempts };
        if (failedAttempts >= 10) {
            data.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
            data.failedLoginAttempts = 0; // Reset attempts once locked out
            await prisma_1.default.user.update({ where: { id: user.id }, data });
            res.status(401).json({ error: 'Conta suspensa temporariamente por 15 minutos devido a 10 tentativas incorretas consecutivas.' });
        }
        else {
            await prisma_1.default.user.update({ where: { id: user.id }, data });
            res.status(401).json({ error: `Credenciais inválidas. Tentativa ${failedAttempts} de 10.` });
        }
        return;
    }
    // Reset lockout status on successful login
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockoutUntil: null }
    });
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'super_secret_jwt_key_123', { expiresIn: '1d' });
    res.json({
        token,
        user: { id: user.id, name: user.name, role: user.role, email: user.email },
        needsPasswordReset: user.passwordNeedsReset
    });
};
exports.login = login;
const resetPassword = async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword) {
        res.status(400).json({ error: 'Preencha a nova senha.' });
        return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
        res.status(400).json({ error: COMPLEXITY_ERROR_MSG });
        return;
    }
    if (!req.user || !req.user.id) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
    }
    try {
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                password: hashedPassword,
                passwordNeedsReset: false,
                failedLoginAttempts: 0,
                lockoutUntil: null
            }
        });
        res.json({ message: 'Senha redefinida com sucesso!' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao redefinir senha.' });
    }
};
exports.resetPassword = resetPassword;
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
            if (!PASSWORD_REGEX.test(password)) {
                res.status(400).json({ error: COMPLEXITY_ERROR_MSG });
                return;
            }
            data.password = await bcryptjs_1.default.hash(password, 10);
            // Force change on next login if updated by someone else
            if (req.user && req.user.id !== id) {
                data.passwordNeedsReset = true;
            }
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
const getAuditLogs = async (req, res) => {
    try {
        const logs = await prisma_1.default.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true, role: true } }
            }
        });
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar logs de auditoria' });
    }
};
exports.getAuditLogs = getAuditLogs;
//# sourceMappingURL=auth.controller.js.map