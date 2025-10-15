import GeneralLoading from '@/components/ui/GeneralLoading';

export default function ClientDocumentsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Mes Documents"
      description="Chargement de vos documents..."
    />
  );
}