import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createProject = async (req: Request, res: Response) => {
  const { title, description, gestorId, dataInicio, dataFim, responsibleIds, categoria } = req.body;
  const ownerId = req.user.id;

  if (!title) {
    res.status(400).json({ error: 'O titulo do projeto e obrigatorio.' });
    return;
  }

  const project = await prisma.project.create({
    data: {
      title: title.toUpperCase(),
      description: description ? description.toUpperCase() : null,
      ownerId,
      gestorId: gestorId || null,
      dataInicio: dataInicio ? new Date(dataInicio) : null,
      dataFim: dataFim ? new Date(dataFim) : null,
      categoria: categoria || null,
      responsibles: responsibleIds && Array.isArray(responsibleIds) ? {
        connect: responsibleIds.map((id: string) => ({ id }))
      } : undefined
    }
  });

  res.status(201).json(project);
};

export const listProjects = async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
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

export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, gestorId, dataInicio, dataFim, responsibleIds, categoria } = req.body;

  try {
    if (!title) {
      res.status(400).json({ error: 'O titulo do projeto e obrigatorio.' });
      return;
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        title: title.toUpperCase(),
        description: description ? description.toUpperCase() : null,
        gestorId: gestorId || null,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        categoria: categoria || null,
        responsibles: responsibleIds && Array.isArray(responsibleIds) ? {
          set: responsibleIds.map((id: string) => ({ id }))
        } : { set: [] }
      }
    });

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar projeto.' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user;

  try {
    if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
      const totalProjects = await prisma.project.count();
      const totalTasks = await prisma.task.count();

      const analysts = await prisma.user.findMany({
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
    } else {
      const totalAssignedTasks = await prisma.task.count({
        where: { assigneeId: userId }
      });

      const todoTasks = await prisma.task.count({
        where: { assigneeId: userId, status: 'TODO' }
      });

      const doingTasks = await prisma.task.count({
        where: { assigneeId: userId, status: 'DOING' }
      });

      const doneTasks = await prisma.task.count({
        where: { assigneeId: userId, status: 'DONE' }
      });

      const assignedProjects = await prisma.project.findMany({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar dados do dashboard.' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
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

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Projeto excluído com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir projeto.' });
  }
};
