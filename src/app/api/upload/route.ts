import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';

// GET /api/upload -> diagnostic rapide de config
export async function GET() {
  try {
  const bucket = process.env.SUPABASE_BUCKET || 'uploads';
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const details: any = {
      bucketConfigured: !!bucket,
      bucketName: bucket || null,
      serviceConfigured: !!SUPABASE_URL && !!SUPABASE_SERVICE_ROLE_KEY,
    };
    if (!bucket || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ ok: false, ...details }, { status: 200 });
    }
    try {
      const supabase = supabaseServer();
      // Essayer un list minimal pour vérifier l'existence du bucket/chemin
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      details.bucketListOk = !error;
      details.bucketError = error?.message || null;
      return NextResponse.json({ ok: !error, ...details }, { status: 200 });
    } catch (e: any) {
      details.exception = e?.message || String(e);
      return NextResponse.json({ ok: false, ...details }, { status: 200 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Erreur diagnostic' }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
  const bucket = process.env.SUPABASE_BUCKET || 'uploads';
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
  const clientId = (form.get('clientId') as string) || '';
  const entryId = (form.get('entryId') as string) || '';
  const category = (form.get('category') as string) || ''; // achats ou ventes
  const montant = parseFloat((form.get('montant') as string) || '0');

    if (!file) {
      return NextResponse.json({ error: 'Paramètre "file" manquant' }, { status: 400 });
    }

    const name = (file as any).name || 'upload.bin';
    const ext = name.includes('.') ? name.split('.').pop() : 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${folder}/${fileName}`;

    // Contenu binaire sous forme d'ArrayBuffer (compatible Node pour supabase-js)
    const arrayBuffer = await file.arrayBuffer();

    const supabase = supabaseServer();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, { contentType: file.type || 'application/octet-stream', upsert: false });

    if (error) {
      // Messages plus parlants selon les cas fréquents
      const msg = error.message || 'Upload échoué';
      const isBucketMissing = /bucket.*(not found|does not exist)/i.test(msg) || /No such file or directory/i.test(msg);
      const isAuth = /unauthorized|invalid key|permission|policy/i.test(msg);
      const status = isBucketMissing ? 400 : isAuth ? 401 : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    // Tentative de mirroring dans l'espace GED client (general) pour faciliter le téléchargement côté GED
    let mirror: { path?: string; url?: string } | null = null;
    if (clientId && entryId && entryId !== 'general') {
      try {
        const mirrorPath = `clients/${clientId}/ledger/general/${fileName}`;
        const { error: mirrorErr } = await supabase.storage
          .from(bucket)
          .upload(mirrorPath, arrayBuffer, { contentType: file.type || 'application/octet-stream', upsert: false });
        if (!mirrorErr) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(mirrorPath);
          mirror = { path: mirrorPath, url: pub.publicUrl };
        }
      } catch {}
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    
    // Retourner les infos incluant la catégorie pour le service de justificatifs
    return NextResponse.json({ 
      path, 
      url: data.publicUrl, 
      mirroredToGeneral: !!mirror, 
      mirror,
      category: category || (montant < 0 ? 'achats' : 'ventes'), // Déterminé automatiquement si non fourni
      bucket
    }, { status: 200 });
  } catch (err: any) {
    console.error('Erreur upload supabase:', err);
    const message = typeof err?.message === 'string' ? err.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
