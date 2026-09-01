"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fotoServicio } from "@/lib/images";

type PostCard = {
  slug: string;
  title: string;
  date: string;
  description: string;
  servicio?: string;
  cover?: string;
};

function formatFecha(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const INTERVALO_MS = 10000;

/** Tres cards: carrusel con flechas y autoplay en móvil, grid desde `sm`. */
export default function CarruselPosts({ posts }: { posts: PostCard[] }) {
  const fila = useRef<HTMLUListElement>(null);
  const pausa = useRef(false);
  const gesto = useRef<{
    id: number;
    x: number;
    left: number;
    moved: boolean;
  } | null>(null);
  const fueArrastre = useRef(false);

  const esMovil = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return window.matchMedia("(max-width: 639px)").matches;
  }, []);

  const ir = useCallback((dir: -1 | 1, { ciclo = false } = {}) => {
    const el = fila.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".carrusel-posts-item");
    const paso = (card?.offsetWidth ?? 280) + 20;
    const max = el.scrollWidth - el.clientWidth;
    if (ciclo && dir === 1 && el.scrollLeft >= max - 8) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    el.scrollBy({ left: dir * paso, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (posts.length < 2) return;
    const id = window.setInterval(() => {
      if (pausa.current || !esMovil()) return;
      ir(1, { ciclo: true });
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [posts.length, ir, esMovil]);

  if (posts.length === 0) return null;

  function tocarPausa(on: boolean) {
    pausa.current = on;
  }

  function pasoCard() {
    const card = fila.current?.querySelector<HTMLElement>(".carrusel-posts-item");
    return (card?.offsetWidth ?? 280) + 20;
  }

  function enCarrusel() {
    return typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;
  }

  function onPointerDown(e: PointerEvent<HTMLUListElement>) {
    if (!enCarrusel() || e.button !== 0) return;
    const el = fila.current;
    if (!el) return;
    tocarPausa(true);
    fueArrastre.current = false;
    gesto.current = { id: e.pointerId, x: e.clientX, left: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLUListElement>) {
    const g = gesto.current;
    const el = fila.current;
    if (!g || !el || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x;
    if (Math.abs(dx) > 8) g.moved = true;
    if (g.moved) el.scrollLeft = g.left - dx;
  }

  function onPointerUp(e: PointerEvent<HTMLUListElement>) {
    const g = gesto.current;
    const el = fila.current;
    if (g && el && g.moved) {
      fueArrastre.current = true;
      const paso = pasoCard();
      const i = Math.round(el.scrollLeft / paso);
      el.scrollTo({ left: i * paso, behavior: "smooth" });
    }
    gesto.current = null;
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    window.setTimeout(() => tocarPausa(false), INTERVALO_MS);
  }

  function onClickCapture(e: MouseEvent) {
    if (!fueArrastre.current) return;
    e.preventDefault();
    e.stopPropagation();
    fueArrastre.current = false;
  }

  return (
    <div className="relative">
      <ul
        ref={fila}
        className="carrusel-posts"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {posts.map((post) => (
          <li key={post.slug} className="carrusel-posts-item">
            <TarjetaPost post={post} />
          </li>
        ))}
      </ul>
      {posts.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 sm:hidden">
          <button
            type="button"
            className="carrusel-posts-btn"
            aria-label="Artículo anterior"
            onClick={() => {
              tocarPausa(true);
              ir(-1);
              window.setTimeout(() => tocarPausa(false), INTERVALO_MS);
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="carrusel-posts-btn"
            aria-label="Artículo siguiente"
            onClick={() => {
              tocarPausa(true);
              ir(1, { ciclo: true });
              window.setTimeout(() => tocarPausa(false), INTERVALO_MS);
            }}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

function TarjetaPost({ post }: { post: PostCard }) {
  const foto = post.cover || (post.servicio ? fotoServicio(post.servicio) : null);
  return (
    <article className="card card-hover flex h-full flex-col !p-0">
      {foto && (
        <Link
          href={`/blog/${post.slug}`}
          className="relative block aspect-[16/10] overflow-hidden rounded-t-[20px]"
        >
          <Image
            src={foto}
            alt=""
            fill
            sizes="(min-width:1024px) 30vw, 82vw"
            className="pointer-events-none object-cover"
            draggable={false}
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <time
          dateTime={post.date}
          className="mb-2 font-display text-[0.75rem] uppercase tracking-[0.14em] text-brand"
        >
          {formatFecha(post.date)}
        </time>
        <h3 className="mb-3 text-[1.15rem]">
          <Link href={`/blog/${post.slug}`} className="hover:text-accent">
            {post.title}
          </Link>
        </h3>
        <p className="mb-4 line-clamp-3 flex-1 text-[0.92rem] text-mutedink">
          {post.description}
        </p>
        <Link
          href={`/blog/${post.slug}`}
          className="font-display text-[0.82rem] font-semibold text-accent"
        >
          Leer el artículo →
        </Link>
      </div>
    </article>
  );
}
