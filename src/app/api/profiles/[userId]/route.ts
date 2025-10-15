/**
 * API Route pour récupérer le profil complet d'un utilisateur
 * Limité à l'utilisateur authentifié qui demande son propre profil
 * 
 * IMPORTANT: Utilise uniquement le token Bearer pour l'authentification
 * car les cookies ne sont pas toujours correctement transmis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import type { UserRole } from '@/types/auth';
import { normalizeUserRole } from '@/utils/role';
import { logger } from '@/utils/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    
    // Récupérer le token Bearer depuis les headers
    const authorization = request.headers.get('authorization') || '';
    const bearerToken = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;
    const cookieToken = request.cookies.get('sb-access-token')?.value || null;
    const token = bearerToken || cookieToken;

    if (!token) {
      logger.warn('No Bearer token provided', {});
      return NextResponse.json({ 
        error: 'Token d\'authentification manquant',
        hint: 'Assurez-vous d\'inclure le header Authorization: Bearer <token>'
      }, { status: 401 });
    }

    // Valider le token avec le service role key (bypass RLS)
    const adminClient = supabaseServer();
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      logger.error('Invalid token', {}, authError || new Error('Unknown error'));
      return NextResponse.json({ 
        error: 'Token invalide ou expiré',
        details: authError?.message
      }, { status: 401 });
    }

    if (user.id !== params.userId) {
      logger.warn('Unauthorized profile access attempt', { userId: user.id, targetId: params.userId });
      return NextResponse.json({ 
        error: 'Accès refusé',
        hint: 'Vous ne pouvez accéder qu\'à votre propre profil'
      }, { status: 403 });
    }

    // Récupérer le profil avec le service role key (bypass RLS)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      const errorCode = (profileError as any)?.code;
      const isMissing = errorCode === 'PGRST116' || errorCode === 'PGRST117' || profileError?.message?.toLowerCase().includes('no rows');

      if (!isMissing) {
        logger.error('Error fetching profile from DB', { userId: user.id }, profileError || new Error('Unknown profile error'));
        return NextResponse.json({ 
          error: 'Profil introuvable', 
          details: profileError?.message 
        }, { status: 404 });
      }

      logger.warn('Profile missing in DB, falling back to auth metadata', { userId: user.id });
      const metadata = {
        ...(user.app_metadata || {}),
        ...(user.user_metadata || {}),
      } as Record<string, unknown>;

      const fallbackProfile = {
        id: user.id,
        role: normalizeUserRole(metadata.role),
        full_name: (metadata.full_name as string | undefined)
          || (metadata.name as string | undefined)
          || user.email?.split('@')[0]
          || null,
        admin_id: (metadata.admin_id as string | undefined) ?? null,
        client_id: (metadata.client_id as string | undefined) ?? null,
        avatar_url: (metadata.avatar_url as string | undefined)
          || (metadata.avatar as string | undefined)
          || null,
        metadata,
      };

      return NextResponse.json(fallbackProfile);
    }

    logger.info('Profile loaded successfully', { userId: user.id });
    return NextResponse.json(profile);
    
  } catch (error) {
    logger.error('Error in GET /api/profiles/[userId]:', {}, error instanceof Error ? error : new Error(String(error)));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: errorMessage 
    }, { status: 500 });
  }
}
