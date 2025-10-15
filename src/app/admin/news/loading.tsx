import GeneralLoading from '@/components/ui/GeneralLoading';

export default function AdminNewsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Gestion des Actualités"
      description="Chargement des actualités..."
    />
  );
}