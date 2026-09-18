import { EcranMissionDetail } from "./EcranMissionDetail";

export default async function MissionDetailPage({ params }: PageProps<"/mission/[id]">) {
  const { id } = await params;

  return <EcranMissionDetail livraisonId={Number(id)} />;
}
