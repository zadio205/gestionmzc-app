import GeneralLoading from '@/components/ui/GeneralLoading';

export default function ClientLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Espace Client"
      description="Chargement de votre espace client..."
    />
  );
}