import type { NextApiRequest, NextApiResponse } from 'next';

// Endpoint legacy désactivé: migration vers Supabase Storage via /api/upload (App Router)
export const config = { api: { bodyParser: true } };

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({ error: 'API migrée vers Supabase - endpoint indisponible' });
}
