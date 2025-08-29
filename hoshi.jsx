/* Hoshi demo — single file React app */
const LOGO_SRC   = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe47145ebb756d01c372_hoshi.jpeg";
const PEOPLE_SRC = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe75f8001bf82851cd0f_commonwealthOfPeoples.jpeg";
const {useMemo,useState,useRef,useEffect} = React;

/* ----------------------- utils & primitives ----------------------- */
function useIsMobile(bp = 640) {
  const [m, setM] = React.useState(
    typeof window !== "undefined" && window.matchMedia?.(`(max-width:${bp}px)`).matches
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
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6AA6FF" stopOpacity="0.7"/><stop offset="100%" stopColor="#6AA6FF" stopOpacity="0"/>
    </linearGradient></defs>
    <path d={d} fill="none" stroke="#6AA6FF" strokeWidth="2"/><path d={`${d} L 280 100 L 0 100 Z`} fill="url(#g)" opacity="0.2"/>
  </svg>);
};

const Section=({title,desc,right,children,tint})=>(
  <section className={(tint || "") + " card p-5 md:p-6"}>
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

/* Reusable donut */
function DonutGauge({ value=0, max=1, size=120, stroke=14, label, display }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size/2},${size/2})`}>
        <circle r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle r={r} fill="none" stroke="#10b981" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${c-dash}`} transform="rotate(-90)" />
        <text y="-4" textAnchor="middle" fontSize={size*0.22} fontWeight="700" fill="#0f172a">
          {display ?? value.toFixed(2)}
        </text>
        {label && <text y={size*0.18} textAnchor="middle" fontSize={size*0.12} fill="#64748b">{label}</text>}
      </g>
    </svg>
  );
}

/* Large hero orb (desktop-only) */
function HeroOrb({ value=0.42, size=520 }) {
  const S=size, cx=S/2, cy=S/2;
  const rOuter = S*0.44, rTrack = S*0.28, rProg = rTrack;
  const trackW = 32, haloW = 28;
  const pct = Math.max(0, Math.min(1, value));
  const C = 2*Math.PI*rProg, dash=C*pct;

  return (
    <svg className="orb-shadow" width={S} height={S} viewBox={`0 0 ${S} ${S}`} aria-hidden>
      <defs><linearGradient id="orbHalo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#10b981"/>
      </linearGradient></defs>
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="url(#orbHalo)" strokeWidth={haloW} opacity="0.5"/>
      <circle cx={cx} cy={cy} r={rTrack} fill="none" stroke="#3a4457" strokeOpacity="0.55" strokeWidth={trackW}/>
      <circle cx={cx} cy={cy} r={rProg} fill="none" stroke="#10b981" strokeWidth={trackW}
              strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
              strokeDasharray={`${dash} ${C-dash}`}/>
      <g transform={`translate(${cx},${cy})`} textAnchor="middle">
        <text y="-6" fontSize={S*0.12} fontWeight="800" fill="#e2e8f0">{value.toFixed(2)}</text>
        <text y={S*0.06} fontSize={S*0.045} fill="#cbd5e1">Good</text>
      </g>
    </svg>
  );
}

/* ------------------------------ STORY ------------------------------ */
function Story({ goApp }) {
  const roiSpark = [2,3,2,4,5,4,6,7,6,7,8,7];
  const demoAvg = 0.42;

  const Stat = ({ k, s }) => (<div className="pill"><div className="k">{k}</div><div className="s">{s}</div></div>);
  const LogoCloudStrip = () => (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {["TenantCo","LandlordCo","SupplyOne","GridIQ","GreenCap","Cetra"].map((n,i)=>(
        <div key={i} className="px-3 py-2 rounded-lg text-center text-xs text-slate-300"
             style={{background:"rgba(148,163,184,.06)",border:"1px solid rgba(148,163,184,.18)"}}>
          {n}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-5 md:px-6">

        {/* HERO */}
        <section className="hero mt-2 md:mt-4">
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

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="pill"><div className="k">10×</div><div className="s">faster onboarding</div></div>
                <div className="pill"><div className="k">92%</div><div className="s">data coverage</div></div>
                <div className="pill"><div className="k">0.42</div><div className="s">avg. service index</div></div>
                <div className="pill"><div className="k">€↗</div><div className="s">forward ROI insight</div></div>
              </div>

              <div className="mt-5">
                <div className="text-xs text-slate-400">Trusted across the ecosystem</div>
                <LogoCloudStrip />
              </div>
            </div>

            {/* Large orb — desktop only */}
            <div className="hidden md:flex items-center justify-center">
              <HeroOrb value={demoAvg}/>
            </div>
          </div>
        </section>

        {/* IMPACT STRIPE */}
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Stat k="10×" s="faster onboarding" />
          <Stat k="92%" s="data coverage target" />
          <Stat k="β 0.35–2.48" s="sensitivity to market drivers" />
          <Stat k="−15–+8%" s="Forward Energy Premium (range)" />
        </section>

        {/* PRODUCT PEEKS */}
        <section className="mt-6 grid md:grid-cols-2 gap-4">
          {/* FEP */}
          <div className="card p-4 md:p-6 relative overflow-visible">
            <h3 className="text-slate-50 text-lg font-semibold">Forward Energy Premium</h3>
            <p className="text-slate-400 text-sm mt-1">
              Quantifies how energy &amp; service factors add/subtract from expected ROI — split by
              systematic (β) vs idiosyncratic drivers.
            </p>

            {/* mini grid — mobile-safe */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl p-3 donut-wrap relative z-10"
                   style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
                <div className="text-xs text-slate-400">Avg. index</div>
                <div className="mt-2 bg-white rounded-xl p-2 inline-flex items-center justify-center">
                  <DonutGauge value={0.07-demoAvg} max={0.07} size={76} stroke={12}
                              display={(demoAvg*10).toFixed(2)} label="Good" />
                </div>
              </div>
              <div className="rounded-xl p-3 md:col-span-2 relative z-0"
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
          <div className="card p-4 md:p-6 relative overflow-visible">
            <h3 className="text-slate-50 text-lg font-semibold">Scenario Studio</h3>
            <p className="text-slate-400 text-sm mt-1">
              One-click stress tests across energy prices, policy, and climate pathways — compare
              “as-is” vs “project” by payback and comfort.
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
        </section>

        {/* WHO IT BENEFITS */}
        <section className="mt-6 grid md:grid-cols-3 gap-3">
          <div className="tint-a p-4">
            <div className="text-slate-300 text-sm">Owners</div>
            <div className="text-slate-100 mt-1 text-[15px]">
              Show value uplift with FEP and comfort outlook; reference indices in leases and capex cases.
            </div>
          </div>
          <div className="tint-b p-4">
            <div className="text-slate-300 text-sm">Occupiers</div>
            <div className="text-slate-100 mt-1 text-[15px]">
              Compare buildings on cost, risk, and satisfaction; prioritise measures with payback &amp; confidence.
            </div>
          </div>
          <div className="tint-a p-4">
            <div className="text-slate-300 text-sm">Suppliers</div>
            <div className="text-slate-100 mt-1 text-[15px]">
              Compete on verified service indices; get credit for measured outcomes, not promises.
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="card p-5 md:p-6 mt-6">
          <h3 className="text-slate-50 text-lg font-semibold mb-3">How it works</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="how-step"><div className="how-num mb-2">1</div><div className="text-slate-100 font-medium">Ingest</div><div className="text-slate-400 text-sm">Email PDFs/CSVs or connect a meter. OCR + normalisation standardise the data.</div></div>
            <div className="how-step"><div className="how-num mb-2">2</div><div className="text-slate-100 font-medium">Compare</div><div className="text-slate-400 text-sm">FEP, β, intensity, tCO₂e, spend &amp; comfort risk, all scenario-aware.</div></div>
            <div className="how-step"><div className="how-num mb-2">3</div><div className="text-slate-100 font-medium">Publish &amp; act</div><div className="text-slate-400 text-sm">Share a Building Performance Sheet. Prioritise actions by ROI and confidence.</div></div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-2xl p-5 md:p-6 border"
                 style={{borderColor:"var(--stroke)",background:"linear-gradient(135deg, rgba(59,130,246,.14), rgba(16,185,129,.12))"}}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="text-slate-50 text-lg font-semibold">See your Forward Energy Premium</div>
              <div className="text-slate-300 text-sm">Upload a bill or EPC — get decision-grade metrics in minutes.</div>
            </div>
            <button onClick={goApp} className="btn btn-primary">Get started</button>
          </div>
        </section>

      </div>
    </div>
  );
}

/* ------------------------------ other views (unchanged / shortened) ------------------------------ */
function Onboarding(){ /* ... keep your existing copy ... */ return <div className="grid gap-4 md:gap-6"><Section title="Basics"><p className="text-slate-300">Demo.</p></Section></div>; }
function Portfolio(){ /* keep your existing Portfolio from the working copy */ return <div/>; }
function Services(){ /* keep your existing Services from the working copy */ return <div/>; }
function Building(){ return (<div className="grid gap-4 md:gap-6"><Section title="Building (demo)"><p className="text-slate-300 text-sm">Placeholder.</p></Section></div>); }
function Actions(){ return (<div className="grid gap-4 md:gap-6"><Section title="Actions"><p className="text-slate-300 text-sm">Placeholder.</p></Section></div>); }
function Lineage(){ return (<div className="grid gap-4 md:gap-6"><Section title="Data lineage — demo"><p className="text-slate-300 text-sm">Placeholder content.</p></Section></div>); }
function PublicBPS(){ return (<div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl"><div className="p-6">BPS demo</div></div>); }

/* ------------------------------ Shell ------------------------------ */
const ICONS={story:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>)};
function App(){
  // define hooks FIRST
  const [active, setActive] = useState("story");
  const [open, setOpen] = useState(false);

  // helper used by Story CTA
  const goToOnboarding = () => setActive("onboarding");

  // now it's safe to build tabs
  const tabs = [
    { key:"story",      label:"Story",               comp:<Story goApp={goToOnboarding}/> },
    { key:"onboarding", label:"Onboarding",          comp:<Onboarding/> },
    { key:"portfolio",  label:"Portfolio",           comp:<Portfolio/> },
    { key:"building",   label:"Building",            comp:<Building/> },
    { key:"actions",    label:"Actions",             comp:<Actions/> },
    { key:"services",   label:"Services",            comp:<Services/> },
    { key:"lineage",    label:"Lineage & Governance",comp:<Lineage/> },
    { key:"public",     label:"Public BPS",          comp:<PublicBPS/> },
  ];

  const NavItem = ({ t }) => {
    const is = active === t.key;
    return (
      <button
        onClick={()=>{ setActive(t.key); setOpen(false); }}
        className={"navicon " + (is ? "active" : "")}
        title={t.label}
        aria-label={t.label}
      >
        {ICONS[t.key]?.(is)}
      </button>
    );
  };

  return (
    <div className="min-h-screen relative">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[76px] bg-[#0d1524] border-r border-[#1f2a3a] flex-col items-center py-4 gap-4 z-[2000]">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0b1220] border border-[#233147] grid place-items-center">
          {LOGO_SRC ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-10 h-10 object-cover" /> : <StarLogo size={22} />}
        </div>
        <div className="mt-1 flex flex-col gap-3">{tabs.map(t => <NavItem key={t.key} t={t}/>)}</div>
        <div className="mt-auto opacity-70 text-[10px] text-slate-300 px-2 text-center">© {new Date().getFullYear()}</div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-[2000] px-4 py-3 flex items-center justify-between"
              style={{background:"rgba(15,17,21,.85)",backdropFilter:"blur(4px)",borderBottom:"1px solid var(--stroke)"}}>
        <button className="navicon" onClick={()=>setOpen(true)} aria-label="Open menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <div className="flex items-center gap-2">
          {LOGO_SRC ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-6 h-6 rounded object-cover" /> : <StarLogo size={18} />}
          <span className="text-sm font-semibold">Hoshi</span>
        </div>
        <span className="opacity-0 navicon"></span>
      </header>

      {/* Drawer (mobile) */}
      {open && <div className="overlay md:hidden" onClick={()=>setOpen(false)}></div>}
      <div className={"md:hidden fixed top-0 bottom-0 left-0 w-[76px] bg-[#0d1524] border-r border-[#1f2a3a] z-40 transition-transform " + (open ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-3 flex items-center justify-center">
          {LOGO_SRC ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-8 h-8 rounded-md object-cover" /> : <StarLogo size={22} />}
        </div>
        <div className="flex flex-col items-center gap-3 pt-1">{tabs.map(t => <NavItem key={t.key} t={t}/>)}</div>
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
              <div className="text-slate-300 font-semibold">Hoshi</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Badge>Dark UI</Badge><Badge tone="neutral">CCC optional</Badge><Badge tone="success">Zero-trust</Badge>
            </div>
          </div>

          {/* Render active tab */}
          {tabs.find(t => t.key === active)?.comp}

          <div className="border-t mt-8 pt-4 text-xs text-slate-500" style={{borderColor:"var(--stroke)"}}>
            © {new Date().getFullYear()} Hoshi • Prototype
          </div>
        </div>
      </main>
    </div>
  );
}

    

/* error overlay (handles both sync and async) */
window.addEventListener('error', e => {
  const el = document.getElementById('hoshi-root');
  if (el) el.innerHTML =
    '<pre style="white-space:pre-wrap;color:#fff;background:#111;padding:12px;border:1px solid #333;border-radius:8px;">'
    + e.message + '</pre>';
});
window.addEventListener('unhandledrejection', e => {
  const el = document.getElementById('hoshi-root');
  if (el) el.innerHTML =
    '<pre style="white-space:pre-wrap;color:#fff;background:#111;padding:12px;border:1px solid #333;border-radius:8px;">'
    + (e.reason?.message || String(e.reason)) + '</pre>';
});

ReactDOM.createRoot(document.getElementById("hoshi-root")).render(<App/>);
