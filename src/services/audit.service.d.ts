export declare class AuditService {
    /**
     * Records an action in the database AuditLog table
     */
    static logAction(userId: string | null, action: string, details: string, ipAddress?: string): Promise<void>;
}
//# sourceMappingURL=audit.service.d.ts.map