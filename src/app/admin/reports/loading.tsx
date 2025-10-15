import GeneralLoading from '@/components/ui/GeneralLoading';

export default function AdminReportsLoading() {
  return (
    <GeneralLoading
      variant="dashboard"
      title="Rapports"
      description="Chargement des rapports..."
    />
  );
}