export declare class EmailService {
    /**
     * Helper to send an HTML email, routing through nodemailer or falling back to log file
     */
    private static sendMail;
    /**
     * 1. Send Task Assignment Email (designation of executor)
     */
    static sendTaskAssignmentEmail(userIds: string[], taskId: string): Promise<void>;
    /**
     * 2. Send Task Completion Email (whenever task changes status to DONE)
     */
    static sendTaskCompletionEmail(taskId: string, completedByUserId: string): Promise<void>;
    /**
     * 3. Send User Welcome Email (on creation)
     */
    static sendUserWelcomeEmail(userId: string, plainTextPassword?: string): Promise<void>;
}
//# sourceMappingURL=email.service.d.ts.map