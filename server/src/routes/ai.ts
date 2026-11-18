import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const aiRouter = Router();

aiRouter.use(requireAuth);

/**
 * AI Prompts
 */
aiRouter.get('/prompts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const prompts = await prisma.aiPrompt.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ prompts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve AI prompts', details: err.message });
  }
});

aiRouter.post('/prompts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, title, category, template, description, shortcut } = req.body;
    if (!title || !template) {
      res.status(400).json({ error: 'Title and template are required' });
      return;
    }

    const clientPromptId = id || `prompt_${Date.now()}`;
    const prompt = await prisma.aiPrompt.upsert({
      where: { userId_clientPromptId: { userId: req.userId!, clientPromptId } },
      update: {
        title,
        category: category || 'general',
        template,
        description: description || '',
        shortcut: shortcut || ''
      },
      create: {
        userId: req.userId!,
        clientPromptId,
        title,
        category: category || 'general',
        template,
        description: description || '',
        shortcut: shortcut || ''
      }
    });

    res.json({ success: true, prompt });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save prompt', details: err.message });
  }
});

/**
 * AI Dynamic Variables
 */
aiRouter.get('/variables', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const variables = await prisma.aiVariable.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ variables });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve variables', details: err.message });
  }
});

aiRouter.post('/variables', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { key, name, defaultValue, description, isSystem } = req.body;
    if (!key) {
      res.status(400).json({ error: 'Variable key is required' });
      return;
    }

    const variable = await prisma.aiVariable.upsert({
      where: { userId_key: { userId: req.userId!, key } },
      update: {
        name: name || key,
        defaultValue: defaultValue !== undefined ? String(defaultValue) : '',
        description: description || '',
        isSystem: !!isSystem
      },
      create: {
        userId: req.userId!,
        key,
        name: name || key,
        defaultValue: defaultValue !== undefined ? String(defaultValue) : '',
        description: description || '',
        isSystem: !!isSystem
      }
    });

    res.json({ success: true, variable });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save variable', details: err.message });
  }
});

/**
 * AI Custom Personas
 */
aiRouter.get('/personas', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const personas = await prisma.aiPersona.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ personas });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve personas', details: err.message });
  }
});
