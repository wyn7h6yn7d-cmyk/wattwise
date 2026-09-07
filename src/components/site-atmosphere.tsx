const LOAD =
  "M0,528 C80,552 140,560 200,498 C260,430 310,352 380,328 C450,306 500,348 560,336 C620,322 670,286 730,248 C800,204 860,228 920,276 C980,328 1040,430 1100,486 C1140,518 1174,528 1200,528";
const SOLAR =
  "M0,710 C220,710 300,708 360,640 C430,548 500,430 600,402 C700,428 770,540 840,638 C900,708 980,710 1200,710";
const PRICE =
  "M0,470 L40,488 L80,442 L120,460 L160,404 L200,428 L240,372 L280,398 L320,350 L360,384 L400,318 L440,360 L480,292 L520,338 L560,268 L600,314 L640,246 L680,300 L720,238 L760,286 L800,252 L840,330 L880,292 L920,368 L960,334 L1000,402 L1040,376 L1080,438 L1120,416 L1160,462 L1200,470";

function PlotCopy({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path className="atm-solar-fill" d={`${SOLAR} L1200,760 L0,760 Z`} />
      <path className="atm-solar" d={SOLAR} />
      <path className="atm-load" d={LOAD} />
      <path className="atm-price" d={PRICE} />
      {Array.from({ length: 24 }, (_, hour) => {
        const px = hour * 50;
        return (
          <g key={hour}>
            <line className="atm-tick" x1={px} x2={px} y1="748" y2="762" />
            {hour % 6 === 0 ? (
              <text className="atm-hour" x={px + 4} y="784">
                {String(hour).padStart(2, "0")}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

export function SiteAtmosphere() {
  return (
    <div className="site-atmosphere" aria-hidden="true">
      <div className="site-atmosphere-wash" />
      <div className="site-atmosphere-paper" />
      <svg className="site-atmosphere-sun" viewBox="0 0 1200 700" preserveAspectRatio="xMaxYMin slice">
        <path className="atm-sun-arc" d="M720,430 C820,210 980,150 1180,210" />
        <circle className="atm-sun-dot" cx="0" cy="0" r="5">
          <animateMotion dur="48s" repeatCount="indefinite" rotate="auto" path="M720,430 C820,210 980,150 1180,210" />
        </circle>
      </svg>
      <svg className="site-atmosphere-plot" viewBox="0 0 2400 820" preserveAspectRatio="xMidYMid slice">
        <line className="atm-axis" x1="0" x2="2400" y1="760" y2="760" />
        <line className="atm-limit" x1="0" x2="2400" y1="248" y2="248" />
        <g className="atm-scroll">
          <PlotCopy x={0} />
          <PlotCopy x={1200} />
        </g>
      </svg>
    </div>
  );
}
