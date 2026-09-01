import Image from "next/image";
import Link from "next/link";
import { SERVICIOS } from "@/lib/servicios";
import { EMPRESA } from "@/lib/site";
import OpenCookiePrefs from "@/components/cookies/OpenCookiePrefs";

export default function Footer() {
  return (
    <footer className="bg-ink pb-8 pt-16 text-[#c3d0dc]">
      <div className="container-site">
        <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2.5 text-white">
              <Image
                src="/favicon.png"
                alt=""
                width={38}
                height={38}
                className="h-[38px] w-[38px] rounded-[11px]"
              />
              <span className="font-display text-xl font-bold leading-tight">
                Neotérmica
                <small className="-mt-0.5 block font-sans text-[0.6rem] font-normal uppercase tracking-[0.18em] text-brand-light">
                  Climatización · Murcia
                </small>
              </span>
            </Link>
            <p className="text-sm">
              Instalación, reparación y renovación de climatización. Murcia y un
              radio de 50 km. Desde {EMPRESA.fundacion}.
            </p>
          </div>

          <div>
            <h5 className="mb-4 font-display text-white">Servicios</h5>
            <ul className="space-y-2 text-sm">
              {[...SERVICIOS]
                .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
                .map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/servicios/${s.slug}`}
                      className="hover:text-white"
                    >
                      {s.nombre}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h5 className="mb-4 font-display text-white">Contacto</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contacto#donde-trabajamos"
                  className="hover:text-white"
                >
                  Dónde trabajamos
                </Link>
              </li>
              <li>
                <a href={`mailto:${EMPRESA.email}`} className="hover:text-white">
                  {EMPRESA.email}
                </a>
              </li>
              <li>
                <Link href="/contacto#formulario" className="hover:text-white">
                  Pedir presupuesto
                </Link>
              </li>
              <li>{EMPRESA.horario}</li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 font-display text-white">Legal</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/accesibilidad" className="hover:text-white">
                  Accesibilidad
                </Link>
              </li>
              <li>
                <Link href="/aviso-legal" className="hover:text-white">
                  Aviso legal
                </Link>
              </li>
              <li>
                <OpenCookiePrefs className="hover:text-white" />
              </li>
              <li>
                <Link href="/politica-de-cookies" className="hover:text-white">
                  Política de cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-de-privacidad"
                  className="hover:text-white"
                >
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-[0.82rem]">
          <span>
            © {new Date().getFullYear()} {EMPRESA.nombre}
          </span>
          <span>
            Hecho con ❤️ en Murcia · Web desarrollada por{" "}
            <a
              href="https://www.eskaladigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-light hover:text-white"
            >
              ESKALA Agencia de Marketing Digital
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
