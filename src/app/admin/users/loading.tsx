import GeneralLoading from '@/components/ui/GeneralLoading';

export default function AdminUsersLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Gestion des Utilisateurs"
      description="Chargement des utilisateurs..."
    />
  );
}