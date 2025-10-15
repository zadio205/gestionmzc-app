import GeneralLoading from '@/components/ui/GeneralLoading';

export default function ClientProfileLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Mon Profil"
      description="Chargement de votre profil..."
    />
  );
}