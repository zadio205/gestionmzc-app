import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json({ error: 'Remplacé par Supabase Auth' }, { status: 410 });
}