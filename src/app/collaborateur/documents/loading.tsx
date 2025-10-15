import GeneralLoading from '@/components/ui/GeneralLoading';

export default function CollaborateurDocumentsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Documents"
      description="Chargement des documents..."
    />
  );
}