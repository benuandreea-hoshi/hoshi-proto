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
// --- Consolidated ROI widget (Recharts UMD-safe) ---
function ROIWidget(){
  // Use Recharts if the UMD script is present on the page
  const R = window.Recharts;
  const hasR = !!(R && R.LineChart);
  let RLChart, RLine, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid, RAreaChart, Area;
  if (hasR) {
    ({ LineChart: RLChart, Line: RLine, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid, AreaChart: RAreaChart, Area } = R);
  }

  // ---- Demo data (swap with your live series) ----
  const labels = ["W1","W2","W3","W4","W5","W6","W7","W8"];
  const data = labels.map((x, i) => ({
    name: x,
    systematic: [8, 12, 16, 22, 20, 24, 28, 26][i],
    idio:       [6, 10,  9, 14, 20, 18, 25, 23][i],
  }));

  const avgIndex = 4.2;        // <- plug your model value
  const riskTag  = "Lower risk";

  const cardStyle = { background:"var(--panel-2)", border:"1px solid var(--stroke)" };

  return (
    <div className="card p-4 md:p-6" style={{border:"1px solid var(--stroke)"}}>
      <h3 className="text-slate-50 text-lg font-semibold">Forward Energy Premium</h3>
      <p className="text-slate-400 text-sm mt-1">
        Quantifies how energy &amp; service factors add/subtract from expected ROI —
        split by <b>systematic (β)</b> vs <b>idiosyncratic</b> drivers.
      </p>

      {/* Top row: Avg. index + consolidated chart */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Avg. index card with ring + risk */}
        <div className="rounded-xl p-4" style={cardStyle}>
          <div className="text-xs text-slate-400">Avg. index</div>
          <div className="mt-3 flex items-center gap-4">
            {/* ring gauge */}
            <div className="relative h-20 w-20 grid place-items-center">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <path d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"
                      fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="4"/>
                <path d="M18 2a16 16 0 1 1 0 32"
                      fill="none" stroke="#22c55e" strokeLinecap="round" strokeWidth="4"
                      strokeDasharray={`${(avgIndex/5)*100}, 100`}/>
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{avgIndex.toFixed(2)}</div>
                  <div className="text-xs text-slate-300">Good</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-0.5">Risk</div>
              <div className="text-base font-semibold text-white">{riskTag}</div>
            </div>
          </div>
        </div>

        {/* Consolidated dual-series chart */}
        <div className="rounded-xl p-4 md:col-span-2" style={cardStyle}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-400">Expected ROI contribution</div>
            <span className="text-[11px] px-2 py-1 rounded-full"
                  style={{background:"rgba(148,163,184,.12)", border:"1px solid rgba(148,163,184,.28)", color:"#e2e8f0"}}>
              {riskTag}
            </span>
          </div>

          <div className="h-56">
            {hasR ? (
              <ResponsiveContainer width="100%" height="100%">
                <RLChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 2 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:12 }} />
                  <Tooltip contentStyle={{ background:"#0c111b", border:"1px solid #1f2a33", borderRadius:12 }}
                           labelStyle={{ color:"#e2e8f0" }} />
                  <Legend wrapperStyle={{ color:"#e2e8f0" }} />
                  <RLine type="monotone" dataKey="systematic" name="Systematic (β)" stroke="#60a5fa" strokeWidth={2} dot={false}/>
                  <RLine type="monotone" dataKey="idio"       name="Idiosyncratic"   stroke="#a78bfa" strokeWidth={2} dot={false}/>
                </RLChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-slate-400 text-sm">
                Add the Recharts UMD script to enable this chart.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optional split view */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {hasR ? (
          <>
            <div className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs text-slate-400 mb-2">Systematic (β) ROI contribution</div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RAreaChart data={data} margin={{ top: 6, right: 10, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-sys" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:11 }} />
                    <Tooltip contentStyle={{ background:"#0c111b", border:"1px solid #1f2a33", borderRadius:12 }}
                             labelStyle={{ color:"#e2e8f0" }} />
                    <Area type="monotone" dataKey="systematic" stroke="#60a5fa" strokeWidth={2} fill="url(#grad-sys)" />
                  </RAreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs text-slate-400 mb-2">Idiosyncratic ROI contribution</div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RAreaChart data={data} margin={{ top: 6, right: 10, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-idio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:11 }} />
                    <Tooltip contentStyle={{ background:"#0c111b", border:"1px solid #1f2a33", borderRadius:12 }}
                             labelStyle={{ color:"#e2e8f0" }} />
                    <Area type="monotone" dataKey="idio" stroke="#a78bfa" strokeWidth={2} fill="url(#grad-idio)" />
                  </RAreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}


/* ------------------------------ STORY ------------------------------ */
function Story({ goApp }) {
  // simple logo strip to keep trust row
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

          <p className="text-slate-300 mt-4 text-base md:text-lg max-w-3xl">
            Evidence that moves value: scenario-adjusted service performance, comfort risk,
            and forward ROI — shared by owners, occupiers, and suppliers.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={goApp} className="btn btn-primary">Launch prototype</button>
            <a href="#how" className="btn btn-ghost">See how it works</a>
          </div>

          {/* quick trust strip */}
          <div className="mt-5">
            <div className="text-xs text-slate-400">Trusted across the ecosystem</div>
            <LogoCloudStrip />
          </div>
        </section>

        {/* PRODUCT — consolidated ROI charts + Scenario card */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <ROIWidget/>

          {/* Scenario Studio (unchanged content) */}
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

        {/* (keep the rest of your Story sections as they are: Commonwealth / How it works / CTA, etc.) */}

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
