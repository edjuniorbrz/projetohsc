import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import path from 'path';

export const uploadDocument = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }
  const { taskId, isConfidential } = req.body;
  const document = await prisma.document.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      isConfidential: isConfidential === 'true',
      taskId
    }
  });
  res.status(201).json(document);
};

export const downloadDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      task: {
        include: { project: true }
      }
    }
  });
  if (!document) {
    res.status(404).json({ error: 'Documento nao encontrado' });
    return;
  }
  if (document.isConfidential) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isProjectOwner = document.task.project ? document.task.project.ownerId === user.id : false;
    const isTaskAssignee = document.task.assigneeId === user.id;
    if (!isSuperAdmin && !isProjectOwner && !isTaskAssignee) {
      res.status(403).json({ error: 'Acesso negado pela LGPD' });
      return;
    }
  }
  const filePath = path.join(__dirname, '../../uploads', document.filename);
  res.download(filePath, document.originalName);
};

export const listDocuments = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user;
  try {
    let documents;
    if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
      documents = await prisma.document.findMany({
        include: {
          task: {
            include: { project: true }
          }
        }
      });
    } else {
      documents = await prisma.document.findMany({
        where: {
          OR: [
            { isConfidential: false },
            { task: { assigneeId: userId } }
          ]
        },
        include: {
          task: {
            include: { project: true }
          }
        }
      });
    }
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar documentos' });
  }
};
