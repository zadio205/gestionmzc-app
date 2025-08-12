import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import ClientLedgerEntry from '@/models/ClientLedgerEntry';
import Client from '@/models/Client';
import User from '@/models/User';

function getAuth(request: NextRequest): { userId: string; role: string } | null {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET! ) as { userId: string; role: string };
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

function normalizeSignature(e: any): string {
  const norm = (s: string) => String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim();
  const dateKey = (d: any) => (d ? new Date(d).toISOString().slice(0,10) : '');
  const amt = (n: any) => (Number.isFinite(Number(n)) ? (Math.round((Number(n)+Number.EPSILON)*100)/100).toFixed(2) : '0.00');
  return [
    'client',
    dateKey(e.date),
    norm(e.accountNumber),
    norm(e.description),
    norm(e.reference),
    amt(e.debit),
    amt(e.credit),
    norm(e.clientId),
  ].join('|');
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
    }

    await dbConnect();

    // Permission: admin, collaborateur assigné, ou client propriétaire
    const client = await Client.findById(clientId).lean<{ collaboratorId?: string }>();
  if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }
    if (auth.role === 'admin') {
      // ok
    } else if (auth.role === 'collaborateur') {
      if (String(client.collaboratorId || '') !== auth.userId) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
      }
    } else if (auth.role === 'client') {
      // Vérifier que le client consulté correspond au clientId de l'utilisateur
      const user = await User.findById(auth.userId).lean<{ clientId?: string }>();
      if (!user || String(user.clientId || '') !== String(clientId)) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const entries = await ClientLedgerEntry.find({ clientId }).sort({ date: 1, _id: 1 }).lean();
    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error('Erreur GET /api/client-ledger:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json();
    if (!body || !Array.isArray(body.entries)) {
      return NextResponse.json({ error: 'Corps invalide: { entries: [] } attendu' }, { status: 400 });
    }

    await dbConnect();

    // Validate that all entries target same client and permission
    const clientId = body.entries[0]?.clientId;
    if (!clientId || !body.entries.every((e: any) => e.clientId === clientId)) {
      return NextResponse.json({ error: 'Toutes les écritures doivent avoir le même clientId' }, { status: 400 });
    }
    const client = await Client.findById(clientId).lean<{ collaboratorId?: string }>();
    if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }
    if (auth.role === 'admin') {
      // ok
    } else if (auth.role === 'collaborateur') {
      if (String(client.collaboratorId || '') !== auth.userId) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
      }
    } else if (auth.role === 'client') {
      const user = await User.findById(auth.userId).lean<{ clientId?: string }>();
      if (!user || String(user.clientId || '') !== String(clientId)) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

  // compute signature and upsert unique entries
    const docs = body.entries.map((e: any) => ({
      ...e,
      balance: (Number(e.debit) || 0) - (Number(e.credit) || 0),
      type: 'client',
      isImported: e.isImported !== false,
      createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
      signature: normalizeSignature(e),
    }));

    const signatures = docs.map((d: any) => d.signature);
    const existing = await ClientLedgerEntry.find({ signature: { $in: signatures } }, 'signature').lean();
    const existingSet = new Set(existing.map((x: any) => x.signature));
    const toInsert = docs.filter((d: any) => !existingSet.has(d.signature));

    let inserted = [] as any[];
    if (toInsert.length > 0) {
      try {
        inserted = await ClientLedgerEntry.insertMany(toInsert, { ordered: false });
      } catch (err: any) {
        // Gérer les erreurs d'écriture en lot (doublons) en comptant ce qui a été inséré
        console.warn('Bulk insert partiellement échoué:', err?.message || err);
        // Si Mongo renvoie insertedDocs, les compter; sinon, considérer 0
        const insertedDocs = (err?.result?.result?.nInserted ?? err?.insertedDocs?.length) || 0;
        console.warn('nInserted (estimé):', insertedDocs);
      }
    }

    console.log(`[client-ledger] inserted=${inserted.length} skipped=${docs.length - inserted.length} clientId=${clientId}`);
    return NextResponse.json({ inserted: inserted.length, skipped: docs.length - inserted.length }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur POST /api/client-ledger:', error?.message || error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
    }

    await dbConnect();

    const client = await Client.findById(clientId).lean<{ collaboratorId?: string }>();
    if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }
    if (auth.role === 'admin') {
      // ok
    } else if (auth.role === 'collaborateur') {
      if (String(client.collaboratorId || '') !== auth.userId) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
      }
    } else if (auth.role === 'client') {
      const user = await User.findById(auth.userId).lean<{ clientId?: string }>();
      if (!user || String(user.clientId || '') !== String(clientId)) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const result = await ClientLedgerEntry.deleteMany({ clientId });
    return NextResponse.json({ deleted: result.deletedCount || 0 }, { status: 200 });
  } catch (error) {
    console.error('Erreur DELETE /api/client-ledger:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
