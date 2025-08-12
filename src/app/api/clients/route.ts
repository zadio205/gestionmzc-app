import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';

const createClientSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  contact: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  siret: z.string().optional(),
  industry: z.string().optional(),
  dossierNumber: z.string().optional(),
  collaboratorId: z.string().optional(), // autoriser l'admin à assigner, sinon par défaut à l'utilisateur courant
});

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

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await dbConnect();

    const { userId, role } = auth;
    const filter = role === 'admin' ? {} : { collaboratorId: userId };
    const clients = await Client.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ clients }, { status: 200 });
  } catch (error) {
    console.error('Erreur GET /api/clients:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parse = createClientSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const data = parse.data;

    await dbConnect();

    // Empêcher les doublons par email
    const exists = await Client.findOne({ email: data.email });
    if (exists) {
      return NextResponse.json({ error: 'Un client avec cet email existe déjà' }, { status: 409 });
    }

    const collaboratorId = data.collaboratorId || auth.userId;

    const created = await Client.create({
      name: data.name,
      email: data.email,
  contact: data.contact,
      phone: data.phone,
      address: data.address,
      siret: data.siret,
      industry: data.industry,
      dossierNumber: data.dossierNumber,
      collaboratorId,
      documents: [],
      isActive: true,
    });

    return NextResponse.json({ client: created }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/clients:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
