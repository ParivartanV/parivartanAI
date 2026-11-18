import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { computeTrialStatus } from '../utils/trial.js';

export const adminRouter = Router();

const jwtSecret = process.env.JWT_SECRET || 'local-dev-jwt-secret-key-change-in-production-12345';

/**
 * 👑 Master Account Instant Login (Local / Admin Access)
 * Supports Master Password + 2FA PIN (312866) verification.
 */
adminRouter.post('/login', async (req, res): Promise<void> => {
  try {
    const adminEmail = (req.body.email || process.env.MASTER_ADMIN_EMAIL || 'parivartanvishalsingh@gmail.com').toLowerCase();
    const adminName = req.body.name || (adminEmail.includes('parivartan') ? 'Vishal Singh' : 'Master Administrator');
    const masterPassword = process.env.MASTER_ADMIN_PASSWORD || 'kmbl1110';
    const master2faPin = process.env.MASTER_2FA_PIN || '312866';

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

    // 1. Password Verification
    if (req.body.password) {
      const providedPassword = String(req.body.password).trim();
      let passValid = false;
      if (existingUser?.passwordHash) {
        passValid = verifyPassword(providedPassword, existingUser.passwordHash);
      }
      if (!passValid && providedPassword === masterPassword) {
        passValid = true;
      }
      if (!passValid) {
        res.status(401).json({ error: 'Invalid password for Master Administrator' });
        return;
      }
    }

    // 2. Two-Factor Authentication (2FA PIN) Verification
    const providedPin = req.body.pin || req.body.twoFactorPin ? String(req.body.pin || req.body.twoFactorPin).trim() : null;
    if (!providedPin) {
      res.status(200).json({
        require2fa: true,
        email: adminEmail,
        message: 'Two-Factor Authentication required. Enter the 6-digit Master PIN (312866).'
      });
      return;
    }

    if (providedPin !== (existingUser?.twoFactorPin || master2faPin) && providedPin !== '312866') {
      res.status(401).json({ error: 'Invalid 2FA Master PIN. Verification failed (PIN must be 312866).' });
      return;
    }

    const masterGoogleId = `master_admin_${Buffer.from(adminEmail).toString('hex').slice(0, 16)}`;

    // Upsert Master Administrator User with role: 'admin'
    const masterUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'admin',
        twoFactorPin: master2faPin,
        twoFactorEnabled: true,
        company: 'Parivartan HQ',
        subscriptionPlan: 'enterprise',
        lastActiveAt: new Date()
      },
      create: {
        googleId: masterGoogleId,
        email: adminEmail,
        passwordHash: existingUser?.passwordHash || hashPassword(masterPassword),
        twoFactorPin: master2faPin,
        twoFactorEnabled: true,
        name: adminName,
        role: 'admin',
        company: 'Parivartan HQ',
        subscriptionPlan: 'enterprise',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adminName)}`,
        settings: {
          create: {
            theme: 'day',
            defaultAuthor: adminName,
          }
        }
      }
    });

    await logActivity({
      userId: masterUser.id,
      action: 'MASTER_ADMIN_LOGIN',
      category: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { email: adminEmail, role: 'admin', twoFactorVerified: true }
    });

    const jwtToken = jwt.sign(
      { userId: masterUser.id, email: masterUser.email, role: 'admin' },
      jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      jwt: jwtToken,
      user: {
        id: masterUser.id,
        email: masterUser.email,
        name: masterUser.name,
        role: masterUser.role,
        company: masterUser.company,
        avatarUrl: masterUser.avatarUrl,
        subscriptionPlan: masterUser.subscriptionPlan,
        twoFactorEnabled: true,
        createdAt: masterUser.createdAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Master login error', details: err.message });
  }
});

/**
 * 🔒 Change Master Admin Password with 2FA Master PIN (312866)
 */
adminRouter.post('/change-password', async (req: any, res: Response): Promise<void> => {
  try {
    const adminEmail = (req.body.email || process.env.MASTER_ADMIN_EMAIL || 'parivartanvishalsingh@gmail.com').toLowerCase();
    const currentPassword = req.body.currentPassword ? String(req.body.currentPassword).trim() : '';
    const newPassword = req.body.newPassword ? String(req.body.newPassword).trim() : '';
    const pin = req.body.pin || req.body.twoFactorPin ? String(req.body.pin || req.body.twoFactorPin).trim() : '';

    if (!newPassword || newPassword.length < 4) {
      res.status(400).json({ error: 'New password must be at least 4 characters long' });
      return;
    }

    const master2faPin = process.env.MASTER_2FA_PIN || '312866';
    if (!pin || (pin !== master2faPin && pin !== '312866')) {
      res.status(401).json({ error: 'Invalid 2FA Master PIN. Verification failed (PIN must be 312866).' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
      res.status(404).json({ error: 'Master Admin account not found' });
      return;
    }

    // Verify current password if provided
    if (user.passwordHash && currentPassword) {
      const valid = verifyPassword(currentPassword, user.passwordHash) || currentPassword === (process.env.MASTER_ADMIN_PASSWORD || 'kmbl1110');
      if (!valid) {
        res.status(401).json({ error: 'Current master password is incorrect' });
        return;
      }
    }

    const newHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        twoFactorPin: master2faPin,
        twoFactorEnabled: true
      }
    });

    await logActivity({
      userId: user.id,
      action: 'MASTER_PASSWORD_CHANGED',
      category: 'security',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { email: adminEmail, message: 'Master Admin password changed with 2FA verification' }
    });

    res.json({
      success: true,
      message: 'Master Admin password updated successfully! You can now log in with your new password.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password', details: err.message });
  }
});

// Protect all following routes with requireAdmin
adminRouter.use(requireAdmin);

/**
 * 📊 Master Overview: Global Stats, Revenue, Logs, and Recent Activity
 */
adminRouter.get('/overview', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalClients,
      totalSnippets,
      totalPrompts,
      totalLogs,
      payments,
      allUsers,
      recentLogs,
      recentClients
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.snippet.count(),
      prisma.aiPrompt.count(),
      prisma.activityLog.count(),
      prisma.payment.findMany({ select: { amount: true, status: true, paymentMethod: true } }),
      prisma.user.findMany({ select: { creditBalance: true } }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, avatarUrl: true } } }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          subscriptionPlan: true,
          creditBalance: true,
          createdAt: true,
          lastActiveAt: true
        }
      })
    ]);

    const totalRevenue = payments
      .filter(p => p.status === 'completed' && p.paymentMethod !== 'credits' && p.paymentMethod !== 'free_credits')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalCredits = allUsers.reduce((sum, u) => sum + (u.creditBalance || 0), 0);

    res.json({
      success: true,
      stats: {
        totalClients,
        totalSnippets,
        totalPrompts,
        totalLogs,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        completedTransactions: payments.filter(p => p.status === 'completed').length
      },
      recentLogs,
      recentClients
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin overview', details: err.message });
  }
});

/**
 * 👥 Clients Directory: List all clients with linked stats and payment totals
 */
adminRouter.get('/clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();

    const clients = await prisma.user.findMany({
      where: search ? {
        OR: [
          { email: { contains: search } },
          { name: { contains: search } },
          { company: { contains: search } }
        ]
      } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        payments: {
          select: { amount: true, status: true, paidAt: true }
        },
        _count: {
          select: {
            snippets: true,
            folders: true,
            aiPrompts: true,
            aiVariables: true,
            activityLogs: true
          }
        }
      }
    });

    const formatted = clients.map(c => {
      const totalPaid = c.payments
        .filter(p => p.status === 'completed' && p.paymentMethod !== 'credits' && p.paymentMethod !== 'free_credits')
        .reduce((sum, p) => sum + p.amount, 0);

      const trial = computeTrialStatus(c);

      return {
        id: c.id,
        name: c.name || 'Anonymous Client',
        email: c.email,
        company: c.company || 'Individual',
        role: c.role,
        avatarUrl: c.avatarUrl,
        plan: c.subscriptionPlan,
        status: c.subscriptionStatus,
        trialEndsAt: c.trialEndsAt,
        billingCycle: c.billingCycle,
        trial,
        creditBalance: Math.round((c.creditBalance || 0) * 100) / 100,
        lastActiveAt: c.lastActiveAt,
        createdAt: c.createdAt,
        counts: c._count,
        totalPaid: Math.round(totalPaid * 100) / 100,
        paymentCount: c.payments.length
      };
    });

    res.json({ success: true, count: formatted.length, clients: formatted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list clients', details: err.message });
  }
});

/**
 * 🔍 Client Deep-Dive Profile: Full dossier of snippets, AI prompts, payments, & logs
 */
adminRouter.get('/clients/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.params.id;

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        settings: true,
        folders: { orderBy: { createdAt: 'asc' } },
        snippets: { orderBy: { updatedAt: 'desc' } },
        aiPrompts: { orderBy: { updatedAt: 'desc' } },
        aiVariables: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
        activityLogs: {
          take: 50,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const totalPaid = client.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      client: {
        ...client,
        trial: computeTrialStatus(client),
        totalPaid: Math.round(totalPaid * 100) / 100
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve client dossier', details: err.message });
  }
});

/**
 * 💳 Link a Payment to a Client Profile (Supports Credit Card, PayPal, Wire, and Credits)
 */
adminRouter.post('/clients/:id/payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.params.id;
    const {
      amount,
      currency,
      status,
      planName,
      transactionId,
      paymentMethod,
      invoiceUrl,
      paidAt,
      upgradePlan
    } = req.body;

    if (!amount || !planName) {
      res.status(400).json({ error: 'Amount and plan name are required' });
      return;
    }

    const numAmount = Number(amount);
    const method = (paymentMethod || 'credit_card').toLowerCase();

    // If using credits as the payment method, check client balance and deduct
    if (method === 'credits') {
      const clientUser = await prisma.user.findUnique({ where: { id: clientId } });
      if (!clientUser) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      const currentBalance = clientUser.creditBalance || 0;
      if (currentBalance < numAmount) {
        res.status(400).json({
          error: `Insufficient credit balance. Client only has ${currentBalance.toFixed(2)} credits, but transaction requires ${numAmount.toFixed(2)} credits.`
        });
        return;
      }
      await prisma.user.update({
        where: { id: clientId },
        data: { creditBalance: { decrement: numAmount } }
      });
    } else if (method === 'free_credits') {
      // Allocate credits to balance
      await prisma.user.update({
        where: { id: clientId },
        data: { creditBalance: { increment: numAmount } }
      });
    }

    const txId = transactionId || `${method === 'credits' ? 'CRD_PAY' : 'TXN'}_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        userId: clientId,
        amount: numAmount,
        currency: method === 'credits' || method === 'free_credits' ? 'CREDITS' : (currency || 'USD'),
        status: status || 'completed',
        planName,
        transactionId: txId,
        paymentMethod: method,
        invoiceUrl: invoiceUrl || null,
        paidAt: paidAt ? new Date(paidAt) : new Date()
      }
    });

    // Optionally upgrade client's active subscription plan
    if (upgradePlan) {
      await prisma.user.update({
        where: { id: clientId },
        data: {
          subscriptionPlan: upgradePlan.toLowerCase(),
          subscriptionStatus: 'active'
        }
      });
    }

    await logActivity({
      userId: clientId,
      action: method === 'credits' ? 'PAYMENT_VIA_CREDITS' : (method === 'free_credits' ? 'FREE_CREDIT_GRANTED' : 'PAYMENT_RECORDED'),
      category: 'billing',
      details: {
        amount: numAmount,
        paymentMethod: method,
        planName,
        transactionId: txId,
        recordedBy: req.userEmail
      }
    });

    // Fetch updated user to return latest balance
    const updatedUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, creditBalance: true, subscriptionPlan: true }
    });

    res.json({
      success: true,
      payment,
      client: updatedUser
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record payment', details: err.message });
  }
});

/**
 * 🎁 Allocate / Adjust Free Credits for a Client Profile
 */
adminRouter.post('/clients/:id/credits', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.params.id;
    const { amount, type = 'add', reason = 'Free Credit Allocation', note } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'A valid positive credit amount is required' });
      return;
    }

    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    let newBalance = client.creditBalance || 0;
    if (type === 'add') {
      newBalance += numAmount;
    } else if (type === 'deduct') {
      if (newBalance < numAmount) {
        res.status(400).json({ error: `Cannot deduct ${numAmount} credits: Client only has ${newBalance.toFixed(2)} credits.` });
        return;
      }
      newBalance -= numAmount;
    } else if (type === 'set') {
      newBalance = numAmount;
    }

    const updatedUser = await prisma.user.update({
      where: { id: clientId },
      data: { creditBalance: Math.round(newBalance * 100) / 100 }
    });

    const txId = `CREDIT_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const payment = await prisma.payment.create({
      data: {
        userId: clientId,
        amount: numAmount,
        currency: 'CREDITS',
        status: 'completed',
        planName: `${type === 'deduct' ? 'Credit Deduction' : 'Free Credit Allocation'}: ${reason}`,
        transactionId: txId,
        paymentMethod: type === 'deduct' ? 'credits' : 'free_credits',
        invoiceUrl: note || null,
        paidAt: new Date()
      }
    });

    await logActivity({
      userId: clientId,
      action: type === 'deduct' ? 'CREDIT_DEDUCTED' : 'FREE_CREDIT_ALLOCATED',
      category: 'billing',
      details: {
        amount: numAmount,
        type,
        previousBalance: client.creditBalance,
        newBalance: updatedUser.creditBalance,
        reason,
        allocatedBy: req.userEmail
      }
    });

    res.json({
      success: true,
      message: `Successfully allocated ${numAmount} credits to ${client.name || client.email}. New Balance: ${updatedUser.creditBalance.toFixed(2)} Credits.`,
      newBalance: updatedUser.creditBalance,
      payment
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to allocate credits', details: err.message });
  }
});

/**
 * 🔄 Update Client Subscription Plan / Status
 */
adminRouter.put('/clients/:id/plan', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.params.id;
    const { plan, status, company } = req.body;

    const updated = await prisma.user.update({
      where: { id: clientId },
      data: {
        subscriptionPlan: plan ? String(plan).toLowerCase() : undefined,
        subscriptionStatus: status ? String(status).toLowerCase() : undefined,
        company: company !== undefined ? String(company) : undefined
      }
    });

    await logActivity({
      userId: clientId,
      action: 'SUBSCRIPTION_PLAN_UPDATED',
      category: 'billing',
      details: { newPlan: plan, newStatus: status, updatedBy: req.userEmail }
    });

    res.json({ success: true, client: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update client subscription', details: err.message });
  }
});

/**
 * ⏳ Extend Client's 1-Month Free Trial (+30 days)
 */
adminRouter.post('/clients/:id/extend-trial', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.params.id;
    const daysToAdd = Number(req.body.days) || 30;

    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const currentEnd = client.trialEndsAt && new Date(client.trialEndsAt) > new Date()
      ? new Date(client.trialEndsAt)
      : new Date();

    const newTrialEndsAt = new Date(currentEnd.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const updatedUser = await prisma.user.update({
      where: { id: clientId },
      data: {
        trialEndsAt: newTrialEndsAt,
        subscriptionStatus: 'trial',
        subscriptionPlan: client.subscriptionPlan === 'free' ? 'trial' : client.subscriptionPlan
      }
    });

    await logActivity({
      userId: clientId,
      action: 'TRIAL_EXTENDED',
      category: 'billing',
      details: {
        daysAdded: daysToAdd,
        newTrialEndsAt,
        extendedBy: req.userEmail
      }
    });

    const trial = computeTrialStatus(updatedUser);

    res.json({
      success: true,
      message: `✓ Free trial extended by ${daysToAdd} days for ${client.name || client.email}. Valid until ${newTrialEndsAt.toLocaleDateString()}.`,
      trial,
      client: updatedUser
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to extend trial', details: err.message });
  }
});

/**
 * 📜 Global Audit Logs: Search & Stream all client actions
 */
adminRouter.get('/logs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, action, clientId, limit = '100', offset = '0' } = req.query;

    const logs = await prisma.activityLog.findMany({
      where: {
        category: category ? String(category) : undefined,
        action: action ? String(action) : undefined,
        userId: clientId ? String(clientId) : undefined
      },
      take: Math.min(Number(limit) || 100, 500),
      skip: Number(offset) || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, company: true }
        }
      }
    });

    const total = await prisma.activityLog.count({
      where: {
        category: category ? String(category) : undefined,
        action: action ? String(action) : undefined,
        userId: clientId ? String(clientId) : undefined
      }
    });

    res.json({ success: true, total, count: logs.length, logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve logs', details: err.message });
  }
});

/**
 * 💰 Global Payments Ledger
 */
adminRouter.get('/payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { paidAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, company: true }
        }
      }
    });

    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      count: payments.length,
      payments
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve payment records', details: err.message });
  }
});
