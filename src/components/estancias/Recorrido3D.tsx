"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

function ServicioBtn({ slug, label }: { slug: string; label: string }) {
  return (
    <Link href={`/servicios/${slug}`} className="estancias-btn estancias-btn-svc">
      {label} →
    </Link>
  );
}

/**
 * Recorrido 3D de la prueba 05-recorrido-3d.html.
 * La escena Three.js se monta solo en el cliente.
 */
export default function Recorrido3D() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;

    void import("./recorrido3d-scene").then((mod) => {
      if (cancelled) return;
      destroy = mod.mountRecorrido(root);
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return (
    <div ref={rootRef} className="estancias">
      <canvas id="scene" className="estancias-scene" aria-hidden />
      <div className="estancias-vignette" aria-hidden />
      <div className="estancias-flash" id="flash" aria-hidden />
      <div className="estancias-progress" id="progress" aria-hidden />
      <div className="estancias-xray">Modo rayos X</div>
      <div className="estancias-chapters" id="chapters" />

      <div className="estancias-steps" id="steps">
        <section className="estancias-step estancias-hero" data-step="0">
          <div className="estancias-card estancias-hero-card">
            <h1>
              Cada espacio pide
              <br />
              su <em>clima</em>
            </h1>
            <p>
              Recorre distintos inmuebles por dentro. En cada uno, las paredes se
              vuelven transparentes y verás el sistema de climatización de
              Neotérmica funcionando: por dónde entra el aire, dónde va el calor
              y por qué.
            </p>
            <div className="estancias-scrollcue">▼ Haz scroll para entrar</div>
          </div>
        </section>

        <section className="estancias-step" data-step="1">
          <div className="estancias-card">
            <div className="estancias-num">
              01 · Vivienda <span className="estancias-chip cold">Frío</span>
            </div>
            <h2>Salón</h2>
            <div className="estancias-place">Split mural inverter</div>
            <p>
              El equipo de la pared impulsa aire fresco en abanico por todo el
              salón. Silencioso, con tecnología inverter que ajusta la potencia y
              ahorra energía cuando la estancia ya está a temperatura.
            </p>
            <div className="estancias-tip">
              <b>Neotérmica:</b> dimensionamos los frigorías según los m² y la
              orientación, para que enfríe rápido sin gastar de más.
            </div>
            <ServicioBtn
              slug="aire-acondicionado-splits"
              label="Aire acondicionado por splits"
            />
          </div>
        </section>

        <section className="estancias-step" data-step="2">
          <div className="estancias-card">
            <div className="estancias-num">
              02 · Vivienda <span className="estancias-chip warm">Calor</span>
            </div>
            <h2>Dormitorio</h2>
            <div className="estancias-place">Suelo radiante</div>
            <p>
              Bajo el suelo circula agua caliente que sube en calor uniforme y
              envolvente. Sin ruido, sin corrientes y sin radiadores a la vista:
              el confort perfecto para descansar en invierno.
            </p>
            <div className="estancias-tip">
              <b>Neotérmica:</b> trabaja a baja temperatura, ideal combinado con
              aerotermia para un consumo mínimo.
            </div>
            <ServicioBtn slug="suelo-radiante" label="Suelo radiante" />
          </div>
        </section>

        <section className="estancias-step" data-step="3">
          <div className="estancias-card">
            <div className="estancias-num">
              03 · Oficina <span className="estancias-chip cold">Frío</span>
            </div>
            <h2>Oficina</h2>
            <div className="estancias-place">Climatización por conductos</div>
            <p>
              El aire se reparte de forma invisible por rejillas en el techo,
              climatizando toda la planta de manera uniforme. Ni un solo equipo a
              la vista: solo confort constante para trabajar mejor.
            </p>
            <div className="estancias-tip">
              <b>Neotérmica:</b> una sola máquina oculta abastece varias salas,
              con zonificación por estancias.
            </div>
            <ServicioBtn
              slug="aire-acondicionado-conductos"
              label="Aire acondicionado por conductos"
            />
          </div>
        </section>

        <section className="estancias-step" data-step="4">
          <div className="estancias-card">
            <div className="estancias-num">
              04 · Hostelería <span className="estancias-chip cold">Frío</span>
            </div>
            <h2>Bar &amp; Restaurante</h2>
            <div className="estancias-place">Cassette de techo</div>
            <p>
              El cassette empotrado en el techo lanza aire en cuatro direcciones,
              manteniendo el local fresco incluso lleno de gente. Alta potencia,
              reparto uniforme y estética limpia sobre la barra.
            </p>
            <div className="estancias-tip">
              <b>Neotérmica:</b> potencia y mantenimiento pensados para locales de
              alta ocupación.
            </div>
            <ServicioBtn
              slug="aire-acondicionado-splits"
              label="Aire acondicionado por splits"
            />
          </div>
        </section>

        <section className="estancias-step" data-step="5">
          <div className="estancias-card">
            <div className="estancias-num">
              05 · Sanidad <span className="estancias-chip cold">Frío</span>
            </div>
            <h2>Clínica</h2>
            <div className="estancias-place">Conductos con filtración</div>
            <p>
              Aire limpio y a temperatura estable en cada consulta. La
              climatización por conductos incorpora filtración, renovando el aire
              sin corrientes directas sobre pacientes ni personal.
            </p>
            <div className="estancias-tip">
              <b>Neotérmica:</b> soluciones con filtración y renovación de aire
              para entornos sanitarios exigentes.
            </div>
            <ServicioBtn
              slug="aire-acondicionado-conductos"
              label="Aire acondicionado por conductos"
            />
          </div>
        </section>

        <section className="estancias-step" data-step="6">
          <div className="estancias-card">
            <div className="estancias-num">
              06 · Deporte <span className="estancias-chip cold">Frío</span>
            </div>
            <h2>Gimnasio</h2>
            <div className="estancias-place">Cassette de alta potencia</div>
            <p>
              Mucha gente y mucho calor corporal. Equipos de alta capacidad
              refrescan y renuevan el aire con rapidez, manteniendo la sala fresca
              incluso en plena clase o entrenamiento intenso.
            </p>
            <div className="estancias-tip">
              <b>Neotérmica:</b> alta potencia y renovación constante para
              espacios de gran afluencia.
            </div>
            <ServicioBtn
              slug="aire-acondicionado-splits"
              label="Aire acondicionado por splits"
            />
          </div>
        </section>

        <section className="estancias-step" data-step="7">
          <div className="estancias-card">
            <div className="estancias-num">
              07 · Industria <span className="estancias-chip warm">Mixto</span>
            </div>
            <h2>Nave industrial</h2>
            <div className="estancias-place">Aerotermia + conductos textiles</div>
            <p>
              Grandes volúmenes climatizados con eficiencia. La aerotermia y los
              conductos textiles reparten el aire de forma homogénea por toda la
              nave: confort para trabajar y un consumo mucho más controlado.
            </p>
            <div className="estancias-tip">
              <b>Neotérmica:</b> proyectos a medida para grandes superficies, con
              estudio de cargas y eficiencia energética.
            </div>
            <ServicioBtn slug="aerotermia" label="Aerotermia" />
          </div>
        </section>

        <section className="estancias-step estancias-final" data-step="8">
          <div className="estancias-card estancias-final-card">
            <h2>Tu inmueble, su clima ideal</h2>
            <p>
              Vivienda, oficina, local, clínica, gimnasio o nave industrial:
              estudiamos cada espacio y te proponemos el sistema exacto que
              necesita. Más de 20 años climatizando Murcia.
            </p>
            <div>
              <Link className="estancias-btn" href="/contacto">
                Solicitar presupuesto →
              </Link>
              <button
                type="button"
                className="estancias-btn ghost"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
