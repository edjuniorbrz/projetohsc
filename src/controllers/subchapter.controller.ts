import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createSubChapter = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title } = req.body;

  if (!projectId) {
    res.status(400).json({ error: 'O ID do projeto é obrigatório.' });
    return;
  }

  if (!title) {
    res.status(400).json({ error: 'O titulo do sub-capitulo e obrigatorio.' });
    return;
  }

  try {
    const subChapter = await prisma.subChapter.create({
      data: {
        title: title.toUpperCase(),
        projectId: projectId as string
      }
    });
    res.status(201).json(subChapter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar sub-capitulo.' });
  }
};

export const deleteSubChapter = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.subChapter.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir sub-capitulo.' });
  }
};
