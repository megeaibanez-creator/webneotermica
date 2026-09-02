import MiAgenda from "@/components/tecnico/MiAgenda";

export const metadata = { title: "Mi agenda · Administración" };

export default function AdminMiAgendaPage() {
  return (
    <div className="admin-shell">
      <MiAgenda compacto />
    </div>
  );
}
