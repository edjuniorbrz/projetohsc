import { Request, Response, NextFunction } from 'express';
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map