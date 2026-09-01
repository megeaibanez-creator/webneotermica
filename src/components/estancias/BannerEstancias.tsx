import Link from "next/link";

const ESPACIOS = [
  ["01", "Salón", "Frío"],
  ["02", "Dormitorio", "Calor"],
  ["03", "Oficina", "Frío"],
  ["04", "Local", "Frío"],
  ["05", "Clínica", "Frío"],
  ["06", "Gimnasio", "Frío"],
] as const;

/**
 * Puerta al recorrido 3D. Misma voz que /estancias, no un anuncio.
 */
export default function BannerEstancias({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Link
      href="/estancias"
      className="banner-estancias group relative block overflow-hidden rounded-[28px] text-white shadow-deep"
    >
      <span className="banner-estancias-grid" aria-hidden />
      <span className="banner-estancias-glow" aria-hidden />

      <span
        className={`relative z-[1] grid items-center gap-10 p-8 sm:p-10 lg:p-12 ${
          compact ? "" : "lg:grid-cols-[1.15fr_0.85fr]"
        }`}
      >
        <span className="block">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 font-display text-[0.62rem] uppercase tracking-[0.28em] text-[#8aa8bf]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--clima)] [animation:est-blink_1.6s_infinite]" />
            Modo rayos X
          </span>
          <span className="mb-4 block font-display text-[clamp(1.7rem,3.4vw,2.55rem)] font-bold leading-[1.08] tracking-[-0.01em]">
            Cada espacio pide
            <br />
            su <em className="bg-gradient-to-br from-[#8aa8bf] to-accent bg-clip-text not-italic text-transparent">clima</em>
          </span>
          <span className="mb-7 block max-w-[32rem] text-[1.02rem] leading-relaxed text-white/70">
            Recorre vivienda, oficina, local, clínica, gimnasio o nave. Las paredes se
            vuelven transparentes y ves el sistema de Neotérmica funcionando.
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-[0.85rem] font-display text-[0.9rem] font-semibold text-ink transition-transform duration-300 group-hover:-translate-y-0.5">
            Entrar al recorrido
            <span aria-hidden>→</span>
          </span>
        </span>

        <span
          className={`hidden grid-cols-2 gap-2.5 ${compact ? "" : "lg:grid"}`}
          aria-hidden
        >
          {ESPACIOS.map(([num, nombre, modo]) => (
            <span
              key={num}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur-sm"
            >
              <span className="mb-1.5 flex items-center justify-between font-display text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                {num}
                <span
                  className={
                    modo === "Calor"
                      ? "text-accent"
                      : "text-[#8aa8bf]"
                  }
                >
                  {modo}
                </span>
              </span>
              <span className="block font-display text-[1.05rem] font-semibold">
                {nombre}
              </span>
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
}
