// Hoshi Prototype — single-file JSX (React 18 UMD + Tailwind + Recharts UMD)

// ---- assets ---------------------------------------------------------------
const LOGO_SRC   = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe47145ebb756d01c372_hoshi.jpeg";
const PEOPLE_SRC = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe75f8001bf82851cd0f_commonwealthOfPeoples.jpeg";

// ---- React hooks shortcut -------------------------------------------------
const { useMemo, useState, useRef, useEffect } = React;

// ---- helpers --------------------------------------------------------------
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

const Badge = ({ tone="neutral", children }) => {
  const map = {
    info:"bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/30",
    success:"bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30",
    warn:"bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30",
    danger:"bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/30",
    neutral:"bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-400/30",
  };
  return <span className={"px-2 py-0.5 rounded-full text-xs "+map[tone]}>{children}</span>;
};

const Metric = ({label,value,sub}) => (
  <div className="rounded-2xl p-4" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
    <div className="text-slate-300 text-xs">{label}</div>
    <div className="text-slate-50 text-2xl font-semibold tracking-tight">{value}</div>
    {sub && <div className="text-slate-400 text-xs">{sub}</div>}
  </div>
);

const LineChartTiny = ({points=[5,8,6,9,12,10,14,15,13,16,18,17]})=>{
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
          r={r} fill="none" stroke="#10b981" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${c-dash}`} transform="rotate(-90)"
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

// ---- Recharts ROI widget (UMD-safe) --------------------------------------
function ROIWidgetUMD({
  avgIndex = 4.2,
  riskTag = "Lower risk",
  labels   = ["W1","W2","W3","W4","W5","W6","W7","W8"],
  series   = { systematic:[8,12,16,22,20,24,28,26], idio:[6,10,9,14,20,18,25,23] }
}) {
  const R = (typeof window !== "undefined") ? window.Recharts : null;
  if (!R) {
    return (
      <div className="rounded-2xl p-4 md:p-6" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
        <div className="text-slate-50 text-lg font-semibold">Expected ROI contribution</div>
        <p className="text-slate-400 text-sm mt-1">
          Charts load when <code>Recharts.min.js</code> is available (it’s referenced above this JSX).
        </p>
      </div>
    );
  }
  const data = labels.map((name,i)=>({ name, systematic:series.systematic[i], idio:series.idio[i] }));
  const { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid, AreaChart, Area } = R;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Avg index */}
      <div className="rounded-2xl p-4 md:p-6" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
        <div className="text-slate-300 text-sm">Avg. index</div>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative h-20 w-20 grid place-items-center">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <path d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="4"/>
              <path d="M18 2a16 16 0 1 1 0 32" fill="none" stroke="#22c55e" strokeLinecap="round" strokeWidth="4"
                    strokeDasharray={`${(avgIndex/5)*100},100`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{avgIndex.toFixed(2)}</div>
                <div className="text-xs text-slate-300">Good</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{riskTag}</div>
            <div className="text-xs text-slate-400">Risk label from model</div>
          </div>
        </div>
      </div>

      {/* Consolidated chart */}
      <div className="md:col-span-2 rounded-2xl p-4 md:p-6" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-slate-50 text-lg font-semibold">Expected ROI contribution</div>
          <span className="text-xs px-2 py-1 rounded-full" style={{background:"rgba(148,163,184,.14)",color:"#e2e8f0",border:"1px solid rgba(148,163,184,.25)"}}>{riskTag}</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:12 }} />
              <Tooltip contentStyle={{ background:"#0b1220", border:"1px solid #233147", borderRadius:12 }} labelStyle={{ color:"#e2e8f0" }} />
              <Legend wrapperStyle={{ color:"#e2e8f0" }} />
              <Line type="monotone" dataKey="systematic" name="Systematic (β)" stroke="#60a5fa" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="idio"       name="Idiosyncratic"   stroke="#a78bfa" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split mini charts */}
      <div className="rounded-2xl p-4 md:p-6" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
        <div className="text-slate-300 text-sm mb-2">Systematic (β) ROI contribution</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top:6, right:8, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="grad-sys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:11 }} />
              <Tooltip contentStyle={{ background:"#0b1220", border:"1px solid #233147", borderRadius:12 }} labelStyle={{ color:"#e2e8f0" }} />
              <Area type="monotone" dataKey="systematic" stroke="#60a5fa" strokeWidth={2} fill="url(#grad-sys)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl p-4 md:p-6" style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
        <div className="text-slate-300 text-sm mb-2">Idiosyncratic ROI contribution</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top:6, right:8, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="grad-idio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill:"#94a3b8", fontSize:11 }} />
              <Tooltip contentStyle={{ background:"#0b1220", border:"1px solid #233147", borderRadius:12 }} labelStyle={{ color:"#e2e8f0" }} />
              <Area type="monotone" dataKey="idio" stroke="#a78bfa" strokeWidth={2} fill="url(#grad-idio)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---- Story (Landing) ------------------------------------------------------
function Story({ goApp }) {
  const Stat = ({ k, s }) => (
    <div className="pill"><div className="k">{k}</div><div className="s">{s}</div></div>
  );
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

          {/* logos */}
          <div className="mt-5">
            <div className="text-xs text-slate-400">Trusted across the ecosystem</div>
            <LogoCloudStrip />
          </div>
        </section>

        {/* VALUE STRIPE */}
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Stat k="10×" s="faster onboarding" />
          <Stat k="92%" s="data coverage target" />
          <Stat k="0.42" s="avg. service index" />
          <Stat k="€↗" s="forward ROI insight" />
        </section>

        {/* PRODUCT PEEK */}
        <section className="mt-6 grid md:grid-cols-2 gap-4">
          {/* New consolidated charts */}
          <div className="card p-4 md:p-6"><ROIWidgetUMD/></div>

          {/* Scenario Studio (unchanged) */}
          <div className="card p-4 md:p-6 relative overflow-hidden">
            <div className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full blur-3xl"
                 style={{background:"radial-gradient(circle, rgba(16,185,129,.16), transparent 60%)"}}/>
            <h3 className="text-slate-50 text-lg font-semibold">Scenario Studio</h3>
            <p className="text-slate-400 text-sm mt-1">
              One-click stress tests across energy prices, policy, and climate pathways — compare “as-is”
              vs “project” by payback and comfort.
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

        {/* COMMONWEALTH */}
        <section className="mt-6 card p-4 md:p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-slate-50 text-lg font-semibold">A Commonwealth of People</h3>
              <p className="text-slate-400 text-sm mb-3">
                Shared, comparable evidence that aligns incentives across owners, occupiers, and suppliers.
              </p>
              <div className="img-frame">
                <img src={PEOPLE_SRC} alt="Commonwealth of People" className="rounded-lg w-full object-cover"/>
              </div>
            </div>
            <div className="grid content-start gap-3">
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
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="card p-5 md:p-6 mt-6">
          <h3 className="text-slate-50 text-lg font-semibold mb-3">How it works</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="how-step"><div className="how-num mb-2">1</div><div className="text-slate-100 font-medium">Ingest</div><div className="text-slate-400 text-sm">Email PDFs/CSVs or connect a meter. OCR + normalisation standardise the data.</div></div>
            <div className="how-step"><div className="how-num mb-2">2</div><div className="text-slate-100 font-medium">Compare</div><div className="text-slate-400 text-sm">FEP, β, intensity, tCO₂e, spend & comfort risk, all scenario-aware.</div></div>
            <div className="how-step"><div className="how-num mb-2">3</div><div className="text-slate-100 font-medium">Publish & act</div><div className="text-slate-400 text-sm">Share a Building Performance Sheet. Prioritise actions by ROI and confidence.</div></div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-2xl p-5 md:p-6 border"
          style={{borderColor:"var(--stroke)", background:"linear-gradient(135deg, rgba(59,130,246,.14), rgba(16,185,129,.12))"}}>
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

// ---- Onboarding (kept compact) -------------------------------------------
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

// ---- Portfolio (table) ----------------------------------------------------
function Portfolio() {
  const rows = [
    {name:"1 King Street",kwh:142000,co2:36.2,intensity:92,complete:.92,actions:3,updated:"2025-08-10"},
    {name:"42 Market Way",kwh:98000,co2:24.4,intensity:78,complete:.84,actions:1,updated:"2025-08-07"},
    {name:"Riverside 8",kwh:123500,co2:31.0,intensity:88,complete:.67,actions:2,updated:"2025-08-05"},
  ];
  const Kpi = (p) => <Metric {...p} />;
  return (
    <div className="grid gap-4 md:gap-6">
      <Section title="Portfolio summary" right={<button className="hidden md:inline-flex btn btn-ghost">Export Portfolio Pack</button>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Kpi label="Total energy"   value="363,500 kWh" sub="Last 12 months" />
          <Kpi label="Emissions"      value="91.6 tCO₂e"   sub="Scope 2 location-based" />
          <Kpi label="Spend"          value="£ 69,120"     sub="Utilities" />
          <Kpi label="Avg. intensity" value="86 kWh/m²"    sub="All buildings" />
        </div>
      </Section>

      <Section title="Buildings" desc="Sort by intensity or data completeness to prioritise."
        right={<div className="hidden md:flex gap-2"><button className="btn btn-ghost">Sort</button><button className="btn btn-primary">Add building</button></div>}>
        <div className="hidden md:block overflow-x-auto rounded-2xl" style={{border:"1px solid var(--stroke)"}}>
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-slate-300" style={{background:"var(--panel-2)"}}>
              <tr>{["Building","kWh","tCO₂e","Intensity","Completeness","Actions","Updated"].map((h,i)=>(<th key={i} className="text-left px-4 py-3" style={{borderBottom:"1px solid var(--stroke)"}}>{h}</th>))}</tr>
            </thead>
            <tbody className="divide-y" style={{borderColor:"var(--stroke)"}}>
              {rows.map((r,i)=>(
                <tr key={i} className="hover:bg-[#10131a]">
                  <td className="px-4 py-3 text-slate-100">{r.name}</td>
                  <td className="px-4 py-3 text-slate-300">{r.kwh.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300">{r.co2.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-300">{r.intensity}</td>
                  <td className="px-4 py-3">
                    <div className="w-28 h-2 rounded bg-slate-800"><div className="h-2 rounded bg-emerald-400" style={{width:(r.complete*100)+"%"}}/></div>
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
                <div><div className="text-xs text-slate-400">kWh</div><div className="text-slate-200 font-semibold">{r.kwh.toLocaleString()}</div></div>
                <div><div className="text-xs text-slate-400">tCO₂e</div><div className="text-slate-200 font-semibold">{r.co2.toFixed(1)}</div></div>
                <div><div className="text-xs text-slate-400">Intensity</div><div className="text-slate-200 font-semibold">{r.intensity}</div></div>
                <div>
                  <div className="text-xs text-slate-400">Completeness</div>
                  <div className="mt-1 h-2 rounded bg-slate-800"><div className="h-2 rounded bg-emerald-400" style={{width:`${r.complete*100}%`}}/></div>
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
      </Section>
    </div>
  );
}

// ---- Services (Leaflet map — guarded) ------------------------------------
function Services(){
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(()=>{
    if (!mapDivRef.current || mapRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(mapDivRef.current, { center:[51.5074,-0.1278], zoom:11, scrollWheelZoom:true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:'&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([51.5074,-0.1278]).addTo(map).bindPopup("London");
    mapRef.current = map;
  },[]);

  if (!window.L) {
    return <Section title="Service Performance"><p className="text-slate-400 text-sm">Map loads when Leaflet is available (it’s already linked above).</p></Section>;
  }

  return (
    <div className="grid gap-4 md:gap-6">
      <Section title="Service Performance">
        <div className="rounded-2xl overflow-hidden border relative z-0" style={{borderColor:"var(--stroke)"}}>
          <div ref={mapDivRef} style={{height:420,width:"100%"}}></div>
        </div>
        <div className="text-xs text-slate-400 mt-3">Markers are demo-only; size/color usually reflects service index & spend.</div>
      </Section>
    </div>
  );
}

// ---- Building (lightweight placeholder to avoid regressions) -------------
function Building(){
  const rows = [
    ["Electricity",18025,20000],
    ["Gas",13154,12500],
    ["Cleaning & Waste",13960,14500],
    ["Mechanical & Electrical",11542,11200],
    ["Insurance",2000,4100],
  ];
  const max = rows.reduce((m,[,A,B])=>Math.max(m,A,B),1);
  const fmt = n => "€ "+Math.round(n).toLocaleString();
  const Bar = ({A,B,max})=>{
    const bw = B/max*100, aw = Math.min(A,B)/max*100, ow = A>B? (A-B)/max*100 : 0;
    return (
      <div className="relative w-full h-2.5 md:h-3 rounded-full bg-slate-900/70 border border-slate-700/80">
        <div className="absolute inset-0 rounded-full overflow-hidden"><div className="h-full bg-slate-400/15" style={{width:`${bw}%`}}/></div>
        <div className="absolute top-0 left-0 h-full rounded-l-full bg-emerald-400" style={{width:`${aw}%`}}/>
        {ow>0 && <div className="absolute top-0 h-full bg-rose-500" style={{left:`${bw}%`,width:`${ow}%`}}/>}
      </div>
    );
  };
  return (
    <div className="grid gap-4 md:gap-6">
      <Section title="Total Building Services Expenditures" desc="Demo bars; green = actual, faint = budget, red = overrun.">
        <div className="space-y-6">
          {rows.map(([k,A,B],i)=>(
            <div key={i} className="grid grid-cols-[220px_1fr_140px] items-center gap-4">
              <div className="text-slate-100 font-medium">{k}</div>
              <Bar A={A} B={B} max={max}/>
              <div className="text-right">
                <div className="text-slate-100">{fmt(A)}</div>
                <div className="text-xs text-slate-400">{B>0?`${fmt(B)} budget`:`no budget`}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ---- Actions --------------------------------------------------------------
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

// ---- Lineage --------------------------------------------------------------
function Lineage(){
  return (
    <div className="grid gap-4 md:gap-6">
      <Section title="Data lineage — demo" desc="Inputs, factors, formulas, versions.">
        <p className="text-slate-300 text-sm">Placeholder content.</p>
      </Section>
    </div>
  );
}

// ---- Public BPS -----------------------------------------------------------
function PublicBPS(){
  return(
    <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-slate-900 text-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">Building Performance Sheet</h2>
          <span className="text-xs text-slate-300">Data coverage: 92% • Updated 10 Aug 2025</span>
        </div>
        <div className="text-slate-300 text-sm">1 King Street, London • Office • 12,800 m²</div>
      </div>
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-xl bg-slate-100 p-4"><div className="text-xs text-slate-600">Energy</div><div className="text-xl font-semibold">142,000 kWh</div></div>
        <div className="rounded-xl bg-slate-100 p-4"><div className="text-xs text-slate-600">Emissions</div><div className="text-xl font-semibold">36.2 tCO₂e</div></div>
        <div className="rounded-xl bg-slate-100 p-4"><div className="text-xs text-slate-600">Spend</div><div className="text-xl font-semibold">£ 30,150</div></div>
        <div className="rounded-xl bg-slate-100 p-4"><div className="text-xs text-slate-600">Intensity</div><div className="text-xl font-semibold">92 kWh/m²</div></div>
      </div>
      <div className="px-6 pb-6">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">12-month trend (tCO₂e)</div>
            <span className="inline-flex"><span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">Peer: Q2</span></span>
          </div>
          <div className="mt-2"><LineChartTiny/></div>
        </div>
      </div>
    </div>
  );
}

// ---- Icons ----------------------------------------------------------------
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

// ---- App ------------------------------------------------------------------
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
          {LOGO_SRC ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-10 h-10 object-cover" /> : <StarLogo size={22} />}
        </div>
        <div className="mt-1 flex flex-col gap-3">{tabs.map(t=><NavItem key={t.key} t={t}/>)}</div>
        <div className="mt-auto opacity-70 text-[10px] text-slate-300 px-2 text-center">© {new Date().getFullYear()}</div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-[2000] px-4 py-3 flex items-center justify-between" style={{background:"rgba(15,17,21,.85)",backdropFilter:"blur(4px)",borderBottom:"1px solid var(--stroke)"}}>
        <button className="navicon" onClick={()=>setOpen(true)} aria-label="Open menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
        <div className="flex items-center gap-2">
          {LOGO_SRC ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-6 h-6 rounded object-cover" /> : <StarLogo size={18} />}
          <span className="text-sm font-semibold">Hoshi</span>
        </div>
        <span className="opacity-0 navicon"></span>
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
              <div className="text-slate-300">Hoshi — transparent ESG for real estate</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Badge>Dark UI</Badge><Badge tone="neutral">CCC optional</Badge><Badge tone="success">Zero-trust</Badge>
            </div>
          </div>

          {tabs.find(t=>t.key===active)?.comp}

          <div className="border-t mt-8 pt-4 text-xs text-slate-500" style={{borderColor:"var(--stroke)"}}>
            © {new Date().getFullYear()} Hoshi • Prototype
          </div>
        </div>
      </main>
    </div>
  );
}

// ---- error guard & mount --------------------------------------------------
window.addEventListener('error', e => {
  const el = document.getElementById('hoshi-root');
  if (el) el.innerHTML =
    '<pre style="white-space:pre-wrap;color:#fff;background:#111;padding:12px;border:1px solid #333;border-radius:8px;">'
    + e.message + '</pre>';
});

ReactDOM.createRoot(document.getElementById("hoshi-root")).render(<App/>);
