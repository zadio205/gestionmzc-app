import GeneralLoading from '@/components/ui/GeneralLoading';

export default function AdminProfileLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Profil Administrateur"
      description="Chargement du profil..."
    />
  );
}