import { Request, Response, NextFunction } from 'express';
import { User } from '../types';
export interface AuthRequest extends Request {
    user?: User;
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireRole: (allowedRoles: ("student" | "parent")[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireParentOrSelf: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=mongoAuth.d.ts.map