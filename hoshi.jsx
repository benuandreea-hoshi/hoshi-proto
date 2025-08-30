const LOGO_SRC   = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe47145ebb756d01c372_hoshi.jpeg";
const PEOPLE_SRC = "https://cdn.prod.website-files.com/68a8baf20ad5978747d9d44d/68a8fe75f8001bf82851cd0f_commonwealthOfPeoples.jpeg";
const {useMemo,useState,useRef,useEffect} = React;
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

 
function Story({ goApp }) {
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
  const LogoCloudStrip = () => (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {["TenantCo","LandlordCo","SupplyOne","GridIQ","GreenCap","Cetra"].map((n,i)=>(
        <div key={i}
          className="px-3 py-2 rounded-lg text-center text-xs text-slate-300"
          style={{background:"rgba(148,163,184,.06)",border:"1px solid rgba(148,163,184,.18)"}}
        >{n}</div>
      ))}
    </div>
  );
  const Band = ({ tone = 1, children, id }) => {
    // three subtle tints to “reset” the eye between sections
    const bg = [
      "linear-gradient(180deg,#0c111b 0%,#0b1320 100%)",
      "linear-gradient(180deg,#0b1320 0%,#0b1626 100%)",
      "linear-gradient(180deg,#0b1626 0%,#0b1a2d 100%)",
    ][Math.max(0, Math.min(2, tone - 1))];
    return (
      <section
        id={id}
        className="rounded-2xl p-5 md:p-6 border"
        style={{ background: bg, border: "1px solid var(--stroke)" }}
      >
        {children}
      </section>
    );
  };

  // icons for “what you get”
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

  return (
    <div className="min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        {/* HERO (Band 1) — orb & logo strip removed */}
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

              

        {/* VALUE STRIPE (Band 2) */}
        <Band tone={2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Stat k="10×" s="faster onboarding" />
            <Stat k="92%" s="data coverage" />
            <Stat k="β 0.35–2.48" s="sensitivity to drivers" />
            <Stat k="−15–+8%" s="Forward Energy Premium" />
          </div>
        </Band>

        {/* WHO IT BENEFITS (Band 3) */}
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

        {/* WHAT YOU GET (Band 1 again for rhythm) */}
        <Band tone={1}>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Forward Energy Premium */}
<div className="card p-4 md:p-6 relative">
  <div
    className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full blur-3xl"
    style={{ background: "radial-gradient(circle, rgba(59,130,246,.18), transparent 60%)" }}
  />
  <h3 className="text-slate-50 text-lg font-semibold">Forward Energy Premium</h3>
  <p className="text-slate-400 text-sm mt-1">
    Quantifies how energy &amp; service factors add/subtract from expected ROI — split by systematic (β) vs idiosyncratic drivers.
  </p>

  {/* On mobile: stack; on small screens: 2 cols; on md+: 3 cols with the sparkline spanning 2 */}
  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
    {/* Avg. index */}
    <div
      className="rounded-xl p-3 z-10"
      style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
    >
      <div className="text-xs text-slate-400">Avg. index</div>
      <div className="mt-2 bg-white rounded-xl p-2 inline-block">
        <DonutGauge
          value={0.07 - demoAvg}
          max={0.07}
          size={96}
          stroke={12}
          display={(demoAvg * 10).toFixed(2)}
          label="Good"
        />
      </div>
    </div>

    {/* Expected ROI contribution */}
    <div
      className="rounded-xl p-3 sm:col-span-1 md:col-span-2 z-0"
      style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">Expected ROI contribution</div>
        <span className="chip">Lower risk</span>
      </div>
      <div className="mt-2">
        <LineChart points={roiSpark} />
      </div>
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

        {/* HOW IT WORKS (Band 2) */}
        <Band tone={2} id="how">
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
              <div className="text-slate-400 text-sm">FEP, β, intensity, tCO₂e, spend & comfort risk — scenario-aware.</div>
            </div>
            <div className="how-step">
              <div className="how-num mb-2">3</div>
              <div className="text-slate-100 font-medium">Publish & act</div>
              <div className="text-slate-400 text-sm">Share a Building Performance Sheet. Prioritise actions by ROI and confidence.</div>
            </div>
          </div>
        </Band>

        {/* CTA (Band 3) */}
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
 function Actions({ goLineage }) {
  // --- helpers (local to this component so we don’t leak globals)
  const fmtGBP = n => "£" + Math.round(n).toLocaleString();
  const npv = (annual, years=7, rate=0.08, capex=0) => {
    const pv = annual * (1 - Math.pow(1+rate, -years)) / rate;
    return Math.round(pv - capex);
  };

 // --- lineage defaults for demo ids (led/hvac)
const DEFAULT_LINEAGE = {
  led: {
    baseline: "FY24 bills",
    method: "Top-down regression adj. for HDD/CDD",
    factors: ["lamp efficacy", "hours-of-use", "maintenance"],
  },
  hvac: {
    baseline: "FY24 logger data",
    method: "Schedule optimisation (BMS)",
    factors: ["occupied hours", "supply temp", "night purge"],
  }
};

// Turn a compact ACTION row into the richer shape your UI expects
const enrich = (a) => {
  const [alarmType, alarmCat] = (a.alarm || "").split("•").map(s => s && s.trim());
  const isOverrun = (alarmType || "").toLowerCase().includes("overrun");

  return {
    id: a.id,
    title: a.title,

    // chips
    alarm: alarmType || a.alarm || "Alarm",
    category: alarmCat || (a.id === "led" ? "Electricity" : "Overheating hours"),
    window: a.window || (a.id === "hvac" ? "Summer" : "Last 12m"),
    rule: a.rule || (isOverrun ? ">10% vs budget" : "> threshold"),

    // finance
    capex: a.capex,
    save: a.save,
    years: a.years ?? (a.pay ? Math.max(1, Math.round(a.pay)) : 7),
    beta: a.beta,
    confidence: a.confidence, // 0..1

    // impacts
    indexDelta: a.deltaIndex,                          // “Δ service index”
    comfortDeltaPct: a.comfortDeltaPct ?? (a.id==="hvac" ? -18 : -28),
    co2Delta: a.co2Delta ?? (a.id==="led" ? -6.5 : -2.3),

    // admin
    status: a.status || "To review",
    plan: null,
    lineage: a.lineage || DEFAULT_LINEAGE[a.id] || { baseline: "FY data", method: "Modelled", factors: [] },
  };
};

// *** this replaces your previous useState([...]) ***
const [actions, setActions] = React.useState(() => ACTIONS.map(enrich));

  // --- derived: planned roll-ups for a quick bar at the top
  const planned = actions.filter(a => a.status === "Planned");
  const plannedTotals = planned.reduce((s,a)=>({
    capex: s.capex + a.capex,
    save: s.save + a.save,
    co2: s.co2 + a.co2Delta,
    index: s.index + a.indexDelta,
  }), {capex:0, save:0, co2:0, index:0});

  // --- modal state
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({
    actionId:null, owner:"", start:"", funding:"CapEx", mv:"Bills (12m)", accept:"", scope:""
  });

  const openPlan = (a) => {
    setDraft({
      actionId: a.id,
      owner:"",
      start: new Date().toISOString().slice(0,7), // yyyy-mm
      funding: "CapEx",
      mv: "Bills (12m)",
      accept: "≥ " + fmtGBP(a.save*0.85) + " saved/yr & Δindex ≤ " + a.indexDelta.toFixed(2),
      scope: ""
    });
    setOpen(true);
  };

  const savePlan = () => {
    setActions(xs => xs.map(a => a.id!==draft.actionId ? a : ({
      ...a,
      status: "Planned",
      plan: {
        owner: draft.owner || "Unassigned",
        start: draft.start,
        funding: draft.funding,
        mv: draft.mv,
        accept: draft.accept,
        scope: draft.scope,
        snapshot: {
          capex: a.capex, save: a.save, years: a.years, beta: a.beta,
          confidence: a.confidence, indexDelta: a.indexDelta, co2Delta: a.co2Delta
        }
      }
    })));
    setOpen(false);
  };

  return (
    <div className="grid gap-4 md:gap-6">
      <Section
        title="Actions"
        desc="Each action originates from a monitored alarm and carries a finance view (NPV, payback) plus expected performance impact."
      >
        {/* Planned roll-up */}
        {!!planned.length && (
          <div className="rounded-xl p-3 mb-3 grid grid-cols-2 md:grid-cols-4 gap-3"
               style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
            <div><div className="text-xs text-slate-400">Planned CapEx</div>
              <div className="text-slate-100 font-semibold">{fmtGBP(plannedTotals.capex)}</div></div>
            <div><div className="text-xs text-slate-400">Planned savings /yr</div>
              <div className="text-slate-100 font-semibold">{fmtGBP(plannedTotals.save)}</div></div>
            <div><div className="text-xs text-slate-400">Planned Δ index</div>
              <div className="text-emerald-300 font-semibold">{plannedTotals.index.toFixed(2)}</div></div>
            <div><div className="text-xs text-slate-400">Planned Δ tCO₂e/yr</div>
              <div className="text-emerald-300 font-semibold">{plannedTotals.co2.toFixed(1)}</div></div>
          </div>
        )}

        {/* Action cards */}
        <ul className="space-y-3">
          {actions.map(a=>{
            const theNpv = npv(a.save, a.years, 0.08, a.capex);
            return (
              <li key={a.id} className="rounded-2xl p-4 md:p-5"
                  style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-slate-100 font-medium">{a.title}</div>
                  <span className="chip">{a.status}</span>
                </div>

                {/* chips */}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="chip">Alarm: {a.alarm}</span>
                  <span className="chip">{a.category}</span>
                  <span className="chip">{a.window}</span>
                  <span className="chip">{a.rule}</span>
                </div>

                {/* metrics */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
                    <div className="text-xs text-slate-400">CapEx</div>
                    <div className="text-slate-100 font-semibold">{fmtGBP(a.capex)}</div>
                  </div>
                  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
                    <div className="text-xs text-slate-400">Annual savings</div>
                    <div className="text-slate-100 font-semibold">{fmtGBP(a.save)}</div>
                  </div>
                  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
                    <div className="text-xs text-slate-400">NPV @ 8% / {a.years}y</div>
                    <div className="text-emerald-300 font-semibold">{fmtGBP(theNpv)}</div>
                  </div>
                  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
                    <div className="text-xs text-slate-400">Simple payback</div>
                    <div className="text-slate-100 font-semibold">{(a.capex/a.save).toFixed(1)}y</div>
                  </div>
                  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
                    <div className="text-xs text-slate-400">β / sensitivity</div>
                    <div className="text-slate-100 font-semibold">{a.beta.toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl p-3" style={{background:"rgba(148,163,184,.06)",border:"1px solid var(--stroke)"}}>
                    <div className="text-xs text-slate-400">Confidence</div>
                    <div className="text-slate-100 font-semibold">{Math.round(a.confidence*100)}%</div>
                  </div>
                </div>

                {/* expected impacts */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="chip">Δ service index {a.indexDelta.toFixed(2)}</span>
                  <span className="chip">Δ comfort risk {a.comfortDeltaPct}%</span>
                  <span className="chip">Δ emissions {a.co2Delta} tCO₂e/yr</span>
                </div>

                {/* CTAs */}
                <div className="mt-4 flex flex-wrap gap-3">
      <button
  className="btn btn-ghost"
  onClick={() => {
    goLineage({
      id: a.id,
      title: a.title,
      status: a.status,
      alarm: { type: a.alarm, category: a.category, window: a.window, rule: a.rule },
      finance: {
        capex: a.capex, save: a.save, years: a.years,
        npv: theNpv,                           // <- reuse computed value
        payback: (a.capex / a.save).toFixed(1),
        beta: a.beta, confidence: a.confidence
      },
      impacts: {
        indexDelta: a.indexDelta,
        comfortDeltaPct: a.comfortDeltaPct,
        co2Delta: a.co2Delta
      },
      lineage: a.lineage,
      plan: a.plan || null
    });
  }}
>
  View data lineage
</button>


                  {a.status!=="Planned" ? (
                    <button className="btn btn-primary" onClick={()=>openPlan(a)}>Add to plan</button>
                  ) : (
                    <span className="text-xs text-slate-400 mt-2">Planned by {a.plan?.owner} · starts {a.plan?.start}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* lightweight modal */}
      {open && (
        <div className="fixed inset-0 z-[3000] grid place-items-center"
             style={{background:"rgba(0,0,0,.45)"}}>
          <div className="w-[min(640px,92vw)] rounded-2xl p-5"
               style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
            <div className="text-slate-100 font-semibold text-lg">Add to plan</div>
            <div className="text-slate-400 text-sm">Promote this action to the roadmap and register how we’ll verify it.</div>

            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <div>
                <label className="text-xs text-slate-400">Owner</label>
                <input className="w-full mt-1 px-3 py-2 rounded-lg"
                       style={{background:"var(--panel-2)",border:"1px solid var(--stroke)",color:"var(--text)"}}
                       value={draft.owner} onChange={e=>setDraft({...draft,owner:e.target.value})}/>
              </div>
              <div>
                <label className="text-xs text-slate-400">Start</label>
                <input type="month" className="w-full mt-1 px-3 py-2 rounded-lg"
                       style={{background:"var(--panel-2)",border:"1px solid var(--stroke)",color:"var(--text)"}}
                       value={draft.start} onChange={e=>setDraft({...draft,start:e.target.value})}/>
              </div>
              <div>
                <label className="text-xs text-slate-400">Funding</label>
                <select className="w-full mt-1 px-3 py-2 rounded-lg"
                        style={{background:"var(--panel-2)",border:"1px solid var(--stroke)",color:"var(--text)"}}
                        value={draft.funding} onChange={e=>setDraft({...draft,funding:e.target.value})}>
                  <option>CapEx</option><option>OpEx</option><option>No-cost ops</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">M&V method</label>
                <select className="w-full mt-1 px-3 py-2 rounded-lg"
                        style={{background:"var(--panel-2)",border:"1px solid var(--stroke)",color:"var(--text)"}}
                        value={draft.mv} onChange={e=>setDraft({...draft,mv:e.target.value})}>
                  <option>Bills (12m)</option>
                  <option>Interval meter (IPMVP C)</option>
                  <option>Submeter w/ baseline model</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400">Acceptance criteria</label>
                <input className="w-full mt-1 px-3 py-2 rounded-lg"
                       style={{background:"var(--panel-2)",border:"1px solid var(--stroke)",color:"var(--text)"}}
                       value={draft.accept} onChange={e=>setDraft({...draft,accept:e.target.value})}/>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400">Scope / notes (optional)</label>
                <textarea rows={3} className="w-full mt-1 px-3 py-2 rounded-lg"
                          style={{background:"var(--panel-2)",border:"1px solid var(--stroke)",color:"var(--text)"}}
                          value={draft.scope} onChange={e=>setDraft({...draft,scope:e.target.value})}/>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="btn btn-ghost" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePlan}>Save to plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// REPLACE the whole Lineage() with this version
  function Lineage({ fromAction, goActions }){
  const A = fromAction; // may be null if opened directly

  const Card = ({title,children})=>(
    <div className="rounded-xl p-4"
         style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
      <div className="text-slate-100 font-medium">{title}</div>
      <div className="mt-2 text-sm text-slate-300">{children}</div>
    </div>
  );

  return (
    <div className="grid gap-4 md:gap-6">
      <Section
        title={"Data lineage" + (A? ` — ${A.title}` : "")}
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

        {/* If we came from an action, show its snapshot */}
        {A ? (
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            <Card title="Lineage snapshot">
              <div className="grid grid-cols-1 gap-2">
                <div><span className="text-slate-400">Alarm</span> · {A.alarm.type} — {A.alarm.category} ({A.alarm.window}; {A.alarm.rule})</div>
                <div><span className="text-slate-400">Baseline</span> · {A.lineage?.baseline || "—"}</div>
                <div><span className="text-slate-400">Method</span> · {A.lineage?.method || "—"}</div>
                <div><span className="text-slate-400">Factors</span> · {(A.lineage?.factors||[]).join(", ") || "—"}</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="chip">Δ index {A.impacts.indexDelta.toFixed(2)}</span>
                  <span className="chip">Δ comfort {A.impacts.comfortDeltaPct}%</span>
                  <span className="chip">Δ tCO₂e {A.impacts.co2Delta} /yr</span>
                </div>
              </div>
            </Card>

            <Card title="Verification & acceptance">
              {A.plan ? (
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
                  <div className="text-slate-400">Source</div><div>{A.lineage?.baseline || "FY24 bills"}</div>
                  <div className="text-slate-400">Transforms</div><div>OCR → clean → normalise (HDD/CDD)</div>
                  <div className="text-slate-400">Model</div><div>{A.lineage?.method || "Top-down regression"}</div>
                  <div className="text-slate-400">Outputs</div><div>Δ index {A.impacts.indexDelta.toFixed(2)}; Δ tCO₂e {A.impacts.co2Delta}/yr</div>
                  <div className="text-slate-400">Version</div><div>v0.2 · {new Date().toISOString().slice(0,10)}</div>
                </div>
              </div>
            </Card>

            <Card title="Finance context">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400">CapEx</span><div className="text-slate-100 font-semibold">£{A.finance.capex.toLocaleString()}</div></div>
                <div><span className="text-slate-400">Savings /yr</span><div className="text-slate-100 font-semibold">£{A.finance.save.toLocaleString()}</div></div>
                <div><span className="text-slate-400">NPV @8%</span><div className="text-emerald-300 font-semibold">£{A.finance.npv.toLocaleString()}</div></div>
                <div><span className="text-slate-400">Payback</span><div className="text-slate-100 font-semibold">{A.finance.payback}y</div></div>
                <div><span className="text-slate-400">β</span><div className="text-slate-100 font-semibold">{A.finance.beta.toFixed(2)}</div></div>
                <div><span className="text-slate-400">Confidence</span><div className="text-slate-100 font-semibold">{Math.round(A.finance.confidence*100)}%</div></div>
              </div>
            </Card>
          </div>
        ) : (
          // No context → general explainer
          <div className="rounded-xl p-4"
               style={{background:"var(--panel-2)",border:"1px solid var(--stroke)"}}>
            <div className="text-slate-300 text-sm">
              Open this page from an action to see a complete lineage snapshot for that recommendation.
              You’ll get: Source → Normalisation → Model → Version → M&V → Acceptance, with links to the portfolio/building data behind it.
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
        <div>BPS v1.3 • commit abc123 • Published 10 Aug 2025</div>
        <div>Signed by Hoshi • License: CC BY-SA</div>
      </div>
    </div>
  );
}
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
/* --------------------- BLOG TAB --------------------- */
function Blog({ goPortfolio, goBuilding }) {
  // simple registry (1st article preloaded)
  const BLOG = [
    {
      slug: "hoshi-in-5-minutes",
      title: "Hoshi in 5 minutes",
      summary:
        "From utility bills to decision-grade signals (NPV, β, systematic vs idiosyncratic).",
      readingMins: 5,
      tags: ["Getting started", "Investors", "Operators"],
    },
  ];

  const [active, setActive] = React.useState(BLOG[0].slug);
  const article = BLOG.find((b) => b.slug === active);

  const TagPill = ({ children }) => (
    <span className="chip whitespace-nowrap">{children}</span>
  );

  // article body as JSX so you can style/tweak freely
  const ArticleBody = () => (
    <div className="prose prose-invert max-w-none">
      {/* TLDR */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "rgba(148,163,184,.06)", border: "1px solid var(--stroke)" }}
      >
        <div className="text-slate-100 font-semibold">TL;DR (60 seconds)</div>
        <p className="text-slate-300 text-sm mt-1">
          Hoshi turns messy building data (bills, meters, comfort logs) into{" "}
          <b>decision-grade signals</b>: <b>NPV</b> (money), <b>β</b>/
          <b> sensitivity</b> (exposure to market-wide drivers), and a split
          between <b>systematic</b> and <b>idiosyncratic</b> risk. Real estate
          can’t just “diversify away” idiosyncratic risk; buildings are few,
          large, and unique, so we measure and manage it.
        </p>
      </div>

      {/* Why translate */}
      <h3 className="text-slate-50 text-lg font-semibold">
        Why translate energy &amp; comfort into ROI and risk?
      </h3>
      <ul className="list-disc pl-6 text-slate-300">
        <li>
          <b>Finance speaks NPV.</b> We express outcomes as present value so ops
          and capital can align.
        </li>
        <li>
          <b>Markets price exposure.</b> β shows how much results move with
          shared forces (prices, policy, climate).
        </li>
        <li>
          <b>Idiosyncratic ≠ ignorable.</b> You don’t hold 500 micro-assets;
          building-specific risk must be managed.
        </li>
      </ul>

      {/* Pipeline */}
      <h3 className="text-slate-50 text-lg font-semibold mt-6">
        What Hoshi actually does (the pipeline)
      </h3>
      <ol className="list-decimal pl-6 text-slate-300">
        <li>
          <b>Ingest:</b> email PDFs/CSVs or connect meters; normalise units and
          periods.
        </li>
        <li>
          <b>Clean &amp; compare:</b> compute intensity, spend, tCO₂e, comfort
          risk, coverage.
        </li>
        <li>
          <b>Turn into signals:</b> NPV / payback; β/sensitivity; a factor-aware
          composite for forward ROI.
        </li>
        <li>
          <b>Make it scenario-aware:</b> stress test prices, policy, and climate
          (2030/2050) to see what holds up.
        </li>
        <li>
          <b>Publish:</b> the <i>Building Performance Sheet</i> (BPS) with
          systematic vs idiosyncratic split + lineage.
        </li>
        <li>
          <b>Act (with governance):</b> every alarm becomes an Action with
          M&amp;V and acceptance criteria.
        </li>
      </ol>

      {/* Can’t diversify away */}
      <h3 className="text-slate-50 text-lg font-semibold mt-6">
        Why you can’t just diversify idiosyncratic risk away
      </h3>
      <p className="text-slate-300">
        In equities, idiosyncratic noise averages out across many small
        holdings. In property it doesn’t: each building is material and unique.
        That’s why Hoshi makes the <b>asset-specific</b> drivers visible and
        actionable.
      </p>

      {/* Different vs others */}
      <h3 className="text-slate-50 text-lg font-semibold mt-6">
        What makes Hoshi different
      </h3>
      <ul className="list-disc pl-6 text-slate-300">
        <li>
          <b>Signals, not just scores:</b> NPV, β, systematic vs idiosyncratic —
          built for capital decisions.
        </li>
        <li>
          <b>Alarm → Action → M&amp;V loop:</b> evidence-first governance with
          data lineage and acceptance criteria.
        </li>
        <li>
          <b>Earth-first framing:</b> align with a “Commonwealth Cost of Carbon”
          lens rather than box-ticking.
        </li>
      </ul>

      {/* Walkthrough */}
      <h3 className="text-slate-50 text-lg font-semibold mt-6">
        Mini walk-through (2 minutes)
      </h3>
      <ul className="list-disc pl-6 text-slate-300">
        <li>
          <b>Portfolio:</b> sort by intensity or coverage; pick a likely
          underperformer.
        </li>
        <li>
          <b>Building:</b> see spend/tCO₂e, overruns and comfort risk; inspect
          the composite index.
        </li>
        <li>
          <b>Actions:</b> e.g., LED retrofit with CapEx, savings, <b>NPV</b>,{" "}
          <b>β</b>, confidence, and expected Δ in service index, comfort risk,
          and tCO₂e/yr; add to plan with <b>M&amp;V</b>.
        </li>
        <li>
          <b>Lineage &amp; Governance:</b> jump to baseline, methods and factors
          so auditors and partners can trust the numbers.
        </li>
      </ul>

      {/* Glossary */}
      <h3 className="text-slate-50 text-lg font-semibold mt-6">Micro-glossary</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <div
          className="rounded-xl p-3"
          style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
        >
          <div className="text-slate-100 font-medium">NPV</div>
          <div className="text-slate-400 text-sm">
            Today’s value of expected savings minus cost.
          </div>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
        >
          <div className="text-slate-100 font-medium">β / sensitivity</div>
          <div className="text-slate-400 text-sm">
            How outcomes move with shared drivers (systematic exposure).
          </div>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
        >
          <div className="text-slate-100 font-medium">Systematic vs idiosyncratic</div>
          <div className="text-slate-400 text-sm">
            Market-wide vs asset-specific; property must manage the latter.
          </div>
        </div>
      </div>

      {/* Sources */}
      <div
        className="mt-6 rounded-xl p-3"
        style={{ background: "rgba(148,163,184,.06)", border: "1px solid var(--stroke)" }}
      >
        <div className="text-slate-400 text-sm">
          <b>Source notes:</b> Ecosystem Alarm Management, by Aidan T Parkinson (https://github.com/aidan-parkinson/corporation-sole).
        </div>
      </div>
    </div>
  );

  // layout (no Section header, to avoid the “Blog” heading)
  return (
    <div className="grid gap-4 md:gap-6">
      <div className="card p-5 md:p-6">
        <div className="grid gap-4">
          {/* tiny list (only one for now, but future-proofed) */}
          <div className="mb-3 flex gap-2 flex-wrap">
            {BLOG.map((b) => (
              <button
                key={b.slug}
                className={
                  "chip " +
                  (active === b.slug
                    ? "bg-blue-500/20 text-blue-200 border-blue-400/40"
                    : "")
                }
                onClick={() => setActive(b.slug)}
              >
                {b.title}
              </button>
            ))}
          </div>

          {/* meta */}
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
            <TagPill>{article.readingMins} min read</TagPill>
            {article.tags.map((t, i) => (
              <TagPill key={i}>{t}</TagPill>
            ))}
          </div>

          {/* body */}
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: "var(--panel-2)", border: "1px solid var(--stroke)" }}
          >
            <h1 className="text-slate-50 text-2xl md:text-3xl font-semibold">
              {article.title}
            </h1>
            <p className="text-slate-300 mt-1">{article.summary}</p>

            <div className="mt-4">
              <ArticleBody />
            </div>

            {/* in-article CTA */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="btn btn-primary" onClick={goPortfolio}>
                Open Portfolio
              </button>
              <button className="btn btn-ghost" onClick={goBuilding}>
                Open Building
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------- END BLOG TAB ------------------- */


function App(){
  const [active,setActive]=useState("story");
 const [open,setOpen]=useState(false);
const [lineageCtx, setLineageCtx] = useState(null);
  
const tabs = [
    { key: "story", label: "Story",      comp: <Story goApp={() => setActive("onboarding")} /> },
    { key: "onboarding", label: "Onboarding", comp: <Onboarding /> },
    { key: "portfolio",  label: "Portfolio",  comp: <Portfolio /> },
    { key: "building",   label: "Building",   comp: <Building /> },

    { key: "actions", label: "Actions",
      comp: <Actions goLineage={(payload) => { setLineageCtx(payload); setActive("lineage"); }} /> },

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
    {/* menu icon */}
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </button>

  {/* BRAND — truly centered on mobile */}
  <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:static md:translate-x-0">
    {LOGO_SRC
      ? <img src={LOGO_SRC} alt="Hoshi logo" className="w-6 h-6 rounded object-cover" />
      : <StarLogo size={18} />
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
