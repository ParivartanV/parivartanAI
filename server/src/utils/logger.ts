import prisma from '../prisma.js';

export async function logActivity(params: {
  userId?: string | null;
  action: string;
  category?: 'auth' | 'sync' | 'ai' | 'billing' | 'system';
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, any> | string;
}): Promise<void> {
  try {
    const detailsStr = typeof params.details === 'object'
      ? JSON.stringify(params.details)
      : (params.details || null);

    await prisma.activityLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        category: params.category || 'system',
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent ? params.userAgent.slice(0, 255) : null,
        details: detailsStr
      }
    });

    if (params.userId) {
      await prisma.user.update({
        where: { id: params.userId },
        data: { lastActiveAt: new Date() }
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
