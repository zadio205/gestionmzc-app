import GeneralLoading from '@/components/ui/GeneralLoading';

export default function CollaborateurTasksLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Mes Tâches"
      description="Chargement des tâches..."
    />
  );
}