const LOGO_SRC   = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe47145ebb756d01c372_hoshi.jpeg";
const PEOPLE_SRC = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe75f8001bf82851cd0f_commonwealthOfPeoples.jpeg";
const {useMemo,useState,useRef,useEffect} = React;

/* ---------- responsive helper (no optional chaining) ---------- */
function useIsMobile(bp = 640) {
  const hasMM = typeof window !== "undefined" && !!window.matchMedia;
  const [m, setM] = React.useState(hasMM ? window.matchMedia(`(max-width:${bp}px)`).matches : false);
  React.useEffect(() => {
    if (!hasMM) return;
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const on = e => setM(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", on);
    else if (mq.addListener) mq.addListener(on);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", on);
      else if (mq.removeListener) mq.removeListener(on);
    };
  }, [bp, hasMM]);
  return m;
}

/* ---------- small UI primitives ---------- */
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

const Section=({title,desc,right,children})=>(
  <section className="card p-5 md:p-6">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div><h3 className="text-slate-50 text-lg font-semibold">{title}</h3>{desc&&<p className="text-slate-400 text-sm mt-1">{desc}</p>}</div>
      {right}
    </div>{children}
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

const Tag = ({children}) => (
  <span className="chip" style={{borderColor:"rgba(148,163,184,.3)",background:"rgba(148,163,184,.12)",color:"#e2e8f0"}}>
    {children}
  </span>
);

/* ---------- Donut gauge ---------- */
function DonutGauge({ value=0, max=1, size=120, stroke=14, label, display }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
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
          {(display != null ? display : value.toFixed(2))}
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

/* ---------- Desktop-only hero orb ---------- */
function HeroOrb({ value = 0.42, label = "Good" }) {
  const size = 520;
  const stroke = 28;
  const r = (size / 2) - stroke;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const dash = `${circ * pct} ${circ * (1 - pct)}`;

  return (
    <div className="hidden md:flex items-center justify-center relative w-full">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#0ea5e9"/>
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.25"/>
          </linearGradient>
        </defs>

        {/* outer ring */}
        <circle cx={size/2} cy={size/2} r={r + 70} fill="none" stroke="url(#heroGrad)" strokeWidth="28" strokeOpacity="0.33" />
        {/* inner plate */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth={stroke} strokeOpacity="0.28" />
        {/* value arc */}
        <g transform={`translate(${size/2}, ${size/2}) rotate(-90)`}>
          <circle r={r} fill="none" stroke="#10b981" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={dash}/>
        </g>
      </svg>

      {/* centered number + label */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-slate-300 text-lg mb-1">{label}</div>
          <div className="text-[88px] leading-none font-semibold text-white">{value.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Story (landing) ---------- */
function Story({ goApp }) {
  const roiSpark = [2, 3, 2, 4, 5, 4, 6, 7, 6, 7, 8, 7];
  const demoAvg = 0.42;

  const Stat = ({ k, s }) => (
    <div className="pill"><div className="k">{k}</div><div className="s">{s}</div></div>
  );

  const LogoCloudStrip = () => (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {["TenantCo","LandlordCo","SupplyOne","GridIQ","GreenCap","Cetra"].map((n,i)=>(
        <div key={i} className="px-3 py-2 rounded-lg text-center text-xs text-slate-300"
             style={{background:"rgba(148,163,184,.06)",border:"1px solid rgba(148,163,184,.18)"}}>{n}</div>
      ))}
    </div>
  );

  const Band = ({ tone = 1, children, id }) => {
    const bg = [
      "linear-gradient(180deg,#0c111b 0%,#0b1320 100%)",
      "linear-gradient(180deg,#0b1320 0%,#0b1626 100%)",
      "linear-gradient(180deg,#0b1626 0%,#0b1a2d 100%)",
    ][Math.max(0, Math.min(2, tone - 1))];
    return (
      <section id={id} className="rounded-2xl p-5 md:p-6 border"
               style={{ background: bg, border: "1px solid var(--stroke)" }}>
        {children}
      </section>
    );
  };

  /* icons */
  const IcoFEP     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 18V6m0 12h16M8 14l3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
  const IcoScenario= () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h12M4 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="2"/></svg>);
  const IcoThermo  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 14V6a2 2 0 114 0v8a4 4 0 11-4 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
  const IcoWrench  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 7a5 5 0 01-7 7l-6 6-3-3 6-6a5 5 0 017-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);

  return (
    <div className="min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        {/* HERO */}
        <Band tone={1}>
          <div className="grid md:grid-cols-2 items-center gap-6 md:gap-10">
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
              {/* KPIs */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat k="10×"  s="faster onboarding" />
                <Stat k="92%"  s="data coverage target" />
                <Stat k="0.42" s="avg. service index" />
                <Stat k="€↗"  s="forward ROI insight" />
              </div>
              {/* trust strip */}
              <div className="mt-5">
                <div className="text-xs text-slate-400">Trusted across the ecosystem</div>
                <LogoCloudStrip />
              </div>

              {/* mobile-only small gauge */}
              <div className="md:hidden mt-6">
                <div className="donut-wrap bg-white rounded-full p-2 shadow-md inline-block">
                  <DonutGauge value={0.07 - demoAvg} max={0.07} size={120} stroke={14} display={demoAvg.toFixed(2)} label="Good" />
                </div>
              </div>

              {/* desktop orb */}
              <HeroOrb value={demoAvg} />
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
            {[
              ["Owners","Show value uplift with FEP and comfort outlook; reference indices in leases and capex cases."],
              ["Occupiers","Compare buildings on cost, risk, and satisfaction; prioritise measures with payback & confidence."],
              ["Suppliers","Compete on verified service indices; get credit for measured outcomes, not promises."],
            ].map(([t,b],i)=>(
              <div key={i} className="rounded-xl p-3" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
                <div className="text-slate-300 text-sm">{t}</div>
                <div className="text-slate-100 mt-1 text-[15px]">{b}</div>
              </div>
            ))}
          </div>
        </Band>

        {/* WHAT YOU GET */}
        <Band tone={1}>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Forward Energy Premium */}
            <div className="card p-4 md:p-6 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full blur-3xl"
                   style={{background:"radial-gradient(circle, rgba(59,130,246,.18), transparent 60%)"}}/>
              <h3 className="text-slate-50 text-lg font-semibold">Forward Energy Premium</h3>
              <p className="text-slate-400 text-sm mt-1">
                Quantifies how energy & service factors add/subtract from expected ROI — split by systematic (β) vs idiosyncratic drivers.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Avg. index */}
                <div className="rounded-xl p-3"
                     style={{background:"var(--panel-2)",border:"1px solid var(--stroke)", overflow:"visible"}}>
                  <div className="text-xs text-slate-400">Avg. index</div>
                  <div className="mt-2 bg-white rounded-xl p-2 inline-block overflow-visible">
                    <DonutGauge value={0.07 - demoAvg} max={0.07} size={96} stroke={12}
                                display={(demoAvg*10).toFixed(2)} label="Good" />
                  </div>
                </div>
                {/* ROI contribution */}
                <div className="rounded-xl p-3 md:col-span-2"
                     style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
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

          {/* compact value grid */}
          <div className="mt-4 grid md:grid-cols-4 gap-3 md:gap-4">
            <div className="usp-card"><div className="flex items-start gap-3"><span className="usp-ico"><IcoFEP/></span><div><div className="text-slate-100 font-medium">Forward Energy Premium</div><div className="text-slate-400 text-sm">Decision-grade ROI signal with β split.</div></div></div></div>
            <div className="usp-card"><div className="flex items-start gap-3"><span className="usp-ico"><IcoScenario/></span><div><div className="text-slate-100 font-medium">Scenario Studio</div><div className="text-slate-400 text-sm">Stress test prices, policy, climate to 2030/2050.</div></div></div></div>
            <div className="usp-card"><div className="flex items-start gap-3"><span className="usp-ico"><IcoThermo/></span><div><div className="text-slate-100 font-medium">Comfort risk</div><div className="text-slate-400 text-sm">Expected overheating hours & satisfaction impact.</div></div></div></div>
            <div className="usp-card"><div className="flex items-start gap-3"><span className="usp-ico"><IcoWrench/></span><div><div className="text-slate-100 font-medium">Strategy advisor</div><div className="text-slate-400 text-sm">Measures ranked by payback & certainty.</div></div></div></div>
          </div>
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

/* ---------- Onboarding, Portfolio, Building, Actions, Lineage, Services, PublicBPS ---------- */
/* (UNCHANGED from your version, except any `?.` removed and safe checks added) */
/* … — to keep this message readable, keep your existing definitions for those sections —
   You already pasted them above; they do not need structural changes. The only
   functional edits needed were removing optional chaining & closing the FEP card. */

/* ---------- constants & helpers for Services ---------- */
const INDEX_BINS = [
  { min: -Infinity, max: 0.0300, color: "#22c55e", label: "< 0.0300" },
  { min: 0.0300,   max: 0.0400, color: "#84cc16", label: "0.0300+" },
  { min: 0.0400,   max: 0.0500, color: "#fbbf24", label: "0.0400+" },
  { min: 0.0500,   max: 0.0600, color: "#f59e0b", label: "0.0500+" },
  { min: 0.0600,   max: 0.0700, color: "#f97316", label: "0.0600+" },
  { min: 0.0700,   max:  Infinity, color: "#ef4444", label: "0.0700+" },
];
const colorForIndex = v => {
  const b = INDEX_BINS.find(b => v >= b.min && v < b.max);
  return b ? b.color : "#64748b";
};

/* -------------- Services(), Building(), Actions(), Lineage(), PublicBPS()
   keep your exact implementations from your last message —
   they’ll run fine without optional chaining. -------------- */

/* ---------- App shell (no optional chaining for active tab or icons) ---------- */
const ICONS={
  story:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  onboarding:()=> (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  portfolio:()=>  (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  building:()=>   (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M10 7h4M10 11h4M10 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  actions:()=>    (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 12l3 3 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  services:()=>   (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 18h16M6 18V9M10 18V6M14 18v-4M18 18v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  lineage:()=>    (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 18h16M4 6h16M8 6v12M16 6v12" stroke="currentColor" strokeWidth="2"/></svg>),
  public:()=>     (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" strokeWidth="2"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18" stroke="currentColor" strokeWidth="2"/></svg>),
};

function App(){
  const [active,setActive]=useState("story");
  const [open,setOpen]=useState(false);

  const tabs=[
    {key:"story",label:"Story",comp:<Story goApp={()=>setActive("onboarding")}/>},
    {key:"onboarding",label:"Onboarding",comp:<Onboarding/>},
    {key:"portfolio",label:"Portfolio",comp:<Portfolio/>},
    {key:"building",label:"Building",comp:<Building/>},
    {key:"actions",label:"Actions",comp:<Actions/>},
    {key:"services",label:"Services",comp:<Services/>},
    {key:"lineage",label:"Lineage & Governance",comp:<Lineage/>},
    {key:"public",label:"Public BPS",comp:<PublicBPS/>},
  ];

  const NavItem=({t})=>{
    const is=active===t.key;
    const Ico = ICONS[t.key];
    return (
      <button onClick={()=>{setActive(t.key);setOpen(false);}}
        className={"navicon "+(is?"active":"")} title={t.label} aria-label={t.label}>
        {Ico ? <Ico /> : null}
      </button>
    );
  };

  const activeTab = tabs.find(t=>t.key===active);

  return(
    <div className="min-h-screen relative">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[76px] bg-[#0d1524] border-r border-[#1f2a3a] flex-col items-center py-4 gap-4 z-[2000]">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0b1220] border border-[#233147] grid place-items-center">
          {LOGO_SRC ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-10 h-10 object-cover" /> : <StarLogo size={22} />}
        </div>
        <div className="mt-1 flex flex-col gap-3">{tabs.map(t=><NavItem key={t.key} t={t}/>)}</div>
        <div className="mt-auto opacity-70 text-[10px] text-slate-300 px-2 text-center">© {new Date().getFullYear()}</div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-[2000] px-4 py-3 flex items-center justify-between"
              style={{background:"rgba(15,17,21,.85)",backdropFilter:"blur(4px)",borderBottom:"1px solid var(--stroke)"}}>
        <button className="navicon" onClick={()=>setOpen(true)} aria-label="Open menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:static md:translate-x-0">
          {LOGO_SRC ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-6 h-6 rounded object-cover" /> : <StarLogo size={18} />}
          <span className="font-semibold text-lg leading-none">Hoshi</span>
        </div>

        <span className="opacity-0 navicon" aria-hidden="true"></span>
      </header>

      {/* Drawer */}
      {open && <div className="overlay md:hidden" onClick={()=>setOpen(false)}></div>}
      <div className={"md:hidden fixed top-0 bottom-0 left-0 w-[76px] bg-[#0d1524] border-r border-[#1f2a3a] z-40 transition-transform "+(open?"translate-x-0":"-translate-x-full")}>
        <div className="p-3 flex items-center justify-center">
          {LOGO_SRC ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-8 h-8 rounded-md object-cover" /> : <StarLogo size={22} />}
        </div>
        <div className="flex flex-col items-center gap-3 pt-1">{tabs.map(t=><NavItem key={t.key} t={t}/>)}</div>
      </div>

      {/* Main */}
      <main className="px-4 md:px-6 py-5 md:py-6 max-w-7xl mx-auto">
        <div className="md:ml-[90px]">
          <div className="hidden md:flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {LOGO_SRC
                ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-8 h-8 rounded-lg object-cover border border-blue-400/30 bg-blue-500/10" />
                : <StarLogo size={20} />
              }
              <div className="text-slate-50 font-semibold text-xl tracking-tight">Hoshi</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400"></div>
          </div>

          {activeTab ? activeTab.comp : null}

          <div className="border-t mt-8 pt-4 text-xs text-slate-500" style={{borderColor:"var(--stroke)"}}>
            © {new Date().getFullYear()} Hoshi •  Prototype
          </div>
        </div>
      </main>
    </div>
  );
}

/* friendly error surface */
window.addEventListener('error', e => {
  const el = document.getElementById('hoshi-root');
  if (el) el.innerHTML =
    '<pre style="white-space:pre-wrap;color:#fff;background:#111;padding:12px;border:1px solid #333;border-radius:8px;">'
    + (e && (e.message || e.error) ? (e.message || String(e.error)) : 'Error') + '</pre>';
});

ReactDOM.createRoot(document.getElementById("hoshi-root")).render(<App/>);

