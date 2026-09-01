import Link from "next/link";

export default function NotFound() {
  return (
    <section className="pb-24 pt-[calc(74px+6rem)]">
      <div className="container-site max-w-[640px] text-center">
        <p className="eyebrow justify-center">Error 404</p>
        <h1 className="mb-4 text-[clamp(2rem,4.5vw,3rem)]">Esta página no existe</h1>
        <p className="lead mx-auto mb-8">
          Puede que el enlace esté antiguo o que hayamos movido el contenido. Desde
          aquí llegas a lo importante.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Ir al inicio
          </Link>
          <Link href="/servicios" className="btn-ghost">
            Ver servicios
          </Link>
          <Link href="/contacto#formulario" className="btn-dark">
            Pedir presupuesto
          </Link>
        </div>
      </div>
    </section>
  );
}
