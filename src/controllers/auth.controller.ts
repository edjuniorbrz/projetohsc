import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { EmailService } from '../services/email.service';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const COMPLEXITY_ERROR_MSG = 'A senha não atende aos requisitos de complexidade: mínimo 8 caracteres, contendo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&#).';

export const register = async (req: Request, res: Response) => {
  const { name, email, role, gestorId, cargo } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    res.status(400).json({ error: 'E-mail já está em uso' });
    return;
  }
  
  const defaultPassword = '123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  const user = await prisma.user.create({
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

  EmailService.sendUserWelcomeEmail(user.id, defaultPassword).catch(err => console.error('[EmailService Error]:', err));

  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
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

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const failedAttempts = user.failedLoginAttempts + 1;
    const data: any = { failedLoginAttempts: failedAttempts };

    if (failedAttempts >= 10) {
      data.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      data.failedLoginAttempts = 0; // Reset attempts once locked out
      await prisma.user.update({ where: { id: user.id }, data });
      res.status(401).json({ error: 'Conta suspensa temporariamente por 15 minutos devido a 10 tentativas incorretas consecutivas.' });
    } else {
      await prisma.user.update({ where: { id: user.id }, data });
      res.status(401).json({ error: `Credenciais inválidas. Tentativa ${failedAttempts} de 10.` });
    }
    return;
  }

  // Reset lockout status on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockoutUntil: null }
  });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'super_secret_jwt_key_123', { expiresIn: '1d' });
  res.json({ 
    token, 
    user: { id: user.id, name: user.name, role: user.role, email: user.email }, 
    needsPasswordReset: user.passwordNeedsReset 
  });
};

export const resetPassword = async (req: Request, res: Response) => {
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: hashedPassword,
        passwordNeedsReset: false,
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    });

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
};

export const getAnalysts = async (req: Request, res: Response) => {
  try {
    const analysts = await prisma.user.findMany({
      where: { role: 'ANALYST' },
      select: { id: true, name: true, email: true }
    });
    res.json(analysts);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar analistas' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, password, role, isActive, gestorId, cargo } = req.body;
  try {
    const data: any = {};
    if (name !== undefined) data.name = name.toUpperCase();
    if (email !== undefined) data.email = email.toLowerCase();
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (gestorId !== undefined) data.gestorId = gestorId || null;
    if (cargo !== undefined) data.cargo = cargo ? cargo.toUpperCase() : null;
    
    if (password) {
      if (!PASSWORD_REGEX.test(password)) {
        res.status(400).json({ error: COMPLEXITY_ERROR_MSG });
        return;
      }
      data.password = await bcrypt.hash(password, 10);
      // Force change on next login if updated by someone else
      if (req.user && req.user.id !== id) {
        data.passwordNeedsReset = true;
      }
    }
    const updated = await prisma.user.update({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar usuário' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (req.user && req.user.id === id) {
      res.status(400).json({ error: 'Você não pode excluir a si mesmo' });
      return;
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir usuário (talvez ele possua projetos ou tarefas vinculadas)' });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar logs de auditoria' });
  }
};
