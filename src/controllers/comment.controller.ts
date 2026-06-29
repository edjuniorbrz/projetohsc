import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import path from 'path';
import fs from 'fs';

export const createComment = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  try {
    const data: any = {
      text,
      userId,
      taskId
    };

    if (req.file) {
      data.filename = req.file.filename;
      data.originalName = req.file.originalname;
    }

    const comment = await prisma.taskComment.create({
      data,
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(comment);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao criar observação.' });
  }
};

export const downloadCommentAttachment = async (req: Request, res: Response) => {
  const filename = req.params.filename as string;

  try {
    const comment = await prisma.taskComment.findFirst({
      where: { filename }
    });

    if (!comment) {
      res.status(404).json({ error: 'Arquivo não encontrado no registro de observações.' });
      return;
    }

    const filePath = path.join(__dirname, '../../uploads', filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Arquivo físico não encontrado no servidor.' });
      return;
    }

    res.download(filePath, (comment.originalName || filename) as string);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao baixar anexo.' });
  }
};
