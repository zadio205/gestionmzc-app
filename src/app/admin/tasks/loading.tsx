import GeneralLoading from '@/components/ui/GeneralLoading';

export default function AdminTasksLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Gestion des Tâches"
      description="Chargement des tâches..."
    />
  );
}