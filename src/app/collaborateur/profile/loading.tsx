import GeneralLoading from '@/components/ui/GeneralLoading';

export default function CollaborateurProfileLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Mon Profil"
      description="Chargement de votre profil..."
    />
  );
}