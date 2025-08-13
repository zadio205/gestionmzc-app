import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const bucket = process.env.SUPABASE_BUCKET;
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

    const supabase = supabaseServer();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({ path, url: data.publicUrl }, { status: 200 });
  } catch (err: any) {
    console.error('Erreur upload supabase:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
