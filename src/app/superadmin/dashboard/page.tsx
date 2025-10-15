'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Shield, UserCog, Users } from 'lucide-react';

interface AdminStats {
  total: number;
  admins: number;
}

const SuperadminDashboard = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<AdminStats>({ total: 0, admins: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/admin/users?scope=admins&type=stats', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Impossible de charger les statistiques');
        }
        const data = await response.json();
        setStats({
          total: data.total ?? 0,
          admins: data.admins ?? data.total ?? 0,
        });
      } catch (error) {
        console.error('Error loading superadmin stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const isLoading = loading || statsLoading;

  return (
    <ProtectedRoute allowedRoles={['superadmin']} unauthorizedMessage="Vous devez être super administrateur." redirectTo="/auth/signin">
      <DashboardLayout userRole="superadmin" userId={user?.id}>
        <div className="space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administration de la plateforme</h1>
              <p className="text-gray-600 mt-1">
                Surveillez vos administrateurs et assurez la conformité des accès.
              </p>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Administrateurs actifs"
              value={isLoading ? '...' : stats.admins}
              icon={UserCog}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
              description="Comptes capables de gérer les clients"
              trend={{ value: stats.admins, isPositive: true }}
            />
            <StatsCard
              title="Sécurité"
              value={isLoading ? '...' : stats.total}
              icon={Shield}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              description="Vérifier les accès critiques"
              trend={{ value: 0, isPositive: true }}
            />
            <StatsCard
              title="Utilisateurs total plateforme"
              value={isLoading ? '...' : stats.total}
              icon={Users}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              description="Basé sur les comptes administrateurs"
              trend={{ value: 0, isPositive: true }}
            />
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/superadmin/admins"
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow transition"
              >
                <h3 className="font-medium text-gray-900">Créer un administrateur</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Ouvrez un nouvel accès pour un administrateur responsable.
                </p>
              </a>
              <a
                href="/superadmin/admins"
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow transition"
              >
                <h3 className="font-medium text-gray-900">Auditer les comptes</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Vérifiez les responsables actifs et désactivez ceux inutilisés.
                </p>
              </a>
              <a
                href="/superadmin/settings"
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow transition"
              >
                <h3 className="font-medium text-gray-900">Paramètres plateforme</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Ajustez les politiques de sécurité et les paramètres globaux.
                </p>
              </a>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default SuperadminDashboard;
