import CrmLista from "@/components/admin/CrmLista";

export const metadata = { title: "Clientes · Administración" };

type Props = { searchParams: Promise<{ id?: string }> };

export default async function AdminClientesPage({ searchParams }: Props) {
  const { id } = await searchParams;
  return <CrmLista entidad="clients" inicialId={id} />;
}
