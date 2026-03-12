import * as THREE from 'three';

// ══════════════════════════════════════════════════════════════════
//  ЗАВДАННЯ 1  —  WebAR · Three.js · DodecahedronGeometry
//                              ExtrudeGeometry · TubeGeometry
// ══════════════════════════════════════════════════════════════════

// ── Inject global styles ───────────────────────────────────────────
const css = document.createElement('style');
css.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000; font-family: 'Space Mono', monospace; overflow: hidden; cursor: crosshair; }

  /* Scanlines overlay */
  #scanlines {
    position: fixed; inset: 0; z-index: 2; pointer-events: none;
    background: repeating-linear-gradient(
      to bottom, transparent 0px, transparent 3px,
      rgba(0,255,200,0.025) 3px, rgba(0,255,200,0.025) 4px
    );
  }

  /* Corner brackets */
  .corner {
    position: fixed; width: 55px; height: 55px; z-index: 10; pointer-events: none;
    opacity: 0; animation: fadeIn 0.8s 0.4s forwards;
  }
  .corner::before, .corner::after { content:''; position:absolute; background:#00ffc8;
    box-shadow: 0 0 10px #00ffc8, 0 0 25px rgba(0,255,200,.3); }
  .corner::before { width:100%; height:2px; }
  .corner::after  { width:2px;  height:100%; }
  .corner.tl { top:18px; left:18px; }
  .corner.tr { top:18px; right:18px; transform:scaleX(-1); }
  .corner.bl { bottom:18px; left:18px; transform:scaleY(-1); }
  .corner.br { bottom:18px; right:18px; transform:scale(-1); }

  /* Title */
  #hud-title {
    position: fixed; top: 36px; left: 50%; transform: translateX(-50%);
    z-index: 10; text-align: center;
    opacity: 0; animation: slideDown 0.9s 0.2s cubic-bezier(.23,1,.32,1) forwards;
  }
  #hud-title h1 {
    font-family: 'Orbitron', sans-serif; font-weight: 900;
    font-size: clamp(16px, 2.8vw, 26px); letter-spacing: 7px;
    color: transparent;
    background: linear-gradient(90deg, #00ffc8, #b57bee, #ff6b9d, #ffd166, #00ffc8);
    background-size: 300%; -webkit-background-clip: text; background-clip: text;
    animation: gradShift 5s linear infinite;
    filter: drop-shadow(0 0 18px rgba(0,255,200,.45));
  }
  #hud-title p { font-size: 9px; letter-spacing: 4px; color: rgba(0,255,200,.45); margin-top: 5px; }

  /* Object legend */
  #legend {
    position: fixed; left: 26px; top: 50%; transform: translateY(-50%);
    z-index: 10; display: flex; flex-direction: column; gap: 18px;
    opacity: 0; animation: fadeIn 0.8s 0.9s forwards;
  }
  .leg-item { display: flex; align-items: center; gap: 10px;
    font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,.35); text-transform: uppercase; }
  .leg-dot { width: 8px; height: 8px; border-radius: 50%;
    animation: dotPulse 2s ease-in-out infinite; }
  .leg-item:hover { color: rgba(255,255,255,.9); }

  /* Stats */
  #stats {
    position: fixed; right: 26px; top: 50%; transform: translateY(-50%);
    z-index: 10; text-align: right; font-size: 9px; letter-spacing: 2px;
    color: rgba(0,255,200,.3); line-height: 2.4;
    opacity: 0; animation: fadeIn 0.8s 1.1s forwards;
  }
  #fps { color: rgba(0,255,200,.8); font-weight: bold; }

  /* Back button */
  #back-btn {
    position: fixed; top: 18px; left: 18px; z-index: 30;
    display: flex; align-items: center; gap: 8px;
    font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 700;
    letter-spacing: 3px; color: rgba(0,255,200,.6); text-transform: uppercase;
    text-decoration: none;
    padding: 8px 16px 8px 12px;
    border: 1px solid rgba(0,255,200,.2); border-radius: 2px;
    background: rgba(0,0,0,.5); backdrop-filter: blur(8px);
    transition: color .25s, border-color .25s, box-shadow .25s, transform .2s;
    opacity: 0; animation: fadeIn .8s .5s forwards;
  }
  #back-btn:hover {
    color: #00ffc8; border-color: rgba(0,255,200,.6);
    box-shadow: 0 0 16px rgba(0,255,200,.25);
    transform: translateX(-2px);
  }
  #back-btn svg { width:12px; height:12px; flex-shrink:0; }

  /* AR Button */
  #btn-wrap {
    position: fixed; bottom: 38px; left: 50%; transform: translateX(-50%);
    z-index: 20; text-align: center;
    opacity: 0; animation: slideUp 0.9s 0.6s cubic-bezier(.23,1,.32,1) forwards;
  }
  #ar-btn {
    position: relative; overflow: hidden;
    padding: 15px 54px;
    font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 5px; color: #000; text-transform: uppercase;
    background: linear-gradient(135deg, #00ffc8 0%, #b57bee 50%, #ff6b9d 100%);
    border: none; border-radius: 2px; cursor: pointer;
    box-shadow: 0 0 30px rgba(0,255,200,.4), 0 0 60px rgba(181,123,238,.2);
    transition: box-shadow .3s, transform .2s;
  }
  #ar-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,.4) 50%, transparent 70%);
    transform: translateX(-100%); transition: transform 0.5s;
  }
  #ar-btn:hover::before { transform: translateX(100%); }
  #ar-btn:hover { box-shadow: 0 0 50px rgba(0,255,200,.7), 0 0 100px rgba(181,123,238,.4); transform: translateY(-2px); }
  #btn-sub { font-size: 8px; letter-spacing: 3px; color: rgba(255,255,255,.2); margin-top: 10px; }

  /* Active badge */
  #badge {
    position: fixed; top: 38px; right: 26px; z-index: 20;
    display: none; align-items: center; gap: 8px;
    font-size: 9px; letter-spacing: 3px; color: #00ffc8; text-transform: uppercase;
  }
  #badge .bl { width:6px; height:6px; border-radius:50%; background:#00ffc8;
    box-shadow: 0 0 8px #00ffc8; animation: blink 1s step-end infinite; }

  @keyframes fadeIn   { to { opacity: 1; } }
  @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-18px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
  @keyframes slideUp   { from { opacity:0; transform:translateX(-50%) translateY(18px);  } to { opacity:1; transform:translateX(-50%) translateY(0); } }
  @keyframes gradShift { to { background-position: -300% 0; } }
  @keyframes dotPulse  { 50% { transform:scale(1.6); opacity:.5; } }
  @keyframes blink     { 50% { opacity:0; } }
`;
document.head.appendChild(css);

// ── Build DOM ──────────────────────────────────────────────────────
document.body.insertAdjacentHTML('beforeend', `
  <div id="scanlines"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>

  <a id="back-btn" href="/index.html">
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <path d="M8 2L4 6l4 4"/>
    </svg>
    Menu
  </a>

  <div id="hud-title">
    <h1>WebAR · Lab&nbsp;2</h1>
    <p>Task 01 — 3D Objects &amp; Animation</p>
  </div>

  <div id="legend">
    <div class="leg-item"><span class="leg-dot" style="background:#ff6b9d;box-shadow:0 0 8px #ff6b9d"></span>Dodecahedron</div>
    <div class="leg-item"><span class="leg-dot" style="background:#ffd166;box-shadow:0 0 8px #ffd166"></span>Extrude Star</div>
    <div class="leg-item"><span class="leg-dot" style="background:#00ffc8;box-shadow:0 0 8px #00ffc8"></span>Tube Helix</div>
  </div>

  <div id="stats">
    <span>FPS&nbsp;<span id="fps">--</span></span>
    <span>OBJ&nbsp;·&nbsp;3</span>
    <span id="mode-lbl">MODE&nbsp;·&nbsp;PREVIEW</span>
    <span id="time-lbl">T&nbsp;·&nbsp;0.00s</span>
  </div>

  <div id="btn-wrap">
    <button id="ar-btn">Start AR</button>
    <p id="btn-sub">WebXR immersive-ar</p>
  </div>

  <div id="badge"><span class="bl"></span>AR ACTIVE</div>
`);

// Starfield
for (let i = 0; i < 130; i++) {
  const d = document.createElement('div');
  const sz = Math.random() * 2.2 + 0.4;
  Object.assign(d.style, {
    position: 'fixed', borderRadius: '50%', background: '#fff', pointerEvents: 'none',
    zIndex: '1', width: sz+'px', height: sz+'px',
    top: Math.random()*100+'%', left: Math.random()*100+'%',
    opacity: 0.05 + Math.random()*0.35,
    animation: `dotPulse ${2+Math.random()*5}s ease-in-out infinite`,
    animationDelay: Math.random()*5 + 's',
  });
  document.body.appendChild(d);
}

// ══════════════════════════════════════════════════════════════════
//  THREE.JS
// ══════════════════════════════════════════════════════════════════
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.01, 20);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
Object.assign(renderer.domElement.style, { position:'fixed', inset:'0', zIndex:'5' });
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(3,5,3); scene.add(sun);
const pL  = new THREE.PointLight(0xff6b9d, 3, 8); pL.position.set(-1.5, 1, 0); scene.add(pL);
const cL  = new THREE.PointLight(0x00ffc8, 2.5, 8); cL.position.set(1.5, -0.5, 0); scene.add(cL);
const yL  = new THREE.PointLight(0xffd166, 2, 8); yL.position.set(0, 2, 0.5); scene.add(yL);

// ── Dodecahedron ───────────────────────────────────────────────────
const dMesh = new THREE.Mesh(
  new THREE.DodecahedronGeometry(0.13, 0),
  new THREE.MeshStandardMaterial({ color:0xff6b9d, metalness:0.65, roughness:0.12,
    emissive:0x660028, emissiveIntensity:0.45 })
);
dMesh.position.set(-0.4, 0, -1.3);
dMesh.add(new THREE.Mesh(
  new THREE.DodecahedronGeometry(0.137, 0),
  new THREE.MeshBasicMaterial({ color:0xff6b9d, wireframe:true, transparent:true, opacity:0.18 })
));
scene.add(dMesh);

// ── Extrude Star ───────────────────────────────────────────────────
function makeStarShape() {
  const s = new THREE.Shape();
  const O=0.115, I=0.048, N=6;
  for (let i=0;i<N*2;i++){
    const a=(i/(N*2))*Math.PI*2 - Math.PI/2;
    const r=i%2===0?O:I;
    i===0?s.moveTo(Math.cos(a)*r,Math.sin(a)*r):s.lineTo(Math.cos(a)*r,Math.sin(a)*r);
  }
  return s.closePath(), s;
}
const eMesh = new THREE.Mesh(
  new THREE.ExtrudeGeometry(makeStarShape(), { depth:0.055, bevelEnabled:true,
    bevelSize:0.012, bevelThickness:0.012, bevelSegments:5 }),
  new THREE.MeshPhysicalMaterial({ color:0xffd166, metalness:0.25, roughness:0.08,
    clearcoat:1, clearcoatRoughness:0.04, emissive:0x553300, emissiveIntensity:0.35 })
);
eMesh.position.set(0, -0.04, -1.3);
eMesh.rotation.x = -Math.PI/2;
scene.add(eMesh);

// ── Tube Helix ─────────────────────────────────────────────────────
class Helix extends THREE.Curve {
  getPoint(t) {
    const a = t * Math.PI * 6;
    return new THREE.Vector3(Math.cos(a)*0.09, (t-0.5)*0.32, Math.sin(a)*0.09);
  }
}
const tMesh = new THREE.Mesh(
  new THREE.TubeGeometry(new Helix(), 120, 0.013, 12, false),
  new THREE.MeshStandardMaterial({ color:0x00ffc8, metalness:0.85, roughness:0.08,
    emissive:0x004433, emissiveIntensity:0.55 })
);
tMesh.position.set(0.4, 0, -1.3);
scene.add(tMesh);

// ── AR ─────────────────────────────────────────────────────────────
async function startAR() {
  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['local'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body },
  });
  renderer.xr.setSession(session);
  document.getElementById('btn-wrap').style.display = 'none';
  document.getElementById('badge').style.display    = 'flex';
  document.getElementById('mode-lbl').textContent   = 'MODE · AR';
  session.addEventListener('end', () => {
    document.getElementById('btn-wrap').style.display = 'block';
    document.getElementById('badge').style.display    = 'none';
    document.getElementById('mode-lbl').textContent   = 'MODE · PREVIEW';
  });
}

const arBtn = document.getElementById('ar-btn');
navigator.xr?.isSessionSupported('immersive-ar').then(ok => {
  if (ok) arBtn.addEventListener('click', startAR);
  else { arBtn.textContent = 'AR Not Supported'; arBtn.style.opacity = '.4'; }
});

// ── Loop ───────────────────────────────────────────────────────────
const clk = new THREE.Clock();
let fc=0, ft=performance.now();

renderer.setAnimationLoop(() => {
  const t = clk.getElapsedTime();

  dMesh.rotation.x = t * 0.75;
  dMesh.rotation.y = t * 1.15;
  dMesh.position.y = Math.sin(t * 1.4) * 0.06;
  const ds = 1 + Math.sin(t*3)*0.04; dMesh.scale.setScalar(ds);

  eMesh.rotation.z = t * 1.9;
  eMesh.position.y = -0.04 + Math.abs(Math.sin(t*1.25))*0.09 - 0.045;

  tMesh.rotation.y = t * 0.85;
  tMesh.rotation.z = Math.sin(t*0.55)*0.22;
  const ts = 1 + Math.sin(t*2.5)*0.065; tMesh.scale.setScalar(ts);

  pL.position.x = Math.sin(t*0.7)*2.2; pL.position.z = Math.cos(t*0.7)*2.2;
  cL.position.x = Math.cos(t*0.5)*2.2; cL.position.z = Math.sin(t*0.5)*2.2;
  yL.intensity  = 1.8 + Math.sin(t*2)*0.5;

  fc++; const now=performance.now();
  if (now-ft > 1000) { document.getElementById('fps').textContent=fc; fc=0; ft=now; }
  document.getElementById('time-lbl').textContent = 'T · '+t.toFixed(2)+'s';

  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});