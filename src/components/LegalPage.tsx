import type { ReactNode } from "react";

/** Marco común de las páginas legales. */
export default function LegalPage({
  titulo,
  actualizado = "31 de agosto de 2026",
  children,
}: {
  titulo: string;
  actualizado?: string;
  children: ReactNode;
}) {
  return (
    <article className="pb-20 pt-[calc(74px+4.5rem)]">
      <div className="container-site max-w-[820px]">
        <h1 className="mb-2 text-[clamp(1.9rem,4vw,2.8rem)]">{titulo}</h1>
        <p className="mb-10 text-[0.85rem] text-mutedink">
          Última actualización: {actualizado}
        </p>
        <div className="post-body">{children}</div>
      </div>
    </article>
  );
}
