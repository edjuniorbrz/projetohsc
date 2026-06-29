"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubChapter = exports.createSubChapter = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createSubChapter = async (req, res) => {
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
        const subChapter = await prisma_1.default.subChapter.create({
            data: {
                title: title.toUpperCase(),
                projectId: projectId
            }
        });
        res.status(201).json(subChapter);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar sub-capitulo.' });
    }
};
exports.createSubChapter = createSubChapter;
const deleteSubChapter = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma_1.default.subChapter.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir sub-capitulo.' });
    }
};
exports.deleteSubChapter = deleteSubChapter;
//# sourceMappingURL=subchapter.controller.js.map