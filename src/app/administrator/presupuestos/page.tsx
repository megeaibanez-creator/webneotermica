import CrmLista from "@/components/admin/CrmLista";

export const metadata = { title: "Presupuestos · Administración" };

type Props = { searchParams: Promise<{ id?: string; cliente?: string }> };

export default async function AdminPresupuestosPage({ searchParams }: Props) {
  const { id, cliente } = await searchParams;
  return <CrmLista entidad="quotes" inicialId={id} inicialCliente={cliente} />;
}
