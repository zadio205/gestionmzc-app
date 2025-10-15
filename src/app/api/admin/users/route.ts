/**
 * API Route pour la gestion des utilisateurs
 * GET: Liste des utilisateurs
 * POST: Créer un utilisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUser, getAdminUsers, getPlatformAdminStats, getPlatformAdmins, getUserProfile, getUserStats } from '@/services/authService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CreateUserInput } from '@/types/auth';
import { logger } from '@/utils/logger';

// GET: Récupérer les utilisateurs d'un admin
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Récupérer l'utilisateur actuel
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer le type de données demandé
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    const scope = searchParams.get('scope');

    const profile = await getUserProfile(user.id, true);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    const isSuperAdmin = profile.role === 'superadmin';

    if (type === 'stats') {
      if (scope === 'admins') {
        if (!isSuperAdmin) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }
        const stats = await getPlatformAdminStats();
        return NextResponse.json(stats);
      }

      const stats = await getUserStats(user.id);
      return NextResponse.json(stats);
    }

    if (scope === 'admins') {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
      const admins = await getPlatformAdmins();
      return NextResponse.json(admins);
    }

    const users = await getAdminUsers(user.id);
    return NextResponse.json(users);
  } catch (error) {
    logger.error('Error in GET /api/admin/users:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST: Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Récupérer l'utilisateur actuel
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les données du corps de la requête
  const body: CreateUserInput = await request.json();

    // Créer l'utilisateur
    const result = await createUser(body, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.user);
  } catch (error) {
    logger.error('Error in POST /api/admin/users:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
