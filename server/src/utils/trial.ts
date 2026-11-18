/**
 * 1-Month Free Trial, Credit Pay-As-You-Go, and Monthly Subscription Policy
 */

export interface TrialStatus {
  isMaster: boolean;
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  trialDaysLeft: number;
  isTrialActive: boolean;
  isPaidPlan: boolean;
  creditBalance: number;
  hasCredits: boolean;
  canAccess: boolean;
  lockReason: 'trial_expired_need_credits_or_plan' | null;
  message: string;
}

export function computeTrialStatus(user: {
  role?: string | null;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  trialEndsAt?: Date | string | null;
  creditBalance?: number | null;
  createdAt?: Date | string | null;
}): TrialStatus {
  const isMaster = user.role === 'admin';
  if (isMaster) {
    return {
      isMaster: true,
      plan: 'enterprise',
      status: 'active',
      trialEndsAt: null,
      trialDaysLeft: 9999,
      isTrialActive: false,
      isPaidPlan: true,
      creditBalance: typeof user.creditBalance === 'number' ? user.creditBalance : 999999,
      hasCredits: true,
      canAccess: true,
      lockReason: null,
      message: 'Master Administrator (Lifetime Enterprise Access)'
    };
  }

  const plan = (user.subscriptionPlan || 'trial').toLowerCase();
  const status = (user.subscriptionStatus || 'trial').toLowerCase();
  const credits = typeof user.creditBalance === 'number' ? user.creditBalance : 0;
  const hasCredits = credits > 0;

  // Paid monthly/annual plans
  const isPaidPlan = (plan === 'pro' || plan === 'enterprise') && status === 'active';

  // Calculate 1-month (30-day) free trial from signup
  const now = new Date();
  let trialEnd: Date;
  if (user.trialEndsAt) {
    trialEnd = new Date(user.trialEndsAt);
  } else if (user.createdAt) {
    trialEnd = new Date(new Date(user.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  } else {
    trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const msLeft = trialEnd.getTime() - now.getTime();
  const trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  const isTrialActive = msLeft > 0 && (plan === 'trial' || plan === 'free' || status === 'trial');

  // Full access allowed if:
  // 1. Paid active plan
  // 2. 1-Month free trial still running
  // 3. User has positive credits balance to pay-as-you-go
  const canAccess = isPaidPlan || isTrialActive || hasCredits;

  let lockReason: 'trial_expired_need_credits_or_plan' | null = null;
  let message = '';

  if (isPaidPlan) {
    message = `Active ${plan.toUpperCase()} Plan`;
  } else if (isTrialActive) {
    message = `1-Month Free Trial (${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining)`;
  } else if (hasCredits) {
    message = `Pay-As-You-Go (${credits.toFixed(1)} Credits available)`;
  } else {
    lockReason = 'trial_expired_need_credits_or_plan';
    message = 'Your 1-Month Free Trial has expired. Please buy credits or subscribe to a monthly plan to continue.';
  }

  return {
    isMaster: false,
    plan,
    status,
    trialEndsAt: trialEnd,
    trialDaysLeft,
    isTrialActive,
    isPaidPlan,
    creditBalance: credits,
    hasCredits,
    canAccess,
    lockReason,
    message
  };
}
