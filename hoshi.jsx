
const LOGO_SRC   = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe47145ebb756d01c372_hoshi.jpeg";
const PEOPLE_SRC = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe75f8001bf82851cd0f_commonwealthOfPeoples.jpeg";
const {useMemo,useState,useRef,useEffect} = React;

// === Hoshi MVP: building store + KPI helpers (isolated) ===
const HOSHI_STORE_KEY = "hoshi.buildings.v1";
function hoshiLoadBuildings() {
  try { return JSON.parse(localStorage.getItem(HOSHI_STORE_KEY) || "[]"); }
  catch { return []; }
}
function hoshiSaveBuildings(list) {
  try { localStorage.setItem(HOSHI_STORE_KEY, JSON.stringify(list || [])); } catch {}
}
const HOSHI_ACTIONS_KEY = "hoshi.actions";

function hoshiLoadActions() {
  try { return JSON.parse(localStorage.getItem(HOSHI_ACTIONS_KEY) || "[]"); }
  catch { return []; }
}
function hoshiSaveActions(list) {
  try { localStorage.setItem(HOSHI_ACTIONS_KEY, JSON.stringify(list || [])); } catch {}
}
const hoshiUid = () => Math.random().toString(36).slice(2, 9);
/** ---------------- SCENARIOS (lightweight) ---------------- **/
// Simple actions starter linked to the first two buildings (if present)
const ACTIONS_SEED = (buildings = []) => {
  const b1 = buildings[0]?.id ?? null;
  const b2 = buildings[1]?.id ?? null;
  return [
    {
      id: hoshiUid(),
      title: "LED retrofit",
      buildingId: b1,
      tags: ["Alarm: Overrun", "Electricity", "Last 12m", ">10% vs budget"],
      status: "To review",
      capex: 25000,
      annualSavings: 8500,
      notes: "Lamp + driver swap in offices + common areas.",
      kpi: { deltaIndex: -0.03, deltaCO2: -6.5 } // index is your “service index” proxy
    },
    {
      id: hoshiUid(),
      title: "HVAC schedule",
      buildingId: b2,
      tags: ["Alarm: Comfort risk", "Overheating", "Summer", "> threshold"],
      status: "Approved",
      capex: 1000,
      annualSavings: 4200,
      notes: "Night purge + setpoint discipline.",
      kpi: { deltaIndex: -0.018, deltaCO2: -2.3 }
    }
  ];
};

const HOSHI_SCENARIOS = [
  { key:"today",  label:"Today",  year:2025, gridEF:0.20, elecP:0.28, gasP:0.07, dsyMult:1.00 },
  { key:"30-hi",  label:"2030 · High decarb", year:2030, gridEF:0.10, elecP:0.24, gasP:0.09, dsyMult:1.20 },
  { key:"30-lo",  label:"2030 · Low decarb",  year:2030, gridEF:0.18, elecP:0.27, gasP:0.08, dsyMult:1.10 },
  { key:"50-hi",  label:"2050 · High decarb", year:2050, gridEF:0.02, elecP:0.22, gasP:0.11, dsyMult:1.50 },
  { key:"50-ncc", label:"2050 · No climate change", year:2050, gridEF:0.20, elecP:0.20, gasP:0.07, dsyMult:1.00 },
];
/* -------------------- ACTION LIBRARY -------------------- */
const ACTION_TEMPLATES = [
  {
    key: "led",
    title: "LED retrofit",
    tags: ["Electricity","Fabric/Lighting"],
    appliesTo: (_b) => true,
    apply: (b) => {
      // ~18% elec cut
      const e = (+b.electricity_kwh || +b.elec_kwh || +b.electricity || 0);
      return { ...b, electricity_kwh: Math.max(0, e * 0.82) };
    },
    capex: 25000, opexSave: 8500, confidence: 0.70,
  },
  {
    key: "dhw_electrify",
    title: "Electrify DHW",
    tags: ["Gas→Elec","DHW"],
    appliesTo: (b) => (+b.gas_kwh || +b.gas || 0) > 0,
    apply: (b) => {
      const g = (+b.gas_kwh || +b.gas || 0);
      const moved = 0.30 * g;    // move ~30% of gas to DHW HP
      const COP = 2.5;
      const e = (+b.electricity_kwh || +b.elec_kwh || +b.electricity || 0);
      return {
        ...b,
        gas_kwh: Math.max(0, g - moved),
        electricity_kwh: e + moved / COP,
      };
    },
    capex: 18000, opexSave: 3200, confidence: 0.65,
  },
  {
    key: "ashp_space_heat",
    title: "ASHP for space heat",
    tags: ["Gas→Elec","Heating"],
    appliesTo: (b) => (+b.gas_kwh || +b.gas || 0) > 0,
    apply: (b) => {
      const g = (+b.gas_kwh || +b.gas || 0);
      const COP = 3.0;
      const e = (+b.electricity_kwh || +b.elec_kwh || +b.electricity || 0);
      return { ...b, gas_kwh: 0, electricity_kwh: e + (g / COP) };
    },
    capex: 120000, opexSave: 28500, confidence: 0.60,
  },
  {
    key: "bms_tune",
    title: "Controls tune-up (set-points, purge, deadbands)",
    tags: ["Controls"],
    appliesTo: (_b) => true,
    apply: (b) => {
      // ~7% total saving across elec + gas
      const e = (+b.electricity_kwh || +b.elec_kwh || +b.electricity || 0);
      const g = (+b.gas_kwh || +b.gas || 0);
      return { ...b, electricity_kwh: e * 0.93, gas_kwh: g * 0.93 };
    },
    capex: 1000, opexSave: 4200, confidence: 0.80,
  },
  {
    key: "shade_purge_fans",
    title: "Shading + secure night purge + fans",
    tags: ["Comfort","Nat-vent"],
    appliesTo: (b) => String(b.servicing || "").toLowerCase().includes("natur"),
    apply: (b) => b, // first pass: energy unchanged; benefit is comfort
    capex: 35000, opexSave: 0, confidence: 0.60,
    comfortFactor: 0.4, // 40% reduction in overheating hours (heuristic)
  },
];
/* ------------------------------------------------------- */


/** Notional intensities for a quick NCM-like proxy (kWh/m²·yr).
 *  Keep this tiny (you can refine later by sector/age).
 */
const NOTIONAL_INTENSITY = {
  Office: { AC: 210, Mixed: 170, NV: 120 },
  _default: { AC: 210, Mixed: 170, NV: 120 }
};

/** EPC-ish band mapping from % of notional (simple, transparent).
 *   <=25%A, <=50%B, <=75%C, <=100%D, <=125%E, <=150%F, else G
 */
function ncmBandFromPct(pct){
  if (pct <= 25)  return "A";
  if (pct <= 50)  return "B";
  if (pct <= 75)  return "C";
  if (pct <= 100) return "D";
  if (pct <= 125) return "E";
  if (pct <= 150) return "F";
  return "G";
}
// --- PATCH START: field aliases ---
function getEnergySplit(b){
  const elec = +(b.electricity_kwh ?? b.elec_kwh ?? b.electricity ?? 0);
  const gas  = +(b.gas_kwh ?? b.gas ?? 0);
  return { elec, gas };
}
// --- PATCH END ---

/** ---------------- COMPUTE HELPERS ---------------- **/

function intensityKWhm2(b){
  const { elec, gas } = getEnergySplit(b);
  const area = +(b.area ?? b.area_m2 ?? b.gia ?? 0);
  return area ? (elec + gas) / area : null;
}
function svcCode(s){
  const x = (s || "").toLowerCase();
  if (x.includes("natural")) return "NV";     // Naturally ventilated
  if (x.includes("mixed"))   return "Mixed";  // Mixed mode
  return "AC";                                 // Fully air-conditioned / default
}


// NCM-like proxy (relative to notional for sector + servicing)
function computeNCMProxy(b, scenario){
  const sector = b.sector || "Office";
  const svc = svcCode(b.servicing);
  const notional = (NOTIONAL_INTENSITY[sector] || NOTIONAL_INTENSITY._default)[svc] || 170;
  const inten = intensityKWhm2(b);
  if (inten == null) return { band:"–", score:null, note:"Missing area/energy." };
  const pct = (inten / notional) * 100;
  return { band: ncmBandFromPct(pct), score: Math.round(pct), note:`Relative to notional ${notional} kWh/m²·yr` };
}

// Financial risk (APT-flavoured) from scenario panel.
// We compute costs across the 5 scenario points to get a β vs portfolio.
function computeFinancialSignal(b, buildings){
  // a cost for this building across the scenario vector
  const costVec = HOSHI_SCENARIOS.map(s => {
    const { elec, gas } = getEnergySplit(b);
    return elec * s.elecP + gas * s.gasP;
  });

  // the “market” = average cost of all buildings under each scenario
  const marketVec = HOSHI_SCENARIOS.map((s) => {
    if (!Array.isArray(buildings) || buildings.length === 0) return 0;
    const list = buildings.map(B => {
      const { elec, gas } = getEnergySplit(B);
      return elec * s.elecP + gas * s.gasP;
    });
    return list.reduce((a,c)=>a+c,0) / list.length;
  });

  const mean = a => a.reduce((x,y)=>x+y,0)/(a.length || 1);
  const mB = mean(costVec), mM = mean(marketVec);

  // β (slope) via simple OLS on the scenario vector
  let num=0, den=0;
  for (let i=0;i<costVec.length;i++){
    num += (costVec[i]-mB) * (marketVec[i]-mM);
    den += (marketVec[i]-mM) ** 2;
  }
  const beta  = den > 0 ? num/den : 0;
  const alpha = mB - beta * mM;

  // idiosyncratic error (RMSE) across scenarios
  let se=0;
  for (let i=0;i<costVec.length;i++){
    const pred = alpha + beta * marketVec[i];
    se += (costVec[i] - pred) ** 2;
  }
  const idio = Math.sqrt(se / (costVec.length || 1));

  // forward deviation vs market (percent)
  const fwdDev = ((alpha + beta * mM) - mM) / (mM || 1);

  return {
    beta: +beta.toFixed(2),
    idio: Math.round(idio),
    fwd: +(fwdDev * 100).toFixed(1),
  };
}

  
// Overheating risk (adaptive-comfort proxy).
// Only meaningful for naturally ventilated / mixed-mode.
function computeOverheat(b, scenario){
  const city = (b.city||"London").toLowerCase();
  const BASE = { london:250, bristol:180, _default:220 };
  const base = BASE[city] || BASE._default;
  const svc = svcCode(b.servicing);
  const adj = svc==="NV" ? 1.0 : svc==="Mixed" ? 0.5 : 0.1;
  const shading = b.shading ? 0.8 : 1.0;
  const hours = Math.round(base * scenario.dsyMult * adj * shading);
  const level = hours>=300 ? "High" : hours>=120 ? "Moderate" : "Low";
  return { hours, level };
}

// illustrative emission factors (kgCO2e/kWh)
const HOSHI_DEFAULT_EF = { elec: 0.233, gas: 0.184 };

// derive minimal KPIs for table/compare
function hoshiKPIs(b) {
  // Accept the modal’s 
 const elec = +( b.elec_kwh ?? b.electricity_kwh ?? b.electricity ?? b.elec ?? 0 );
  const gas  = +(
    b.gas_kwh ?? b.gas ?? 0
  );
  const area = +(
    b.area ?? b.gia ?? 0
  );

  const efE  = +(b.ef_elec ?? HOSHI_DEFAULT_EF.elec);
  const efG  = +(b.ef_gas  ?? HOSHI_DEFAULT_EF.gas);

  const kwh = elec + gas;
  const tco2e = (elec * efE + gas * efG) / 1000; // tonnes
  const intensity = area > 0 ? kwh / area : 0;

  // completeness uses your original required keys; include alternates too
  const required = [
    ["name"],
    ["area","gia"],
    ["elec_kwh","electricity","elec"],
    ["gas_kwh","gas"]
  ];
  const have = required.filter(keys => keys.some(k => b[k] !== undefined && b[k] !== "")).length;
  const completeness = Math.round((have / required.length) * 100);

  return { kwh, tco2e, intensity, completeness };
}
/* ---------- tiny proxies: forward deviation + nat-vent overheating ---------- */

// pick a scenario by loose name/label match (e.g. "Today", "2030", "2050")
function pickScenario(label){
  if (!Array.isArray(HOSHI_SCENARIOS)) return null;
  const L = String(label).toLowerCase();
  return HOSHI_SCENARIOS.find(s =>
    String(s.name ?? s.label ?? "").toLowerCase().includes(L)
  ) || null;
}

/* Forward deviation at a single scenario.
   Simple proxy: my energy cost vs “market mean” cost at that scenario. */
function fwdAt(b, buildings, scenario){
  if (!b || !scenario) return 0;
  const { elec, gas } = getEnergySplit(b);
  const my = elec*scenario.elecP + gas*scenario.gasP;

  // market = mean cost across whatever buildings we have (fallback: just me)
  const base = (Array.isArray(buildings) && buildings.length ? buildings : [b]);
  const list = base.map(B => {
    const { elec, gas } = getEnergySplit(B);
    return elec*scenario.elecP + gas*scenario.gasP;
  });
  const market = list.reduce((a,c)=>a+c,0) / (list.length || 1);

  return market ? ((my - market)/market)*100 : 0; // %
}

/* Forward deviation delta between two time slices (e.g., "Today" → "2050").
   Returns *percentage points* (can be negative or positive). */
function fwdDiff(b, buildings, fromLabel="Today", toLabel="2050"){
  const sFrom = pickScenario(fromLabel), sTo = pickScenario(toLabel);
  if (!sFrom || !sTo) return 0;
  return fwdAt(b, buildings, sTo) - fwdAt(b, buildings, sFrom);
}

/* Very light overheating estimate for naturally ventilated buildings.
   Heuristic (explainable, ballpark):
   - only if servicing contains "natural"
   - base ~ 40 h/yr
   - + (intensity-90)/2 if intensity > 90 kWh/m²
   - + 20 h if yearBuilt < 1995
   - + 40 h per +1°C warming you pass in (deltaC)
   - clamp 0–800 */
function natVentOverheatHours(b, opts={}){
  const svc = String(b.servicing || "").toLowerCase();
  if (!svc.includes("natur")) return 0;

  const intensity = (() => {
    const area = +b.area || 0;
    const { elec, gas } = getEnergySplit(b);
    return area ? (elec+gas)/area : 0;
  })();

  const deltaC = +opts.deltaC || 0;
  const older  = (+b.yearBuilt || 9999) < 1995 ? 20 : 0;
  const above  = Math.max(0, intensity - 90)/2;
  const base   = 40 + older + above + (40*deltaC);
  return Math.max(0, Math.min(800, base));
}

/* -------- apply + delta calculators for templates -------- */

// Normalize aliases after a template modifies fields
function applyTemplate(b, tmpl){
  const out = tmpl.apply({ ...b });

  // maintain both alias families so the rest of the app keeps working
  const e = (out.electricity_kwh ?? out.elec_kwh ?? out.electricity ?? b.electricity_kwh ?? b.elec_kwh ?? b.electricity) || 0;
  const g = (out.gas_kwh ?? out.gas ?? b.gas_kwh ?? b.gas) || 0;

  return {
    ...out,
    electricity_kwh: e,     // preferred
    elec_kwh: e,            // alias for existing code
    gas_kwh: g,             // preferred
    gas: g,                 // alias for existing code
  };
}

// map scenario label to an approximate warming delta for nat-vent heuristic
function warmingDelta(label){
  const L = String(label || "").toLowerCase();
  if (L.includes("2050")) return 2.0;
  if (L.includes("2030")) return 1.0;
  return 0.0; // "Today" / default
}

// Compute deltas produced by applying a template to building b
function computeActionDelta(b, buildings, tmpl, scenarioLabel = "Today") {
  const s = pickScenario(scenarioLabel) || pickScenario("Today");

  const baseK   = hoshiKPIs(b);
  const baseFwd = s ? fwdAt(b, buildings, s) : 0;                     // %
  const baseSig = computeFinancialSignal(b, buildings) || {};
  const baseB   = Number(baseSig.beta || 0);
  const baseHot = natVentOverheatHours(b, { deltaC: warmingDelta(scenarioLabel) });

  const after   = applyTemplate(b, tmpl);
  const postK   = hoshiKPIs(after);
  const postFwd = s ? fwdAt(after, buildings, s) : 0;                 // %
  const postSig = computeFinancialSignal(after, buildings) || {};
  const postB   = Number(postSig.beta || 0);
  const postHot = natVentOverheatHours(after, { deltaC: warmingDelta(scenarioLabel) });

  // comfort benefit for nat-vent comfort template
  let comfortDelta = postHot - baseHot;
  if (tmpl.key === "shade_purge_fans" && String(b.servicing || "").toLowerCase().includes("natur")) {
    comfortDelta = Math.round(comfortDelta * (tmpl.comfortFactor ?? 0.5)); // negative saves hours
  }

  return {
    kwh: Math.round(postK.kwh - baseK.kwh),
    tco2e: Number((postK.tco2e - baseK.tco2e).toFixed(1)),
    intensity: Math.round((postK.intensity || 0) - (baseK.intensity || 0)),
    fwd: Number((postFwd - baseFwd).toFixed(1)),        // percentage points
    beta: Number((postB - baseB).toFixed(2)),
    overHours: Math.round(comfortDelta)
  };
}



/* ===== Hoshi helpers (currency + finance) ===== */
function getCurrency() {
  if (typeof window === "undefined") return "GBP";
  return window.localStorage.getItem("hoshi.currency") || "GBP";
}
function currencySymbol(cur) {
  return ({ GBP: "£", EUR: "€", USD: "$", JPY: "¥" }[cur]) || (cur + " ");
}
function fmtMoney(n, cur = getCurrency(), maxFrac = 0) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: maxFrac,
    }).format(n);
  } catch (e) {
    return currencySymbol(cur) + Math.round(n).toLocaleString();
  }
}
/* NPV/IRR helpers — lightweight, good enough for MVP */
function calcNPV(rate, cashflows /* array: t=0..N */) {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}
function calcIRR(cashflows, guess = 0.1) {
  // Newton-Raphson; clamp to avoid explosions
  let r = guess;
  for (let i = 0; i < 50; i++) {
    let npv = 0, d = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const denom = Math.pow(1 + r, t);
      npv += cashflows[t] / denom;
      if (t > 0) d -= (t * cashflows[t]) / Math.pow(1 + r, t + 1);
    }
    const step = npv / d;
    if (!isFinite(step)) break;
    const next = r - step;
    if (Math.abs(next - r) < 1e-6) return next;
    r = Math.max(-0.99, next);
  }
  return r;
}

// --- Demo actions shared by Actions() and PublicBPS() ---
const ACTIONS = [
  {
    id: "led",
    title: "LED retrofit",
    alarm: "Overrun • Electricity",
    status: "To review",
    capex: 25000,
    save: 8500,
    npv: 19254,
    pay: 2.9,
    beta: 0.60,
    confidence: 0.70,
    deltaIndex: -0.03,
  },
  {
    id: "hvac",
    title: "HVAC schedule",
    alarm: "Comfort risk • Overheating",
    status: "Approved",
    capex: 1000,
    save: 4200,
    npv: 9824,
    pay: 0.2,
    beta: 0.20,
    confidence: 0.80,
    deltaIndex: -0.02,
  },
];

// --- responsive helper ---
function useIsMobile(bp = 640) {
  const [m, setM] = React.useState(
    typeof window !== "undefined" &&
      window.matchMedia?.(`(max-width:${bp}px)`).matches
  );
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const on = e => setM(e.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [bp]);
  return m;
}

const Badge=({tone="neutral",children})=>{
  const map={info:"bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/30",
    success:"bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30",
    warn:"bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30",
    danger:"bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/30",
    neutral:"bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-400/30"};
  return <span className={"px-2 py-0.5 rounded-full text-xs "+map[tone]}>{children}</span>;
};
const Metric=({label,value,sub})=>(
  <div className="rounded-2xl p-4" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
    <div className="text-slate-300 text-xs">{label}</div>
    <div className="text-slate-50 text-2xl font-semibold tracking-tight">{value}</div>
    {sub && <div className="text-slate-400 text-xs">{sub}</div>}
  </div>
);
const LineChart=({points=[5,8,6,9,12,10,14,15,13,16,18,17]})=>{
  const d=useMemo(()=>{
    const max=Math.max(...points),min=Math.min(...points);
    const n=points.map(p=>(p-min)/(max-min||1)),step=280/(points.length-1);
    return n.map((v,i)=>`${i?'L':'M'}${i*step},${100-v*100}`).join(' ');
  },[points]);
  return(<svg viewBox="0 0 280 100" className="w-full h-24">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6AA6FF" stopOpacity="0.7"/><stop offset="100%" stopColor="#6AA6FF" stopOpacity="0"/></linearGradient></defs>
    <path d={d} fill="none" stroke="#6AA6FF" strokeWidth="2"/><path d={`${d} L 280 100 L 0 100 Z`} fill="url(#g)" opacity="0.2"/>
  </svg>);
};
// REPLACE your current Section with this
const Section = ({ title, desc, right, children }) => (
  <section
    className="card p-5 md:p-6 box-border w-full max-w-full"
    style={{ overflow: "visible" }}   
  >
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="text-slate-50 text-lg font-semibold">{title}</h3>
        {desc && <p className="text-slate-400 text-sm mt-1">{desc}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);



const StarLogo=({size=28})=>(
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
    <defs>
      <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6464"/><stop offset="100%" stopColor="#e23838"/></linearGradient>
      <linearGradient id="gradB" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2e3bbd"/><stop offset="100%" stopColor="#1aa9b7"/></linearGradient>
    </defs>
    <polygon fill="url(#gradR)" points="50,4 61,38 96,38 66,57 77,92 50,72 23,92 34,57 4,38 39,38"/>
    <path d="M20 34 L77 30 L35 63 Z" fill="url(#gradB)" opacity="0.95"/>
  </svg>
);
// small label chip
const Tag = ({children}) => (
  <span className="chip" style={{borderColor:"rgba(148,163,184,.3)",background:"rgba(148,163,184,.12)",color:"#e2e8f0"}}>
    {children}
  </span>
);

function DonutGauge({ value=0, max=1, size=120, stroke=14, label, display }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size/2},${size/2})`}>
        <circle r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c-dash}`}
          transform="rotate(-90)"
        />
        <text y="-4" textAnchor="middle" fontSize={size*0.22} fontWeight="700" fill="#0f172a">
          {display ?? value.toFixed(2)}
        </text>
        {label && (
          <text y={size*0.18} textAnchor="middle" fontSize={size*0.12} fill="#64748b">
            {label}
          </text>
        )}
      </g>
    </svg>
  );
}
 // desktop-only hero orb (fixed outer ring bounds; centered text overlay)
function HeroOrb({ value = 0.42, label = "Good" }) {
  const size = 520;             // canvas
  const stroke = 28;            // gauge thickness
  const r = (size / 2) - stroke;

  // keep the decorative ring fully inside the viewBox:
  // outerR + (outerStroke/2) <= size/2
  const outerStroke = 16;
  const outerR = Math.min((size / 2) - outerStroke / 2, r + 12);

  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const dash = `${circ * pct} ${circ * (1 - pct)}`;

  return (
    <div className="hidden md:flex items-center justify-center relative w-full">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* decorative outer ring (now fully inside the box) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerR}
          fill="none"
          stroke="url(#heroGrad)"
          strokeWidth={outerStroke}
          strokeOpacity="0.33"
        />

        {/* inner track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1f2937"
          strokeWidth={stroke}
          strokeOpacity="0.28"
        />

        {/* value arc */}
        <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
          <circle
            r={r}
            fill="none"
            stroke="#10b981"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={dash}
          />
        </g>
      </svg>

      {/* centered number + label */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-slate-300 text-lg mb-1">{label}</div>
          <div className="text-[88px] leading-none font-semibold text-white">
            {value.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
 function CommonwealthCarousel({ onLearnMore }) {
  const ref = React.useRef(null);
  const [idx, setIdx] = React.useState(0);

  const slides = React.useMemo(() => [
    {
      key: "what",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" opacity=".5" />
          <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18" stroke="currentColor" />
        </svg>
      ),
      title: "What it is",
      body: (
        <>
          A covenant between free societies to keep order over the things no single firm controls:
          the carbon cycle, shared grids, breathable air, by setting a{" "}
          <b>public, non-optional floor of ecological rules</b> that sits above private contracts.
        </>
      )
    },
    {
      key: "why",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="3" width="6" height="18" rx="1.5" stroke="currentColor" />
          <rect x="13" y="7" width="6" height="14" rx="1.5" stroke="currentColor" opacity=".6" />
          <path d="M7.5 7h1.5M7.5 11h1.5M15.5 11h1.5" stroke="currentColor" />
        </svg>
      ),
      title: "Why real estate needs it",
      body: (
        <>
          Buildings are few, large, and long-lived. You can’t diversify away one tower’s comfort or carbon exposure.
          With owners, tenants, <b>building operations teams</b>, insurers and lenders optimizing locally,{" "}
          <b>the risks that matter live in the gaps</b>. The commonwealth supplies the referee where voluntary
          coordination is missing.
        </>
      )
    },
    {
      key: "what-sits",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" />
          <path d="M8 9h8M8 13h8M8 17h6" stroke="currentColor" />
        </svg>
      ),
      title: "What sits in the commonwealth",
      body: (
        <>
          A <b>public floor of obligations</b> (published, explainable, enforceable), a canonical{" "}
          <b>Commonwealth Cost of Carbon (CCC)</b> everyone can reference in underwriting and leases, and a{" "}
          <b>governed record of promises</b> where claims carry baseline, method, and factors, with versions you can audit.
        </>
      )
    },
    {
      key: "practice",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 12l3 3 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "What changes for practice",
      body: (
        <>
          Instead of ad-hoc pledges and shifting internal prices, decisions line up against a{" "}
          <b>public floor</b>; obligations are <b>inspectable</b> (not just asserted); and responsibility is{" "}
          <b>portable</b> across partners, audits and time.
        </>
      )
    }
  ], []);

  // keep dots in sync while swiping
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      setIdx(Math.round(el.scrollLeft / w));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (dir) => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollBy({ left: dir * (w + 12), behavior: "smooth" });
  };

  return (
    <div className="grid gap-3 md:gap-6 md:grid-cols-2 items-start">
      {/* left: image (cap height on mobile) */}
      <div className="rounded-2xl overflow-hidden border box-border" style={{ borderColor: "var(--stroke)" }}>
        <img
          src={PEOPLE_SRC}
          alt="Commonwealth of People"
          className="block w-full h-48 sm:h-56 md:h-full object-cover"
        />
      </div>

      {/* right: carousel */}
      <div
        className="relative rounded-2xl p-3 md:p-5 min-w-0 overflow-hidden"
        style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
      >
        {/* header */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div>
            <div className="text-slate-50 font-semibold text-lg md:text-xl">Commonwealth of People</div>
            <div className="mt-1 md:mt-2 hidden sm:flex flex-wrap gap-2 text-xs">
              <span className="chip">Public floor</span>
              <span className="chip">Commonwealth Cost of Carbon</span>
              <span className="chip">Governed ledger</span>
              <span className="chip">Portable responsibility</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button className="btn btn-ghost" onClick={() => go(-1)} aria-label="Previous">‹</button>
            <button className="btn btn-ghost" onClick={() => go(1)} aria-label="Next">›</button>
          </div>
        </div>

        {/* rail */}
       <div
  ref={ref}
  className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar px-1 max-w-full"
  style={{ scrollbarWidth: "none" }}
>
          {slides.map((s) => (
            <div
              key={s.key}
              className="shrink-0 snap-start basis-full max-w-full min-w-0 rounded-xl p-3 md:p-4"
              style={{ background: "rgba(148,163,184,.06)", border: "1px solid var(--stroke)" }}
            >
              <div className="flex items-start gap-2.5 md:gap-3">
                <span className="mt-0.5 md:mt-1 text-slate-300">{s.icon}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-base md:text-lg">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-400">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-sm md:text-[0.95rem] leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* dots + CTA */}
        <div className="mt-2 md:mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 order-2 md:order-1">
            {slides.map((_, i) => (
              <span
                key={i}
                className="inline-block rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: i === idx ? "var(--text)" : "rgba(148,163,184,.45)"
                }}
              />
            ))}
          </div>
          <button
            className="btn btn-primary order-1 md:order-2 w-full md:w-auto text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2"
            onClick={onLearnMore}
          >
            Learn more
          </button>
        </div>
      </div>
    </div>
  );
}

 function HoshiAddBuildingModal({
  open,
  onClose,
  onSave,
  initial = null,                 // ← NEW (pass a building here to edit)
  defaultCurrency = "GBP",
}) {
  const blank = {
    id: undefined,
    name: "",
    city: "",
    sector: "Office",
    area: "",
    elec_kwh: "",
    gas_kwh: "",
    spend: "",
    ef_elec: HOSHI_DEFAULT_EF.elec,
    ef_gas: HOSHI_DEFAULT_EF.gas,
    yearBuilt: "",
    servicing: "Mixed mode",
    rent_sqm: "",
  };

  // for inputs, coerce numbers to strings so fields show values
  const toStr = (v) => (v === 0 || v ? String(v) : "");
const i = initial || {};
 const seed = initial
   ? {
      ...blank,
       ...i,
      area:      toStr(i.area),
      elec_kwh:  toStr(i.elec_kwh ?? i.electricity_kwh),
       gas_kwh:   toStr(i.gas_kwh  ?? i.gas),
       spend:     toStr(i.spend),
       ef_elec:   toStr(i.ef_elec ?? HOSHI_DEFAULT_EF.elec),
       ef_gas:    toStr(i.ef_gas  ?? HOSHI_DEFAULT_EF.gas),
       yearBuilt: toStr(i.yearBuilt),
       rent_sqm:  toStr(i.rent_sqm),
   }
  : blank;

          

  const [form, setForm] = React.useState(seed);
  const [imgs, setImgs] = React.useState(
    initial?.images?.length ? initial.images : [""]
  );

  React.useEffect(() => {
    if (!open) return;
    const i = initial || {};
   const fresh = initial
    ? {
         ...blank, ...i,
         area:      toStr(i.area),
         elec_kwh:  toStr(i.elec_kwh ?? i.electricity_kwh),
         gas_kwh:   toStr(i.gas_kwh  ?? i.gas),
         spend:     toStr(i.spend),
         ef_elec:   toStr(i.ef_elec ?? HOSHI_DEFAULT_EF.elec),
         ef_gas:    toStr(i.ef_gas  ?? HOSHI_DEFAULT_EF.gas),
         yearBuilt: toStr(i.yearBuilt),
         rent_sqm:  toStr(i.rent_sqm),
       }
    : blank;
    setForm(fresh);
    setImgs(i.images && i.images.length ? i.images : [""]);
  }, [open, initial]);

  const isEdit = Boolean(initial && initial.id);

  const b = {
    ...form,
    area: +form.area,
    elec_kwh: +form.elec_kwh,
    gas_kwh: +form.gas_kwh,
    ef_elec: +form.ef_elec,
    ef_gas: +form.ef_gas,
  };

  const k = hoshiKPIs(b);
  const disabled = !form.name || !form.area;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black/45 flex items-end md:items-center justify-center">
      <div
        className="w-[min(720px,92vw)] max-h-[92dvh] rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
      >
        <div className="px-4 md:px-5 py-4 md:py-5">
          <div className="text-slate-100 font-semibold text-lg">
            {isEdit ? "Edit building" : "Add building"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-5 pb-[max(env(safe-area-inset-bottom),16px)]">
          {/* ——— your existing form fields exactly as before ——— */}
          <div className="grid md:grid-cols-2 gap-3">
  {/* Name */}
  <div>
    <label className="text-xs text-slate-400">Name</label>
    <input
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.name}
      onChange={e=>setForm({ ...form, name:e.target.value })}
      placeholder="1 King Street"
    />
  </div>

  {/* City */}
  <div>
    <label className="text-xs text-slate-400">City</label>
    <input
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.city}
      onChange={e=>setForm({ ...form, city:e.target.value })}
      placeholder="London"
    />
  </div>

  {/* Sector */}
  <div>
    <label className="text-xs text-slate-400">Sector</label>
    <select
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.sector}
      onChange={e=>setForm({ ...form, sector:e.target.value })}
    >
      <option>Office</option>
      <option>Retail</option>
      <option>Industrial</option>
      <option>Other</option>
    </select>
  </div>

  {/* Area */}
  <div>
    <label className="text-xs text-slate-400">Area (m²)</label>
    <input
      type="number" min="0"
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.area}
      onChange={e=>setForm({ ...form, area:e.target.value })}
      placeholder="12800"
    />
  </div>

  {/* Electricity */}
  <div>
    <label className="text-xs text-slate-400">Electricity (kWh/yr)</label>
    <input
      type="number" min="0"
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.elec_kwh}
      onChange={e=>setForm({ ...form, elec_kwh:e.target.value })}
      placeholder="95000"
    />
  </div>

  {/* Gas */}
  <div>
    <label className="text-xs text-slate-400">Gas (kWh/yr)</label>
    <input
      type="number" min="0"
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.gas_kwh}
      onChange={e=>setForm({ ...form, gas_kwh:e.target.value })}
      placeholder="47000"
    />
  </div>

  {/* Spend */}
  <div>
    <label className="text-xs text-slate-400">Annual spend ({defaultCurrency})</label>
    <input
      type="number" min="0"
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.spend}
      onChange={e=>setForm({ ...form, spend:e.target.value })}
      placeholder="30150"
    />
  </div>

  {/* Year built */}
  <div>
    <label className="text-xs text-slate-400">Year built</label>
    <input
      type="number"
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.yearBuilt}
      onChange={e=>setForm({ ...form, yearBuilt:e.target.value })}
      placeholder="2009"
    />
  </div>

  {/* Servicing */}
  <div>
    <label className="text-xs text-slate-400">Servicing strategy</label>
    <select
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.servicing}
      onChange={e=>setForm({ ...form, servicing:e.target.value })}
    >
      <option>Fully air-conditioned</option>
      <option>Mixed mode</option>
      <option>Naturally ventilated</option>
    </select>
  </div>

  {/* Rent */}
  <div>
    <label className="text-xs text-slate-400">Rent £/m² (optional)</label>
    <input
      type="number" min="0"
      className="w-full mt-1 px-3 py-2 rounded-lg"
      style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
      value={form.rent_sqm}
      onChange={e=>setForm({ ...form, rent_sqm:e.target.value })}
      placeholder="243"
    />
  </div>

  {/* Images (full width) */}
  <div className="md:col-span-2">
    <label className="text-xs text-slate-400">Images (URLs, up to 3)</label>
    {imgs.map((u, i) => (
      <div key={i} className="flex gap-2 mt-1">
        <input
          className="flex-1 px-3 py-2 rounded-lg"
          style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
          placeholder="https://…/building.jpg"
          value={u}
          onChange={e=>setImgs(imgs.map((x, ii)=>(ii===i? e.target.value : x)))}
        />
        <button type="button" className="btn btn-ghost" onClick={()=>setImgs(imgs.filter((_,ii)=>ii!==i))}>
          Remove
        </button>
      </div>
    ))}
    {imgs.length < 3 && (
      <button type="button" className="btn btn-ghost mt-2" onClick={()=>setImgs([...imgs, ""])}>
        + Add image
      </button>
    )}
  </div>

  {/* Emission factors */}
  <div className="grid grid-cols-2 gap-3 md:col-span-2">
    <div>
      <label className="text-xs text-slate-400">EF elec (kgCO₂e/kWh)</label>
      <input
        type="number" step="0.001"
        className="w-full mt-1 px-3 py-2 rounded-lg"
        style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
        value={form.ef_elec}
        onChange={e=>setForm({ ...form, ef_elec:e.target.value })}
      />
    </div>
    <div>
      <label className="text-xs text-slate-400">EF gas (kgCO₂e/kWh)</label>
      <input
        type="number" step="0.001"
        className="w-full mt-1 px-3 py-2 rounded-lg"
        style={{ background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)" }}
        value={form.ef_gas}
        onChange={e=>setForm({ ...form, ef_gas:e.target.value })}
      />
    </div>
  </div>
</div>

{/* Live KPI preview */}
<div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
    <div className="text-xs text-slate-400">kWh</div>
    <div className="text-slate-100 font-semibold">{k.kwh.toLocaleString()}</div>
  </div>
  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
    <div className="text-xs text-slate-400">tCO₂e</div>
    <div className="text-slate-100 font-semibold">{k.tco2e.toFixed(1)}</div>
  </div>
  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
    <div className="text-xs text-slate-400">Intensity (kWh/m²)</div>
    <div className="text-slate-100 font-semibold">{k.intensity ? k.intensity.toFixed(0) : "—"}</div>
  </div>
  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
    <div className="text-xs text-slate-400">Completeness</div>
    <div className="text-slate-100 font-semibold">{k.completeness}%</div>
  </div>
</div>
        
        </div>

        <div className="border-t" style={{ borderColor: "var(--stroke)" }}>
          <div className="p-4 md:p-5 flex items-center justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={disabled}
              onClick={() => {
                const payload = {
                  id: initial?.id ?? hoshiUid(),
                  ...b,
                  spend: +form.spend || null,
                  yearBuilt: +form.yearBuilt || null,
                  servicing: form.servicing || null,
                  rent_sqm: +form.rent_sqm || null,
                  images: imgs.filter(Boolean),
                  updated: new Date().toISOString().slice(0, 10),
                  ...(initial?.isDemo ? { isDemo: false } : {}),
                };
                onSave(payload);
                onClose();
              }}
            >
              {isEdit ? "Save changes" : "Save building"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function BuildingCard({ b, onPick, picked }) {
  const k = hoshiKPIs(b);
  const hero = (b.images && b.images[0]) || LOGO_SRC;
  return (
    <div className={`rounded-2xl overflow-hidden border ${picked ? "ring-2 ring-sky-400" : ""}`}
         style={{borderColor:"var(--stroke)", background:"var(--panel-2)"}}>
      <div className="w-full h-40 sm:h-48 overflow-hidden">
        <img src={hero} alt={b.name} className="w-full h-full object-cover" loading="lazy"/>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-slate-50 font-semibold">{b.name}</div>
            <div className="text-slate-400 text-xs">{b.city || "—"} · {b.sector || "—"}</div>
          </div>
          <button className="btn btn-ghost text-xs" onClick={onPick}>
            {picked ? "Remove" : "Compare"}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          {b.servicing && <span className="chip">{b.servicing}</span>}
          {b.yearBuilt ? <span className="chip">{b.yearBuilt}</span> : null}
          {b.rent_sqm ? <span className="chip">£{b.rent_sqm}/m²</span> : null}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg p-2" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
            <div className="text-[10px] text-slate-400">kWh</div>
            <div className="text-slate-100 font-semibold text-sm">{Math.round(k.kwh).toLocaleString()}</div>
          </div>
          <div className="rounded-lg p-2" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
            <div className="text-[10px] text-slate-400">tCO₂e</div>
            <div className="text-slate-100 font-semibold text-sm">{k.tco2e.toFixed(1)}</div>
          </div>
          <div className="rounded-lg p-2" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
            <div className="text-[10px] text-slate-400">kWh/m²</div>
            <div className="text-slate-100 font-semibold text-sm">{k.intensity?Math.round(k.intensity):"—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareTable({ cols, scenario, buildings }) {
  const rows = [
    { k: "Location",  f: b => b.city || "—" },
    { k: "Sector",    f: b => b.sector || "—" },
    { k: "Servicing", f: b => b.servicing || "—" },
    { k: "Year built",f: b => b.yearBuilt || "—" },
    { k: "Area (m²)", f: b => (b.area || 0).toLocaleString() },
    { k: "Energy (kWh)", f: b => Math.round(hoshiKPIs(b).kwh).toLocaleString() },
    { k: "tCO₂e/yr",  f: b => hoshiKPIs(b).tco2e.toFixed(1) },
    { k: "Intensity (kWh/m²)", f: b => hoshiKPIs(b).intensity ? Math.round(hoshiKPIs(b).intensity) : "—" },
    { k: "Annual spend", f: b => b.spend ? fmtMoney(b.spend) : "—" },

    // --- NEW: scenario-aware risk group ---
    { k: "Scenario", f: () => scenario.label },

    { k: "NCM (asset rating)", f: b => {
        const r = computeNCMProxy(b, scenario);                  // uses intensity vs notional
        return r.score != null ? `${r.score}% · ${r.band}` : "—";
      } },

    { k: "Forward price deviation", f: b => {
  const f = computeFinancialSignal(b, buildings);
  const val = Number(f.fwd);
 return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
      } },

    { k: "β (sensitivity)", f: b => computeFinancialSignal(b, buildings).beta.toFixed(2) },

    { k: "Idiosyncratic (RMSE)", f: b => {
        const { idio } = computeFinancialSignal(b, buildings);
        return fmtMoney(idio);
      } },

    { k: "Overheating (DSY hours)", f: b => {
        const oh = computeOverheat(b, scenario);                  // NV/Mixed more exposed
        return `${oh.hours} h (${oh.level})`;
      } },

    { k: "Updated", f: b => b.updated || "—" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[640px] w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 pr-3 text-slate-400">Metric</th>
            {cols.map(b => (
              <th key={b.id} className="text-left py-2 px-3 text-slate-300">
                <div className="flex items-center gap-2">
                  <img src={(b.images&&b.images[0])||LOGO_SRC} alt="" className="w-9 h-9 rounded object-cover"/>
                  <div>
                    <div className="text-slate-50 font-medium">{b.name}</div>
                    <div className="text-slate-400 text-xs">{b.city || "—"}</div>
                  </div>
                </div>
              </th>
            ))}
          </tr>
          
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.k} className="border-t" style={{borderColor:"var(--stroke)"}}>
              <td className="py-2 pr-3 text-slate-400">{r.k}</td>
              {cols.map(b => <td key={b.id} className="py-2 px-3 text-slate-100">{r.f(b)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ScenarioBar({ value, onChange }){
  return (
    <div className="flex flex-wrap gap-2 items-center text-xs text-slate-300 mb-3">
      <span className="opacity-70">Scenario:</span>
      {HOSHI_SCENARIOS.map(s=>(
        <button key={s.key}
          onClick={()=>onChange(s)}
          className={"chip "+(value.key===s.key?"ring-1 ring-sky-400":"")}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

function CompareView({ buildings, setBuildings }) {
  const [picked, setPicked] = React.useState([]);
  const toggle = (id) =>
    setPicked(xs => xs.includes(id) ? xs.filter(x=>x!==id) : (xs.length<3 ? [...xs,id] : xs));
const [scenario, setScenario] = React.useState(HOSHI_SCENARIOS[0]);
  return (
    <Section
      title="Compare buildings"
      desc="Pick up to three assets and see them side-by-side. Supports images, servicing, and core KPIs."
    >
      {/* cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {buildings.map(b => (
          <BuildingCard
            key={b.id}
            b={b}
            picked={picked.includes(b.id)}
            onPick={()=>toggle(b.id)}
          />
        ))}
      </div>

      {/* table */}
      {picked.length>0 && (
        <div className="mt-4 rounded-2xl p-4 md:p-5" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-50 font-semibold">Side-by-side</div>
            <div className="text-slate-400 text-xs">{picked.length} selected (max 3)</div>
          </div>
           {/* NEW: scenario selector */}
          <ScenarioBar value={scenario} onChange={setScenario} />
          
          <CompareTable
            cols={buildings.filter(b=>picked.includes(b.id))}
            scenario={scenario}
            buildings={buildings}
          />
        </div>
      )}
    </Section>
  );
}


function Story({ goApp, goBlog }) {
  // tiny sparkline + demo
  const roiSpark = [2, 3, 2, 4, 5, 4, 6, 7, 6, 7, 8, 7];
  const demoAvg = 0.42;

  // small helpers
  const Stat = ({ k, s }) => (
    <div className="pill">
      <div className="k">{k}</div>
      <div className="s">{s}</div>
    </div>
  );

  const Band = ({ tone = 1, children, id }) => {
    const bg = [
      "linear-gradient(180deg,#0c111b 0%,#0b1320 100%)",
      "linear-gradient(180deg,#0b1320 0%,#0b1626 100%)",
      "linear-gradient(180deg,#0b1626 0%,#0b1a2d 100%)",
    ][Math.max(0, Math.min(2, tone - 1))];
    return (
      <section id={id} className="rounded-2xl p-5 md:p-6 border" style={{ background: bg, border: "1px solid var(--stroke)" }}>
        {children}
      </section>
    );
  };

  // icons
  const IcoFEP = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 18V6m0 12h16M8 14l3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const IcoScenario = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h12M4 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
  const IcoThermo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M10 14V6a2 2 0 114 0v8a4 4 0 11-4 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const IcoWrench = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20 7a5 5 0 01-7 7l-6 6-3-3 6-6a5 5 0 017-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );


  // money formatter (single copy)
  const fmtMoney = (n) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency:
        (typeof window !== "undefined" &&
          (window.localStorage.getItem("hoshi.currency") || "GBP")) || "GBP",
      maximumFractionDigits: 0,
    }).format(n);

  // demo inputs used for "Illustrative outcome"
  const DEMO = {
    capex: 250_000,
    baselineAnnual: 1_200_000,
    savingsPct: 0.12,
    opex: 15_000,
    years: 10,
    rate: 0.08,
  };

  const [showAssump, setShowAssump] = React.useState(false);

  // compute once for the demo
  const { payback, npv10, irr, annualSavings } = React.useMemo(() => {
    const s = DEMO.baselineAnnual * DEMO.savingsPct;
    const flows = [-DEMO.capex, ...Array.from({ length: DEMO.years }, () => (s - DEMO.opex))];
    return {
      annualSavings: s,
      payback: s > 0 ? DEMO.capex / s : Infinity,
      npv10: calcNPV(DEMO.rate, flows), // assumes calcNPV helper exists globally
      irr: calcIRR(flows),               // assumes calcIRR helper exists globally
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        {/* HERO */}
        <Band tone={1}>
          <div className="grid grid-cols-1 gap-6 md:gap-10">
            <div>
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <span className="chip">Prototype</span>
                <span className="chip" style={{background:"rgba(148,163,184,.12)",color:"#e2e8f0",borderColor:"rgba(148,163,184,.3)"}}>
                  Dark UI · Blue→Green
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.08]">
                <span className="text-slate-100">Hoshi — </span>
                <span className="text-neon">transparent ESG</span>
                <span className="text-slate-100"> for real estate.</span>
              </h1>

              <p className="text-slate-300 mt-4 text-base md:text-lg max-w-2xl">
                Evidence that moves value: scenario-adjusted service performance, comfort risk,
                and forward ROI — shared by owners, occupiers, and suppliers.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={goApp} className="btn btn-primary">Launch prototype</button>
                <a href="#how" className="btn btn-ghost">See how it works</a>
              </div>
            </div>
          </div>
        </Band>

        {/* VALUE STRIPE */}
        <Band tone={2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Stat k="10×" s="faster onboarding" />
            <Stat k="92%" s="data coverage" />
            <Stat k="β 0.35–2.48" s="sensitivity to drivers" />
            <Stat k="−15–+8%" s="Forward Energy Premium" />
          </div>
        </Band>

        {/* WHO IT BENEFITS */}
        <Band tone={3} id="who">
          <h3 className="text-slate-50 text-lg font-semibold mb-3">Who Hoshi serves</h3>
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-xl p-3" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
              <div className="text-slate-300 text-sm">Owners</div>
              <div className="text-slate-100 mt-1 text-[15px]">
                Show value uplift with FEP and comfort outlook; reference indices in leases and capex cases.
              </div>
            </div>
            <div className="rounded-xl p-3" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
              <div className="text-slate-300 text-sm">Occupiers</div>
              <div className="text-slate-100 mt-1 text-[15px]">
                Compare buildings on cost, risk, and satisfaction; prioritise measures with payback & confidence.
              </div>
            </div>
            <div className="rounded-xl p-3" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
              <div className="text-slate-300 text-sm">Suppliers</div>
              <div className="text-slate-100 mt-1 text-[15px]">
                Compete on verified service indices; get credit for measured outcomes, not promises.
              </div>
            </div>
          </div>
        </Band>

        {/* WHAT YOU GET */}
        <Band tone={1}>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Forward Energy Premium */}
            <div className="card p-4 md:p-6 relative">
              <div className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full blur-3xl"
                   style={{ background: "radial-gradient(circle, rgba(59,130,246,.18), transparent 60%)" }}/>
              <h3 className="text-slate-50 text-lg font-semibold">Forward Energy Premium</h3>
              <p className="text-slate-400 text-sm mt-1">
                Quantifies how energy &amp; service factors add/subtract from expected ROI — split by systematic (β) vs idiosyncratic drivers.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-xl p-3 z-10" style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}>
                  <div className="text-xs text-slate-400">Avg. index</div>
                  <div className="mt-2 bg-white rounded-xl p-2 inline-block">
                    <DonutGauge value={0.07 - demoAvg} max={0.07} size={96} stroke={12}
                                display={(demoAvg * 10).toFixed(2)} label="Good" />
                  </div>
                </div>

                <div className="rounded-xl p-3 sm:col-span-1 md:col-span-2 z-0"
                     style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">Expected ROI contribution</div>
                    <span className="chip">Lower risk</span>
                  </div>
                  <div className="mt-2"><LineChart points={roiSpark} /></div>
                </div>
              </div>
            </div>

            {/* Scenario Studio */}
            <div className="card p-4 md:p-6 relative overflow-hidden">
              <div className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full blur-3xl"
                   style={{background:"radial-gradient(circle, rgba(16,185,129,.16), transparent 60%)"}}/>
              <h3 className="text-slate-50 text-lg font-semibold">Scenario Studio</h3>
              <p className="text-slate-400 text-sm mt-1">
                One-click stress tests across energy prices, policy, and climate pathways —
                compare “as-is” vs “project” by payback and comfort.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
                  <div className="text-xs text-slate-400 mb-1">Overheating hours</div>
                  <div className="text-slate-100 font-semibold">−28%</div>
                  <div className="text-xs text-slate-400">Mixed-mode retrofit</div>
                </div>
                <div className="rounded-xl p-3" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
                  <div className="text-xs text-slate-400 mb-1">Payback</div>
                  <div className="text-slate-100 font-semibold">1.8 years</div>
                  <div className="text-xs text-slate-400">LED + controls</div>
                </div>
              </div>
            </div>
          </div>

          {/* What you get — narrative outcome */}
          <div className="mt-4">
            <div className="rounded-2xl p-4 md:p-5" style={{background:"var(--panel-2)", border:"1px solid var(--stroke)"}}>
              <div className="text-slate-50 font-semibold">Illustrative outcome</div>
              <p className="text-slate-300 text-sm mt-1">
                For a typical 12,800&nbsp;m² office, Hoshi flags LED + controls and HVAC schedule tuning,
                verifies a {Math.round(DEMO.savingsPct*100)}% utility reduction, and ranks it by confidence.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-3">
                <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)", border:"1px solid var(--stroke)"}}>
                  <div className="text-xs text-slate-400 mb-1">Payback</div>
                  <div className="text-slate-100 font-semibold">
                    {Number.isFinite(payback) ? `${payback.toFixed(1)}y` : "—"}
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)", border:"1px solid var(--stroke)"}}>
                  <div className="text-xs text-slate-400 mb-1">NPV (10y)</div>
                  <div className="text-slate-100 font-semibold">{fmtMoney(npv10)}</div>
                </div>
                <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)", border:"1px solid var(--stroke)"}}>
                  <div className="text-xs text-slate-400 mb-1">IRR (10y)</div>
                  <div className="text-slate-100 font-semibold">
                    {Number.isFinite(irr) ? `${(irr*100).toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="text-xs text-slate-400">≈ {fmtMoney(annualSavings)} saved per year, verified via data lineage.</div>
                <button className="btn btn-ghost text-xs" onClick={()=>setShowAssump(x=>!x)}>
                  {showAssump ? "Hide" : "See"} assumptions
                </button>
              </div>

              {showAssump && (
                <ul className="text-xs text-slate-400 mt-2 list-disc pl-4">
                  <li>CapEx {fmtMoney(DEMO.capex)}; service OpEx {fmtMoney(DEMO.opex)}/yr</li>
                  <li>Baseline utilities {fmtMoney(DEMO.baselineAnnual)}/yr; savings {Math.round(DEMO.savingsPct*100)}%</li>
                  <li>10-year horizon @ 8% discount rate (illustrative)</li>
                </ul>
              )}
            </div>
          </div>

          {/* compact value grid */}
          <div className="mt-4 grid md:grid-cols-4 gap-3 md:gap-4">
            <div className="usp-card"><div className="flex items-start gap-3"><span className="usp-ico"><IcoFEP/></span><div><div className="text-slate-100 font-medium">Forward Energy Premium</div><div className="text-slate-400 text-sm">Decision-grade ROI signal with β split.</div></div></div></div>
            <div className="usp-card"><div className="flex items-start gap-3"><span className="usp-ico"><IcoScenario/></span><div><div className="text-slate-100 font-medium">Scenario Studio</div><div className="text-slate-400 text-sm">Stress test prices, policy, climate to 2030/2050.</div></div></div></div>
            <div className="usp-card"><div className="flex items-start gap-3"><span className="usp-ico"><IcoThermo/></span><div><div className="text-slate-100 font-medium">Comfort risk</div><div className="text-slate-400 text-sm">Expected overheating hours & satisfaction impact.</div></div></div></div>
            <div className="usp-card"><div className="flex items-start gap-3"><span className="usp-ico"><IcoWrench/></span><div><div className="text-slate-100 font-medium">Strategy advisor</div><div className="text-slate-400 text-sm">Measures ranked by payback & certainty.</div></div></div></div>
          </div>
        </Band>

        {/* COMMONWEALTH OF PEOPLE (carousel) */}
        <Band tone={3} id="commonwealth">
          <CommonwealthCarousel
            onLearnMore={() => {
              if (typeof goBlog === "function") goBlog();
              else window.location.hash = "#blog";
            }}
          />
        </Band>

        {/* HOW IT WORKS */}
        <Band tone={2} id="how">
          <h3 className="text-slate-50 text-lg font-semibold mb-3">How it works</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="how-step"><div className="how-num mb-2">1</div><div className="text-slate-100 font-medium">Ingest</div><div className="text-slate-400 text-sm">Email PDFs/CSVs or connect a meter. OCR + normalisation standardise the data.</div></div>
            <div className="how-step"><div className="how-num mb-2">2</div><div className="text-slate-100 font-medium">Compare</div><div className="text-slate-400 text-sm">FEP, β, intensity, tCO₂e, spend & comfort risk — scenario-aware.</div></div>
            <div className="how-step"><div className="how-num mb-2">3</div><div className="text-slate-100 font-medium">Publish & act</div><div className="text-slate-400 text-sm">Share a Building Performance Sheet. Prioritise actions by ROI and confidence.</div></div>
          </div>
        </Band>

        {/* CTA */}
        <Band tone={3}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="text-slate-50 text-lg font-semibold">See your Forward Energy Premium</div>
              <div className="text-slate-300 text-sm">Upload a bill or EPC — get decision-grade metrics in minutes.</div>
            </div>
            <button onClick={goApp} className="btn btn-primary">Get started</button>
          </div>
        </Band>
      </div>
    </div>
  );
}

function Onboarding({ goAddBuilding }){
  const [step,setStep]=useState(1);
  const next=()=>setStep(s=>Math.min(4,s+1));
  const back=()=>setStep(s=>Math.max(1,s-1));
  const inputStyle={background:"var(--panel-2)",border:"1px solid var(--stroke)",borderRadius:"12px",padding:"8px 12px",color:"#fff",width:"100%"};
  return(<div className="grid gap-4 md:gap-6">
    <div className="flex items-center gap-2 md:gap-3">{[1,2,3,4].map(i=>(<div key={i} className={`h-2 rounded-full ${i<=step?"bg-blue-400":"bg-slate-700"}`} style={{width:i===step?80:64}}/>))}</div>
    {step === 1 && (
  <Section title="Basics" desc="Name your portfolio and set default units.">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Portfolio name */}
      <div>
        <label className="text-sm text-slate-300">Portfolio name</label>
        <input className="mt-1" style={inputStyle} placeholder="Acme Real Estate" />
      </div>

      {/* Area + Currency side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Area units */}
        <div>
          <label className="text-sm text-slate-300">Area units</label>
          <select className="mt-1" style={inputStyle}>
            <option>m²</option>
            <option>ft²</option>
          </select>
        </div>

        {/* Currency (wrapped so it doesn't drop under Area) */}
        <div>
          <label className="text-sm text-slate-300">Currency</label>
          <select
            className="mt-1"
            style={inputStyle}
            defaultValue={
              typeof window !== "undefined"
                ? (window.localStorage.getItem("hoshi.currency") || "GBP")
                : "GBP"
            }
            onChange={(e) => window.localStorage.setItem("hoshi.currency", e.target.value)}
          >
            <option>GBP</option>
            <option>EUR</option>
            <option>USD</option>
          </select>
        </div>
      </div>
    </div>

    <div className="mt-4 flex justify-end">
      <button onClick={next} className="btn btn-primary">Next</button>
    </div>
  </Section>
)}


      
    {step===2 && (<Section title="Email-to-ingest" desc="Forward bills to this unique address. We'll extract totals and dates.">
      <div className="flex items-center gap-3"><code className="px-3 py-2 rounded-xl" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)",color:"#93c5fd"}}>bills+acme@hoshi.app</code><button className="btn btn-ghost">Copy</button></div>
      <div className="mt-4 flex justify-between"><button onClick={back} className="btn btn-ghost">Back</button><button onClick={next} className="btn btn-primary">Next</button></div>
    </Section>)}
    {step===3 && (<Section title="Portfolio settings">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="text-sm text-slate-300">Estimated buildings</label><input className="mt-1" style={inputStyle} placeholder="12"/></div>
        <div><label className="text-sm text-slate-300">Sectors</label><select className="mt-1" style={inputStyle}><option>Office</option><option>Residential</option><option>Retail</option></select></div>
        <div><label className="text-sm text-slate-300">Time zone</label><select className="mt-1" style={inputStyle}><option>Europe/London</option></select></div>
      </div>
      <div className="mt-4 flex justify-between"><button onClick={back} className="btn btn-ghost">Back</button><button onClick={next} className="btn btn-primary">Create portfolio</button></div>
    </Section>)}
     {step===4 && (
  <Section title="You're set" desc="Add your first building — it takes about 3 minutes.">
 <div className="flex justify-between">
 <button onClick={back} className="btn btn-ghost">Back</button>
 <button className="btn btn-primary" onClick={goAddBuilding}>Add building</button>
</div>
</Section>
)}
  </div>);
}


function Portfolio({ buildings = [], setBuildings }) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
const [editing,  setEditing]  = React.useState(null);
const openEdit = (b) => { setEditing(b); setEditOpen(true); };
  const defaultCurrency = (typeof window !== "undefined"
    ? (localStorage.getItem("hoshi.currency") || "GBP")
    : "GBP");
  const fmtMoney = (n) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: defaultCurrency || "GBP",
    maximumFractionDigits: 0,
  }).format(n || 0);


    // ✅ Auto-open when coming from Onboarding
  React.useEffect(() => {
    if (localStorage.getItem("hoshi.intent") === "add-building") {
      setAddOpen(true);
      localStorage.removeItem("hoshi.intent");
    }
  }, []);

  const rows = buildings.length
    ? buildings.map(b => {
        const k = hoshiKPIs(b);
        return {
          name: b.name,
          kwh: Math.round(k.kwh),
          co2: k.tco2e,
          intensity: Math.round(k.intensity || 0),
          complete: (k.completeness || 0) / 100,
          actions: 0,
          updated: b.updated || "—",
        };
      })
    : [
        {name:"1 King Street",kwh:142000,co2:36.2,intensity:92,complete:.92,actions:3,updated:"2025-08-10"},
        {name:"42 Market Way",kwh:98000,co2:24.4,intensity:78,complete:.84,actions:1,updated:"2025-08-07"},
        {name:"Riverside 8",kwh:123500,co2:31.0,intensity:88,complete:.67,actions:2,updated:"2025-08-05"},
      ];

const rollup = React.useMemo(() => {
  if (buildings?.length) {
    // Real buildings → use hoshiKPIs
    let totalKwh = 0, totalCO2 = 0, totalSpend = 0, totalArea = 0;
    for (const b of buildings) {
      const k = hoshiKPIs(b);
      totalKwh += k.kwh;
      totalCO2 += k.tco2e;
      totalArea += (+b.area || 0);
      totalSpend += (+b.spend || 0);
    }
    return {
      totalKwh,
      totalCO2,
      totalSpend,
      avgIntensity: totalArea ? totalKwh / totalArea : 0,
    };
  }

  // Fallback: placeholder rows already have aggregate-like values
 if (rows?.length) {
  const totalKwh = rows.reduce((s, r) => s + (+r.kwh || 0), 0);
  const totalCO2 = rows.reduce((s, r) => s + (+r.co2 || 0), 0);
  const avgIntensity =
    rows.length ? rows.reduce((s, r) => s + (+r.intensity || 0), 0) / rows.length : 0;

  return { totalKwh, totalCO2, totalSpend: null, avgIntensity }; // <- null (not 0)
}

  return null;
}, [buildings, rows]);

  const Kpi = (p) => <Metric {...p} />;

  return (
    <div className="grid gap-4 md:gap-6">
      <Section
        title="Portfolio summary"
        right={<button className="hidden md:inline-flex btn btn-ghost">Export Portfolio Pack</button>}
      >
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
  <Kpi
    label="Total energy"
    value={rollup ? `${Math.round(rollup.totalKwh).toLocaleString()} kWh` : "363,500 kWh"}
    sub="Last 12 months"
  />
  <Kpi
    label="Emissions"
    value={rollup ? `${rollup.totalCO2.toFixed(1)} tCO₂e` : "91.6 tCO₂e"}
    sub="Scope 2 location-based"
  />
  <Kpi
  label="Spend"
  value={
    rollup && rollup.totalSpend != null
      ? fmtMoney(rollup.totalSpend)
      : "£ 69,120" // sample figure
  }
  sub={rollup && rollup.totalSpend != null ? "Utilities" : "Utilities (sample)"}
/>

  <Kpi
    label="Avg. intensity"
    value={rollup ? `${Math.round(rollup.avgIntensity)} kWh/m²` : "86 kWh/m²"}
    sub="All buildings"
  />
</div>

      </Section>

      <Section
        title="Buildings"
        desc="Sort by intensity or data completeness to prioritise."
        right={
          <div className="hidden md:flex gap-2">
            <button className="btn btn-ghost">Sort</button>
            <button className="btn btn-primary" onClick={()=>setAddOpen(true)}>Add building</button>
          </div>
        }
      >
        {/* mobile chips */}
        <div className="md:hidden -mx-2 mb-3 overflow-x-auto no-scrollbar">
          <div className="px-2 flex gap-2">
            <span className="chip whitespace-nowrap">Sort: Intensity</span>
            <span className="chip whitespace-nowrap">Filter: All</span>
            <span className="chip whitespace-nowrap">Export</span>
          </div>
        </div>

        {/* desktop table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl" style={{border:"1px solid var(--stroke)"}}> 
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-slate-300" style={{background:"var(--panel-2)"}}>
              <tr>
                {["Building","kWh","tCO₂e","Intensity","Completeness","Actions","Updated",""].map((h,i)=>(
  <th key={i} className="text-left px-4 py-3" style={{borderBottom:"1px solid var(--stroke)"}}>{h}</th>
))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{borderColor:"var(--stroke)"}}>
  {rows.map((r,i)=>(
    <tr key={i} className="hover:bg-[#10131a]">
      <td className="px-4 py-3 text-slate-100">{r.name}</td>
      <td className="px-4 py-3 text-slate-300">{r.kwh.toLocaleString()}</td>
      <td className="px-4 py-3 text-slate-300">{Number(r.co2).toFixed(1)}</td>
      <td className="px-4 py-3 text-slate-300">{r.intensity}</td>
      <td className="px-4 py-3">
        <div className="w-28 h-2 rounded bg-slate-800">
          <div className="h-2 rounded bg-emerald-400" style={{width:(r.complete*100)+"%"}}/>
        </div>
        <div className="text-xs text-slate-400 mt-1">{Math.round(r.complete*100)}%</div>
      </td>
      <td className="px-4 py-3 text-slate-300">{r.actions}</td>
      <td className="px-4 py-3 text-slate-400">{r.updated}</td>
      <td className="px-4 py-3 text-right">
        {buildings[i] && (
          <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(buildings[i])}>
            Edit
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>

        {/* mobile list */}
       <ul className="md:hidden space-y-3 pb-[calc(96px+max(env(safe-area-inset-bottom),16px))]">
          {rows.map((r,i)=>(
            <li key={i} className="rounded-2xl p-4" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-slate-100 font-medium">{r.name}</div>
                <div className="text-slate-400 text-xs">Updated {r.updated}</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><div className="text-xs text-slate-400">kWh</div><div className="text-slate-200 font-semibold">{r.kwh.toLocaleString()}</div></div>
                <div><div className="text-xs text-slate-400">tCO₂e</div><div className="text-slate-200 font-semibold">{Number(r.co2).toFixed(1)}</div></div>
                <div><div className="text-xs text-slate-400">Intensity</div><div className="text-slate-200 font-semibold">{r.intensity}</div></div>
                <div>
                  <div className="text-xs text-slate-400">Completeness</div>
                  <div className="mt-1 h-2 rounded bg-slate-800">
                    <div className="h-2 rounded bg-emerald-400" style={{width:`${r.complete*100}%`}}/>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{Math.round(r.complete*100)}%</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
  <span className="text-xs text-slate-400">{r.actions} actions</span>
  {buildings[i] ? (
    <button className="btn btn-ghost" onClick={()=>openEdit(buildings[i])}>Edit</button>
  ) : (
    <span className="text-xs text-slate-500">Sample</span>
  )}
</div>
            </li>
          ))}
        </ul>

        {/* Mobile FAB */}
      <button
  className="md:hidden fixed right-5 btn btn-primary rounded-full shadow-lg z-[3000]"
  aria-label="Add building"
  style={{
    bottom: 'calc(72px + max(env(safe-area-inset-bottom), 16px))', // clears the Webflow badge
    right: 'max(1.25rem, env(safe-area-inset-right))'
  }}
  onClick={() => setAddOpen(true)}
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
</button>
      </Section>

      {/* Add building modal */}
      <HoshiAddBuildingModal
        open={addOpen}
        onClose={()=>setAddOpen(false)}
        defaultCurrency={defaultCurrency}
        onSave={(b)=>{ setBuildings?.(prev => [...(prev || []), b]); setAddOpen(false); }}
      />
      <HoshiAddBuildingModal
  open={editOpen}
  initial={editing}                 // ← prefill when editing
  defaultCurrency={defaultCurrency}
  onClose={() => { setEditOpen(false); setEditing(null); }}
  onSave={(updated) => {
    setBuildings(prev => (prev || []).map(x =>
      x.id === updated.id ? { ...x, ...updated } : x
    ));
    setEditOpen(false);
    setEditing(null);
  }}
/>

      
    </div>
  );
}
// --- Services map constants (bands, weights, sample places) ---
const INDEX_BINS = [
  { min: -Infinity, max: 0.0300, color: "#22c55e", label: "< 0.0300" },
  { min: 0.0300,   max: 0.0400, color: "#84cc16", label: "0.0300+" },
  { min: 0.0400,   max: 0.0500, color: "#fbbf24", label: "0.0400+" },
  { min: 0.0500,   max: 0.0600, color: "#f59e0b", label: "0.0500+" },
  { min: 0.0600,   max: 0.0700, color: "#f97316", label: "0.0600+" },
  { min: 0.0700,   max:  Infinity, color: "#ef4444", label: "0.0700+" },
];
const colorForIndex = v =>
  INDEX_BINS.find(b => v >= b.min && v < b.max)?.color || "#64748b";

const PRESETS = {
  Balanced:          { electricity:.14, gas:.14, water:.08, hvac:.12, cleaning:.12, waste:.10, security:.15, maintenance:.15 },
  "Utilities-heavy": { electricity:.22, gas:.20, water:.12, hvac:.18, cleaning:.06, waste:.06, security:.08, maintenance:.08 },
  "Ops-heavy":       { electricity:.08, gas:.08, water:.06, hvac:.08, cleaning:.20, waste:.14, security:.18, maintenance:.18 },
};

const PLACES = [
  { name:"City of London", lat:51.513, lng:-0.091, spend: 950000,
    m:{ electricity:.0450, gas:.0395, water:.0340, hvac:.0430, cleaning:.0385, waste:.0372, security:.0420, maintenance:.0410 } },
  { name:"Soho",          lat:51.513, lng:-0.136, spend: 520000,
    m:{ electricity:.0415, gas:.0420, water:.0335, hvac:.0405, cleaning:.0380, waste:.0365, security:.0450, maintenance:.0420 } },
  { name:"Paddington",    lat:51.515, lng:-0.175, spend: 610000,
    m:{ electricity:.0405, gas:.0375, water:.0325, hvac:.0385, cleaning:.0395, waste:.0355, security:.0400, maintenance:.0390 } },
  { name:"Stratford",     lat:51.541, lng:-0.003, spend: 780000,
    m:{ electricity:.0385, gas:.0360, water:.0315, hvac:.0375, cleaning:.0360, waste:.0345, security:.0380, maintenance:.0370 } },
  { name:"Docklands",     lat:51.505, lng:-0.022, spend: 680000,
    m:{ electricity:.0435, gas:.0400, water:.0345, hvac:.0415, cleaning:.0390, waste:.0375, security:.0410, maintenance:.0405 } },
  { name:"Richmond",      lat:51.461, lng:-0.304, spend: 340000,
    m:{ electricity:.0375, gas:.0340, water:.0305, hvac:.0365, cleaning:.0360, waste:.0335, security:.0380, maintenance:.0370 } },
  { name:"Bromley",       lat:51.405, lng: 0.015, spend: 300000,
    m:{ electricity:.0480, gas:.0465, water:.0390, hvac:.0470, cleaning:.0415, waste:.0400, security:.0460, maintenance:.0445 } },
  { name:"Croydon",       lat:51.372, lng:-0.103, spend: 420000,
    m:{ electricity:.0500, gas:.0480, water:.0410, hvac:.0485, cleaning:.0425, waste:.0415, security:.0470, maintenance:.0460 } },
];

const CAT_KEYS = ["electricity","gas","water","hvac","cleaning","waste","security","maintenance"];


function compositeIndex(m, w) {
  let s=0, ws=0; CAT_KEYS.forEach(k=>{ if (m[k]!=null && w[k]) { s += m[k]*w[k]; ws += w[k]; }});
  return ws ? s/ws : 0;
}

function Services(){
  const [city,setCity]       = React.useState("London");
  const [preset,setPreset]   = React.useState("Balanced");
  const [mapZoom,setMapZoom] = React.useState(11);
  const mapDivRef = React.useRef(null);
  const mapRef    = React.useRef(null);
  const layerRef  = React.useRef(null);

  const weights = PRESETS[preset];

  const enriched = React.useMemo(()=>{
    const minS = Math.min(...PLACES.map(p=>p.spend));
    const maxS = Math.max(...PLACES.map(p=>p.spend));
    const scaleR = v => 10 + 8 * ((v - minS)/Math.max(1,(maxS-minS))); // smaller: 10–18 px radius
    return PLACES.map(p=>{
      const idx = compositeIndex(p.m, weights);     // raw 0.03–0.07
      const disp = (idx*10);                        // scaled for display 0.30–0.70
      return { ...p, idx, disp, color: colorForIndex(idx), r: Math.round(scaleR(p.spend)) };
    });
  },[weights]);

  const avgRaw   = React.useMemo(()=> (enriched.length ? enriched.reduce((s,p)=>s+p.idx,0)/enriched.length : 0), [enriched]);
  const avgDisp  = (avgRaw*10); // 0.30–0.70

  /* init Leaflet once */
  React.useEffect(()=>{
    if (!mapDivRef.current || mapRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(mapDivRef.current, { center:[51.5074,-0.1278], zoom:mapZoom, scrollWheelZoom:true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.on("zoomend",()=> setMapZoom(map.getZoom()));
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
  },[]);

  /* draw markers */
  React.useEffect(()=>{
    if (!mapRef.current || !layerRef.current || !window.L) return;
    const L = window.L;
    layerRef.current.clearLayers();

    enriched.forEach(p=>{
      const html = `
        <div style="
          width:${p.r*2}px;height:${p.r*2}px;border-radius:9999px;border:2px solid #fff;
          background:${p.color};display:flex;align-items:center;justify-content:center;
          color:#fff;font-weight:800;font-size:${Math.max(10, Math.min(14, p.r-2))}px;
          box-shadow:0 6px 16px rgba(0,0,0,.25);
        ">${p.disp.toFixed(2)}</div>`;
      const icon = L.divIcon({ html, className:"", iconSize:[p.r*2,p.r*2], iconAnchor:[p.r,p.r], popupAnchor:[0,-p.r] });

      const breakdown = CAT_KEYS.map(k=>(
        `<tr><td style="padding:2px 8px">${k}</td><td style="padding:2px 0;text-align:right">${(p.m[k]*10).toFixed(2)}</td></tr>`
      )).join("");

      const popupHtml = `
        <div style="font-family:inherit;min-width:220px">
          <div style="font-weight:700;margin-bottom:4px">${p.name}</div>
          <div style="font-size:12px;color:#475569;margin-bottom:6px">Composite index (×10 shown)</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:9999px;background:${p.color}"></span>
            <span style="font-weight:800">${p.disp.toFixed(2)}</span>
            <span style="font-size:12px;color:#64748b">(lower is better)</span>
          </div>
          <div style="font-size:12px;color:#334155;margin:6px 0 4px">Breakdown (weighted by <b>${preset}</b>, ×10)</div>
          <table style="font-size:12px;color:#334155;width:100%;border-collapse:collapse">${breakdown}</table>
          <div style="font-size:11px;color:#64748b;margin-top:8px">Annual spend (approx): £${(p.spend/1000).toFixed(0)}k • size ∝ spend</div>
        </div>
      `;
      const m = L.marker([p.lat,p.lng], {icon}).bindPopup(popupHtml);
      layerRef.current.addLayer(m);
    });

    if (enriched.length){
      const b = window.L.latLngBounds(enriched.map(p=>[p.lat,p.lng])).pad(0.2);
      mapRef.current.fitBounds(b, { maxZoom: 13 });
    }
  },[enriched]);

  const selectStyle={
    padding:"8px 12px", borderRadius:10,
    background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)"
  };

  /* Gauge: arc = “goodness” (maxBand - avgRaw), number = scaled avg */
  const maxBandRaw = 0.0700;
  const goodness = Math.max(0, maxBandRaw - avgRaw);      // 0–0.07
  const goodnessMax = maxBandRaw;

  return (
    <div className="grid gap-4 md:gap-6">
      <Section title="Service Performance" right={
        <div className="hidden md:flex items-center gap-3">
          <div className="text-slate-300 text-xs">Avg. index</div>
          <div className="bg-white rounded-full p-2 shadow-md">
            <DonutGauge value={goodness} max={goodnessMax} display={avgDisp.toFixed(2)} label="Good" />
          </div>
          <div className="text-slate-300 text-xs ml-1">({avgRaw.toFixed(4)})</div>
        </div>
      }>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <label className="text-sm text-slate-300">View in</label>
          <select style={selectStyle} value={city} onChange={e=>setCity(e.target.value)}>
            <option>London</option>
          </select>
          <label className="text-sm text-slate-300 ml-2">Weights</label>
          <select style={selectStyle} value={preset} onChange={e=>setPreset(e.target.value)}>
            {Object.keys(PRESETS).map(k=><option key={k}>{k}</option>)}
          </select>

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            <span>Zoom</span>
            <button className="btn btn-ghost" onClick={()=>mapRef.current && mapRef.current.zoomOut()}>−</button>
            <div className="w-24 h-1 bg-slate-700 rounded">
              <div className="h-1 bg-blue-400 rounded" style={{width:`${Math.min(100,Math.max(0,((mapZoom-7)/6)*100))}%`}}/>
            </div>
            <button className="btn btn-ghost" onClick={()=>mapRef.current && mapRef.current.zoomIn()}>+</button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border relative z-0" style={{borderColor:"var(--stroke)"}}>
          <div ref={mapDivRef} style={{height:420,width:"100%"}}></div>
        </div>

        <div className="flex flex-wrap items-start gap-4 mt-4">
          <div className="card px-3 py-2">
            <div className="text-xs text-slate-300 mb-1">Index (raw)</div>
            <div className="grid grid-cols-1 gap-1">
              {INDEX_BINS.map((b,i)=>(
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-3.5 h-3.5 rounded-sm" style={{background:b.color}}></span>
                  <span className="text-slate-100">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-400">Markers show index ×10 • color by raw band • size ∝ spend</div>
        </div>

        <div className="md:hidden flex items-center gap-2 mt-3">
          <div className="bg-white rounded-full p-2 shadow-md">
            <DonutGauge value={goodness} max={goodnessMax} size={90} stroke={12} display={avgDisp.toFixed(2)} label="Good"/>
          </div>
          <div className="text-sm text-slate-300">Avg. raw {avgRaw.toFixed(4)}</div>
        </div>
      </Section>
    </div>
  );
}
   // === Building (bars without external CSS) — MOBILE-CARD-BARS ===
function Building(){
  // Data compressed as [label, actual, budget]
  const D={
    "2023":[
      ["Management Fees",4833,4800],["Accounting Fees",5730,5100],
      ["Site Management Resources",18520,18200],["Health, Safety and Environment",20989,21000],
      ["Electricity",20000,22500],["Gas",13409,12000],["Cleaning & Waste",15142,14800],
      ["Mechanical & Electrical",10500,9800],["Lift & Escalators",3070,3200],
      ["Insurance",4200,4500],["Major Works",10000,9000],["Interest",4300,0]
    ],
    "2024":[
      ["Management Fees",4930,4850],["Accounting Fees",5630,5200],
      ["Site Management Resources",18700,18600],["Health, Safety and Environment",20989,20989],
      ["Electricity",18025,20000],["Gas",13154,12500],["Cleaning & Waste",13960,14500],
      ["Mechanical & Electrical",11542,11200],["Lift & Escalators",3070,3000],
      ["Insurance",2000,4100],["Major Works",7250,0],["Interest",4200,0]
    ],
    "2025 YTD":[
      ["Management Fees",2400,2420],["Accounting Fees",2900,3000],
      ["Site Management Resources",9200,9300],["Health, Safety and Environment",10200,10450],
      ["Electricity",9300,11000],["Gas",6400,5900],["Cleaning & Waste",7600,7200],
      ["Mechanical & Electrical",5600,5200],["Lift & Escalators",1600,1650],
      ["Insurance",2100,2200],["Major Works",2000,0],["Interest",2100,0]
    ]
  };

  const YEARS = Object.keys(D);
  const [year,setYear] = React.useState(YEARS[YEARS.length-1]);
  const rows = D[year];
  const isMobile = useIsMobile(640);

  // totals + scale
  const M = rows.reduce((a,[,A,B])=>{
    a.max = Math.max(a.max,A,B);
    a.ta += A; a.tb += B;
    return a;
  },{max:1,ta:0,tb:0});

  const over    = Math.max(0, M.ta - M.tb);
  const overPct = M.tb ? (over/M.tb*100) : 0;
  const need    = rows.filter(([,A,B]) => A > B*1.1).length;

  // format helpers
  const fmt    = n => "€ " + Math.round(n).toLocaleString();
  const fmtPct = p => (p==null ? "–" : `${p.toFixed(0)}%`);

  // insights
  const top = rows
    .filter(([,A,B]) => A > B)
    .map(([k,A,B]) => ({ k, over: A-B, pct: B ? ((A-B)/B)*100 : null }))
    .sort((a,b) => b.over - a.over)
    .slice(0,3);
  const underOrOn = rows.filter(([,A,B]) => A <= B).length;

  // tiny legend pill
  const Dot = ({c,label}) => (
    <span className="flex items-center gap-2 text-slate-300 text-sm">
      <i className="inline-block w-2.5 h-2.5 rounded-sm" style={{background:c}}/>{label}
    </span>
  );

  // single bar renderer (Tailwind only)
  const Bar = ({A,B,max})=>{
    const bw = B/max*100;
    const aw = Math.min(A,B)/max*100;
    const ow = A>B? (A-B)/max*100 : 0;
    return (
      <div className="relative w-full h-2.5 md:h-3 rounded-full bg-slate-900/70 border border-slate-700/80">
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="h-full bg-slate-400/15" style={{width:`${bw}%`}}/>
        </div>
        <div className="absolute top-0 left-0 h-full rounded-l-full bg-emerald-400" style={{width:`${aw}%`}}/>
        {ow>0 && <div className="absolute top-0 h-full bg-rose-500" style={{left:`${bw}%`,width:`${ow}%`}}/>}
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:gap-6">
      <Section
        title="Total Building Services Expenditures"
        right={
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-xs">Year</span>
            <select
              className="px-2 py-1 rounded-lg text-sm"
              style={{background:"var(--panel-2)",border:"1px solid var(--stroke)",color:"var(--text)"}}
              value={year}
              onChange={e=>setYear(e.target.value)}
            >
              {YEARS.map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
        }
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
          <Metric label="Total actual" value={fmt(M.ta)} sub={year}/>
          <Metric label="Budget/benchmark" value={fmt(M.tb)} sub={year}/>
          <Metric label="Overrun" value={fmt(over)} sub={`${overPct.toFixed(1)}% vs budget`}/>
          <Metric label="Needs attention" value={`${need}`} sub=">10% above budget"/>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 mb-3">
          <Dot c="#34d399" label="Actual"/>
          <Dot c="rgba(221,227,234,.13)" label="Budget"/>
          <Dot c="#ef4444" label="Overrun"/>
        </div>

        {/* Rows */}
        {!isMobile ? (
          <div className="space-y-7">
            {rows.map(([k,A,B],i)=>(
              <div key={i} className="grid grid-cols-[260px_1fr_140px] items-center gap-4">
                <div className="text-slate-100 font-medium leading-tight">{k}</div>
                <Bar A={A} B={B} max={M.max}/>
                <div className="text-right">
                  <div className="text-slate-100">{fmt(A)}</div>
                  <div className="text-xs text-slate-400">{B>0 ? `${fmt(B)} budget` : `no budget`}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-5">
            {rows.map(([k,A,B],i)=>(
              <li key={i} className="rounded-xl p-3" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-slate-100 font-medium">{k}</div>
                  <div className="text-right text-[13px] text-slate-300">
                    <span className="font-semibold text-slate-100">{fmt(A)}</span>
                    <span className="text-slate-400"> · {B>0?`${fmt(B)} budget`:`no budget`}</span>
                  </div>
                </div>
                <div className="mt-3"><Bar A={A} B={B} max={M.max}/></div>
              </li>
            ))}
          </ul>
        )}

        {/* Insights & explainer */}
        <div className="mt-5 grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl p-3" style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}>
            <div className="text-slate-300">Totals &amp; status — {year}</div>
            <div className="mt-2 space-y-1 text-slate-100">
              <div className="flex justify-between"><span>Total actual</span><span>{fmt(M.ta)}</span></div>
              <div className="flex justify-between"><span>Budget / benchmark</span><span>{fmt(M.tb)}</span></div>
              <div className="flex justify-between">
                <span>Overrun</span>
                <span className="text-rose-300">{fmt(over)} <span className="text-slate-400">· {fmtPct(overPct)}</span></span>
              </div>
              <div className="flex justify-between"><span>Lines &gt;10% over</span><span>{need}</span></div>
              <div className="flex justify-between"><span>On / under budget</span><span>{underOrOn}</span></div>
            </div>
          </div>

          <div className="rounded-xl p-3" style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}>
            <div className="text-slate-300">Top overruns</div>
            <ul className="mt-2 divide-y" style={{ borderColor: "var(--stroke)" }}>
              {top.length ? top.map(t => (
                <li key={t.k} className="py-1.5 flex items-center justify-between">
                  <span className="text-slate-100">{t.k}</span>
                  <span className="font-medium text-rose-300">
                    {fmt(t.over)}{t.pct != null && <span className="text-slate-400"> · {fmtPct(t.pct)}</span>}
                  </span>
                </li>
              )) : <li className="py-1.5 text-slate-400">No overruns in {year}.</li>}
            </ul>
          </div>

          <div className="rounded-xl p-3" style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}>
            <div className="text-slate-300">How to read the bars</div>
            <ul className="mt-2 text-slate-100 space-y-1 list-disc pl-4">
              <li><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-2" style={{ background:"#34d399" }} />Actual spend (green).</li>
              <li><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-2" style={{ background:"rgba(221,227,234,.13)" }} />Budget / benchmark track.</li>
              <li><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-2" style={{ background:"#ef4444" }} />Overrun (red) shows € above budget.</li>
              <li>Bar widths normalised to the largest line item for the selected year.</li>
              <li>“Needs attention” &gt; 10% above budget for that line.</li>
              <li>No budget → bar shows only red segment.</li>
            </ul>
            <div className="mt-2 text-[12px] text-slate-400">
              Amounts rounded; totals are simple sums. Swap “Budget” for a peer benchmark when available.
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
 // REPLACE your whole Actions() with this version
function Actions({ buildings=[], actions=[], setActions, goLineage }) {
  const [scenario, setScenario] = React.useState("Today");
  const [bId, setBId] = React.useState(buildings[0]?.id || null);
  const active = buildings.find(b => b.id===bId) || buildings[0];

  const addToPlan = (tmpl) => {
    if (!active) return;
    const delta = computeActionDelta(active, buildings, tmpl, scenario);
    const item = {
      id: hoshiUid(),
      buildingId: active.id,
      title: tmpl.title,
      tags: tmpl.tags,
      capex: tmpl.capex,
      opex_saving: tmpl.opexSave,
      npv: null, payback: null,
      delta,
      confidence: tmpl.confidence,
      status: "To review",
      lineage: { method:"template-"+tmpl.key, createdFromKpis: true }
    };
    setActions(prev => [...prev, item]);
  };

  const buildingActions = actions.filter(a => (a.buildingId ?? active?.id) === active?.id);

  const Card = ({tmpl}) => {
    const d = active ? computeActionDelta(active, buildings, tmpl, scenario) : null;
    return (
      <div className="rounded-2xl p-4 md:p-5 mb-4" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
    // REPLACE the header block in Card with this:
<div className="flex flex-wrap items-start gap-3">
  <div className="min-w-0 grow order-1 md:order-none">
    <div className="text-slate-50 font-semibold">{tmpl.title}</div>

    {/* chips row: scroll instead of wrapping on mobile */}
    <div className="mt-1 flex gap-2 text-xs text-slate-400 overflow-x-auto no-scrollbar pr-1">
      {tmpl.tags.map((t,i)=>(
        <span key={i} className="chip whitespace-nowrap">{t}</span>
      ))}
      <span className="chip whitespace-nowrap">{scenario}</span>
    </div>
  </div>

  {/* Button: full width on mobile, inline on desktop */}
  <button
    className="btn btn-primary w-full md:w-auto order-3 md:order-none md:ml-auto mt-2 md:mt-0"
    onClick={()=>addToPlan(tmpl)}
  >
    Add to plan
  </button>
</div>
        
        {active && d && (
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            <Metric label="Δ kWh/yr" value={d.kwh.toLocaleString()} />
            <Metric label="Δ tCO₂e/yr" value={`${d.tco2e}`} />
            <Metric label="Δ intensity" value={`${d.intensity} kWh/m²`} />
            <Metric label="Δ forward premium" value={`${d.fwd>=0?"+":""}${d.fwd}%`} />
            <Metric label="Δ β / sensitivity" value={`${d.beta>=0?"+":""}${d.beta}`} />
            {(active.servicing||"").toLowerCase().includes("naturally") &&
              <Metric label="Δ overheating (hrs/yr)" value={d.overHours} />}
          </div>
        )}
{/* bottom pills + lineage */}
<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
  <span className="chip stat">
    CapEx {tmpl.capex ? "£" + tmpl.capex.toLocaleString() : "—"}
  </span>
  <span className="chip stat">
    Savings {tmpl.opexSave ? "£" + tmpl.opexSave.toLocaleString() + "/yr" : "—"}
  </span>
  <span className="chip stat">
    Confidence {Math.round((tmpl.confidence || 0) * 100)}%
  </span>

  {/* spacer on desktop so the button hugs the right;
     on mobile the button is full width */}
  <div className="hidden md:block grow" />

  <button
    className="btn btn-ghost w-full md:w-auto md:ml-auto mt-1 md:mt-0"
    onClick={() => {
      // use the 'd' you already computed at the top of Card
      goLineage?.({
        source: "ActionTemplate",
        key: tmpl.key,
        title: tmpl.title,
        tags: tmpl.tags,
        finance: { capex: tmpl.capex, save: tmpl.opexSave, confidence: tmpl.confidence },
        impacts: d ? {
          kwh: d.kwh, tco2e: d.tco2e, intensity: d.intensity,
          fwd: d.fwd, beta: d.beta, overHours: d.overHours
        } : null,
        building: active ? { id: active.id, name: active.name } : null,
        scenario
      });
    }}
  >
    View data lineage
  </button>
</div>
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:gap-6">
      <Section
        title="Actions"
        desc="Pick a building, explore suggested actions, see the effect, and add the ones you want to your plan."
      >
          <div className="actions">  
        {/* Picker */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <label className="text-slate-300 text-sm">Building</label>
          <select
            className="px-3 py-2 rounded-lg"
            style={{background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)"}}
            value={bId || ""}
            onChange={e=>setBId(e.target.value)}
          >
            {buildings.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <label className="text-slate-300 text-sm ml-2">Scenario</label>
          <select
            className="px-3 py-2 rounded-lg"
            style={{background:"var(--panel-2)", border:"1px solid var(--stroke)", color:"var(--text)"}}
            value={scenario} onChange={e=>setScenario(e.target.value)}
          >
            <option>Today</option>
            <option>2030</option>
            <option>2050</option>
          </select>
        </div>

        {/* Suggestions for the active building */}
        <div className="text-slate-400 text-sm mb-2">Suggested actions for this building</div>
        {(active ? ACTION_TEMPLATES.filter(t=>t.appliesTo(active)) : [])
          .map(t => <Card key={t.key} tmpl={t} />)}

        {/* Already in your plan for this building */}
        <div className="mt-6 text-slate-400 text-sm">In your plan for this building</div>
        {buildingActions.length===0 && <div className="text-slate-500 text-sm mt-2">No actions yet.</div>}
        {buildingActions.map(a=>(
          <div key={a.id} className="rounded-xl p-4 mt-3" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
            <div className="flex items-center justify-between">
              <div className="text-slate-100 font-medium">{a.title}</div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={()=>setActions(prev=>prev.filter(x=>x.id!==a.id))}>Remove</button>
              </div>
            </div>
            {a.delta && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 mt-3">
                <Metric label="Δ kWh/yr" value={a.delta.kwh.toLocaleString()} />
                <Metric label="Δ tCO₂e/yr" value={`${a.delta.tco2e}`} />
                <Metric label="Δ intensity" value={`${a.delta.intensity} kWh/m²`} />
                <Metric label="Δ forward premium" value={`${a.delta.fwd>=0?"+":""}${a.delta.fwd}%`} />
                <Metric label="Δ β / sensitivity" value={`${a.delta.beta>=0?"+":""}${a.delta.beta}`} />
                {typeof a.delta.overHours==="number" && <Metric label="Δ overheating (hrs/yr)" value={a.delta.overHours} />}
              </div>
            )}
          </div>
        ))}
            </div>
      </Section>
    </div>
  );
}

// --- Lineage & Governance ---
function Lineage({ fromAction, goActions }) {
  const A = fromAction || null;

  // Helpers
  const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
  const f1 = (v) => num(v).toFixed(1);
  const f2 = (v) => num(v).toFixed(2);

  const Card = ({ title, children }) => (
    <div className="rounded-xl p-4" style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}>
      <div className="text-slate-100 font-medium">{title}</div>
      <div className="mt-2 text-sm text-slate-300">{children}</div>
    </div>
  );

  // Determine shape: legacy planned action vs. template preview
  const isTemplate = A && A.source === "ActionTemplate";
  const T = isTemplate ? ACTION_TEMPLATES.find(t => t.key === A.key) : null;

  const title =
    "Data lineage" +
    (A
      ? " — " + (A.title || T?.title || "Action")
      : "");

  // Normalised fields (so JSX stays simple)
  const alarm = !isTemplate ? (A?.alarm || {}) : null;
  const finance = A?.finance || (isTemplate
    ? { capex: T?.capex, save: T?.opexSave, confidence: T?.confidence }
    : null);

  const impacts = A?.impacts || null;
  const tags = (A?.tags && A.tags.length ? A.tags : T?.tags) || [];

  return (
    <div className="grid gap-4 md:gap-6">
      <Section
        title={title}
        desc="Inputs → transforms → factors → formulas → versions. This is how we make numbers audit-ready."
        right={A && <button className="btn btn-ghost" onClick={goActions}>← Back to actions</button>}
      >
        {/* Why lineage matters */}
        <div className="grid md:grid-cols-3 gap-3 md:gap-4 mb-3">
          <Card title="Why this matters">
            <ul className="list-disc pl-5 space-y-1">
              <li>Builds trust: every KPI links to sources and methods.</li>
              <li>Finance-grade: shows how savings/NPV were derived.</li>
              <li>Governance: versioned factors & acceptance criteria.</li>
            </ul>
          </Card>
          <Card title="What’s included">
            <ul className="list-disc pl-5 space-y-1">
              <li>Data sources (bills, meters, surveys, models).</li>
              <li>Normalisation (HDD/CDD, occupancy, area).</li>
              <li>Formulas & coefficients with version and date.</li>
            </ul>
          </Card>
          <Card title="Client benefits">
            <ul className="list-disc pl-5 space-y-1">
              <li>Faster approvals: procurement & finance aligned.</li>
              <li>Comparable metrics across assets & vendors.</li>
              <li>Audit trail for ESG and assurance processes.</li>
            </ul>
          </Card>
        </div>

        {/* Snapshot */}
        {A ? (
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            <Card title="Lineage snapshot">
              <div className="grid grid-cols-1 gap-2">
                {!isTemplate ? (
                  <>
                    <div>
                      <span className="text-slate-400">Alarm</span> ·
                      {" "}{alarm?.type || A?.alarm || "—"}
                      {alarm?.category ? ` — ${alarm.category}` : ""}
                      {(alarm?.window || alarm?.rule) && (
                        <> ({alarm?.window || "—"}; {alarm?.rule || "—"})</>
                      )}
                    </div>
                    <div><span className="text-slate-400">Baseline</span> · {A?.lineage?.baseline || "—"}</div>
                    <div><span className="text-slate-400">Method</span> · {A?.lineage?.method || "—"}</div>
                    <div><span className="text-slate-400">Factors</span> · {(A?.lineage?.factors || []).join(", ") || "—"}</div>
                  </>
                ) : (
                  <>
                    <div><span className="text-slate-400">Template</span> · {T?.title || A?.title || A?.key}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tags.map((t,i)=><span key={i} className="chip">{t}</span>)}
                      {A?.scenario && <span className="chip">{A.scenario}</span>}
                      {A?.building?.name && <span className="chip">{A.building.name}</span>}
                    </div>
                  </>
                )}

                {/* Impacts if available */}
                {impacts && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {"kwh" in impacts && <span className="chip">Δ kWh {impacts.kwh.toLocaleString()}</span>}
                    {"tco2e" in impacts && <span className="chip">Δ tCO₂e {f1(impacts.tco2e)}/yr</span>}
                    {"intensity" in impacts && <span className="chip">Δ intensity {impacts.intensity} kWh/m²</span>}
                    {"fwd" in impacts && <span className="chip">Δ forward {num(impacts.fwd)>=0?"+":""}{f1(impacts.fwd)}%</span>}
                    {"beta" in impacts && <span className="chip">Δ β {num(impacts.beta)>=0?"+":""}{f2(impacts.beta)}</span>}
                    {"overHours" in impacts && typeof impacts.overHours === "number" && (
                      <span className="chip">Δ overheating {impacts.overHours} h/yr</span>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card title="Verification & acceptance">
              {A?.plan ? (
                <div className="grid gap-2">
                  <div><span className="text-slate-400">Owner</span> · {A.plan.owner}</div>
                  <div><span className="text-slate-400">Start</span> · {A.plan.start}</div>
                  <div><span className="text-slate-400">Funding</span> · {A.plan.funding}</div>
                  <div><span className="text-slate-400">M&V</span> · {A.plan.mv}</div>
                  <div><span className="text-slate-400">Acceptance</span> · {A.plan.accept}</div>
                  {A.plan.scope && <div><span className="text-slate-400">Scope</span> · {A.plan.scope}</div>}
                </div>
              ) : (
                <div>
                  Not planned yet. Use <span className="chip">Add to plan</span> in Actions to register
                  owner, start, funding and M&V so this section populates automatically.
                </div>
              )}
            </Card>

            <Card title="Trace (demo)">
              <div className="text-xs">
                <div className="grid grid-cols-[160px_1fr] gap-y-1">
                  <div className="text-slate-400">Source</div>
                  <div>{A?.lineage?.baseline || (isTemplate ? "FY bills / building KPIs" : "—")}</div>

                  <div className="text-slate-400">Transforms</div>
                  <div>OCR → clean → normalise (HDD/CDD)</div>

                  <div className="text-slate-400">Model</div>
                  <div>{A?.lineage?.method || (isTemplate ? `template-${A?.key}` : "Top-down regression")}</div>

                  <div>Outputs</div>
                  <div>
                    {impacts
                      ? <>
                          {"Δ kWh "}{("kwh" in impacts) ? impacts.kwh.toLocaleString() : "—"}
                          {"; Δ tCO₂e "}{("tco2e" in impacts) ? f1(impacts.tco2e) : "—"}/yr
                        </>
                      : "—"}
                  </div>

                  <div className="text-slate-400">Version</div>
                  <div>v0.2 · {new Date().toISOString().slice(0,10)}</div>
                </div>
              </div>
            </Card>

            <Card title="Finance context">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">CapEx</span>
                  <div className="text-slate-100 font-semibold">
                    {fmtMoney(num(finance?.capex))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Savings /yr</span>
                  <div className="text-slate-100 font-semibold">
                    {fmtMoney(num(finance?.save))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">NPV @8%</span>
                  <div className="text-emerald-300 font-semibold">
                    {/* NPV is not computed here for templates; show "—" unless provided */}
                    {Number.isFinite(num(A?.finance?.npv, NaN)) ? fmtMoney(A.finance.npv) : "—"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Payback</span>
                  <div className="text-slate-100 font-semibold">
                    {A?.finance?.payback ?? "—"}{A?.finance?.payback != null ? "y" : ""}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">β</span>
                  <div className="text-slate-100 font-semibold">
                    {Number.isFinite(num(A?.finance?.beta, NaN)) ? num(A.finance.beta).toFixed(2) : "—"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Confidence</span>
                  <div className="text-slate-100 font-semibold">
                    {Math.round(num(finance?.confidence, 0.7) * 100)}%
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="rounded-xl p-4" style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}>
            <div className="text-slate-300 text-sm">
              Open this page from an action to see a complete lineage snapshot for that recommendation.
              You’ll get: Source → Normalisation → Model → Version → M&V → Acceptance, with links to the
              portfolio/building data behind it.
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}



function PublicBPS({ goLineage = ()=>{}, goActions = ()=>{} }){
  // Demo signals (swap with real values later)
  const signals = {
    beta: 0.55,         // systematic sensitivity (β)
    idio: 1.8,          // idiosyncratic premium, %
    total: 2.6,         // total Forward Energy Premium, %
  };

  const topActions = ACTIONS.slice(0,2);

  const fmtGBP = n => "£ " + n.toLocaleString();
  const fmtPct = n => (n>=0?"+":"") + n.toFixed(1) + "%";

  const MiniStackBar = ({sys,idio})=>{
    const total = Math.max(0.0001, Math.abs(sys) + Math.abs(idio));
    const sysPct = Math.round(Math.abs(sys)/total*100);
    const idioPct = 100 - sysPct;
    return (
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full inline-block" style={{width:`${sysPct}%`, background:"#38bdf8"}}/>
        <div className="h-full inline-block" style={{width:`${idioPct}%`, background:"#34d399"}}/>
      </div>
    );
  };

  const Chip = ({children,onClick})=>(
    <button onClick={onClick}
      className="px-2.5 py-1 rounded-full text-xs bg-slate-200/70 text-slate-700 hover:bg-slate-200 transition">
      {children}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg md:text-xl font-semibold">Building Performance Sheet</h2>
          <div className="hidden sm:flex items-center gap-2">
            <Chip>Coverage 92%</Chip>
            <Chip>Sources 2</Chip>
            <Chip>Methods: bills+meter</Chip>
            <Chip>Updated 10 Aug 2025</Chip>
            <Chip onClick={goLineage}>View lineage →</Chip>
          </div>
        </div>
        <div className="text-slate-300 text-sm">1 King Street, London • Office • 12,800 m²</div>

        {/* Mobile chips */}
        <div className="sm:hidden flex flex-wrap gap-2 mt-3">
          <Chip>Coverage 92%</Chip>
          <Chip>Sources 2</Chip>
          <Chip onClick={goLineage}>Lineage →</Chip>
        </div>
      </div>

      {/* Top KPI tiles */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-xl bg-slate-100 p-4">
          <div className="text-xs text-slate-600">Energy</div>
          <div className="text-xl font-semibold">142,000 kWh</div>
        </div>
        <div className="rounded-xl bg-slate-100 p-4">
          <div className="text-xs text-slate-600">Emissions</div>
          <div className="text-xl font-semibold">36.2 tCO₂e</div>
        </div>
        <div className="rounded-xl bg-slate-100 p-4">
          <div className="text-xs text-slate-600">Spend</div>
          <div className="text-xl font-semibold">£ 30,150</div>
        </div>
        <div className="rounded-xl bg-slate-100 p-4">
          <div className="text-xs text-slate-600">Intensity</div>
          <div className="text-xl font-semibold">92 kWh/m²</div>
        </div>
      </div>

      {/* Financial signals (β / idio / total FEP) */}
      <div className="px-6">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Financial signals (Forward ROI)</div>
            <span className="text-xs text-slate-500">β + Idiosyncratic → FEP</span>
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-slate-600">β (systematic sensitivity)</div>
              <div className="text-lg font-semibold">{signals.beta.toFixed(2)}</div>
              <div className="text-[12px] text-slate-500 mt-1">Higher → more exposed to prices/policy/climate</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-slate-600">Idiosyncratic premium</div>
              <div className="text-lg font-semibold">{fmtPct(signals.idio)}</div>
              <div className="text-[12px] text-slate-500 mt-1">Asset-specific performance & variance</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-slate-600">Total FEP</div>
              <div className="text-lg font-semibold">{fmtPct(signals.total)}</div>
              <div className="mt-2"><MiniStackBar sys={signals.total - signals.idio} idio={signals.idio} /></div>
              <div className="text-[12px] text-slate-500 mt-1">Stack shows systematic vs idiosyncratic share</div>
            </div>
          </div>
        </div>
      </div>

      {/* 12-month trend */}
      <div className="px-6 pb-6">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">12-month trend (tCO₂e)</div>
            <span className="inline-flex">
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">Peer: Q2</span>
            </span>
          </div>
          <div className="mt-2"><LineChart/></div>
        </div>
      </div>

      {/* Actions summary */}
      <div className="px-6 pb-6">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Actions in plan</div>
            <button onClick={goActions}
              className="text-sm px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:opacity-90">
              View plan →
            </button>
          </div>

          <ul className="mt-3 divide-y divide-slate-200">
            {topActions.map(a=>(
              <li key={a.id} className="py-2 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-slate-500">{a.alarm} • {a.status}</div>
                </div>
                <div className="text-right text-sm text-slate-700">
                  <div>NPV {fmtGBP(a.npv)}</div>
                  <div className="text-xs text-slate-500">Payback {a.pay}y • β {a.beta.toFixed(2)} • conf. {Math.round(a.confidence*100)}%</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="text-[12px] text-slate-500 mt-3">
            Each action originates from a monitored alarm and carries a finance view (NPV, payback) plus expected impact on service index and comfort risk.
          </div>
        </div>
      </div>

      {/* Footer / attestation strip */}
      <div className="px-6 pb-5 text-[12px] text-slate-500 flex items-center justify-between">
        <div>BPS v1.3 • commit fb3c918 • Published 2 Sep 2025</div>
        <div>Signed by Hoshi • License: Aidan Parkinson</div>
      </div>
    </div>
  );
}
  const ICONS = {
  story: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  onboarding: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  portfolio: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M10 7h4M10 11h4M10 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  actions: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 12l3 3 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  services: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 18h16M6 18V9M10 18V6M14 18v-4M18 18v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  lineage: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 18h16M4 6h16M8 6v12M16 6v12" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  public: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" strokeWidth="2" />
      <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};
// add the Blog icon without risking object-literal commas/braces
ICONS.blog = function BlogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
ICONS.compare = (is) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="6" height="14" rx="1.5"
          stroke="currentColor" strokeWidth="1.6"/>
    <rect x="14" y="5" width="6" height="14" rx="1.5"
          stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);
// REPLACE the whole HeroImage with this exact version
function HeroImage({ src, alt = "" }) {
  return (
    <figure
       className="rounded-2xl overflow-hidden border box-border w-full max-w-full"
      style={{ border: "1px solid var(--stroke)", background: "#0c1220" }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="block w-full h-auto object-contain mx-auto"
        style={{ maxHeight: "56svh" }}
      />
    </figure>
  );
}





/* --------------------- BLOG TAB --------------------- */
function Blog({ openPortfolio, openBuilding }) {
  // Keep the small overflow fix
  React.useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `#hoshi-root .card { overflow: visible !important; }`;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  // ---- GitHub Pages base for static articles ----
  const PAGES_BASE = "https://benuandreea-hoshi.github.io/hoshi-proto";

  // simple registry (two articles)
const BLOG = [
  {
    slug: "hoshi-in-5-minutes",
    label: "Getting started",
    title: "Hoshi in 5 minutes",
    summary:
      "From utility bills to decision-grade signals (NPV, β, systematic vs idiosyncratic).",
    img: LOGO_SRC,
    hero: LOGO_SRC,
    readingMins: 5,
    tags: ["Investors", "Operators", "Signals"],
    url: `${PAGES_BASE}/article-hoshi.html`,
  },
  {
    slug: "commonwealth-of-people",
    label: "Governance",
    title: "Commonwealth of People",
    summary:
      "A practical governance frame: public ecological floor, shared carbon price, and enforceable actions with an audit trail.",
    img: PEOPLE_SRC,
    hero: PEOPLE_SRC,
    readingMins: 7,
    tags: ["Governance","CCC","Ledger","Alarms"],
    url: `${PAGES_BASE}/article-commonwealth.html`,
  },
 {
  slug: "compare-buildings",
  label: "Feature",
  title: "Compare Buildings",
  summary:
    "Side-by-side decisions: photos, servicing, age, energy, carbon, intensity, and spend—on one screen.",
  img: "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68ba19a4160886b0a71ae9c4_embracing-world-peace-poster-freedom-happiness-global-harmony_1020495-8806.jpg", // ← card thumbnail
  hero: "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68ba19a4160886b0a71ae9c4_embracing-world-peace-poster-freedom-happiness-global-harmony_1020495-8806.jpg", // ← optional
  readingMins: 5,
  tags: ["Tenants","Owners","Investors"],
  url: `${PAGES_BASE}/article-compare.html`,
},
  // NEW — FEP article
  {
    slug: "forward-energy-premium",
    label: "Signals",
    title: "Forward Energy Premium (FEP)",
    summary:
      "A forward ROI signal that blends price/policy/climate exposure with asset specifics.",
    img: LOGO_SRC,      // swap to a FEP hero if you have one
    hero: LOGO_SRC,
    readingMins: 5,
    tags: ["Investors","Operators","Signals"],
    url: `${PAGES_BASE}/article-fep.html`,
  },

  // NEW — Governance loop article
  {
    slug: "alarm-action-plan-mv",
    label: "Governance",
    title: "Alarm → Action → Plan → M&V",
    summary:
      "The operating rhythm that turns data into enforceable decisions—with proof.",
    img: PEOPLE_SRC,    // swap to a governance image if you have one
    hero: PEOPLE_SRC,
    readingMins: 6,
    tags: ["Governance","Operations","Evidence"],
    url: `${PAGES_BASE}/article-governance-loop.html`,
  },
];

  const [view, setView] = React.useState("home"); // 'home' | 'article' (fallback route)
  const [active, setActive] = React.useState(BLOG[0].slug);
  const article = BLOG.find((b) => b.slug === active) ?? BLOG[0];

  const TagPill = ({ children }) => (
    <span className="chip whitespace-nowrap">{children}</span>
  );

  // tiny animated orbit (CSS-only, lightweight)
  const Orbit = () => (
    <div className="relative h-36 md:h-40">
      <div className="absolute inset-0 rounded-full opacity-20"
           style={{ border: "1px solid var(--stroke)", boxShadow: "0 0 80px rgba(56,189,248,.15), inset 0 0 80px rgba(16,185,129,.08)" }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-spin"
           style={{ width: 120, height: 120, border: "1px dashed rgba(56,189,248,.35)", animationDuration: "16s" }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-spin"
           style={{ width: 180, height: 180, border: "1px dashed rgba(16,185,129,.35)", animationDuration: "24s", animationDirection: "reverse" }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
           style={{ background: "radial-gradient(circle at 30% 30%, #60a5fa, #34d399 70%)", boxShadow: "0 0 18px rgba(56,189,248,.65)" }} />
    </div>
  );

  // ---------- HOME (landing) ----------
  const Home = () => (
    <Section title="Hoshi Blog">
      {/* Hero */}
      <div className="rounded-2xl p-5 md:p-6 mb-4 relative overflow-hidden"
           style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}>
        <div className="md:flex items-center gap-6">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-400">
                The Hoshi field guide,
              </span>{" "}
              for insightful articles.
            </h2>
            <p className="text-slate-300 mt-2 max-w-2xl">
              The concepts, metrics, and governance patterns behind a factor-aware platform for buildings and portfolios.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="chip">Getting started</span>
              <span className="chip">Investors</span>
              <span className="chip">Operators</span>
              <span className="chip">Governance</span>
            </div>
          </div>
          <div className="hidden md:block w-[220px] shrink-0">
            <Orbit />
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {BLOG.map((a) => (
          <button
            key={a.slug}
         onClick={() => {
  setActive(a.slug);
  setView("article");   // always show Article view
}}
            className="text-left rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
            style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
          >
            <div className="w-full overflow-hidden" style={{ height: "clamp(260px, 42vw, 460px)" }}>
              <img src={a.img || LOGO_SRC} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="chip">{a.label}</span>
                <span className="text-xs text-slate-400">{a.readingMins} min read</span>
              </div>
              <div className="text-slate-50 font-semibold text-lg leading-snug">{a.title}</div>
              <div className="text-slate-400 text-sm mt-1">{a.summary}</div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {a.tags.map((t, i) => <span key={i} className="chip">{t}</span>)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Section>
  );

 // ---------- ARTICLE (fallback route if an item has no URL) ----------
const Article = () => {
  // if the article is an external HTML, don't pass title/desc to Section
  const headerProps = article.url ? {} : { title: article.title, desc: article.summary };

  return (
    <Section {...headerProps}>
      <div
        className="rounded-2xl p-0 box-border w-full"
        style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
      >
        {article.url ? (
          <iframe
            key={article.url}
            title={article.title}
            src={article.url}
            className="w-full rounded-2xl block"
            style={{ height: "75svh", border: 0 }}
            loading="lazy"
            sandbox="allow-forms allow-popups allow-scripts allow-same-origin"
          />
        ) : (
          <div className="p-4 md:p-5">
            <ArticleBody />
          </div>
        )}

        {/* Single Back button */}
        <div className="p-4 md:p-5">
          <button className="btn btn-ghost" onClick={() => setView("home")}>
            ← Back to Blog
          </button>
        </div>
      </div>
    </Section>
  );
};

  // render
  return (
    <div className="grid gap-4 md:gap-6">
      {view === "home" ? <Home /> : <Article />}
    </div>
  );
};

// Demo pair shown on first load (if user has no buildings)
const HOSHI_SAMPLE_BUILDINGS = [
  {
    id: "demo-a",
    name: "Kings Court",
    city: "London",
    sector: "Office",
    area: 6300,                // m²
    elec_kwh: 1_850_000,
    gas_kwh:  1_200_000,
    spend:  520000,
    yearBuilt: 1998,
    servicing: "Fully air-conditioned",
    shading: false,
    rent_sqm: 820,
    images: [
      "https://www.cbre.co.uk/resources/fileassets/GB-Plus-513936/7b28e999/Screenshot%202025-08-21%20163623_Photo_1_medium.jpg"
    ],
    updated: new Date().toISOString().slice(0,10),
    isDemo: true,
  },
  {
    id: "demo-b",
    name: "Harbourside House",
    city: "Bristol",
    sector: "Office",
    area: 1150,
    elec_kwh: 240_000,
    gas_kwh:  180_000,
    spend:  78000,
    yearBuilt: 1976,
    servicing: "Naturally ventilated",
    shading: true,
    rent_sqm: 310,
    images: [
      "https://content.knightfrank.com/property/cpd241874/images/e4667fb9-57ce-44d1-ac2d-979a443b1cbe-0.jpg?cio=true&w=1440&f=webp"
    ],
    updated: new Date().toISOString().slice(0,10),
    isDemo: true,
  },
];


function App(){
  const [active,setActive]=useState("story");
 const [open,setOpen]=useState(false);
const [lineageCtx, setLineageCtx] = useState(null);
  // === Hoshi MVP: buildings state ===
const [buildings, setBuildings] = React.useState(hoshiLoadBuildings());
React.useEffect(() => hoshiSaveBuildings(buildings), [buildings]);
  const [actions, setActions] = React.useState(hoshiLoadActions());
React.useEffect(() => hoshiSaveActions(actions), [actions]);

  // Seed demo buildings on first visit if none exist
React.useEffect(() => {
  if (!Array.isArray(buildings) || buildings.length > 0) return;
  if (localStorage.getItem("hoshi.seeded")) return;
  setBuildings(HOSHI_SAMPLE_BUILDINGS);
  localStorage.setItem("hoshi.seeded", "1");
  // (hoshiSaveBuildings runs from your existing effect)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
React.useEffect(() => {
  // wait until buildings are there
  if (!Array.isArray(buildings) || buildings.length === 0) return;
  // don’t overwrite existing user actions
  if (Array.isArray(actions) && actions.length > 0) return;
  // don’t reseed if user intentionally cleared later
  if (localStorage.getItem("hoshi.actionsSeeded") === "1") return;
  
const seedActions = ACTIONS_SEED(buildings);
  if (seedActions.length) {
    setActions(seedActions);
    localStorage.setItem("hoshi.actionsSeeded", "1");
  }
}, [buildings, actions]);
  const tabs = [
{ key: "story", label: "Story",
  comp: <Story
          goApp={() => setActive("onboarding")}
          goBlog={() => setActive("blog")}   // <-- add this
        />
},
{ key: "onboarding", label: "Onboarding", comp: (
  <Onboarding goAddBuilding={() => {
    localStorage.setItem("hoshi.intent", "add-building");
    setActive("portfolio");
  }} />
) },

{ key: "portfolio", label: "Portfolio",
  comp: <Portfolio buildings={buildings} setBuildings={setBuildings} /> },
  { key: "compare", label: "Compare",
  comp: <CompareView buildings={buildings} setBuildings={setBuildings} /> },


    { key: "building",   label: "Building",   comp: <Building /> },

{ key: "actions", label: "Actions",
  comp: <Actions
          buildings={buildings}
          actions={actions}
          setActions={setActions}
          goLineage={(payload) => { setLineageCtx(payload); setActive("lineage"); }}
        />
},
    
    { key: "lineage", label: "Lineage & Governance",
      comp: <Lineage fromAction={lineageCtx} goActions={() => setActive("actions")} /> },

    { key: "services", label: "Services", comp: <Services /> },
  {key:"public",label:"Public BPS",comp:<PublicBPS goLineage={()=>setActive("lineage")} goActions={()=>setActive("actions")} />},
  { key:"blog", label:"Blog",
  comp: <Blog
          openPortfolio={()=>setActive("portfolio")}
          openBuilding={()=>setActive("building")}
        />
},

  ];
      React.useEffect(() => {
  setActions(xs => xs.map(a => ({
    ...a,
    save: a.save ?? a.annualSavings ?? 0,
    indexDelta: a.indexDelta ?? a.kpi?.deltaIndex ?? 0,
    co2Delta: a.co2Delta ?? a.kpi?.deltaCO2 ?? 0,
    alarm: a.alarm || (a.tags?.[0]?.replace(/^Alarm:\s*/, "") ?? "Alarm"),
    category: a.category || a.tags?.[1] || "",
    window: a.window || a.tags?.[2] || "Last 12m",
    rule: a.rule || a.tags?.[3] || "> threshold",
  })));
}, []);


  const NavItem=({t})=>{
    const is=active===t.key;
    return (
      <button onClick={()=>{setActive(t.key);setOpen(false);}}
        className={"navicon "+(is?"active":"")} title={t.label} aria-label={t.label}>
        {ICONS[t.key]?.(is)}
      </button>
    );
  };

  return(
    <div className="min-h-screen relative">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[76px] bg-[#0d1524] border-r border-[#1f2a3a] flex-col items-center py-4 gap-4 z-[2000]">
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0b1220] border border-[#233147] grid place-items-center">
  {LOGO_SRC
    ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-10 h-10 object-cover" />
    : <StarLogo size={22} />
  }
</div>
        <div className="mt-1 flex flex-col gap-3">{tabs.map(t=><NavItem key={t.key} t={t}/>)}</div>
        <div className="mt-auto opacity-70 text-[10px] text-slate-300 px-2 text-center">© {new Date().getFullYear()}</div>
      </aside>

      {/* Top bar (mobile) */}
<header
  className="md:hidden sticky top-0 z-[2000] px-4 py-3 flex items-center justify-between"
  style={{background:"rgba(15,17,21,.85)",backdropFilter:"blur(4px)",borderBottom:"1px solid var(--stroke)"}}
>
  <button className="navicon" onClick={()=>setOpen(true)} aria-label="Open menu">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </button>

  {/* Brand centered */}
  <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:static md:translate-x-0">
    {LOGO_SRC
      ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-6 h-6 rounded object-cover" />
      : <span className="font-semibold text-lg leading-none">Hoshi</span>
    }
    <span className="font-semibold text-lg leading-none">Hoshi</span>
  </div>

  {/* right-side spacer to balance the menu button */}
  <span className="opacity-0 navicon" aria-hidden="true"></span>
</header>


      {/* Drawer */}
      {open && <div className="overlay md:hidden" onClick={()=>setOpen(false)}></div>}
      <div className={"md:hidden fixed top-0 bottom-0 left-0 w-[76px] bg-[#0d1524] border-r border-[#1f2a3a] z-40 transition-transform "+(open?"translate-x-0":"-translate-x-full")}>
       <div className="p-3 flex items-center justify-center">
  {LOGO_SRC
    ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-8 h-8 rounded-md object-cover" />
    : <StarLogo size={22} />
  }
</div>
        <div className="flex flex-col items-center gap-3 pt-1">{tabs.map(t=><NavItem key={t.key} t={t}/>)}</div>
      </div>

      {/* Main */}
      <main className="px-4 md:px-6 py-5 md:py-6 max-w-7xl mx-auto">
        <div className="md:ml-[90px]">
          <div className="hidden md:flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
             {LOGO_SRC
      ? <img src={LOGO_SRC} alt="Hoshi logo"
          className="w-8 h-8 rounded-lg object-cover border border-blue-400/30 bg-blue-500/10" />
      : <StarLogo size={20} />
    }
    <div className="text-slate-50 font-semibold text-xl tracking-tight">Hoshi</div>
  </div>
  <div className="flex items-center gap-2 text-xs text-slate-400">
  </div>
</div>

          {tabs.find(t=>t.key===active)?.comp}

          <div className="border-t mt-8 pt-4 text-xs text-slate-500" style={{borderColor:"var(--stroke)"}}>
            © {new Date().getFullYear()} Hoshi •  Prototype  
          </div>
        </div>
      </main>
    </div>
  );
}
window.addEventListener('error', e => {
  const el = document.getElementById('hoshi-root');
  if (el) el.innerHTML =
    '<pre style="white-space:pre-wrap;color:#fff;background:#111;padding:12px;border:1px solid #333;border-radius:8px;">'
    + e.message + '</pre>';
});


ReactDOM.createRoot(document.getElementById("hoshi-root")).render(<App/>);
