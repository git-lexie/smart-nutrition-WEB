import AuditLog from '@/models/AuditLog';

// We added types (string, any) to make the red lines disappear!
export const logUserAction = async (userId: string, action: string, details: any = {}) => {
  try {
    await AuditLog.create({ userId, action, details });
  } catch (error) {
    console.error("Failed to write to audit log:", error);
  }
};