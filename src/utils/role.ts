import type { UserRole } from '@/types/auth';

const ROLE_MAP: Record<string, UserRole> = {
  superadmin: 'superadmin',
  'super-admin': 'superadmin',
  admin: 'admin',
  'ADMIN': 'admin',
  collaborateur: 'collaborateur',
  collaborator: 'collaborateur',
  client: 'client',
};

/**
 * Normalise une valeur de rôle en l'un des UserRole connus
 */
export function normalizeUserRole(value: unknown): UserRole {
  if (!value) {
    return 'client';
  }

  if (typeof value === 'string') {
    const key = value.trim();
    const lowerKey = key.toLowerCase();
    return ROLE_MAP[lowerKey] || ROLE_MAP[key] || 'client';
  }

  if (Array.isArray(value) && value.length > 0) {
    return normalizeUserRole(value[0]);
  }

  if (typeof value === 'object' && 'role' in (value as Record<string, unknown>)) {
    return normalizeUserRole((value as Record<string, unknown>).role);
  }

  return 'client';
}
