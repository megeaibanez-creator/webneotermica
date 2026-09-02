import { NextResponse } from "next/server";
import { exigirStaff } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await exigirStaff();
  if (staff instanceof NextResponse) return staff;
  return NextResponse.json({
    id: staff.id,
    nombre: staff.nombre,
    rol: staff.rol,
    es_tecnico: staff.es_tecnico,
  });
}
