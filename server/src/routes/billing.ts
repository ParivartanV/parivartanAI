import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { computeTrialStatus } from '../utils/trial.js';
import { logActivity } from '../utils/logger.js';

export const billingRouter = Router();

// Protect all billing endpoints
billingRouter.use(requireAuth);

/**
 * 📊 Get Client Trial, Credit, & Subscription Status
 */
billingRouter.get('/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        creditBalance: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        billingCycle: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const trial = computeTrialStatus(user);

    res.json({
      success: true,
      user,
      trial
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve billing status', details: err.message });
  }
});

/**
 * 🪙 Buy Credits (Pay-As-You-Go Packages)
 */
billingRouter.post('/buy-credits', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { pack, amount: customAmount, paymentMethod = 'credit_card' } = req.body;
    let creditsToAdd = 0;
    let priceUsd = 0;
    let planLabel = '';

    if (pack === 'small' || customAmount === 100) {
      creditsToAdd = 100;
      priceUsd = 10.00;
      planLabel = 'Starter Pack (100 Credits)';
    } else if (pack === 'medium' || customAmount === 500) {
      creditsToAdd = 500;
      priceUsd = 40.00;
      planLabel = 'Growth Pack (500 Credits)';
    } else if (pack === 'large' || customAmount === 1000) {
      creditsToAdd = 1000;
      priceUsd = 70.00;
      planLabel = 'Pro Volume Pack (1,000 Credits)';
    } else {
      creditsToAdd = Number(customAmount) || 100;
      priceUsd = Math.round(creditsToAdd * 0.10 * 100) / 100;
      planLabel = `Custom Credit Pack (${creditsToAdd} Credits)`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        creditBalance: { increment: creditsToAdd },
        subscriptionStatus: 'active'
      }
    });

    const txId = `CRD_BUY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        userId: req.userId!,
        amount: priceUsd,
        currency: 'USD',
        status: 'completed',
        planName: planLabel,
        transactionId: txId,
        paymentMethod,
        paidAt: new Date()
      }
    });

    await logActivity({
      userId: req.userId,
      action: 'CREDITS_PURCHASED',
      category: 'billing',
      details: {
        creditsAdded: creditsToAdd,
        newBalance: updatedUser.creditBalance,
        priceUsd,
        transactionId: txId,
        paymentMethod
      }
    });

    const trial = computeTrialStatus(updatedUser);

    res.json({
      success: true,
      message: `✓ Successfully purchased ${creditsToAdd} Credits for $${priceUsd.toFixed(2)}!`,
      creditsAdded: creditsToAdd,
      newBalance: updatedUser.creditBalance,
      payment,
      trial
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to purchase credits', details: err.message });
  }
});

/**
 * 📅 Subscribe to Monthly Subscription Plan ($9.99/mo Pro or $29.99/mo Enterprise)
 */
billingRouter.post('/subscribe', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { plan = 'pro', paymentMethod = 'credit_card' } = req.body;
    const targetPlan = plan.toLowerCase() === 'enterprise' ? 'enterprise' : 'pro';
    const isEnterprise = targetPlan === 'enterprise';
    const priceUsd = isEnterprise ? 29.99 : 9.99;
    const bonusCredits = isEnterprise ? 1000 : 250;
    const planName = isEnterprise ? 'Enterprise Monthly Subscription' : 'Pro Monthly Subscription';

    const currentUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if paying with existing internal credits
    if (paymentMethod === 'credits') {
      const creditCost = isEnterprise ? 300 : 100;
      if ((currentUser.creditBalance || 0) < creditCost) {
        res.status(400).json({
          error: `Insufficient credits to activate monthly plan. Requires ${creditCost} credits, but you only have ${currentUser.creditBalance || 0} credits.`
        });
        return;
      }
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          creditBalance: { decrement: creditCost }
        }
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        subscriptionPlan: targetPlan,
        subscriptionStatus: 'active',
        billingCycle: 'monthly',
        creditBalance: { increment: bonusCredits }
      }
    });

    const txId = `SUB_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        userId: req.userId!,
        amount: paymentMethod === 'credits' ? 0 : priceUsd,
        currency: paymentMethod === 'credits' ? 'CREDITS' : 'USD',
        status: 'completed',
        planName,
        transactionId: txId,
        paymentMethod,
        paidAt: new Date()
      }
    });

    await logActivity({
      userId: req.userId,
      action: 'MONTHLY_PLAN_ACTIVATED',
      category: 'billing',
      details: {
        plan: targetPlan,
        priceUsd,
        bonusCredits,
        paymentMethod,
        transactionId: txId
      }
    });

    const trial = computeTrialStatus(updatedUser);

    res.json({
      success: true,
      message: `✓ Upgraded to ${targetPlan.toUpperCase()} Monthly plan! +${bonusCredits} monthly credits added.`,
      plan: targetPlan,
      trial,
      payment
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to activate subscription', details: err.message });
  }
});
