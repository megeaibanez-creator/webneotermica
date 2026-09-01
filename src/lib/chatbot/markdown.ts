/** Markdown ligero para burbujas del chat. Copia del molde Nora / Laura. */

export function renderChatMarkdown(text: string): string {
  const lines = escapeHtml(text.replace(/\r\n/g, "\n")).split("\n");
  const out: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${paragraph.join("<br/>")}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      const tag = list.type;
      out.push(`<${tag} class="chat-list">${list.items.join("")}</${tag}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const boldHeading = /^\*\*([^*]+)\*\*:?\s*$/.exec(line);
    const ulItem = /^[-*•●–—]\s+(.*)$/.exec(line);
    const olItem = /^(\d+)[.)]\s+(.*)$/.exec(line);

    if (heading) {
      flushParagraph();
      flushList();
      const hashes = heading[1]?.length ?? 1;
      const tag = hashes <= 3 ? "h3" : "h4";
      out.push(`<${tag} class="chat-heading">${renderInline(heading[2] ?? "")}</${tag}>`);
    } else if (boldHeading) {
      flushParagraph();
      flushList();
      out.push(`<h3 class="chat-heading">${escapeHtml(boldHeading[1] ?? "")}</h3>`);
    } else if (ulItem) {
      flushParagraph();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(`<li>${renderInline(ulItem[1] ?? "")}</li>`);
    } else if (olItem) {
      flushParagraph();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(`<li value="${olItem[1]}">${renderInline(olItem[2] ?? "")}</li>`);
    } else if (!line) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(renderInline(line));
    }
  }
  flushParagraph();
  flushList();
  return out.join("");
}

/** Alias que usa el widget. */
export const aHtml = renderChatMarkdown;

const RUTA_INTERNA =
  /(?<![">\w])(\/(?:contacto|servicios|blog|estancias|aviso-legal|politica-de-privacidad|politica-de-cookies|accesibilidad)(?:\/[a-z0-9\-]+)*(?:#[a-z0-9\-]+)?)(?=[\s.,;:!?)<]|$)/gi;

function etiquetaRuta(href: string): string {
  const [path, hash] = href.split("#");
  if (path === "/contacto") return hash === "formulario" ? "Pedir presupuesto" : "contacto";
  if (path === "/estancias") return "recorrido 3D";
  if (path === "/blog") return "blog";
  if (path === "/servicios") return "servicios";
  const ultimo = (path ?? href).split("/").filter(Boolean).pop() ?? href;
  return ultimo.replace(/-/g, " ");
}

function enlazarRutasSueltas(s: string): string {
  return s.replace(RUTA_INTERNA, (href, _g, offset: number) => {
    const antes = s.slice(Math.max(0, offset - 8), offset);
    if (antes.includes("href=")) return href;
    return `<a href="${href}" class="chat-link">${etiquetaRuta(href)}</a>`;
  });
}

function renderInline(s: string): string {
  const conMarkdown = s
    .replace(
      /\[([^\]]+)\]\s*\((https?:\/\/[^)]+|\/[^)]+)\)/g,
      '<a href="$2" class="chat-link">$1</a>'
    )
    .replace(
      /(?<![">])(https?:\/\/[^\s<)]+)(?![^<]*<\/a>)/g,
      '<a href="$1" class="chat-link" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  return enlazarRutasSueltas(conMarkdown).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
