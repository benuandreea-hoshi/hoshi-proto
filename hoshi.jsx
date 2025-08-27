const LOGO_SRC   = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe47145ebb756d01c372_hoshi.jpeg";
const PEOPLE_SRC = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe75f8001bf82851cd0f_commonwealthOfPeoples.jpeg";
const {useMemo,useState,useRef,useEffect} = React;
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
function Story({ goApp }) {
  const IcoMail = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16v12H4zM4 6l8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const IcoChart = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V4M4 20h16M8 16v-6M12 20V8M16 20v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  const IcoShield = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l8 4v5c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7l8-4z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M9.5 12.5l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const IcoBolt = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-5 md:px-6">

        {/* HERO */}
        <section className="hero mt-2 md:mt-4">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <span className="chip">Prototype</span>
            <span className="chip" style={{background:"rgba(148,163,184,.12)",color:"#e2e8f0",borderColor:"rgba(148,163,184,.3)"}}>
              Real-estate ESG
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.08]">
            <span className="text-slate-100">Hoshi — </span>
            <span className="text-neon">transparent ESG</span>
            <span className="text-slate-100"> for real estate.</span>
          </h1>

          <p className="text-slate-300 mt-4 text-base md:text-lg max-w-3xl">
            Ingest utility data in minutes, compare metrics instantly, and ship a public
            Building Performance Sheet with auditable lineage.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={goApp} className="btn btn-primary">Launch prototype</button>
            <a href="#how" className="btn btn-ghost">How it works</a>
          </div>

          {/* KPIs */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="pill"><div className="k">10×</div><div className="s">faster onboarding</div></div>
            <div className="pill"><div className="k">92%</div><div className="s">data coverage target</div></div>
            <div className="pill"><div className="k">100%</div><div className="s">traceable metrics</div></div>
          </div>
        </section>
        <section className="mt-6 card p-4 md:p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* USP cards */}
            <div className="grid gap-3 md:gap-4 content-start">
              <div className="usp-card">
                <div className="flex items-start gap-3">
                  <span className="usp-ico"><IcoMail/></span>
                  <div>
                    <div className="text-slate-100 font-medium">Simple ingestion</div>
                    <div className="text-slate-400 text-sm">Email bills or upload CSV. APIs when ready.</div>
                  </div>
                </div>
              </div>
              <div className="usp-card">
                <div className="flex items-start gap-3">
                  <span className="usp-ico"><IcoChart/></span>
                  <div>
                    <div className="text-slate-100 font-medium">Comparable metrics</div>
                    <div className="text-slate-400 text-sm">kWh, tCO₂e, spend &amp; intensity—apples to apples.</div>
                  </div>
                </div>
              </div>
              <div className="usp-card">
                <div className="flex items-start gap-3">
                  <span className="usp-ico"><IcoShield/></span>
                  <div>
                    <div className="text-slate-100 font-medium">Transparent lineage</div>
                    <div className="text-slate-400 text-sm">Every metric traceable to sources, factors &amp; formulas.</div>
                  </div>
                </div>
              </div>
              <div className="usp-card">
                <div className="flex items-start gap-3">
                  <span className="usp-ico"><IcoBolt/></span>
                  <div>
                    <div className="text-slate-100 font-medium">Action planning</div>
                    <div className="text-slate-400 text-sm">Ranked measures with payback &amp; savings.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* People image + copy */}
            <div>
              <h3 className="text-slate-50 text-lg font-semibold">A Commonwealth of Peoples</h3>
              <p className="text-slate-400 text-sm mb-3">
                Why transparent performance matters across owners, occupiers, and the supply-chain.
              </p>
              <div className="img-frame">
                <img src={PEOPLE_SRC} alt="Commonwealth of Peoples" className="rounded-lg w-full object-cover"/>
              </div>
              <p className="text-slate-300 mt-4 text-[15px] leading-6">
                Hoshi aligns incentives by making service performance comparable across buildings and portfolios.
                Clear benchmarks, auditable lineage, and shared evidence give owners, tenants, and suppliers the
                same picture—so better briefs get written and better outcomes get rewarded.
              </p>
              <ul className="mt-3 space-y-2 text-slate-300 text-[15px]">
                <li className="flex items-start"><span className="check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Comparable indices reveal service gaps and ROI opportunities.</li>
                <li className="flex items-start"><span className="check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Public Building Performance Sheets build trust and marketability.</li>
                <li className="flex items-start"><span className="check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Evidence-backed improvements inspire more ambitious project briefs.</li>
              </ul>
            </div>
          </div>
        </section>
        <section id="how" className="card p-5 md:p-6 mt-6">
          <h3 className="text-slate-50 text-lg font-semibold mb-3">How it works</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="how-step">
              <div className="how-num mb-2">1</div>
              <div className="text-slate-100 font-medium">Ingest</div>
              <div className="text-slate-400 text-sm">Email PDFs/CSVs or connect a meter. OCR + normalisation standardise the data.</div>
            </div>
            <div className="how-step">
              <div className="how-num mb-2">2</div>
              <div className="text-slate-100 font-medium">Compare</div>
              <div className="text-slate-400 text-sm">Factors applied. Intensity, tCO₂e, spend and a composite service index computed.</div>
            </div>
            <div className="how-step">
              <div className="how-num mb-2">3</div>
              <div className="text-slate-100 font-medium">Publish &amp; act</div>
              <div className="text-slate-400 text-sm">Share a Building Performance Sheet. Prioritise actions by ROI and confidence.</div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function Onboarding(){
  const [step,setStep]=useState(1);
  const next=()=>setStep(s=>Math.min(4,s+1));
  const back=()=>setStep(s=>Math.max(1,s-1));
  const inputStyle={background:"var(--panel-2)",border:"1px solid var(--stroke)",borderRadius:"12px",padding:"8px 12px",color:"#fff",width:"100%"};
  return(<div className="grid gap-4 md:gap-6">
    <div className="flex items-center gap-2 md:gap-3">{[1,2,3,4].map(i=>(<div key={i} className={`h-2 rounded-full ${i<=step?"bg-blue-400":"bg-slate-700"}`} style={{width:i===step?80:64}}/>))}</div>
    {step===1 && (<Section title="Basics" desc="Name your portfolio and set default units.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="text-sm text-slate-300">Portfolio name</label><input className="mt-1" style={inputStyle} placeholder="Acme Real Estate"/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-slate-300">Area units</label><select className="mt-1" style={inputStyle}><option>m²</option><option>ft²</option></select></div>
          <div><label className="text-sm text-slate-300">Currency</label><select className="mt-1" style={inputStyle}><option>GBP</option><option>EUR</option></select></div>
        </div>
      </div>
      <div className="mt-4 flex justify-end"><button onClick={next} className="btn btn-primary">Next</button></div>
    </Section>)}
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
    {step===4 && (<Section title="You're set" desc="Add your first building — it takes about 3 minutes.">
      <div className="flex justify-between"><button onClick={back} className="btn btn-ghost">Back</button><button className="btn btn-primary">Add building</button></div>
    </Section>)}
  </div>);
}

function Portfolio() {
  const rows = [
    {name:"1 King Street",kwh:142000,co2:36.2,intensity:92,complete:.92,actions:3,updated:"2025-08-10"},
    {name:"42 Market Way",kwh:98000,co2:24.4,intensity:78,complete:.84,actions:1,updated:"2025-08-07"},
    {name:"Riverside 8",kwh:123500,co2:31.0,intensity:88,complete:.67,actions:2,updated:"2025-08-05"},
  ];

  const Kpi = (p) => <Metric {...p} />; // reuse your Metric card

  return (
    <div className="grid gap-4 md:gap-6">
      {/* KPIs — stack on mobile, 4-up on desktop */}
      <Section
        title="Portfolio summary"
        right={<button className="hidden md:inline-flex btn btn-ghost">Export Portfolio Pack</button>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Kpi label="Total energy"   value="363,500 kWh" sub="Last 12 months" />
          <Kpi label="Emissions"      value="91.6 tCO₂e"   sub="Scope 2 location-based" />
          <Kpi label="Spend"          value="£ 69,120"     sub="Utilities" />
          <Kpi label="Avg. intensity" value="86 kWh/m²"    sub="All buildings" />
        </div>
      </Section>

      <Section
        title="Buildings"
        desc="Sort by intensity or data completeness to prioritise."
        right={
          <div className="hidden md:flex gap-2">
            <button className="btn btn-ghost">Sort</button>
            <button className="btn btn-primary">Add building</button>
          </div>
        }
      >
  
        <div className="md:hidden -mx-2 mb-3 overflow-x-auto no-scrollbar">
          <div className="px-2 flex gap-2">
            <span className="chip whitespace-nowrap">Sort: Intensity</span>
            <span className="chip whitespace-nowrap">Filter: All</span>
            <span className="chip whitespace-nowrap">Export</span>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto rounded-2xl" style={{border:"1px solid var(--stroke)"}}>
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-slate-300" style={{background:"var(--panel-2)"}}>
              <tr>
                {["Building","kWh","tCO₂e","Intensity","Completeness","Actions","Updated"].map((h,i)=>(
                  <th key={i} className="text-left px-4 py-3" style={{borderBottom:"1px solid var(--stroke)"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{borderColor:"var(--stroke)"}}>
              {rows.map((r,i)=>(
                <tr key={i} className="hover:bg-[#10131a]">
                  <td className="px-4 py-3 text-slate-100">{r.name}</td>
                  <td className="px-4 py-3 text-slate-300">{r.kwh.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300">{r.co2.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-300">{r.intensity}</td>
                  <td className="px-4 py-3">
                    <div className="w-28 h-2 rounded bg-slate-800">
                      <div className="h-2 rounded bg-emerald-400" style={{width:(r.complete*100)+"%"}}/>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{Math.round(r.complete*100)}%</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.actions}</td>
                  <td className="px-4 py-3 text-slate-400">{r.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="md:hidden space-y-3">
          {rows.map((r,i)=>(
            <li key={i} className="rounded-2xl p-4" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-slate-100 font-medium">{r.name}</div>
                <div className="text-slate-400 text-xs">Updated {r.updated}</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400">kWh</div>
                  <div className="text-slate-200 font-semibold">{r.kwh.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">tCO₂e</div>
                  <div className="text-slate-200 font-semibold">{r.co2.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Intensity</div>
                  <div className="text-slate-200 font-semibold">{r.intensity}</div>
                </div>
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
                <button className="btn btn-ghost">Open</button>
              </div>
            </li>
          ))}
        </ul>

        {/* Mobile FAB */}
        <button
          className="md:hidden fixed bottom-5 right-5 btn btn-primary rounded-full shadow-lg"
          aria-label="Add building"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </Section>
    </div>
  );
}
const INDEX_BINS = [
  { min: -Infinity, max: 0.0300, color: "#22c55e", label: "< 0.0300" },
  { min: 0.0300,   max: 0.0400, color: "#84cc16", label: "0.0300+" },
  { min: 0.0400,   max: 0.0500, color: "#fbbf24", label: "0.0400+" },
  { min: 0.0500,   max: 0.0600, color: "#f59e0b", label: "0.0500+" },
  { min: 0.0600,   max: 0.0700, color: "#f97316", label: "0.0600+" },
  { min: 0.0700,   max:  Infinity, color: "#ef4444", label: "0.0700+" },
];
const colorForIndex = v => INDEX_BINS.find(b => v >= b.min && v < b.max)?.color || "#64748b";
const PRESETS = {
  Balanced:        { electricity:.14, gas:.14, water:.08, hvac:.12, cleaning:.12, waste:.10, security:.15, maintenance:.15 },
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
  const M = rows.reduce((a,[,A,B])=>{a.max=Math.max(a.max,A,B);a.ta+=A;a.tb+=B;return a},{max:1,ta:0,tb:0});
  const over   = Math.max(0,M.ta-M.tb);
  const overPct= M.tb ? (over/M.tb*100) : 0;
  const need   = rows.filter(([,A,B])=>A>B*1.1).length;
  const fmt    = n => "€ "+Math.round(n).toLocaleString();

  // tiny legend pill
  const Dot = ({c,label}) => (
    <span className="flex items-center gap-2 text-slate-300 text-sm">
      <i className="inline-block w-2.5 h-2.5 rounded-sm" style={{background:c}}/>{label}
    </span>
  );

  // single bar renderer (Tailwind only, no .hb- CSS needed)
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

  // ---------- moved OUT of <Bar> ----------
   const fmtPct = p => (p==null ? "–" : `${p.toFixed(0)}%`);
  const top = rows
    .filter(([_,A,B]) => A > B)
    .map(([k,A,B]) => ({ k, over:A-B, pct: B ? ((A-B)/B)*100 : null }))
    .sort((a,b) => b.over - a.over)
    .slice(0,3);
  const underOrOn = rows.filter(([_,A,B]) => A <= B).length;

  const Bar = ({A,B,max}) => { /* ... no cross-component vars here ... */ };

  return (/* ... use top/underOrOn safely here ... */);
}
  // ----------------------------------------

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
          {/* Totals & status */}
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

          {/* Top overruns */}
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

          {/* How to read the bars */}
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
function Actions(){
  const items = [
    { m:"LED retrofit", capex:25000, save:8500, pay:1.8, status:"To review" },
    { m:"HVAC schedule", capex:1000, save:4200, pay:0.4, status:"Approved" },
  ];
  return (
    <div className="grid gap-4 md:gap-6">
      <Section title="Actions">
        <ul className="space-y-2">
          {items.map((x,i)=>(
            <li key={i} className="rounded-xl p-3" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
              <div className="text-slate-100 font-medium">{x.m}</div>
              <div className="text-xs text-slate-400">CapEx £{x.capex.toLocaleString()} • Save £{x.save.toLocaleString()} • Payback {x.pay}y • {x.status}</div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Lineage(){
  return (
    <div className="grid gap-4 md:gap-6">
      <Section title="Data lineage — demo" desc="Inputs, factors, formulas, versions.">
        <p className="text-slate-300 text-sm">Placeholder content.</p>
      </Section>
    </div>
  );
}

function PublicBPS(){return(<div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl"><div className="bg-slate-900 text-white p-6"><div className="flex items-center justify-between"><h2 className="text-lg md:text-xl font-semibold">Building Performance Sheet</h2><span className="text-xs text-slate-300">Data coverage: 92% • Updated 10 Aug 2025</span></div><div className="text-slate-300 text-sm">1 King Street, London • Office • 12,800 m²</div></div><div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"><div className="rounded-xl bg-slate-100 p-4"><div className="text-xs text-slate-600">Energy</div><div className="text-xl font-semibold">142,000 kWh</div></div><div className="rounded-xl bg-slate-100 p-4"><div className="text-xs text-slate-600">Emissions</div><div className="text-xl font-semibold">36.2 tCO₂e</div></div><div className="rounded-xl bg-slate-100 p-4"><div className="text-xs text-slate-600">Spend</div><div className="text-xl font-semibold">£ 30,150</div></div><div className="rounded-xl bg-slate-100 p-4"><div className="text-xs text-slate-600">Intensity</div><div className="text-xl font-semibold">92 kWh/m²</div></div></div><div className="px-6 pb-6"><div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><div className="text-sm font-medium">12-month trend (tCO₂e)</div><span className="inline-flex"><span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">Peer: Q2</span></span></div><div className="mt-2"><LineChart/></div></div></div></div>);}

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
  const tabs=[
    {key:"story",label:"Story",comp:<Story goApp={()=>setActive("onboarding")}/>},
    {key:"onboarding",label:"Onboarding",comp:<Onboarding/>},
    {key:"portfolio",label:"Portfolio",comp:<Portfolio/>},
    {key:"building",label:"Building",comp:<Building/>},
    {key:"actions",label:"Actions",comp:<Actions/>},
    {key:"services",label:"Services",comp:<Services/>},     // NEW
    {key:"lineage",label:"Lineage & Governance",comp:<Lineage/>},
    {key:"public",label:"Public BPS",comp:<PublicBPS/>},
  ];
  const [active,setActive]=useState("story");
  const [open,setOpen]=useState(false);

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
      <header className="md:hidden sticky top-0 z-[2000] px-4 py-3 flex items-center justify-between" style={{background:"rgba(15,17,21,.85)",backdropFilter:"blur(4px)",borderBottom:"1px solid var(--stroke)"}}>
        <button className="navicon" onClick={()=>setOpen(true)} aria-label="Open menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
       <div className="flex items-center gap-2">
  {LOGO_SRC
    ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-6 h-6 rounded object-cover" />
    : <StarLogo size={18} />
  }
  <span className="text-sm font-semibold">Real Estate Performance Marketing Platform</span>
</div>
        <span className="opacity-0 navicon"></span>
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
<div className="text-slate-300">Real Estate Performance Marketing Platform</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400"><Badge>Dark UI</Badge><Badge tone="neutral">CCC optional</Badge><Badge tone="success">Zero-trust</Badge></div>
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
