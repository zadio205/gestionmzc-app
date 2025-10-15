import GeneralLoading from '@/components/ui/GeneralLoading';

export default function AdminClientsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Gestion des Clients"
      description="Chargement de la liste des clients..."
    />
  );
}