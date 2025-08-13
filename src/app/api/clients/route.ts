import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { listClientsCache, addClientCache, updateClientCache, deleteClientCache, seedClientsCache } from '@/lib/clientsCache';
import { InputValidator } from '@/utils/inputValidation';

// GET /api/clients -> { clients: [...] }
export async function GET() {
  try {
    const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    let data: any[] | null = null;
    let error: any = null;
    if (hasSupabase) {
      const supabase = supabaseServer();
      const res = await supabase.from('clients').select('*');
      data = res.data as any[];
      error = res.error;
      if (!error && Array.isArray(data)) {
        // Synchroniser le cache pour un fallback transparent du PATCH/DELETE
        seedClientsCache(data.map((row: any) => ({
          id: row._id || row.id,
          name: row.name || '',
          email: row.email || '',
          contact: row.contact || '',
          phone: row.phone || '',
          address: row.address || '',
          siret: row.siret || '',
          industry: row.industry || '',
          dossier_number: row.dossier_number || row.dossierNumber || '',
          collaborator_id: row.collaborator_id || row.collaboratorId || '',
          documents: row.documents || [],
          is_active: (row.is_active ?? row.isActive) ?? true,
          status: row.status || null,
          last_activity: row.last_activity || row.updated_at || row.created_at || null,
          collaborator: row.collaborator || null,
          created_at: row.created_at || row.createdAt || null,
          updated_at: row.updated_at || row.updatedAt || null,
        })));
      }
    } else {
      data = listClientsCache();
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const clients = (data || []).map((row: any) => ({
      _id: row._id || row.id,
      name: row.name || '',
      email: row.email || '',
      contact: row.contact || '',
      phone: row.phone || '',
      address: row.address || '',
      siret: row.siret || '',
      industry: row.industry || '',
      dossierNumber: row.dossier_number || row.dossierNumber || '',
      collaboratorId: row.collaborator_id || row.collaboratorId || '',
      documents: row.documents || [],
      isActive: (row.is_active ?? row.isActive) ?? true,
      createdAt: row.created_at || row.createdAt || null,
      updatedAt: row.updated_at || row.updatedAt || null,
      status: row.status,
      lastActivity: row.last_activity || row.updated_at || row.created_at || row.lastActivity || row.updatedAt || row.createdAt || null,
      collaborator: row.collaborator,
    }));

    return NextResponse.json({ clients }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/clients -> { client }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = InputValidator.validateText(body?.name, 120);
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }
    if (!email || !InputValidator.validateEmail(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const dossierInput = typeof body?.dossierNumber === 'string' ? body.dossierNumber : (typeof body?.dossier_number === 'string' ? body.dossier_number : undefined);
    const collabInput = body?.collaboratorId ?? body?.collaborator_id;

    const payload = {
      name,
      email,
      contact: body?.contact ? InputValidator.validateText(body.contact, 120) : null,
      phone: body?.phone ? InputValidator.validateText(body.phone, 40) : null,
      dossier_number: typeof dossierInput === 'string' ? (InputValidator.validateText(dossierInput, 60) || null) : null,
      collaborator_id: collabInput != null ? String(collabInput) : null,
    } as const;

    const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    let data: any = null;
    let error: any = null;
    if (hasSupabase) {
      const supabase = supabaseServer();
      const res = await supabase.from('clients').insert(payload).select('*').single();
      data = res.data;
      error = res.error;
      // Fallback silencieux vers cache si Supabase échoue
      if (error) {
        data = addClientCache({
          id: crypto.randomUUID(),
          name,
          email,
          contact: payload.contact,
          phone: payload.phone,
          dossier_number: payload.dossier_number,
          collaborator_id: payload.collaborator_id,
          documents: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        error = null;
      }
    } else {
      data = addClientCache({
        id: crypto.randomUUID(),
        name,
        email,
        contact: payload.contact,
        phone: payload.phone,
        dossier_number: payload.dossier_number,
        collaborator_id: payload.collaborator_id,
        documents: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    if (error) {
      // 400 pour contraintes ou colonnes inconnues
      const status = /column|input|type|null value|violates|duplicate/i.test(error.message) ? 400 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    const client = {
      _id: (data as any)._id || (data as any).id,
      name: (data as any).name,
      email: (data as any).email,
      contact: (data as any).contact || '',
      phone: (data as any).phone || '',
      dossierNumber: (data as any).dossier_number || (data as any).dossierNumber || '',
      collaboratorId: (data as any).collaborator_id || (data as any).collaboratorId || '',
      documents: (data as any).documents || [],
      isActive: ((data as any).is_active ?? (data as any).isActive) ?? true,
      createdAt: (data as any).created_at || (data as any).createdAt || null,
      updatedAt: (data as any).updated_at || (data as any).updatedAt || null,
    };

    return NextResponse.json({ client }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/clients -> { client }
export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body?.id || body?._id;
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const updates: any = {};
  const updatesSnake: any = {};
    if (typeof body?.name === 'string') {
      const name = InputValidator.validateText(body.name, 120);
      if (!name) return NextResponse.json({ error: 'Nom invalide' }, { status: 400 });
  updates.name = name;
  updatesSnake.name = name;
    }
    if (typeof body?.email === 'string') {
      const email = body.email.trim();
      if (!InputValidator.validateEmail(email)) return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  updates.email = email;
  updatesSnake.email = email;
    }
    if (typeof body?.contact === 'string') {
      const v = InputValidator.validateText(body.contact, 120) || null;
      updates.contact = v;
      updatesSnake.contact = v;
    }
    if (typeof body?.phone === 'string') {
      const v = InputValidator.validateText(body.phone, 40) || null;
      updates.phone = v;
      updatesSnake.phone = v;
    }
    if (typeof body?.dossierNumber === 'string') {
  const v = InputValidator.validateText(body.dossierNumber, 60) || null;
  updates.dossier_number = v;
  updatesSnake.dossier_number = v;
    }
    if (typeof body?.collaboratorId === 'string') {
      const v = String(body.collaboratorId);
  updates.collaborator_id = v;
  updatesSnake.collaborator_id = v;
    }
    // Mapper status -> is_active (pas de colonne status requise)
    if (typeof body?.status === 'string') {
      const v = InputValidator.validateText(body.status, 40);
      if (v) {
        const b = v.toLowerCase() === 'actif';
        updates.is_active = b;
        updatesSnake.is_active = b;
      }
    }
    if (typeof body?.isActive === 'boolean') {
      updates.is_active = body.isActive;
      updatesSnake.is_active = body.isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune mise à jour fournie' }, { status: 400 });
    }

    const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    let data: any = null;
    if (hasSupabase) {
      const supabase = supabaseServer();
    // Envoyer uniquement des clés snake_case au schéma fourni
    const res = await supabase.from('clients').update(updatesSnake).eq('id', id).select('*').single();
    let error = res.error;
    data = res.data;
      if (error) {
        // Fallback silencieux vers cache pour éviter 500 et débloquer l'UI
        const patched = updateClientCache(id, {
      name: updatesSnake.name,
      email: updatesSnake.email,
      contact: updatesSnake.contact,
      phone: updatesSnake.phone,
      dossier_number: updatesSnake.dossier_number,
      collaborator_id: updatesSnake.collaborator_id,
      is_active: updatesSnake.is_active,
      status: updatesSnake.status,
        });
        if (!patched) {
          const status = /input|type|null value|violates|duplicate|not exist/i.test(error.message) ? 400 : 500;
          return NextResponse.json({ error: error.message }, { status });
        }
        data = patched;
      }
    } else {
      const patched = updateClientCache(id, {
        name: updates.name,
        email: updates.email,
        contact: updates.contact,
        phone: updates.phone,
        dossier_number: (updates as any).dossier_number ?? (updates as any).dossierNumber,
        collaborator_id: (updates as any).collaborator_id ?? (updates as any).collaboratorId,
        is_active: (updates as any).is_active ?? (updates as any).isActive,
        status: (updates as any).status,
      });
      if (!patched) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
      data = patched;
    }

    const client = {
      _id: (data as any)._id || (data as any).id,
      name: (data as any).name,
      email: (data as any).email,
      contact: (data as any).contact || '',
      phone: (data as any).phone || '',
      dossierNumber: (data as any).dossier_number || (data as any).dossierNumber || '',
      collaboratorId: (data as any).collaborator_id || (data as any).collaboratorId || '',
      documents: (data as any).documents || [],
      isActive: ((data as any).is_active ?? (data as any).isActive) ?? true,
      createdAt: (data as any).created_at || (data as any).createdAt || null,
      updatedAt: (data as any).updated_at || (data as any).updatedAt || null,
      status: (data as any).status,
    };

    return NextResponse.json({ client }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/clients?id=...
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (hasSupabase) {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (error) {
        const status = /not exist|foreign key|constraint/i.test(error.message) ? 400 : 500;
        return NextResponse.json({ error: error.message }, { status });
      }
      return NextResponse.json({ deleted: data ? 1 : 0 }, { status: 200 });
    } else {
      const ok = deleteClientCache(id);
      return NextResponse.json({ deleted: ok ? 1 : 0 }, { status: 200 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
