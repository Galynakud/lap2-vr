import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ══════════════════════════════════════════════════════════════════
//  ЗАВДАННЯ 2  —  WebAR · GLTF Transport Model · Animation
// ══════════════════════════════════════════════════════════════════

const css = document.createElement('style');
css.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000; font-family: 'Space Mono', monospace; overflow: hidden; cursor: crosshair; }

  #scanlines {
    position: fixed; inset: 0; z-index: 2; pointer-events: none;
    background: repeating-linear-gradient(to bottom,
      transparent 0px, transparent 3px, rgba(0,200,255,.025) 3px, rgba(0,200,255,.025) 4px);
  }

  .corner { position:fixed; width:55px; height:55px; z-index:10; pointer-events:none;
    opacity:0; animation:fadeIn .8s .4s forwards; }
  .corner::before,.corner::after { content:''; position:absolute; background:#00c8ff;
    box-shadow: 0 0 10px #00c8ff, 0 0 25px rgba(0,200,255,.3); }
  .corner::before { width:100%; height:2px; }
  .corner::after  { width:2px;  height:100%; }
  .corner.tl{top:18px;left:18px;} .corner.tr{top:18px;right:18px;transform:scaleX(-1);}
  .corner.bl{bottom:18px;left:18px;transform:scaleY(-1);} .corner.br{bottom:18px;right:18px;transform:scale(-1);}

  #hud-title {
    position:fixed; top:36px; left:50%; transform:translateX(-50%);
    z-index:10; text-align:center;
    opacity:0; animation:slideDown .9s .2s cubic-bezier(.23,1,.32,1) forwards;
  }
  #hud-title h1 {
    font-family:'Orbitron',sans-serif; font-weight:900;
    font-size:clamp(16px,2.8vw,26px); letter-spacing:7px;
    color:transparent;
    background:linear-gradient(90deg,#00c8ff,#0066ff,#b57bee,#00c8ff);
    background-size:300%; -webkit-background-clip:text; background-clip:text;
    animation:gradShift 5s linear infinite;
    filter:drop-shadow(0 0 18px rgba(0,200,255,.5));
  }
  #hud-title p { font-size:9px; letter-spacing:4px; color:rgba(0,200,255,.45); margin-top:5px; }

  /* Loading overlay */
  #loader-overlay {
    position:fixed; inset:0; z-index:50;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    background:rgba(0,0,0,.85); backdrop-filter:blur(8px);
    opacity:1; transition:opacity .6s;
  }
  #loader-overlay.hidden { opacity:0; pointer-events:none; }

  #loader-ring {
    width:80px; height:80px; position:relative; margin-bottom:28px;
  }
  #loader-ring svg { position:absolute; inset:0; }
  #loader-ring .track { fill:none; stroke:rgba(0,200,255,.1); stroke-width:3; }
  #loader-ring .bar   { fill:none; stroke:#00c8ff; stroke-width:3;
    stroke-dasharray:220; stroke-linecap:round;
    stroke-dashoffset:220; transition:stroke-dashoffset .3s ease;
    filter:drop-shadow(0 0 6px #00c8ff); transform-origin:center;
    animation:spin 1s linear infinite; }
  @keyframes spin { to { stroke-dashoffset: -220; } }

  #loader-title {
    font-family:'Orbitron',sans-serif; font-size:11px; letter-spacing:5px;
    color:rgba(0,200,255,.9); margin-bottom:10px; text-transform:uppercase;
  }
  #loader-pct {
    font-size:28px; font-family:'Orbitron',sans-serif; font-weight:900;
    color:#00c8ff; letter-spacing:2px;
    text-shadow:0 0 20px rgba(0,200,255,.7);
  }
  #loader-sub { font-size:8px; letter-spacing:3px; color:rgba(255,255,255,.2); margin-top:8px; }

  /* Model info panel */
  #info-panel {
    position:fixed; left:26px; top:50%; transform:translateY(-50%);
    z-index:10; display:flex; flex-direction:column; gap:14px;
    opacity:0; animation:fadeIn .8s 1.2s forwards;
  }
  .info-row { font-size:9px; letter-spacing:2px; color:rgba(255,255,255,.28); text-transform:uppercase; }
  .info-row span { color:rgba(0,200,255,.7); display:block; font-size:10px; margin-top:2px; }

  #stats {
    position:fixed; right:26px; top:50%; transform:translateY(-50%);
    z-index:10; text-align:right; font-size:9px; letter-spacing:2px;
    color:rgba(0,200,255,.3); line-height:2.4;
    opacity:0; animation:fadeIn .8s 1.1s forwards;
  }
  #fps { color:rgba(0,200,255,.8); font-weight:bold; }

  /* Back button */
  #back-btn {
    position: fixed; top: 18px; left: 18px; z-index: 30;
    display: flex; align-items: center; gap: 8px;
    font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 700;
    letter-spacing: 3px; color: rgba(0,200,255,.6); text-transform: uppercase;
    text-decoration: none;
    padding: 8px 16px 8px 12px;
    border: 1px solid rgba(0,200,255,.2); border-radius: 2px;
    background: rgba(0,0,0,.5); backdrop-filter: blur(8px);
    transition: color .25s, border-color .25s, box-shadow .25s, transform .2s;
    opacity: 0; animation: fadeIn .8s .5s forwards;
  }
  #back-btn:hover {
    color: #00c8ff; border-color: rgba(0,200,255,.6);
    box-shadow: 0 0 16px rgba(0,200,255,.25);
    transform: translateX(-2px);
  }
  #back-btn svg { width:12px; height:12px; flex-shrink:0; }

  /* AR Button */
  #btn-wrap {
    position:fixed; bottom:38px; left:50%; transform:translateX(-50%);
    z-index:20; text-align:center;
    opacity:0; animation:slideUp .9s .6s cubic-bezier(.23,1,.32,1) forwards;
  }
  #ar-btn {
    position:relative; overflow:hidden;
    padding:15px 54px;
    font-family:'Orbitron',sans-serif; font-size:12px; font-weight:700;
    letter-spacing:5px; color:#000; text-transform:uppercase;
    background:linear-gradient(135deg,#00c8ff 0%,#0066ff 50%,#b57bee 100%);
    border:none; border-radius:2px; cursor:pointer;
    box-shadow:0 0 30px rgba(0,200,255,.4),0 0 60px rgba(0,102,255,.2);
    transition:box-shadow .3s,transform .2s;
  }
  #ar-btn::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,transparent 30%,rgba(255,255,255,.4) 50%,transparent 70%);
    transform:translateX(-100%); transition:transform .5s;
  }
  #ar-btn:hover::before { transform:translateX(100%); }
  #ar-btn:hover { box-shadow:0 0 50px rgba(0,200,255,.7),0 0 100px rgba(0,102,255,.4); transform:translateY(-2px); }
  #btn-sub { font-size:8px; letter-spacing:3px; color:rgba(255,255,255,.2); margin-top:10px; }

  #badge {
    position:fixed; top:38px; right:26px; z-index:20;
    display:none; align-items:center; gap:8px;
    font-size:9px; letter-spacing:3px; color:#00c8ff; text-transform:uppercase;
  }
  #badge .bl { width:6px;height:6px;border-radius:50%;background:#00c8ff;
    box-shadow:0 0 8px #00c8ff; animation:blink 1s step-end infinite; }

  @keyframes fadeIn   { to{opacity:1;} }
  @keyframes slideDown{ from{opacity:0;transform:translateX(-50%) translateY(-18px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }
  @keyframes slideUp  { from{opacity:0;transform:translateX(-50%) translateY(18px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }
  @keyframes gradShift{ to{background-position:-300% 0;} }
  @keyframes blink    { 50%{opacity:0;} }
`;
document.head.appendChild(css);

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
    <p>Task 02 — GLTF Transport Model</p>
  </div>

  <div id="loader-overlay">
    <div id="loader-ring">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle class="track" cx="40" cy="40" r="35"/>
        <circle class="bar"   cx="40" cy="40" r="35"/>
      </svg>
    </div>
    <div id="loader-title">Loading Model</div>
    <div id="loader-pct">0%</div>
    <div id="loader-sub">Transport · GLTF Format</div>
  </div>

  <div id="info-panel">
    <div class="info-row">Format<span>GLTF/GLB</span></div>
    <div class="info-row">Category<span>Transport</span></div>
    <div class="info-row">Anim<span id="anim-lbl">Rotation</span></div>
    <div class="info-row">Scale<span id="scale-lbl">Auto</span></div>
  </div>

  <div id="stats">
    <span>FPS&nbsp;<span id="fps">--</span></span>
    <span id="mode-lbl">MODE · PREVIEW</span>
    <span id="time-lbl">T · 0.00s</span>
  </div>

  <div id="btn-wrap">
    <button id="ar-btn">Start AR</button>
    <p id="btn-sub">WebXR immersive-ar</p>
  </div>
  <div id="badge"><span class="bl"></span>AR ACTIVE</div>
`);

// Starfield
for (let i=0;i<100;i++){
  const d=document.createElement('div');
  const sz=Math.random()*2+0.4;
  Object.assign(d.style,{ position:'fixed',borderRadius:'50%',background:'#fff',
    pointerEvents:'none',zIndex:'1', width:sz+'px',height:sz+'px',
    top:Math.random()*100+'%',left:Math.random()*100+'%',
    opacity:0.05+Math.random()*0.3,
    animation:`fadeIn ${2+Math.random()*5}s ease-in-out infinite alternate`,
    animationDelay:Math.random()*5+'s' });
  document.body.appendChild(d);
}

// ══════════════════════════════════════════════════════════════════
//  THREE.JS
// ══════════════════════════════════════════════════════════════════
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.01, 20);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
Object.assign(renderer.domElement.style, { position:'fixed',inset:'0',zIndex:'5' });
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.0));
const sun = new THREE.DirectionalLight(0xfff5e0, 1.8); sun.position.set(3,5,3); sun.castShadow=true; scene.add(sun);
scene.add(new THREE.HemisphereLight(0xddeeff, 0x221100, 0.7));
const bL = new THREE.PointLight(0x00c8ff, 2, 8); bL.position.set(-2,2,0); scene.add(bL);
const bR = new THREE.PointLight(0x0066ff, 1.5, 8); bR.position.set(2,1,0); scene.add(bR);


const MODEL_URL = 'https://raw.githubusercontent.com/Galynakud/lap2-vr/refs/heads/main/scene.gltf';

let model = null;
const loader = new GLTFLoader();
const loaderEl = document.getElementById('loader-overlay');
const pctEl    = document.getElementById('loader-pct');

loader.load(MODEL_URL,
  (gltf) => {
    model = gltf.scene;

    // Auto-scale to ~30 cm
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxD = Math.max(size.x, size.y, size.z);
    const sf = 0.7 / maxD;
    model.scale.setScalar(sf);
    document.getElementById('scale-lbl').textContent = 'x'+sf.toFixed(3);

    // Center & place
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center.multiplyScalar(sf));
    model.position.z = -1.0;
    model.position.y = -0.05;

    model.traverse(c => {
      if (c.isMesh) {
        c.castShadow = c.receiveShadow = true;
        if (c.material) c.material.envMapIntensity = 1.0;
      }
    });

    scene.add(model);
    loaderEl.classList.add('hidden');
  },
  (prog) => {
    const p = Math.round((prog.loaded / (prog.total||1)) * 100);
    pctEl.textContent = p + '%';
  },
  (err) => {
    console.error(err);
    pctEl.textContent = 'ERR';
    document.getElementById('loader-title').textContent = 'Load Failed';
    document.getElementById('loader-sub').textContent   = 'Check MODEL_URL in task2.js';
  }
);

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
  else { arBtn.textContent='AR Not Supported'; arBtn.style.opacity='.4'; }
});

// ── Loop ────────────────────────────────────────────────────────────
const clk = new THREE.Clock();
let fc=0, ft=performance.now();

renderer.setAnimationLoop(() => {
  const t = clk.getElapsedTime();
  if (model) {
    model.rotation.y = t * 0.45;
    model.position.y = -0.05 + Math.sin(t * 0.7) * 0.025;
  }
  bL.position.x = Math.sin(t*0.6)*2.5; bL.position.z = Math.cos(t*0.6)*2.5;
  bR.position.x = Math.cos(t*0.4)*2.5; bR.position.z = Math.sin(t*0.4)*2.5;

  fc++; const now=performance.now();
  if(now-ft>1000){ document.getElementById('fps').textContent=fc; fc=0; ft=now; }
  document.getElementById('time-lbl').textContent='T · '+t.toFixed(2)+'s';
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});