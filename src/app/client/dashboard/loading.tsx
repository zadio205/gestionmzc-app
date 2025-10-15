import GeneralLoading from '@/components/ui/GeneralLoading';

export default function ClientDashboardLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Tableau de Bord Client"
      description="Chargement de votre tableau de bord..."
    />
  );
}