import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const snippetsRouter = Router();

// Apply auth to all snippet endpoints
snippetsRouter.use(requireAuth);

/**
 * List all snippets for current user
 */
snippetsRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const snippets = await prisma.snippet.findMany({
      where: { userId: req.userId! },
      include: { folder: true },
      orderBy: { updatedAt: 'desc' }
    });

    const formatted = snippets.map(s => {
      let tags: string[] = [];
      try { tags = JSON.parse(s.tags); } catch (_) {}
      return {
        id: s.clientSnippetId,
        title: s.title,
        shortcut: s.shortcut,
        content: s.content,
        folderId: s.folder?.clientFolderId,
        tags,
        usageCount: s.usageCount,
        updatedAt: s.updatedAt,
      };
    });

    res.json({ snippets: formatted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve snippets', details: err.message });
  }
});

/**
 * Create or Upsert a Snippet
 */
snippetsRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, title, shortcut, content, folderId, tags } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    const clientSnippetId = id || `snip_${Date.now()}`;
    let dbFolderId: string | undefined = undefined;

    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { userId_clientFolderId: { userId: req.userId!, clientFolderId: folderId } }
      });
      if (folder) dbFolderId = folder.id;
    }

    const snippet = await prisma.snippet.upsert({
      where: { userId_clientSnippetId: { userId: req.userId!, clientSnippetId } },
      update: {
        title,
        shortcut: shortcut || '/snip',
        content,
        folderId: dbFolderId,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        updatedAt: new Date()
      },
      create: {
        userId: req.userId!,
        clientSnippetId,
        title,
        shortcut: shortcut || '/snip',
        content,
        folderId: dbFolderId,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      }
    });

    res.json({ success: true, snippet });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save snippet', details: err.message });
  }
});

/**
 * Delete a Snippet
 */
snippetsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientSnippetId = req.params.id;
    await prisma.snippet.deleteMany({
      where: {
        userId: req.userId!,
        clientSnippetId
      }
    });

    res.json({ success: true, message: 'Snippet deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete snippet', details: err.message });
  }
});
