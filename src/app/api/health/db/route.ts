import { NextResponse } from 'next/server';

// Endpoint legacy de santé MongoDB désactivé
export function GET() {
  return NextResponse.json({ error: 'MongoDB retiré - endpoint désactivé' }, { status: 410 });
}
