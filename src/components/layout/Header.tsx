"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { SERVICIOS } from "@/lib/servicios";
import { EMPRESA } from "@/lib/site";
import { restoreClima } from "@/lib/clima";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/estancias", label: "Estancias" },
  { href: "/servicios", label: "Servicios", dropdown: true },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
] as const;

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servOpen, setServOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    restoreClima();
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setServOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const enLandingServicio =
    pathname.startsWith("/servicios/") && pathname !== "/servicios";
  const hrefPresupuesto = enLandingServicio ? "#formulario" : "/contacto#formulario";

  return (
    <>
      <nav className="fixed inset-x-0 top-3 z-[110]" aria-label="Principal">
        <div
          className={`mx-[5vw] flex h-[74px] items-center justify-between rounded-2xl border border-line bg-white/80 px-5 backdrop-blur-md transition-shadow ${
            scrolled ? "bg-white/95 shadow-card" : ""
          }`}
        >
          <Link href="/" className="relative block h-12 w-[110px] shrink-0 sm:h-[52px] sm:w-[118px]">
            <Image
              src="/images/logo.png"
              alt={EMPRESA.nombre}
              fill
              sizes="118px"
              className="object-contain object-left"
              priority
            />
          </Link>

          <ul className="hidden items-center gap-4 md:flex lg:gap-6">
            {NAV.map((item) =>
              "dropdown" in item && item.dropdown ? (
                <li
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setServOpen(true)}
                  onMouseLeave={() => setServOpen(false)}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 text-[0.88rem] font-medium hover:text-brand"
                    aria-expanded={servOpen}
                  >
                    {item.label} <ChevronDown size={14} aria-hidden />
                  </Link>
                  {servOpen && (
                    <ul className="absolute left-1/2 top-full w-72 -translate-x-1/2 rounded-2xl border border-line bg-white p-2 shadow-deep">
                      {SERVICIOS.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/servicios/${s.slug}`}
                            className="block rounded-xl px-3 py-2 text-[0.85rem] hover:bg-soft hover:text-brand"
                          >
                            {s.nombre}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[0.88rem] font-medium hover:text-brand"
                  >
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>

          <div className="flex items-center gap-3">
            <Link href={hrefPresupuesto} className="btn-primary hidden sm:inline-flex">
              Pedir presupuesto
            </Link>
            <button
              type="button"
              className="p-1.5 md:hidden"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[108] bg-ink/25 md:hidden"
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-[5vw] right-[5vw] top-[82px] z-[109] max-h-[min(70vh,32rem)] overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-deep md:hidden">
              <ul className="flex flex-col">
                {NAV.map((item) =>
                  "dropdown" in item && item.dropdown ? (
                    <li key={item.href}>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className="flex-1 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium hover:bg-soft"
                        >
                          {item.label}
                        </Link>
                        <button
                          type="button"
                          className="mr-1 rounded-xl p-2 text-mutedink hover:bg-soft"
                          aria-expanded={servOpen}
                          aria-label="Oficios"
                          onClick={() => setServOpen((v) => !v)}
                        >
                          <ChevronDown
                            size={16}
                            className={servOpen ? "rotate-180 transition-transform" : "transition-transform"}
                          />
                        </button>
                      </div>
                      {servOpen && (
                        <ul className="mb-1 ml-2 border-l border-line pl-2">
                          {SERVICIOS.map((s) => (
                            <li key={s.slug}>
                              <Link
                                href={`/servicios/${s.slug}`}
                                className="block rounded-xl px-3 py-2 text-[0.88rem] text-mutedink hover:bg-soft hover:text-ink"
                              >
                                {s.nombre}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ) : (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-xl px-3 py-2.5 text-[0.95rem] font-medium hover:bg-soft"
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
              <Link href={hrefPresupuesto} className="btn-primary mt-1 w-full">
                Pedir presupuesto
              </Link>
            </div>
          </>
        )}
      </nav>
    </>
  );
}
