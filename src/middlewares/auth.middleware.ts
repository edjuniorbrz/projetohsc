import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
  const token = parts[1];
  if (!token) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
  try {
    const decoded = jwt.verify(token, String(process.env.JWT_SECRET || 'super_secret_jwt_key_123'));
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado para o seu perfil' });
      return;
    }
    next();
  };
};
