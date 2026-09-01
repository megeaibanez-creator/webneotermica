import fs from "node:fs";
import path from "node:path";

const htmlPath = path.resolve(
  import.meta.dirname,
  "../../pruebas_html/05-recorrido-3d.html"
);
const outPath = path.resolve(
  import.meta.dirname,
  "../src/components/estancias/recorrido3d-scene.js"
);

const html = fs.readFileSync(htmlPath, "utf8");
const match = html.match(
  /<script type="module">\s*import \* as THREE from 'three';\s*([\s\S]*?)<\/script>/
);
if (!match) {
  throw new Error("No encontré el módulo Three.js en 05-recorrido-3d.html");
}

let body = match[1];
body = body.replaceAll(
  "document.querySelectorAll('.step')",
  "root.querySelectorAll('.estancias-step')"
);
body = body.replaceAll(
  "document.getElementById('scene')",
  "root.querySelector('#scene')"
);
body = body.replaceAll(
  "document.getElementById('flash')",
  "root.querySelector('#flash')"
);
body = body.replaceAll(
  "document.getElementById('chapters')",
  "root.querySelector('#chapters')"
);
body = body.replaceAll(
  "document.getElementById('progress')",
  "root.querySelector('#progress')"
);

const wrapped = `import * as THREE from "three";

/** Escena de 05-recorrido-3d.html. Devuelve destroy() al desmontar. */
export function mountRecorrido(root) {
  const canvas = root.querySelector("#scene");
  if (!canvas) return () => {};

  let raf = 0;
  let destroyed = false;
  const listeners = [];
  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    listeners.push(() => target.removeEventListener(type, fn, opts));
  }

${body.replaceAll("addEventListener(", "on(window, ").replace(
  "function animate(){\n  requestAnimationFrame(animate);",
  "function animate(){\n  if (destroyed) return;\n  raf = requestAnimationFrame(animate);"
)}

  return function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
    listeners.forEach((off) => off());
    io.disconnect();
    renderer.dispose();
    chapters.replaceChildren();
  };
}
`;

fs.writeFileSync(outPath, wrapped);
console.log("Escrito", outPath);
