import prisma from '../lib/prisma';

export class AuditService {
  /**
   * Records an action in the database AuditLog table
   */
  public static async logAction(
    userId: string | null,
    action: string,
    details: string,
    ipAddress?: string
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          details,
          userId: userId || null,
          ipAddress: ipAddress || null
        }
      });
      console.log(`[AuditLog] Action "${action}" recorded successfully for user: ${userId || 'SYSTEM/ANONYMOUS'}`);
    } catch (err) {
      console.error('[AuditService Error] Failed to write audit log:', err);
    }
  }
}
