import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

export const syncRouter = Router();

/**
 * PULL: Download all cloud data for the authenticated client
 */
syncRouter.get('/pull', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const [folders, snippets, aiPrompts, aiVariables, aiPersonas, settings] = await Promise.all([
      prisma.folder.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.snippet.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
      prisma.aiPrompt.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
      prisma.aiVariable.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.aiPersona.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.userSetting.findUnique({ where: { userId } })
    ]);

    // Parse JSON tags for snippets
    const formattedSnippets = snippets.map(s => {
      let tagsArray: string[] = [];
      try {
        tagsArray = JSON.parse(s.tags);
      } catch (_) {
        tagsArray = [];
      }
      return {
        id: s.clientSnippetId,
        folderId: s.folderId ? (folders.find(f => f.id === s.folderId)?.clientFolderId || s.folderId) : undefined,
        title: s.title,
        shortcut: s.shortcut,
        content: s.content,
        tags: tagsArray,
        usageCount: s.usageCount,
        updatedAt: s.updatedAt.getTime(),
        createdAt: s.createdAt.getTime(),
      };
    });

    const formattedFolders = folders.map(f => ({
      id: f.clientFolderId,
      name: f.name,
      createdAt: f.createdAt.getTime(),
    }));

    const formattedPrompts = aiPrompts.map(p => ({
      id: p.clientPromptId,
      title: p.title,
      category: p.category,
      template: p.template,
      description: p.description || '',
      shortcut: p.shortcut || '',
      updatedAt: p.updatedAt.getTime(),
    }));

    const formattedVariables = aiVariables.map(v => ({
      id: v.id,
      key: v.key,
      name: v.name,
      defaultValue: v.defaultValue || '',
      description: v.description || '',
      isSystem: v.isSystem
    }));

    const formattedPersonas = aiPersonas.map(p => ({
      id: p.clientPersonaId,
      name: p.name,
      role: p.role || '',
      icon: p.icon || '🎭',
      systemPrompt: p.systemPrompt,
      isCustom: p.isCustom
    }));

    await logActivity({
      userId,
      action: 'SYNC_PULL_SUCCESS',
      category: 'sync',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { snippetCount: formattedSnippets.length, folderCount: formattedFolders.length }
    });

    res.json({
      success: true,
      syncedAt: Date.now(),
      data: {
        folders: formattedFolders,
        snippets: formattedSnippets,
        prompts: formattedPrompts,
        variables: formattedVariables,
        personas: formattedPersonas,
        settings: settings || { theme: 'day', defaultAuthor: 'Support Engineer' }
      }
    });
  } catch (err: any) {
    console.error('Sync Pull Error:', err);
    res.status(500).json({ error: 'Failed to pull cloud data', details: err.message });
  }
});

/**
 * PUSH: Upload client changes (snippets, folders, AI prompts, variables, settings) to cloud database
 */
syncRouter.post('/push', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { folders, snippets, prompts, variables, personas, settings } = req.body;

    // 1. Process Folders
    const folderDbMap: Record<string, string> = {};
    if (Array.isArray(folders)) {
      for (const f of folders) {
        if (!f || !f.id || !f.name) continue;
        const saved = await prisma.folder.upsert({
          where: {
            userId_clientFolderId: { userId, clientFolderId: f.id }
          },
          update: { name: f.name },
          create: {
            userId,
            clientFolderId: f.id,
            name: f.name
          }
        });
        folderDbMap[f.id] = saved.id;
      }
    }

    // 2. Process Snippets
    if (Array.isArray(snippets)) {
      for (const s of snippets) {
        if (!s || !s.id || !s.title) continue;
        const dbFolderId = s.folderId ? folderDbMap[s.folderId] : undefined;

        await prisma.snippet.upsert({
          where: {
            userId_clientSnippetId: { userId, clientSnippetId: s.id }
          },
          update: {
            folderId: dbFolderId,
            title: s.title,
            shortcut: s.shortcut || '/snip',
            content: s.content || '',
            tags: JSON.stringify(Array.isArray(s.tags) ? s.tags : []),
            usageCount: typeof s.usageCount === 'number' ? s.usageCount : 0,
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date()
          },
          create: {
            userId,
            clientSnippetId: s.id,
            folderId: dbFolderId,
            title: s.title,
            shortcut: s.shortcut || '/snip',
            content: s.content || '',
            tags: JSON.stringify(Array.isArray(s.tags) ? s.tags : []),
            usageCount: typeof s.usageCount === 'number' ? s.usageCount : 0
          }
        });
      }
    }

    // 3. Process AI Prompts
    if (Array.isArray(prompts)) {
      for (const p of prompts) {
        if (!p || !p.id || !p.title) continue;
        await prisma.aiPrompt.upsert({
          where: {
            userId_clientPromptId: { userId, clientPromptId: p.id }
          },
          update: {
            title: p.title,
            category: p.category || 'general',
            template: p.template || '',
            description: p.description || '',
            shortcut: p.shortcut || ''
          },
          create: {
            userId,
            clientPromptId: p.id,
            title: p.title,
            category: p.category || 'general',
            template: p.template || '',
            description: p.description || '',
            shortcut: p.shortcut || ''
          }
        });
      }
    }

    // 4. Process AI Variables
    if (Array.isArray(variables)) {
      for (const v of variables) {
        if (!v || !v.key) continue;
        await prisma.aiVariable.upsert({
          where: {
            userId_key: { userId, key: v.key }
          },
          update: {
            name: v.name || v.key,
            defaultValue: v.defaultValue !== undefined ? String(v.defaultValue) : '',
            description: v.description || '',
            isSystem: !!v.isSystem
          },
          create: {
            userId,
            key: v.key,
            name: v.name || v.key,
            defaultValue: v.defaultValue !== undefined ? String(v.defaultValue) : '',
            description: v.description || '',
            isSystem: !!v.isSystem
          }
        });
      }
    }

    // 5. Process AI Personas
    if (Array.isArray(personas)) {
      for (const p of personas) {
        if (!p || !p.id || !p.name) continue;
        await prisma.aiPersona.upsert({
          where: {
            userId_clientPersonaId: { userId, clientPersonaId: p.id }
          },
          update: {
            name: p.name,
            role: p.role || '',
            icon: p.icon || '🎭',
            systemPrompt: p.systemPrompt || '',
            isCustom: p.isCustom !== false
          },
          create: {
            userId,
            clientPersonaId: p.id,
            name: p.name,
            role: p.role || '',
            icon: p.icon || '🎭',
            systemPrompt: p.systemPrompt || '',
            isCustom: p.isCustom !== false
          }
        });
      }
    }

    // 6. Process User Settings
    if (settings && typeof settings === 'object') {
      await prisma.userSetting.upsert({
        where: { userId },
        update: {
          theme: settings.theme || 'day',
          defaultAuthor: settings.defaultAuthor || 'Support Engineer',
          fontScale: typeof settings.fontScale === 'number' ? settings.fontScale : 1.0,
          lastSyncAt: new Date()
        },
        create: {
          userId,
          theme: settings.theme || 'day',
          defaultAuthor: settings.defaultAuthor || 'Support Engineer',
          fontScale: typeof settings.fontScale === 'number' ? settings.fontScale : 1.0,
          lastSyncAt: new Date()
        }
      });
    }

    await logActivity({
      userId,
      action: 'SYNC_PULL_SUCCESS',
      category: 'sync',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { snippetCount: formattedSnippets.length, folderCount: formattedFolders.length }
    });

    res.json({
      success: true,
      syncedAt: Date.now(),
      message: 'Cloud database synchronized successfully'
    });
  } catch (err: any) {
    console.error('Sync Push Error:', err);
    res.status(500).json({ error: 'Failed to push cloud data', details: err.message });
  }
});
