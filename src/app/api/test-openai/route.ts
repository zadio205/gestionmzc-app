import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getConfig() {
  const base = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const apiKey = process.env.OPENAI_API_KEY;
  return { base, model, apiKey };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const live = url.searchParams.get('live');
  const doLiveCall = live === '1' || live === 'true';

  const { base, model, apiKey } = getConfig();
  const hasApiKey = !!apiKey;

  // Dry-run: ne fait aucun appel réseau (par défaut)
  if (!doLiveCall) {
    return NextResponse.json({
      ok: true,
      mode: 'dry-run',
      provider: 'openai-compatible',
      base,
      model,
      hasApiKey,
      note: 'Ajoutez ?live=1 pour effectuer un appel réel (peut entraîner des coûts)'
    });
  }

  // Si on cible l'API OpenAI officielle sans clé, retourner une erreur explicite plutôt que d'appeler
  if (!hasApiKey && base.includes('api.openai.com')) {
    return NextResponse.json(
      {
        ok: false,
        mode: 'live',
        base,
        model,
        hasApiKey,
        error: 'OPENAI_API_KEY manquant pour appeler l’API OpenAI officielle. Ajoutez OPENAI_API_KEY dans .env.local ou utilisez un endpoint OpenAI‑compatible local via OPENAI_API_BASE.',
      },
      { status: 400 }
    );
  }

  // Appel réseau réel: teste l’endpoint /responses avec une requête minimale
  const started = Date.now();
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(`${base}/responses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        input: 'ping',
        store: false,
        max_output_tokens: 10
      }),
      signal: AbortSignal.timeout(8000)
    });

    const latencyMs = Date.now() - started;

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          mode: 'live',
          base,
          model,
          hasApiKey,
          status: res.status,
          error: 'OpenAI API error',
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    const sample = (data?.output_text || data?.choices?.[0]?.message?.content || '').toString();

    return NextResponse.json({
      ok: true,
      mode: 'live',
      base,
      model,
      hasApiKey,
      latencyMs,
      sample: sample.slice(0, 60)
    });
  } catch (err: any) {
    const latencyMs = Date.now() - started;
    return NextResponse.json(
      {
        ok: false,
        mode: 'live',
        error: err?.message || 'Network error',
        latencyMs
      },
      { status: 500 }
    );
  }
}
