import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Indisponible en production' }, { status: 403 });
    }

    const { email, userId } = await req.json().catch(() => ({} as any));
    if (!email && !userId) {
      return NextResponse.json({ error: 'email ou userId requis' }, { status: 400 });
    }

    const supabase = supabaseServer();

    let uid = userId as string | undefined;
    if (!uid && email) {
      // Recherche simple par email (jusqu’à 100 premiers utilisateurs)
      const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
      if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
      const target = list.users.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase());
      uid = target?.id;
    }

    if (!uid) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Confirme l’email et s’assure du rôle admin dans les metadata
    const { error: updErr } = await supabase.auth.admin.updateUserById(uid, {
      email_confirm: true,
      user_metadata: { role: 'admin' },
    } as any);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
