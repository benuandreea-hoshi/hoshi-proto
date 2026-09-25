**Hoshi is a portfolio optimisation platform designed to support capital allocation decisions for real estate decarbonisation.**

Most ESG and sustainability platforms are designed primarily to measure, aggregate and report environmental performance. They help organisations understand where they are today and support disclosure, benchmarking and compliance. Hoshi adds a different decision layer > **it uses building performance, emissions, regulatory exposure and financial assumptions to help determine where limited capital should be deployed, in what order, and with what expected impact.**

Rather than treating emissions as standalone sustainability metrics, Hoshi connects them directly to investment decisions. It evaluates potential interventions in terms of capital required, emissions reduction, operating performance, regulatory exposure and longer-term asset value. The aim is to provide a common decision environment for sustainability teams, asset managers and finance or investment teams that would otherwise evaluate these questions through separate datasets and models.

**Prototype**: https://hoshi-property-dba4d5.webflow.io/ 

**The Problem:**
Real estate owners are under increasing pressure to decarbonise their portfolios while continuing to make disciplined capital allocation decisions. Energy performance requirements are tightening, energy-price volatility affects operating costs, and investors are paying greater attention to climate exposure and the risk of assets becoming harder or more expensive to operate. At the same time, capital available for retrofit is finite.
The information needed to make these decisions already exists in different forms, but it is fragmented. Building performance data is often difficult to compare consistently across a portfolio. Emissions are calculated, but are not always connected to asset economics or capital efficiency. Retrofit measures may be assessed building by building, without considering whether the same capital would generate greater value or emissions reduction elsewhere in the portfolio. Regulatory exposure can also be identified without necessarily translating it into the timing and financial consequences of future intervention.

This creates a coordination problem. A building may receive investment because it is performing badly, another because it is approaching a regulatory threshold, and another because a retrofit project has already been proposed. What is missing is a consistent way of asking which intervention should happen first when all of those assets are competing for the same capital. > Hoshi is designed to provide that decision layer.

**What Hoshi does:**
Hoshi brings together building performance baselines, emissions intensity, retrofit costs and expected savings, energy-price assumptions, regulatory trajectories and portfolio-level financial outcomes within a single decision model.
It then uses those inputs to compare potential interventions across the portfolio. The practical question Hoshi is designed to answer is: **Given a finite capital budget, where should we intervene first to reduce emissions and regulatory exposure while protecting long-term asset value?**

**This changes the unit of analysis.** Instead of treating decarbonisation as a checklist applied independently to each building, Hoshi treats it as a constrained portfolio optimisation problem. An intervention can therefore be assessed not simply by whether it improves one building, but by whether allocating capital to that intervention represents a better portfolio decision than allocating the same capital elsewhere.

**Core capabilities for an MVP**
- a consistent baseline across the portfolio to normalise asset-level energy consumption, emissions intensity, and EPC ratings so buildings can be compared directly
- Each asset is represented through a structured performance profile that highlights current state, regulatory exposure, and intervention potential
- From this baseline, the platform models retrofit scenarios. It applies intervention cost curves and projected savings to estimate impact on operating performance and emissions trajectory. These models are not engineering simulations; they are decision-grade financial approximations intended to support portfolio sequencing
- Hoshi then ranks assets based on capital efficiency and risk exposure > rather than asking “which building is worst,” it evaluates which interventions generate the highest emissions reduction per unit of capital deployed, and how that affects portfolio-level yield and regulatory resilience
- scenario modelling is built into the decision layer. Users can adjust energy price assumptions, regulatory tightening timelines, and retrofit phasing
- The platform recalculates portfolio impact, allowing teams to stress-test decisions under uncertainty rather than rely on static projections
- Finally it will visualise forward exposure. It identifies assets that are likely to become non-compliant or economically disadvantaged under plausible regulatory and market developments. This is to convert climate and regulatory risk into quantified financial exposure

**Research**
- The conceptual framing of Hoshi was **influenced by Aidan Parkinson’s Ecosystem Alarm Management book**, which introduces the philosophy of the Commonwealth of People and the Commonwealth Cost of Carbon (CCC). That work explored the need for consistent, comparable environmental metrics at systemic scale: https://www.researchgate.net/publication/373011352_ECOSYSTEM_ALARM_MANAGEMENT
