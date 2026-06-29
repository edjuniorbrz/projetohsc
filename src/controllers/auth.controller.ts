import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { EmailService } from '../services/email.service';

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, gestorId, cargo } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Preencha todos os campos obrigatorios' });
    return;
  }
  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    res.status(400).json({ error: 'E-mail ja esta em uso' });
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { 
      name: name.toUpperCase(), 
      email: email.toLowerCase(), 
      password: hashedPassword, 
      role, 
      gestorId: gestorId || null,
      cargo: cargo ? cargo.toUpperCase() : null
    }
  });

  EmailService.sendUserWelcomeEmail(user.id, password).catch(err => console.error('[EmailService Error]:', err));

  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    res.status(401).json({ error: 'Credenciais invalidas' });
    return;
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401).json({ error: 'Credenciais invalidas' });
    return;
  }
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'super_secret_jwt_key_123', { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
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
      data.password = await bcrypt.hash(password, 10);
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
