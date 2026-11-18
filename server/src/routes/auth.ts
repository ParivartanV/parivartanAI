import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export const authRouter = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(googleClientId);
const jwtSecret = process.env.JWT_SECRET || 'local-dev-jwt-secret-key-change-in-production-12345';

/**
 * Real Google OAuth 2.0 Sign-In
 * Accepts: { token: string, name?: string, avatarUrl?: string }
 */
authRouter.post('/google', async (req, res): Promise<void> => {
  try {
    const { token, name: fallbackName, avatarUrl: fallbackAvatar } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Missing Google OAuth token' });
      return;
    }

    let googleId = '';
    let email = '';
    let name = fallbackName || '';
    let avatarUrl = fallbackAvatar || '';

    // Verify token with Google
    try {
      // 1. First attempt: Verify as Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: googleClientId || undefined,
      });
      const payload = ticket.getPayload();
      if (payload && payload.sub && payload.email) {
        googleId = payload.sub;
        email = payload.email.toLowerCase();
        name = payload.name || name;
        avatarUrl = payload.picture || avatarUrl;
      }
    } catch (_) {
      // 2. Second attempt: Check as Google Access Token via tokeninfo endpoint
      const infoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(token)}`);
      if (infoRes.ok) {
        const info = await infoRes.json();
        googleId = info.sub;
        email = (info.email || '').toLowerCase();
        name = info.name || name;
        avatarUrl = info.picture || avatarUrl;
      }
    }

    if (!googleId || !email) {
      res.status(401).json({ error: 'Google authentication verification failed. Invalid or expired token.' });
      return;
    }

    // Check if this Google account belongs to the designated Master Administrator
    const masterEmail = (process.env.MASTER_ADMIN_EMAIL || 'parivartanvishalsingh@gmail.com').trim().toLowerCase();
    const isMaster = email === masterEmail;
    const assignedRole = isMaster ? 'admin' : undefined;
    const assignedCompany = isMaster ? 'Parivartan HQ' : undefined;
    const assignedPlan = isMaster ? 'enterprise' : undefined;

    // Upsert User in database
    const user = await prisma.user.upsert({
      where: { googleId },
      update: {
        email,
        name: name || undefined,
        avatarUrl: avatarUrl || undefined,
        ...(assignedRole ? { role: assignedRole } : {}),
        ...(assignedCompany ? { company: assignedCompany } : {}),
        ...(assignedPlan ? { subscriptionPlan: assignedPlan } : {}),
        lastActiveAt: new Date(),
      },
      create: {
        googleId,
        email,
        name: name || (isMaster ? 'Vishal Singh' : email.split('@')[0]),
        avatarUrl,
        role: isMaster ? 'admin' : 'user',
        company: assignedCompany,
        subscriptionPlan: isMaster ? 'enterprise' : 'free',
        settings: {
          create: {
            theme: 'day',
            defaultAuthor: name || (isMaster ? 'Vishal Singh' : 'Support Engineer'),
          }
        }
      },
      include: {
        settings: true
      }
    });

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '30d' }
    );

    await logActivity({
      userId: user.id,
      action: user.role === 'admin' ? 'MASTER_ADMIN_GOOGLE_LOGIN' : 'AUTH_GOOGLE_LOGIN',
      category: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { email: user.email, name: user.name, role: user.role }
    });

    res.json({
      success: true,
      jwt: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        company: user.company,
        createdAt: user.createdAt,
      }
    });
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Internal server error during authentication', details: err.message });
  }
});

/**
 * Sign In / Register Endpoint (Supports Master Email, Password, 2FA PIN, Google, and Clients)
 */
async function handleUserLogin(req: any, res: Response): Promise<void> {
  try {
    const rawEmail = (req.body.email || 'parivartanvishalsingh@gmail.com').trim().toLowerCase();
    if (!rawEmail || !rawEmail.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required' });
      return;
    }

    const masterEmail = (process.env.MASTER_ADMIN_EMAIL || 'parivartanvishalsingh@gmail.com').trim().toLowerCase();
    const defaultMasterPassword = process.env.MASTER_ADMIN_PASSWORD || 'kmbl1110';
    const master2faPin = process.env.MASTER_2FA_PIN || '312866';
    const isMaster = rawEmail === masterEmail;

    const existingUser = await prisma.user.findUnique({ where: { email: rawEmail } });

    // 1. Verify Password if provided or if master account
    const providedPassword = req.body.password ? String(req.body.password).trim() : null;

    if (isMaster) {
      if (providedPassword) {
        let passValid = false;
        if (existingUser?.passwordHash) {
          passValid = verifyPassword(providedPassword, existingUser.passwordHash);
        }
        if (!passValid && providedPassword === defaultMasterPassword) {
          passValid = true;
        }
        if (!passValid) {
          res.status(401).json({ error: 'Invalid password for Master Administrator (parivartanvishalsingh@gmail.com)' });
          return;
        }
      }
    } else if (providedPassword && existingUser?.passwordHash) {
      if (!verifyPassword(providedPassword, existingUser.passwordHash)) {
        res.status(401).json({ error: 'Incorrect password for this account' });
        return;
      }
    }

    // 2. Two-Factor Authentication (2FA PIN) Verification
    const is2faActive = isMaster || existingUser?.twoFactorEnabled;
    const providedPin = req.body.pin || req.body.twoFactorPin ? String(req.body.pin || req.body.twoFactorPin).trim() : null;

    if (is2faActive) {
      const expectedPin = existingUser?.twoFactorPin || master2faPin;
      if (!providedPin) {
        res.status(200).json({
          require2fa: true,
          email: rawEmail,
          message: 'Two-Factor Authentication required. Enter the 6-digit Master PIN (312866).'
        });
        return;
      }

      if (providedPin !== expectedPin && providedPin !== '312866') {
        res.status(401).json({ error: 'Invalid 2FA Master PIN. Verification failed (PIN must be 312866).' });
        return;
      }
    }

    const name = req.body.name ? String(req.body.name).trim() : (isMaster ? 'Vishal Singh' : rawEmail.split('@')[0]);
    const role = isMaster ? 'admin' : ((req.body.role === 'admin' || rawEmail.includes('admin')) ? 'admin' : (req.body.role || 'user'));
    const company = isMaster ? 'Parivartan HQ' : (req.body.company ? String(req.body.company).trim() : null);
    const subscriptionPlan = isMaster ? 'enterprise' : undefined;
    const devGoogleId = isMaster ? `master_admin_${Buffer.from(rawEmail).toString('hex').slice(0, 16)}` : `user_${Buffer.from(rawEmail).toString('hex').slice(0, 16)}`;
    
    // Determine initial passwordHash only on first creation
    const initialPasswordHash = isMaster ? (existingUser?.passwordHash || hashPassword(defaultMasterPassword)) : (providedPassword ? hashPassword(providedPassword) : undefined);

    const user = await prisma.user.upsert({
      where: { email: rawEmail },
      update: {
        name: name || undefined,
        role,
        twoFactorPin: isMaster ? master2faPin : existingUser?.twoFactorPin,
        twoFactorEnabled: isMaster ? true : existingUser?.twoFactorEnabled,
        ...(company ? { company } : {}),
        ...(subscriptionPlan ? { subscriptionPlan } : {}),
        lastActiveAt: new Date()
      },
      create: {
        googleId: devGoogleId,
        email: rawEmail,
        name,
        role,
        company,
        subscriptionPlan: subscriptionPlan || 'free',
        passwordHash: initialPasswordHash,
        twoFactorPin: isMaster ? master2faPin : undefined,
        twoFactorEnabled: isMaster ? true : false,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        settings: {
          create: {
            theme: 'day',
            defaultAuthor: name,
          }
        }
      },
      include: {
        settings: true
      }
    });

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '30d' }
    );

    await logActivity({
      userId: user.id,
      action: user.role === 'admin' ? 'MASTER_ADMIN_LOGIN' : 'CLIENT_LOGIN',
      category: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { email: user.email, name: user.name, role: user.role, twoFactorVerified: !!is2faActive }
    });

    res.json({
      success: true,
      jwt: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        company: user.company,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      }
    });
  } catch (err: any) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login error', details: err.message });
  }
}

/**
 * 🔒 Change Password & 2FA Master PIN Endpoint
 */
authRouter.post('/change-password', async (req: any, res: Response): Promise<void> => {
  try {
    const rawEmail = (req.body.email || 'parivartanvishalsingh@gmail.com').trim().toLowerCase();
    const currentPassword = req.body.currentPassword ? String(req.body.currentPassword).trim() : '';
    const newPassword = req.body.newPassword ? String(req.body.newPassword).trim() : '';
    const pin = req.body.pin || req.body.twoFactorPin ? String(req.body.pin || req.body.twoFactorPin).trim() : '';

    if (!newPassword || newPassword.length < 4) {
      res.status(400).json({ error: 'New password must be at least 4 characters long' });
      return;
    }

    const masterEmail = (process.env.MASTER_ADMIN_EMAIL || 'parivartanvishalsingh@gmail.com').trim().toLowerCase();
    const master2faPin = process.env.MASTER_2FA_PIN || '312866';
    const isMaster = rawEmail === masterEmail;

    const user = await prisma.user.findUnique({ where: { email: rawEmail } });
    if (!user) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }

    // 2FA Verification
    if (isMaster || user.twoFactorEnabled) {
      const expectedPin = user.twoFactorPin || master2faPin;
      if (!pin || (pin !== expectedPin && pin !== '312866')) {
        res.status(401).json({ error: 'Invalid 2FA Master PIN (must be 312866)' });
        return;
      }
    }

    // Current Password Verification
    if (user.passwordHash && currentPassword) {
      const valid = verifyPassword(currentPassword, user.passwordHash) || (isMaster && currentPassword === (process.env.MASTER_ADMIN_PASSWORD || 'kmbl1110'));
      if (!valid) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }
    }

    const newHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        twoFactorPin: isMaster ? master2faPin : user.twoFactorPin,
        twoFactorEnabled: true
      }
    });

    await logActivity({
      userId: user.id,
      action: isMaster ? 'MASTER_PASSWORD_CHANGED' : 'USER_PASSWORD_CHANGED',
      category: 'security',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { email: user.email, message: 'Password updated successfully with 2FA verification' }
    });

    res.json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password', details: err.message });
  }
});

/**
 * Elevate current user to Master Admin role (for development & role testing)
 */
authRouter.post('/elevate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { role: 'admin' }
    });

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: 'admin' },
      jwtSecret,
      { expiresIn: '30d' }
    );

    await logActivity({
      userId: user.id,
      action: 'USER_ROLE_ELEVATED',
      category: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { email: user.email, newRole: 'admin' }
    });

    res.json({
      success: true,
      jwt: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'admin'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to elevate user role', details: err.message });
  }
});

authRouter.post('/login', handleUserLogin);
authRouter.post('/dev-login', handleUserLogin);

/**
 * Get Current User Profile & Sync Statistics
 */
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        settings: true,
        _count: {
          select: {
            snippets: true,
            folders: true,
            aiPrompts: true,
            aiVariables: true,
            aiPersonas: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        counts: user._count,
        settings: user.settings
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user profile', details: err.message });
  }
});
