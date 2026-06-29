import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger';
import authRoutes from './routes/auth.routes';
import gestorRoutes from './routes/gestor.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import documentRoutes from './routes/document.routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', authRoutes);
app.use('/gestores', gestorRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/documents', documentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API rodando e protegida' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('Servidor rodando na porta ' + PORT);
});