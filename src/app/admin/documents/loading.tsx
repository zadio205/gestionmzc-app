import GeneralLoading from '@/components/ui/GeneralLoading';

export default function AdminDocumentsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Gestion des Documents"
      description="Chargement des documents..."
    />
  );
}