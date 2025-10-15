import GeneralLoading from '@/components/ui/GeneralLoading';

export default function SuperadminSettingsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Paramètres Système"
      description="Chargement des paramètres..."
    />
  );
}