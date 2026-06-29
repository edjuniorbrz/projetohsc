import { Request, Response } from 'express';
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
export declare const getAnalysts: (req: Request, res: Response) => Promise<void>;
export declare const getUsers: (req: Request, res: Response) => Promise<void>;
export declare const updateUser: (req: Request, res: Response) => Promise<void>;
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
export declare const getAuditLogs: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map