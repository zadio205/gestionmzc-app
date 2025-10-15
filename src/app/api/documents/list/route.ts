import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const bucket = process.env.SUPABASE_BUCKET || 'uploads';

    const body = await req.json().catch(() => ({}));
    const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
    const entryId = typeof body?.entryId === 'string' ? body.entryId.trim() : '';
    if (!clientId || !entryId) {
      return NextResponse.json({ error: 'clientId et entryId requis' }, { status: 400 });
    }

    const path = `clients/${clientId}/ledger/${entryId}`;
    const supabase = supabaseServer();

    const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } as any });
    if (error) {
      const msg = error.message || 'Liste échouée';
      const status = /not found|does not exist/i.test(msg) ? 404 : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    const files = (data || []).map((f) => {
      const fullPath = `${path}/${f.name}`;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fullPath);
      return {
        name: f.name,
        size: f.metadata?.size ?? null,
        createdAt: f.created_at || null,
        updatedAt: f.updated_at || null,
        path: fullPath,
        url: pub.publicUrl,
      };
    });

    return NextResponse.json({ files }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
