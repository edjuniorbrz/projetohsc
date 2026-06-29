import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

export const getGestores = async (req: Request, res: Response) => {
  try {
    const gestores = await prisma.user.findMany({
      where: {
        role: 'MANAGER'
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
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar gestores' });
  }
};

export const createGestor = async (req: Request, res: Response) => {
  const { name, email, isActive, cargo } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    return;
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(400).json({ error: 'E-mail de gestor/usuário já está em uso' });
      return;
    }
    const hashedPassword = await bcrypt.hash('Mudar@123', 10);
    const gestor = await prisma.user.create({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar gestor' });
  }
};

export const updateGestor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, isActive, cargo } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Gestor não encontrado' });
      return;
    }
    if (email && email !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (duplicate) {
        res.status(400).json({ error: 'E-mail já está em uso por outro usuário' });
        return;
      }
    }
    const updated = await prisma.user.update({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar gestor' });
  }
};

export const deleteGestor = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const gestor = await prisma.user.findUnique({
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

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Gestor excluído com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir gestor' });
  }
};
