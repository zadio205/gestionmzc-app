import GeneralLoading from '@/components/ui/GeneralLoading';

export default function ClientChatLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Messagerie"
      description="Chargement de la messagerie..."
    />
  );
}