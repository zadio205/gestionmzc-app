import GeneralLoading from '@/components/ui/GeneralLoading';

export default function SuperadminDashboardLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Tableau de Bord Super Admin"
      description="Chargement du tableau de bord administrateur..."
    />
  );
}