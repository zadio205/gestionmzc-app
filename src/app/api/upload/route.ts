import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const bucket = process.env.SUPABASE_BUCKET;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Configuration Supabase serveur manquante (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' }, { status: 500 });
    }
    if (!bucket) {
      return NextResponse.json({ error: 'SUPABASE_BUCKET manquant' }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const folder = (form.get('folder') as string) || 'public';

    if (!file) {
      return NextResponse.json({ error: 'Paramètre "file" manquant' }, { status: 400 });
    }

    const name = (file as any).name || 'upload.bin';
    const ext = name.includes('.') ? name.split('.').pop() : 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${folder}/${fileName}`;

    // Conversion en buffer pour compatibilité maximale côté Node
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const supabase = supabaseServer();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: false });

    if (error) {
      // Messages plus parlants selon les cas fréquents
      const msg = error.message || 'Upload échoué';
      const isBucketMissing = /bucket.*(not found|does not exist)/i.test(msg) || /No such file or directory/i.test(msg);
      const isAuth = /unauthorized|invalid key|permission|policy/i.test(msg);
      const status = isBucketMissing ? 400 : isAuth ? 401 : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({ path, url: data.publicUrl }, { status: 200 });
  } catch (err: any) {
    console.error('Erreur upload supabase:', err);
    const message = typeof err?.message === 'string' ? err.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
