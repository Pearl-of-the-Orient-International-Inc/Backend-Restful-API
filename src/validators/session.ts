import z from 'zod';

export const sessionIdPathSchema = z.object({
  sessionId: z.uuid({ error: 'Session ID must be a valid UUID' }),
});

export type SessionIdPathSchema = z.infer<typeof sessionIdPathSchema>;
