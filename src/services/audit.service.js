"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class AuditService {
    /**
     * Records an action in the database AuditLog table
     */
    static async logAction(userId, action, details, ipAddress) {
        try {
            await prisma_1.default.auditLog.create({
                data: {
                    action,
                    details,
                    userId: userId || null,
                    ipAddress: ipAddress || null
                }
            });
            console.log(`[AuditLog] Action "${action}" recorded successfully for user: ${userId || 'SYSTEM/ANONYMOUS'}`);
        }
        catch (err) {
            console.error('[AuditService Error] Failed to write audit log:', err);
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map