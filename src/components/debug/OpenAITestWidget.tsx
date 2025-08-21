"use client";

import React, { useState } from 'react';
import { Bolt, Play, RefreshCw } from 'lucide-react';

export default function OpenAITestWidget() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const call = async (live: boolean) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await fetch(`/api/test-openai${live ? '?live=1' : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bolt className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Test OpenAI</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => call(false)}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-50"
            title="Dry-run (sans appel externe)"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Dry-run</span>
          </button>
          <button
            onClick={() => call(true)}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            title="Live (peut entraîner un coût)"
          >
            <Play className="w-4 h-4" />
            <span>Live</span>
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Vérifie rapidement la configuration OPENAI_API_BASE / OPENAI_MODEL et l'accessibilité du service.
      </div>

      {loading && (
        <div className="mt-4 text-sm text-gray-500">Test en cours…</div>
      )}

      {error && (
        <div className="mt-4 p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      {result && (
        <div className="mt-4 p-3 text-xs bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap break-all">
          {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}
