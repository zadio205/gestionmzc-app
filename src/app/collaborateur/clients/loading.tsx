import GeneralLoading from '@/components/ui/GeneralLoading';

export default function CollaborateurClientsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Gestion Clients"
      description="Chargement de la liste des clients..."
    />
  );
}