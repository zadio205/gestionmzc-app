import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { InputValidator } from '@/utils/inputValidation';

// GET /api/clients -> { clients: [...] }
export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('clients')
      .select('*');

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
      dossierNumber: row.dossierNumber || '',
      collaboratorId: row.collaboratorId || '',
      documents: row.documents || [],
      isActive: row.isActive ?? true,
      createdAt: row.createdAt || null,
      updatedAt: row.updatedAt || null,
      status: row.status,
      lastActivity: row.lastActivity || row.updatedAt || row.createdAt || null,
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

    const payload = {
      name,
      email,
      contact: body?.contact ? InputValidator.validateText(body.contact, 120) : null,
      phone: body?.phone ? InputValidator.validateText(body.phone, 40) : null,
      dossierNumber: body?.dossierNumber ? InputValidator.validateText(body.dossierNumber, 60) : null,
      collaboratorId: body?.collaboratorId ? String(body.collaboratorId) : null,
    } as const;

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('clients')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const client = {
      _id: (data as any)._id || (data as any).id,
      name: (data as any).name,
      email: (data as any).email,
      contact: (data as any).contact || '',
      phone: (data as any).phone || '',
      dossierNumber: (data as any).dossierNumber || '',
      collaboratorId: (data as any).collaboratorId || '',
      documents: (data as any).documents || [],
      isActive: (data as any).isActive ?? true,
      createdAt: (data as any).createdAt || null,
      updatedAt: (data as any).updatedAt || null,
    };

    return NextResponse.json({ client }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
