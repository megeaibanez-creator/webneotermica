import CrmLista from "@/components/admin/CrmLista";

export const metadata = { title: "Facturación · Administración" };

type Props = { searchParams: Promise<{ id?: string; cliente?: string }> };

export default async function AdminFacturacionPage({ searchParams }: Props) {
  const { id, cliente } = await searchParams;
  return <CrmLista entidad="invoices" inicialId={id} inicialCliente={cliente} />;
}
