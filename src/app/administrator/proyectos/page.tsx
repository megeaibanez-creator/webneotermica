import CrmLista from "@/components/admin/CrmLista";

export const metadata = { title: "Proyectos · Administración" };

type Props = { searchParams: Promise<{ id?: string; cliente?: string }> };

export default async function AdminProyectosPage({ searchParams }: Props) {
  const { id, cliente } = await searchParams;
  return <CrmLista entidad="projects" inicialId={id} inicialCliente={cliente} />;
}
