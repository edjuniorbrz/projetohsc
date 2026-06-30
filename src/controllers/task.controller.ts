import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { EmailService } from '../services/email.service';
import { AuditService } from '../services/audit.service';

export const createTask = async (req: Request, res: Response) => {
  const { 
    title, 
    projectId, 
    assigneeIds, // Array of assignee IDs
    why,
    where,
    how,
    howMuch,
    dataInicioProgramada,
    dataPrevistaFinalizar,
    subChapterId,
    isUrgent
  } = req.body;
  
  try {
    const task = await prisma.task.create({
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
          connect: assigneeIds && Array.isArray(assigneeIds) ? assigneeIds.map((id: string) => ({ id })) : []
        }
      }
    });

    if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      EmailService.sendTaskAssignmentEmail(assigneeIds, task.id).catch(err => console.error('[EmailService Error]:', err));
      
      await prisma.pendingAcknowledgement.createMany({
        data: assigneeIds.map((userId: string) => ({
          userId,
          taskId: task.id
        }))
      });
    }

    await AuditService.logAction(
      req.user ? req.user.id : null,
      'CREATE_TASK',
      `Criou a tarefa "${task.title}" (ID ${task.id}) no projeto ID ${projectId || 'Sem Projeto'}`,
      req.ip
    );

    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao criar tarefa.' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, blockedReason } = req.body;
  
  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tarefa não encontrada.' });
      return;
    }
    
    const data: any = { status };
    
    if (status === 'DOING') {
      if (!existing.dataInicioReal) {
        data.dataInicioReal = new Date();
      }
      if (existing.porcentagemExecucao === 0) {
        data.porcentagemExecucao = 10;
      }
      data.blockedAt = null;
      data.blockedReason = null;
    } else if (status === 'DONE') {
      if (!existing.dataRealFinalizada) {
        data.dataRealFinalizada = new Date();
      }
      data.porcentagemExecucao = 100;
      data.blockedAt = null;
      data.blockedReason = null;
    } else if (status === 'TODO') {
      data.porcentagemExecucao = 0;
      data.dataRealFinalizada = null;
      data.blockedAt = null;
      data.blockedReason = null;
    } else if (status === 'BLOCKED') {
      if (existing.status !== 'BLOCKED') {
        data.blockedAt = new Date();
      }
      if (blockedReason !== undefined) {
        data.blockedReason = blockedReason;
      }
    }
    
    const task = await prisma.task.update({
      where: { id },
      data
    });

    if (status === 'DONE') {
      EmailService.sendTaskCompletionEmail(task.id, req.user.id).catch(err => console.error('[EmailService Error]:', err));
    }

    await AuditService.logAction(
      req.user ? req.user.id : null,
      'UPDATE_TASK_STATUS',
      `Alterou o status da tarefa "${task.title}" (ID ${task.id}) de "${existing.status}" para "${task.status}". Motivo bloqueio: ${blockedReason || '-'}`,
      req.ip
    );

    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar status da tarefa.' });
  }
};

export const updateTaskProgress = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { progress } = req.body;
  
  try {
    const progressVal = parseInt(progress);
    if (isNaN(progressVal) || progressVal < 0 || progressVal > 100) {
      res.status(400).json({ error: 'Progresso inválido. Deve ser de 0 a 100.' });
      return;
    }
    
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tarefa não encontrada.' });
      return;
    }
    
    const data: any = { porcentagemExecucao: progressVal };
    
    if (progressVal === 100) {
      data.status = 'DONE';
      if (!existing.dataRealFinalizada) {
        data.dataRealFinalizada = new Date();
      }
      data.blockedAt = null;
      data.blockedReason = null;
    } else if (progressVal > 0) {
      data.status = 'DOING';
      if (!existing.dataInicioReal) {
        data.dataInicioReal = new Date();
      }
      data.dataRealFinalizada = null;
      data.blockedAt = null;
      data.blockedReason = null;
    } else {
      data.status = 'TODO';
      data.dataRealFinalizada = null;
      data.blockedAt = null;
      data.blockedReason = null;
    }
    
    const task = await prisma.task.update({
      where: { id },
      data
    });

    if (progressVal === 100) {
      EmailService.sendTaskCompletionEmail(task.id, req.user.id).catch(err => console.error('[EmailService Error]:', err));
    }

    await AuditService.logAction(
      req.user ? req.user.id : null,
      'UPDATE_TASK_PROGRESS',
      `Alterou o progresso da tarefa "${task.title}" (ID ${task.id}) de ${existing.porcentagemExecucao}% para ${task.porcentagemExecucao}%`,
      req.ip
    );

    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar progresso da tarefa.' });
  }
};

export const claimTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    const task = await prisma.task.findUnique({
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
    
    const updated = await prisma.task.update({
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

    EmailService.sendTaskAssignmentEmail([userId], updated.id).catch(err => console.error('[EmailService Error]:', err));
    
    await AuditService.logAction(
      userId,
      'CLAIM_TASK',
      `Reivindicou a execução da tarefa "${updated.title}" (ID ${updated.id})`,
      req.ip
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao reivindicar tarefa.' });
  }
};

export const listTasks = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user;
  try {
    let tasks;
    if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
      tasks = await prisma.task.findMany({
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
    } else {
      tasks = await prisma.task.findMany({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tarefa não encontrada.' });
      return;
    }

    await AuditService.logAction(
      req.user ? req.user.id : null,
      'DELETE_TASK',
      `Excluiu a tarefa "${existing.title}" (ID ${id})`,
      req.ip
    );

    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Tarefa excluída com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao excluir tarefa.' });
  }
};
