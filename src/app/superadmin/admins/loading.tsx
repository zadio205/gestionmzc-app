import GeneralLoading from '@/components/ui/GeneralLoading';

export default function SuperadminAdminsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Gestion des Administrateurs"
      description="Chargement de la liste des administrateurs..."
    />
  );
}