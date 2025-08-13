import { NextResponse } from 'next/server';

export async function GET() { return NextResponse.json({ error: 'API migrée vers Supabase - endpoint indisponible' }, { status: 410 }); }
export async function POST() { return NextResponse.json({ error: 'API migrée vers Supabase - endpoint indisponible' }, { status: 410 }); }
export async function DELETE() { return NextResponse.json({ error: 'API migrée vers Supabase - endpoint indisponible' }, { status: 410 }); }
