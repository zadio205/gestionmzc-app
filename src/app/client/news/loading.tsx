import GeneralLoading from '@/components/ui/GeneralLoading';

export default function ClientNewsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Actualités"
      description="Chargement des actualités..."
    />
  );
}