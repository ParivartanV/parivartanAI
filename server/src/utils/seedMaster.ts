import prisma from '../prisma.js';
import { hashPassword } from './password.js';

export async function seedMasterAdmin(): Promise<void> {
  const masterEmail = (process.env.MASTER_ADMIN_EMAIL || 'parivartanvishalsingh@gmail.com').trim().toLowerCase();
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD || 'kmbl1110';
  const master2faPin = process.env.MASTER_2FA_PIN || '312866';
  const masterName = 'Vishal Singh';
  const masterGoogleId = `master_admin_${Buffer.from(masterEmail).toString('hex').slice(0, 16)}`;

  try {
    const existing = await prisma.user.findUnique({ where: { email: masterEmail } });
    const passwordHash = existing?.passwordHash || hashPassword(masterPassword);

    await prisma.user.upsert({
      where: { email: masterEmail },
      update: {
        role: 'admin',
        twoFactorPin: master2faPin,
        twoFactorEnabled: true,
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'active',
        company: 'Parivartan HQ',
        lastActiveAt: new Date()
      },
      create: {
        googleId: masterGoogleId,
        email: masterEmail,
        passwordHash,
        twoFactorPin: master2faPin,
        twoFactorEnabled: true,
        name: masterName,
        role: 'admin',
        company: 'Parivartan HQ',
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'active',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(masterName)}`,
        settings: {
          create: {
            theme: 'day',
            defaultAuthor: masterName,
          }
        }
      }
    });
    console.log(`👑 Master Admin account initialized: ${masterEmail} (2FA PIN: ${master2faPin})`);
  } catch (err) {
    console.error('Error seeding Master Admin account:', err);
  }
}
