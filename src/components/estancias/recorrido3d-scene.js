import * as THREE from "three";

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

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLD = 0x597D95, COLDLITE = 0x8fb6cf, WARM = 0xCB0A3D, WARMLITE = 0xff5c86;
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef1f5);
scene.fog = new THREE.Fog(0xeef1f5, 14, 32);

const camera = new THREE.PerspectiveCamera(46, innerWidth/innerHeight, 0.1, 120);

// lights (bright studio + sombras suaves)
scene.add(new THREE.HemisphereLight(0xffffff, 0xc8d2dc, 0.72));
scene.add(new THREE.AmbientLight(0xffffff, 0.32));
const key = new THREE.DirectionalLight(0xffffff, 1.05);
key.position.set(4.5, 9.5, 5.5);
key.castShadow = true;
key.shadow.mapSize.set(1024,1024);
key.shadow.camera.near = 1; key.shadow.camera.far = 28;
key.shadow.camera.left = -8; key.shadow.camera.right = 8;
key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
key.shadow.bias = -0.0004;
scene.add(key);
const fill = new THREE.DirectionalLight(0xdce6f0, 0.35); fill.position.set(-6,5,-4); scene.add(fill);
const rimC = new THREE.PointLight(0x8fb6cf, 0.4, 28); rimC.position.set(-5.5,3.6,3.4); scene.add(rimC);
const rimW = new THREE.PointLight(0xff5c86, 0.28, 28); rimW.position.set(5.5,3,-3.5); scene.add(rimW);

// ---- material helpers ----
function tint(hex, amt){ const c=new THREE.Color(hex); c.lerp(new THREE.Color(0xffffff), amt); return c; }
const glassWall = () => new THREE.MeshStandardMaterial({color:0xdbe4ec, transparent:true, opacity:0.16, metalness:0.08, roughness:0.88, side:THREE.DoubleSide});
const edgeMat = new THREE.LineBasicMaterial({color:0x8ba1b5, transparent:true, opacity:0.55});
const floorMat = (c)=> new THREE.MeshStandardMaterial({color:tint(c,0.62), metalness:0.04, roughness:0.86});
const propMat = (c, metal=0.08, rough=0.68)=> new THREE.MeshStandardMaterial({color:tint(c,0.38), metalness:metal, roughness:rough});

function boxEdges(w,h,d){
  const g = new THREE.BoxGeometry(w,h,d);
  return new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat);
}
function shade(m){ m.castShadow=true; m.receiveShadow=true; return m; }
function prop(w,h,d,c,x,y,z, metal, rough){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), propMat(c, metal, rough));
  m.position.set(x,y,z); return shade(m);
}
function cyl(rt,rb,h,c,x,y,z,seg=18, metal, rough){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), propMat(c, metal, rough));
  m.position.set(x,y,z); return shade(m);
}
function torus(r,t,c,x,y,z){
  const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,10,26), propMat(c));
  m.position.set(x,y,z); return shade(m);
}
function glowBox(w,h,d,c,x,y,z,op=0.7){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op}));
  m.position.set(x,y,z); return m;
}
function sphere(r,c,x,y,z,seg=16){
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,seg,12), propMat(c));
  m.position.set(x,y,z); return shade(m);
}
function cap(r,len,c,x,y,z){
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,6,10), propMat(c,0.04,0.78));
  m.position.set(x,y,z); return shade(m);
}

// ---- builders 3D (más forma, menos cajas) ----
function fSofa(g,x,z,rot=0){
  const s=new THREE.Group();
  s.add(prop(2.72,0.22,1.12,0x2c3a48, 0,0.34,0.02));
  s.add(prop(2.55,0.16,0.98,0x4a5d70, 0,0.5,0.02));
  s.add(prop(2.72,0.62,0.22,0x334352, 0,0.78,0.48));
  s.add(prop(0.22,0.42,1.12,0x334352, -1.27,0.62,0.02));
  s.add(prop(0.22,0.42,1.12,0x334352, 1.27,0.62,0.02));
  [-0.78,0,0.78].forEach(dx=> s.add(prop(0.72,0.14,0.82,0x5a6e82, dx,0.64,0.0)));
  const cL=cap(0.16,0.42,0x6a7e92, -0.72,0.92,0.36); cL.rotation.z=Math.PI/2; s.add(cL);
  const cR=cap(0.16,0.42,0x6a7e92, 0.72,0.92,0.36); cR.rotation.z=Math.PI/2; s.add(cR);
  [-1.05,1.05].forEach(dx=>[-0.38,0.38].forEach(dz=> s.add(cyl(0.035,0.035,0.26,0x1a222c, dx,0.13,0.02+dz,8,0.4,0.35))));
  s.position.set(x,0,z); s.rotation.y=rot; g.add(s);
}
function fArmchair(g,x,z,rot=0){
  const s=new THREE.Group();
  s.add(prop(0.92,0.2,0.9,0x3d2e2a, 0,0.36,0));
  s.add(prop(0.86,0.14,0.78,0x6b4a42, 0,0.52,0));
  s.add(prop(0.92,0.52,0.18,0x3d2e2a, 0,0.72,0.38));
  s.add(prop(0.16,0.38,0.9,0x3d2e2a, -0.4,0.6,0));
  s.add(prop(0.16,0.38,0.9,0x3d2e2a, 0.4,0.6,0));
  [-0.32,0.32].forEach(dx=>[-0.3,0.3].forEach(dz=> s.add(cyl(0.03,0.03,0.28,0x1a222c, dx,0.14,dz,8,0.4,0.35))));
  s.position.set(x,0,z); s.rotation.y=rot; g.add(s);
}
function fCoffee(g,x,z){
  g.add(cyl(0.52,0.52,0.04,0xc9d4de, x,0.46,z,28,0.35,0.18));
  g.add(cyl(0.07,0.09,0.42,0x2a333c, x,0.23,z,12,0.45,0.3));
  g.add(cyl(0.28,0.28,0.03,0x2a333c, x,0.04,z,20,0.4,0.4));
  g.add(prop(0.22,0.03,0.16,0x8b4a32, x-0.12,0.5,z));
  g.add(cyl(0.05,0.04,0.08,0xd8e4ee, x+0.16,0.52,z+0.08,12));
}
function fPlant(g,x,z,scale=1){
  const p=new THREE.Group();
  p.add(cyl(0.18,0.24,0.32,0x6a3d2e, 0,0.16,0,14));
  p.add(cyl(0.2,0.2,0.04,0x4a2c22, 0,0.34,0,14));
  p.add(cyl(0.02,0.02,0.55,0x2d5a38, 0,0.62,0,6));
  p.add(sphere(0.34,0x2f6b4a, 0,0.92,0,14));
  p.add(sphere(0.22,0x3a8a58, 0.18,1.12,-0.06,12));
  p.add(sphere(0.18,0x276344, -0.16,1.05,0.1,12));
  p.add(sphere(0.14,0x4aa86a, 0.04,1.28,0.08,10));
  p.position.set(x,0,z); p.scale.setScalar(scale); g.add(p);
}
function fWindow(g,x,y,z,rotY=0){
  const w=new THREE.Group();
  w.add(prop(1.8,1.4,0.06,0xe8eef4, 0,0,0,0.05,0.4));
  w.add(glowBox(1.62,1.22,0.02,0xb7d4ea, 0,0,0.02,0.45));
  w.add(prop(0.05,1.22,0.04,0xd0d8e0, 0,0,0.03));
  w.add(prop(1.62,0.05,0.04,0xd0d8e0, 0,0,0.03));
  w.position.set(x,y,z); w.rotation.y=rotY; g.add(w);
}
function fFloorPlanks(g,W,D,c=0x8b6f4e){
  const n=10;
  for(let i=0;i<n;i++){
    const z=-D/2+0.18+i*(D-0.2)/n;
    g.add(prop(W*0.96,0.012,(D-0.2)/n-0.03, c, 0,0.056,z,0.02,0.82));
  }
}
function fRug(g,x,z,w=2.8,d=2.0,c=0x8a3a4a){
  g.add(prop(w,0.02,d,c, x,0.062,z,0.02,0.92));
  g.add(prop(w-0.16,0.008,d-0.16,0xd8c8b8, x,0.072,z,0.02,0.9));
}
function fTV(g,x,y,z,rot=0){
  const t=new THREE.Group();
  t.add(prop(1.95,1.12,0.06,0x12171d, 0,0,0,0.4,0.25));
  t.add(glowBox(1.78,0.96,0.02,COLDLITE, 0,0,0.03,0.42));
  t.add(prop(0.28,0.08,0.08,0x1a2028, 0,-0.62,0.02));
  t.position.set(x,y,z); t.rotation.y=rot; g.add(t);
}
function fSideboard(g,x,z){
  g.add(prop(2.2,0.48,0.42,0x3d322c, x,0.3,z));
  g.add(prop(2.22,0.04,0.44,0x5a4a40, x,0.55,z));
  [-0.55,0.55].forEach(dx=> g.add(prop(0.9,0.32,0.02,0x2a231f, x+dx,0.28,z+0.21)));
}
function fLamp(g,x,z){
  g.add(cyl(0.14,0.18,0.04,0x2a333c, x,0.03,z,16,0.4,0.4));
  g.add(cyl(0.025,0.025,1.15,0x2a333c, x,0.62,z,8,0.45,0.3));
  const shade=new THREE.Mesh(new THREE.ConeGeometry(0.22,0.28,16,1,true), new THREE.MeshStandardMaterial({color:0xf3e6c8,emissive:0xffe4b0,emissiveIntensity:0.35,side:THREE.DoubleSide,roughness:0.7}));
  shade.position.set(x,1.28,z); shade.rotation.x=Math.PI; g.add(shade);
  g.add(sphere(0.07,0xffe8b8, x,1.16,z));
}
function fBooks(g,x,y,z){
  const cols=[0xCB0A3D,0x597D95,0x3d4a38,0x8a5a2a,0x2a3a4a];
  for(let i=0;i<5;i++) g.add(prop(0.08,0.22+i*0.02,0.16,cols[i], x+i*0.09,y,z));
}
function fDesk(g,x,z,screenCol){
  g.add(prop(1.62,0.05,0.78,0x4a3c32, x,0.86,z,0.08,0.55));
  [-0.7,0.7].forEach(dx=>[-0.3,0.3].forEach(dz=> g.add(cyl(0.03,0.03,0.82,0x1c2733, x+dx,0.42,z+dz,8,0.5,0.3))));
  g.add(prop(0.72,0.46,0.05,0x10161c, x,1.24,z-0.26,0.35,0.25));
  g.add(glowBox(0.62,0.36,0.02,screenCol, x,1.24,z-0.24,0.58));
  g.add(cyl(0.08,0.12,0.18,0x22303c, x,1.0,z-0.24,10,0.4,0.35));
  g.add(prop(0.42,0.016,0.16,0x18222c, x,0.895,z+0.16));
  g.add(cyl(0.03,0.03,0.08,0x18222c, x+0.52,0.9,z+0.12,8));
  const ch=new THREE.Group();
  ch.add(prop(0.48,0.07,0.48,0x2b3a48, 0,0.52,0));
  ch.add(prop(0.48,0.48,0.07,0x2b3a48, 0,0.8,0.22));
  ch.add(cyl(0.04,0.04,0.46,0x141c24, 0,0.26,0,8,0.5,0.3));
  ch.add(cyl(0.22,0.22,0.04,0x141c24, 0,0.04,0,16,0.4,0.4));
  [0,Math.PI/2,Math.PI,3*Math.PI/2].forEach(a=>{
    const arm=prop(0.28,0.03,0.06,0x141c24, Math.cos(a)*0.16,0.05,Math.sin(a)*0.16);
    ch.add(arm);
  });
  ch.position.set(x,0,z+0.68); g.add(ch);
}
function fStool(g,x,z){
  g.add(cyl(0.22,0.2,0.08,0x5a3d32, x,0.9,z,16));
  g.add(cyl(0.035,0.04,0.86,0x22303c, x,0.44,z,8,0.5,0.3));
  g.add(torus(0.15,0.018,0x30414f, x,0.32,z));
  g.add(cyl(0.16,0.16,0.03,0x22303c, x,0.04,z,14,0.4,0.4));
}
function fBottle(g,x,y,z,c){
  g.add(cyl(0.045,0.05,0.28,c, x,y,z,10,0.2,0.25));
  g.add(cyl(0.02,0.03,0.12,c, x,y+0.18,z,8,0.2,0.25));
}
function fExamBed(g,x,z){
  g.add(prop(0.78,0.08,1.95,0xcfd8e0, x,0.82,z,0.15,0.35));
  g.add(prop(0.82,0.12,1.98,0xeef3f7, x,0.9,z));
  g.add(prop(0.62,0.08,0.32,0xf7fafc, x,1.0,z-0.78));
  [-0.32,0.32].forEach(dx=>[-0.82,0.82].forEach(dz=> g.add(cyl(0.03,0.03,0.78,0x8fb6cf, x+dx,0.4,z+dz,8,0.5,0.25))));
  g.add(prop(0.7,0.04,1.7,0x8aa0b0, x,0.42,z));
  g.add(cyl(0.025,0.025,0.55,0x1c2733, x,1.22,z-0.92,8));
  g.add(prop(0.5,0.08,0.18,0xdfe8f0, x,1.5,z-0.92));
}
function fCart(g,x,z){
  const t=new THREE.Group();
  t.add(prop(0.62,0.04,0.5,0x8aa0b0, 0,0.92,0,0.3,0.3));
  t.add(prop(0.62,0.04,0.5,0x8aa0b0, 0,0.55,0,0.3,0.3));
  [-0.26,0.26].forEach(dx=>[-0.2,0.2].forEach(dz=> t.add(cyl(0.018,0.018,0.92,0x8fb6cf, dx,0.46,dz,8,0.5,0.25))));
  t.add(prop(0.48,0.36,0.05,0x0f1620, 0,1.28,-0.12));
  t.add(glowBox(0.4,0.28,0.02,COLDLITE, 0,1.28,-0.1,0.62));
  [-0.22,0.22].forEach(dx=>[-0.16,0.16].forEach(dz=>{ const w=cyl(0.045,0.045,0.04,0x1a222c, dx,0.05,dz,12); w.rotation.z=Math.PI/2; t.add(w); }));
  t.position.set(x,0,z); g.add(t);
}
function fSink(g,x,z){
  g.add(prop(0.7,0.08,0.48,0xe8eef3, x,0.92,z,0.1,0.35));
  g.add(prop(0.7,0.7,0.48,0xd5dee6, x,0.54,z));
  g.add(cyl(0.12,0.14,0.06,0xc8d2dc, x,0.98,z,16));
  g.add(cyl(0.015,0.015,0.22,0x8aa0b0, x,1.12,z-0.12,8,0.6,0.2));
  g.add(prop(0.1,0.03,0.08,0x8aa0b0, x,1.22,z-0.04,0.6,0.2));
}
function fTreadmill(g,x,z){
  const t=new THREE.Group();
  t.add(prop(0.86,0.14,1.95,0x2b3a48, 0,0.16,0));
  t.add(prop(0.72,0.03,1.72,0x141c24, 0,0.26,0.06));
  for(let i=0;i<7;i++) t.add(prop(0.7,0.008,0.08,0x2a333c, 0,0.275,-0.7+i*0.24));
  [-0.4,0.4].forEach(dx=> t.add(cyl(0.03,0.03,1.18,0x51606e, dx,0.78,-0.88,8,0.45,0.3)));
  t.add(prop(0.9,0.06,0.1,0x51606e, 0,1.32,-0.88));
  t.add(prop(0.52,0.32,0.04,0x0f1620, 0,1.28,-0.94));
  t.add(glowBox(0.42,0.24,0.02,COLDLITE, 0,1.28,-0.91,0.55));
  [-0.36,0.36].forEach(dx=>{ const w=cyl(0.12,0.12,0.08,0x141c24, dx,0.12,0.82,12); w.rotation.z=Math.PI/2; t.add(w); });
  t.position.set(x,0,z); g.add(t);
}
function fDumbbells(g,x,z){
  g.add(prop(0.12,1.15,0.42,0x2b3a48, x-0.72,0.62,z));
  g.add(prop(0.12,1.15,0.42,0x2b3a48, x+0.72,0.62,z));
  [0.42,0.78].forEach(sy=> g.add(prop(1.56,0.06,0.4,0x2b3a48, x,sy,z)));
  [-0.45,0,0.45].forEach((dx,i)=>{
    const y=0.5; g.add(cyl(0.045,0.045,0.42,0x8aa0b0, x+dx,y,z,10,0.5,0.25));
    g.add(sphere(0.09+i*0.012,0x30414f,x+dx-0.22,y,z));
    g.add(sphere(0.09+i*0.012,0x30414f,x+dx+0.22,y,z));
  });
}
function fBench(g,x,z){
  g.add(prop(0.48,0.1,1.35,0x2b3a48, x,0.48,z));
  g.add(prop(0.42,0.06,0.55,0x3a2a33, x,0.56,z-0.38));
  [-0.55,0.55].forEach(dz=> g.add(prop(0.48,0.46,0.07,0x22303c, x,0.23,z+dz)));
}
function fRack(g,x,z){
  [-0.95,0.95].forEach(dx=>[-0.52,0.52].forEach(dz=> g.add(cyl(0.045,0.045,3.5,0xCB0A3D, x+dx,1.78,z+dz,8,0.35,0.4))));
  [0.55,1.7,2.85].forEach((sy,si)=>{
    g.add(prop(2.05,0.06,1.2,0x51606e, x,sy,z,0.3,0.4));
    for(let i=-1;i<=1;i++){
      const c=[0x7a6a4a,0x6f7a4a,0x4a6a7a][(i+si+2)%3];
      g.add(prop(0.52,0.42+((i+si)%2)*0.12,0.5,c, x+i*0.62,sy+0.28,z));
    }
  });
}
function fPallet(g,x,z){
  g.add(prop(1.15,0.08,0.92,0x6a5636, x,0.08,z));
  [-0.3,0,0.3].forEach(dz=> g.add(prop(1.15,0.06,0.12,0x5a482c, x,0.14,z+dz)));
  g.add(prop(0.98,0.68,0.78,0x8a7448, x,0.52,z));
  g.add(prop(0.48,0.36,0.46,0x6f7a4a, x-0.18,1.05,z));
}
function fForklift(g,x,z){
  const f=new THREE.Group();
  f.add(prop(0.95,0.62,1.55,0xCB0A3D, 0,0.52,0));
  f.add(prop(0.82,0.42,0.55,0x1c2733, 0,1.08,0.22));
  f.add(glowBox(0.7,0.22,0.03,COLDLITE, 0,1.12,0.5,0.35));
  [-0.48,0.48].forEach(dx=>[-0.52,0.52].forEach(dz=>{ const w=cyl(0.22,0.22,0.18,0x141c24, dx,0.24,dz,14); w.rotation.z=Math.PI/2; f.add(w); }));
  f.add(prop(0.08,1.55,0.08,0x51606e, 0.38,0.95,0.95));
  f.add(prop(0.08,1.55,0.08,0x51606e,-0.38,0.95,0.95));
  f.add(prop(0.82,0.05,0.08,0x51606e, 0,1.55,0.95));
  f.add(prop(0.08,0.04,0.7,0xc8d2dc, 0.22,0.22,1.35));
  f.add(prop(0.08,0.04,0.7,0xc8d2dc,-0.22,0.22,1.35));
  f.position.set(x,0,z); f.rotation.y=-0.45; g.add(f);
}

function makeUnit(w,h,d,mode){
  const col = mode==='warm'? WARM : COLD;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color:0xf4f8fc, metalness:0.35, roughness:0.32, emissive:col, emissiveIntensity:0.12}));
  body.castShadow=true; g.add(body);
  const slatN = Math.max(3, Math.round(h/0.08));
  for(let i=0;i<slatN;i++){
    const sl=prop(w*0.86,0.012,0.012,0x8aa0b0, 0, -h/2+0.08+i*(h-0.12)/slatN, d/2+0.008, 0.4, 0.3);
    g.add(sl);
  }
  g.add(glowBox(w*0.5,0.02,0.01,col, 0, h/2-0.06, d/2+0.01, 0.85));
  const glow = new THREE.Mesh(new THREE.BoxGeometry(w*1.06,h*1.08,d*1.2), new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:0.14}));
  g.add(glow);
  g.userData.glow = glow;
  return g;
}
function makeCassette(size,mode){
  const col = mode==='warm'? WARM : COLD;
  const g = new THREE.Group();
  g.add(prop(size,0.08,size,0xeef3f7, 0,0,0,0.2,0.35));
  g.add(prop(size*0.32,0.06,size*0.32,0xd5dee6, 0,-0.02,0));
  [[1,0],[-1,0],[0,1],[0,-1]].forEach(([sx,sz])=>{
    g.add(prop(sx?size*0.28:size*0.7, 0.02, sz?size*0.28:size*0.7, col, sx*size*0.28, -0.05, sz*size*0.28));
  });
  const glow = new THREE.Mesh(new THREE.BoxGeometry(size*1.05,0.12,size*1.05), new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:0.16}));
  g.add(glow); g.userData.glow=glow;
  return g;
}

// build a room. returns {group, unitPos, mode, air}
function buildRoom(opts){
  const g = new THREE.Group();
  const W=opts.W||8, H=opts.H||3.2, D=opts.D||6;
  // floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W,0.1,D), floorMat(opts.floor));
  floor.position.y = 0; floor.receiveShadow = true; g.add(floor);
  if (opts.radiant){
    const rad = new THREE.Mesh(new THREE.PlaneGeometry(W*0.88,D*0.88), new THREE.MeshBasicMaterial({color:WARM, transparent:true, opacity:0.18}));
    rad.rotation.x = -Math.PI/2; rad.position.y = 0.058; g.add(rad);
    for(let i=0;i<9;i++){
      const line = new THREE.Mesh(new THREE.BoxGeometry(W*0.78,0.018,0.04), new THREE.MeshBasicMaterial({color:WARMLITE,transparent:true,opacity:0.7}));
      line.position.set((i%2?0.08:-0.08),0.07,-2.15+ i*0.52); g.add(line);
    }
  }
  // glass walls (rayos X)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W,H), glassWall()); back.position.set(0,H/2,-D/2); g.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(D,H), glassWall()); left.rotation.y=Math.PI/2; left.position.set(-W/2,H/2,0); g.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(D,H), glassWall()); right.rotation.y=-Math.PI/2; right.position.set(W/2,H/2,0); g.add(right);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W,D), glassWall()); ceil.rotation.x=Math.PI/2; ceil.position.set(0,H,0); g.add(ceil);
  // wall edges wireframe
  const we = boxEdges(W,H,D); we.position.y=H/2; g.add(we);

  // props
  opts.props(g);

  // unit
  const unit = opts.unit();
  g.add(unit.mesh);

  // airflow particles
  const N = 220;
  const pos = new Float32Array(N*3);
  const seed = [];
  for(let i=0;i<N;i++){ seed.push(spawn(unit.origin, opts.flow)); pos[i*3]=seed[i].x; pos[i*3+1]=seed[i].y; pos[i*3+2]=seed[i].z; }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const pmat = new THREE.PointsMaterial({color: opts.mode==='warm'?WARM:COLD, size:0.1, transparent:true, opacity:0.9, depthWrite:false});
  const points = new THREE.Points(pg, pmat);
  g.add(points);

  g.visible = false;
  scene.add(g);
  return {group:g, air:{points, seed, flow:opts.flow, origin:unit.origin, glow:unit.mesh.userData.glow}};
}

function spawn(o, flow){
  return {
    x:o.x + (Math.random()-.5)*flow.spread,
    y:o.y + (Math.random()-.5)*flow.spread*0.4,
    z:o.z + (Math.random()-.5)*flow.spread,
    life:Math.random()
  };
}

// ---------- ROOMS ----------
const rooms = [];

// 0 Salón — split mural (frío). Sofá mira a la tele, mesa en medio, rincón de lectura.
rooms.push(buildRoom({
  floor:0x6b5340, mode:'cold',
  unit:()=>{ const u=makeUnit(1.55,0.32,0.28,'cold'); u.position.set(-2.35,2.62,-2.78); return {mesh:u, origin:new THREE.Vector3(-1.4,2.4,-2.4)}; },
  flow:{dir:new THREE.Vector3(0.55,-0.45,0.7), spread:1.4, speed:0.05, len:5},
  props:(g)=>{
    fFloorPlanks(g,7.7,5.7,0x8a6e50);
    fRug(g,0.15,0.15,3.15,2.25,0x7a3548);
    fSofa(g,0.15,1.55,0);                 // respaldo hacia +Z, mira a la tele (-Z)
    fCoffee(g,0.15,0.15);
    fArmchair(g,2.15,0.55,-0.55);
    fSideboard(g,0.2,-2.55);
    fTV(g,0.2,1.55,-2.78);
    fLamp(g,-2.55,1.55);
    fPlant(g,3.35,1.85,1.15);
    fPlant(g,-3.35,-2.15,0.85);
    fWindow(g,-3.96,1.7,-0.15,Math.PI/2);
    fBooks(g,0.85,0.62,-2.45);
    g.add(prop(0.9,1.35,0.08,0xc8b8a0, 3.7,1.55,-1.6)); // cuadro
    g.add(glowBox(0.72,0.95,0.02,0xe8d8c0, 3.68,1.55,-1.58,0.35));
  }
}));

// 1 Dormitorio — suelo radiante. Cama al fondo, mesillas a ambos lados, armario y banco.
rooms.push(buildRoom({
  floor:0x6a4a3a, mode:'warm', radiant:true,
  unit:()=>{ const u=makeUnit(2.4,0.05,1.9,'warm'); u.position.set(0,0.07,-0.4); return {mesh:u, origin:new THREE.Vector3(0,0.22,-0.4)}; },
  flow:{dir:new THREE.Vector3(0,1,0), spread:3.4, speed:0.035, len:3.2},
  props:(g)=>{
    fFloorPlanks(g,7.7,5.7,0x8a6a52);
    g.add(prop(2.2,0.02,2.8,0x7a3548, 0,0.062,-0.7));
    g.add(prop(2.55,0.28,2.85,0x3a2a33, 0,0.24,-0.85));
    [-1.1,1.1].forEach(dx=>[-1.1,1.1].forEach(dz=> g.add(cyl(0.04,0.04,0.22,0x2a1e26, dx,0.11,-0.85+dz,8))));
    g.add(prop(2.6,0.85,0.14,0x2a1e26, 0,0.85,-2.28));
    g.add(prop(2.4,0.18,2.55,0xe8ddd2, 0,0.48,-0.7));
    g.add(prop(2.15,0.1,1.55,0xc95d78, 0,0.62,-0.15));
    g.add(prop(0.95,0.16,0.48,0xf4ece4, -0.55,0.68,-1.85));
    g.add(prop(0.95,0.16,0.48,0xf4ece4, 0.55,0.68,-1.85));
    [-1.7,1.7].forEach(dx=>{
      g.add(prop(0.52,0.48,0.42,0x50414d, dx,0.3,-2.05));
      g.add(cyl(0.08,0.12,0.22,0x2a1e26, dx,0.66,-2.05,12));
      g.add(sphere(0.12,0xffe4b0, dx,0.86,-2.05));
    });
    g.add(prop(0.55,2.15,1.7,0x3a2a33, -3.55,1.12,-0.9));
    g.add(prop(0.02,1.7,0.7,0x2a1e26, -3.26,1.15,-1.15));
    g.add(prop(0.02,1.7,0.7,0x2a1e26, -3.26,1.15,-0.65));
    g.add(prop(1.15,0.42,0.4,0x4a3a42, 0,0.26,1.15));
    fPlant(g,3.35,1.7,0.9);
    fWindow(g,3.96,1.65,-0.2,-Math.PI/2);
  }
}));

// 2 Oficina — dos puestos frente a la pared + mesa de reunión.
rooms.push(buildRoom({
  floor:0x4a5360, mode:'cold',
  unit:()=>{ const u=makeCassette(1.15,'cold'); u.position.set(0,3.12,-0.6); return {mesh:u, origin:new THREE.Vector3(0,2.85,-0.6)}; },
  flow:{dir:new THREE.Vector3(0,-1,0.15), spread:1.8, speed:0.055, len:4},
  props:(g)=>{
    fFloorPlanks(g,7.7,5.7,0x6a7380);
    fDesk(g,-1.7,-1.55, COLDLITE);
    fDesk(g,1.5,-1.55, COLDLITE);
    g.add(cyl(0.85,0.85,0.05,0x4a3c32, 0.1,0.82,1.35,28,0.08,0.5));
    g.add(cyl(0.08,0.1,0.78,0x22303c, 0.1,0.4,1.35,10,0.4,0.35));
    [-0.7,0.9].forEach(dx=> fStool(g, dx, 1.95));
    g.add(prop(2.4,1.05,0.38,0x30414f, 0,0.55,-2.72));
    fBooks(g,-0.7,1.15,-2.62);
    fPlant(g,-3.4,1.85,1.0);
    g.add(prop(0.08,2.0,2.5,0x9fc0d8, 3.72,1.1,0.1,0.05,0.2));
    g.add(glowBox(0.03,1.8,2.3,0xc5dce8, 3.68,1.1,0.1,0.18));
    fWindow(g,-3.96,1.7,0.2,Math.PI/2);
  }
}));

// 3 Bar — barra al fondo, taburetes alineados, mesa de comensales.
rooms.push(buildRoom({
  floor:0x3a2e28, mode:'cold',
  unit:()=>{ const u=makeCassette(1.25,'cold'); u.position.set(0,3.12,-0.8); return {mesh:u, origin:new THREE.Vector3(0,2.86,-0.8)}; },
  flow:{dir:new THREE.Vector3(0,-1,0), spread:2.6, speed:0.06, len:4},
  props:(g)=>{
    fFloorPlanks(g,7.7,5.7,0x5a4034);
    g.add(prop(5.1,1.05,0.82,0x3a2b33, 0,0.55,-1.85));
    g.add(prop(5.25,0.08,0.98,0x6a5348, 0,1.1,-1.85,0.08,0.45));
    g.add(prop(4.2,1.45,0.18,0x2a2030, 0,1.75,-2.78));
    g.add(prop(4.0,0.04,0.22,0x51606e, 0,1.25,-2.68));
    g.add(prop(4.0,0.04,0.22,0x51606e, 0,1.85,-2.68));
    const cols=[COLDLITE,WARMLITE,0xe0c060,0x8fb6cf,0xff5c86,0xe0c060,COLDLITE,0xcb0a3d];
    for(let i=0;i<8;i++) fBottle(g, -1.75+i*0.5, 2.08, -2.68, cols[i]);
    for(let i=0;i<4;i++) fStool(g, -1.7+i*1.15, -0.95);
    // mesa redonda + 2 sillas
    g.add(cyl(0.62,0.62,0.05,0x4a3c32, 2.35,0.78,1.45,28));
    g.add(cyl(0.07,0.09,0.74,0x22303c, 2.35,0.38,1.45,10,0.4,0.35));
    fStool(g, 1.7, 1.85); fStool(g, 2.95, 1.85);
    [-1.4,0,1.4].forEach(px=>{
      g.add(cyl(0.012,0.012,0.45,0x141c24, px,2.85,-0.55,6));
      g.add(sphere(0.11,0xffe4b0, px,2.55,-0.55));
    });
    fPlant(g,-3.4,1.7,0.85);
  }
}));

// 4 Clínica — camilla contra la pared, carro y lavabo al otro lado.
rooms.push(buildRoom({
  floor:0xd8e0e6, mode:'cold',
  unit:()=>{ const u=makeCassette(1.05,'cold'); u.position.set(0.2,3.12,-0.9); return {mesh:u, origin:new THREE.Vector3(0.2,2.86,-0.9)}; },
  flow:{dir:new THREE.Vector3(0,-1,0.12), spread:1.7, speed:0.05, len:4},
  props:(g)=>{
    g.add(prop(7.6,0.02,5.6,0xeef3f7, 0,0.06,0));
    fExamBed(g,-1.55,-0.85);
    fCart(g,0.55,-0.55);
    fStool(g,0.85,0.75);
    fSink(g,2.85,-2.15);
    g.add(prop(1.15,1.55,0.38,0xe4ecf3, 3.15,0.82,-1.15));
    g.add(glowBox(0.95,0.55,0.03,COLDLITE, 3.0,1.15,-0.95,0.28));
    g.add(prop(0.08,2.15,3.2,0xe8eef3, -3.72,1.12,0.1));
    g.add(torus(0.48,0.04,COLDLITE, 0.2,2.72,-0.9));
    fWindow(g,3.96,1.7,0.4,-Math.PI/2);
    g.add(prop(0.55,0.7,0.55,0xdfe8f0, -3.1,0.4,1.7));
  }
}));

// 5 Gimnasio — cintas frente al espejo, zona de pesas a la derecha.
rooms.push(buildRoom({
  floor:0x2a3138, mode:'cold',
  unit:()=>{ const u=makeCassette(1.45,'cold'); u.position.set(0,3.12,-0.4); return {mesh:u, origin:new THREE.Vector3(0,2.82,-0.4)}; },
  flow:{dir:new THREE.Vector3(0,-1,0), spread:3.1, speed:0.07, len:4.2},
  props:(g)=>{
    g.add(prop(7.6,0.03,5.6,0x1c2228, 0,0.06,0));
    fTreadmill(g,-2.45,0.35);
    fTreadmill(g,-2.45,-1.75);
    fDumbbells(g,2.55,-1.55);
    fBench(g,2.35,1.15);
    g.add(prop(0.06,2.35,5.2,0x9fc0d8, -3.9,1.35,0,0.05,0.15));
    g.add(glowBox(0.02,2.15,5.0,0xc5dce8, -3.86,1.35,0,0.2));
    g.add(sphere(0.16,0x30414f, 1.55,0.16,-2.25));
    g.add(sphere(0.2,0x2b3a48, 2.05,0.2,-2.25));
    const kb=torus(0.07,0.025,0x30414f, 1.55,0.34,-2.25); kb.rotation.x=Math.PI/2; g.add(kb);
    g.add(cyl(0.42,0.42,0.08,0xCB0A3D, 0.15,0.08,-2.15,24));
    g.add(prop(1.1,0.04,1.8,0x3a2a33, 2.35,0.07,1.15));
  }
}));

// 6 Nave industrial — aerotermia + conductos textiles (mixto)
rooms.push(buildRoom({
  W:12, H:5, D:8,
  floor:0x2b3138, mode:'warm',
  unit:()=>{ const u=makeUnit(1.8,0.7,1.2,'warm'); u.position.set(-4,4.4,-2.8); return {mesh:u, origin:new THREE.Vector3(-3.2,4.1,-2.6)}; },
  flow:{dir:new THREE.Vector3(0.35,-1,0.15), spread:4.5, speed:0.08, len:6},
  props:(g)=>{
    // textile ducts running along ceiling (glowing tubes)
    [-2.2,0.4,2.6].forEach((zz,i)=>{ const tube=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,9,16), new THREE.MeshStandardMaterial({color:0xf4f8fc,emissive:i===0?WARM:COLD,emissiveIntensity:0.25,metalness:0.2,roughness:0.5})); tube.rotation.z=Math.PI/2; tube.position.set(0.5,4.3,zz); g.add(tube); });
    // shelving racks
    fRack(g,-4.4,2.35);
    fRack(g,-1.55,2.35);
    fRack(g,-4.4,-2.45);
    fPallet(g,3.55,2.15);
    fPallet(g,4.85,2.15);
    fPallet(g,4.15,0.45);
    fForklift(g,2.15,-1.55);
    g.add(prop(1.9,1.7,1.35,0x394b5e, 4.55,0.9,-2.55));
    g.add(glowBox(1.15,0.32,0.04,WARMLITE, 4.55,1.45,-1.85,0.45));
    g.add(cyl(0.38,0.38,2.2,0x51606e, 3.15,1.15,-2.85,16,0.3,0.4));
    g.add(prop(0.14,0.025,7.2,0xe0c060, 0.4,0.08,0));
    g.add(prop(8.5,0.025,0.14,0xe0c060, 0.4,0.08,3.55));
  }
}));

// ---------- STEPS (camera + room) ----------
const V = (x,y,z)=>new THREE.Vector3(x,y,z);
const STEPS = [
  {room:0, pos:V(1.8,2.25,6.9), look:V(0.1,1.15,-0.8)},   // 0 hero: 3/4 del salón
  {room:0, pos:V(2.6,2.15,3.5), look:V(-1.8,2.35,-2.5)},  // 1 split + eje sofá-tele
  {room:1, pos:V(2.7,2.2,3.7), look:V(0,0.55,-1.1)},      // 2 cama y suelo radiante
  {room:2, pos:V(2.6,1.85,3.9), look:V(0,2.15,-0.8)},     // 3 oficina + cassette
  {room:3, pos:V(2.8,1.95,3.7), look:V(-0.2,1.35,-1.6)},  // 4 barra
  {room:4, pos:V(2.7,1.9,3.8), look:V(-0.8,1.2,-1.0)},    // 5 clínica
  {room:5, pos:V(3.1,2.05,3.9), look:V(-0.4,1.35,-0.6)},  // 6 gimnasio
  {room:6, pos:V(6.4,3.5,8.2), look:V(-0.8,2.1,-1.0)},    // 7 nave
  {room:6, pos:V(0.2,4.1,11.2), look:V(0,2.2,-1)}         // 8 final
];

// Dolly-out según viewport: PC un par de pasos atrás; móvil más para ver toda la estancia
function camPull(){
  const w = innerWidth;
  if (w < 600) return 1.68;
  if (w < 900) return 1.38;
  return 1.2;
}
function framedPos(step){
  const pull = camPull();
  const dir = step.pos.clone().sub(step.look);
  const p = step.look.clone().add(dir.multiplyScalar(pull));
  if (innerWidth < 600) p.y += 0.45;
  return p;
}
function applyFrame(i, instant){
  const s = STEPS[i];
  const next = framedPos(s);
  tgtLook = s.look.clone();
  if (instant){ camPos.copy(next); tgtPos.copy(next); camLook.copy(tgtLook); }
  else tgtPos = next;
}

let curRoom = -1;
function showRoom(idx){
  if (idx===curRoom) return;
  const flash = root.querySelector('#flash');
  flash.classList.add('show');
  setTimeout(()=>{
    rooms.forEach((r,i)=> r.group.visible = (i===idx));
    curRoom = idx;
    flash.classList.remove('show');
  }, 200);
}

// camera state
let camPos = framedPos(STEPS[0]);
let camLook = STEPS[0].look.clone();
let tgtPos = camPos.clone();
let tgtLook = camLook.clone();
let mouseX=0, mouseY=0;
on(window, 'pointermove', e=>{ mouseX=(e.clientX/innerWidth-.5); mouseY=(e.clientY/innerHeight-.5); });

showRoom(0);

// ---------- scroll wiring ----------
const stepEls = [...root.querySelectorAll('.estancias-step')];
const chapters = root.querySelector('#chapters');
stepEls.forEach((el,i)=>{ const b=document.createElement('button'); b.onclick=()=>el.scrollIntoView({behavior:'smooth'}); chapters.appendChild(b); });
const dots = [...chapters.children];

let activeStep = -1;
function setStep(i){
  if(i===activeStep) return;
  activeStep = i;
  applyFrame(i, false);
  showRoom(STEPS[i].room);
  dots.forEach((d,k)=>d.classList.toggle('on', k===i));
}

const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); setStep(+e.target.dataset.step); } });
},{threshold:0.55});
stepEls.forEach(el=>io.observe(el));

// progress bar
on(window, 'scroll', ()=>{
  const h = document.documentElement.scrollHeight - innerHeight;
  root.querySelector('#progress').style.width = (scrollY/h*100)+'%';
});

// ---------- render loop ----------
function resize(){
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.fov = innerWidth < 600 ? 58 : innerWidth < 900 ? 50 : 46;
  camera.updateProjectionMatrix();
  scene.fog.far = innerWidth < 600 ? 40 : 32;
  if (activeStep >= 0) applyFrame(activeStep, false);
  else applyFrame(0, true);
}
on(window, 'resize', resize); resize();

const tmp = new THREE.Vector3();
let t=0;
function animate(){
  if (destroyed) return;
  raf = requestAnimationFrame(animate);
  t += 1;
  // camera easing
  const ease = reduced?1:0.06;
  camPos.lerp(tgtPos, ease);
  camLook.lerp(tgtLook, ease);
  const px = camPos.x + mouseX*0.6;
  const py = camPos.y - mouseY*0.4;
  camera.position.set(px,py,camPos.z);
  camera.lookAt(camLook);

  // airflow of current room
  const room = rooms[curRoom];
  if(room){
    const {points, seed, flow, origin, glow} = room.air;
    const arr = points.geometry.attributes.position.array;
    if(!reduced){
      for(let i=0;i<seed.length;i++){
        const s = seed[i];
        s.x += flow.dir.x*flow.speed*(0.6+Math.random()*0.8);
        s.y += flow.dir.y*flow.speed*(0.6+Math.random()*0.8);
        s.z += flow.dir.z*flow.speed*(0.6+Math.random()*0.8);
        s.life += 0.01;
        if(s.life>1){ const n=spawn(origin,flow); s.x=n.x;s.y=n.y;s.z=n.z;s.life=0; }
        arr[i*3]=s.x; arr[i*3+1]=s.y; arr[i*3+2]=s.z;
      }
      points.geometry.attributes.position.needsUpdate = true;
      if(glow) glow.material.opacity = 0.12 + Math.sin(t*0.06)*0.06;
    }
  }
  renderer.render(scene,camera);
}
animate();


  return function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
    listeners.forEach((off) => off());
    io.disconnect();
    renderer.dispose();
    chapters.replaceChildren();
  };
}
