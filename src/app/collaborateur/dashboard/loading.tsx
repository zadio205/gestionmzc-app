import GeneralLoading from '@/components/ui/GeneralLoading';

export default function CollaborateurDashboardLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Tableau de Bord Collaborateur"
      description="Chargement de votre tableau de bord..."
    />
  );
}