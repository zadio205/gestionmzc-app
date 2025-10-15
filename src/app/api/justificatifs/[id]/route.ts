import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { logger } from '@/utils/logger';

const JUSTIFICATIFS_TABLE = 'justificatifs';

/**
 * GET /api/justificatifs/[id]
 * Récupère un justificatif spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from(JUSTIFICATIFS_TABLE)
      .select('*')
      .eq('_id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Justificatif non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Erreur GET /api/justificatifs/[id]:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/justificatifs/[id]
 * Met à jour un justificatif (principalement le statut)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = supabaseServer();

    // Mettre à jour uniquement les champs autorisés
    const allowedUpdates = ['status', 'tags', 'category'];
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from(JUSTIFICATIFS_TABLE)
      .update(updates)
      .eq('_id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Erreur PATCH /api/justificatifs/[id]:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/justificatifs/[id]
 * Supprime un justificatif (métadonnées + fichier Supabase Storage)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseServer();

    // 1. Récupérer les infos du justificatif pour supprimer le fichier
    const { data: justificatif, error: fetchError } = await supabase
      .from(JUSTIFICATIFS_TABLE)
      .select('*')
      .eq('_id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Justificatif non trouvé' },
        { status: 404 }
      );
    }

    // 2. Supprimer le fichier dans Supabase Storage
    const bucket = justificatif.bucket || process.env.SUPABASE_BUCKET || 'uploads';
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([justificatif.path]);

    if (storageError) {
      logger.warn('Erreur suppression fichier Storage', { path: justificatif.path }, storageError);
    }

    // 3. Supprimer les métadonnées
    const { error: deleteError } = await supabase
      .from(JUSTIFICATIFS_TABLE)
      .delete()
      .eq('_id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Justificatif supprimé' });
  } catch (error) {
    logger.error('Erreur DELETE /api/justificatifs/[id]:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
