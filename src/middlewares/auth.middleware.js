"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, String(process.env.JWT_SECRET || 'super_secret_jwt_key_123'));
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Token inválido' });
        return;
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Acesso negado para o seu perfil' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.middleware.js.map