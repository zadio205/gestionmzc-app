import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { Justificatif } from '@/types/justificatif';
import { logger } from '@/utils/logger';

// Table Supabase pour stocker les métadonnées des justificatifs
const JUSTIFICATIFS_TABLE = 'justificatifs';

/**
 * GET /api/justificatifs
 * Récupère les justificatifs selon des filtres
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const category = searchParams.get('category') as 'achats' | 'ventes' | null;
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const supabase = supabaseServer();
    let query = supabase.from(JUSTIFICATIFS_TABLE).select('*');

    // Appliquer les filtres
    if (clientId) {
      query = query.eq('clientId', clientId);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('dateEcriture', dateFrom);
    }
    if (dateTo) {
      query = query.lte('dateEcriture', dateTo);
    }

    // Trier par date de création décroissante
    query = query.order('createdAt', { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error('Erreur Supabase', { clientId, category, status }, error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des justificatifs' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    logger.error('Erreur GET /api/justificatifs:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/justificatifs
 * Crée une nouvelle entrée de justificatif dans la GED
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = supabaseServer();

    // Valider les champs requis
    const requiredFields = ['name', 'clientId', 'entryId', 'category', 'path', 'uploadedBy'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Valider la catégorie
    if (!['achats', 'ventes'].includes(body.category)) {
      return NextResponse.json(
        { error: 'La catégorie doit être "achats" ou "ventes"' },
        { status: 400 }
      );
    }

    // Préparer les données
    const justificatifData = {
      ...body,
      status: body.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insérer dans Supabase
    const { data, error } = await supabase
      .from(JUSTIFICATIFS_TABLE)
      .insert([justificatifData])
      .select()
      .single();

    if (error) {
      logger.error('Erreur Supabase insert', { clientId: body.clientId }, error);
      return NextResponse.json(
        { error: 'Erreur lors de la création du justificatif' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    logger.error('Erreur POST /api/justificatifs:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
