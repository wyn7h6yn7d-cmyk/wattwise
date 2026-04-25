"use client";

export function RenewableEnergyScene() {
  return (
    <div className="renewable-scene" aria-hidden="true">
      <div className="scene-atmosphere" />
      <div className="scene-horizon" />

      <svg className="scene-svg" viewBox="0 0 1200 700" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ridgeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(16, 44, 36, 0.05)" />
            <stop offset="0.55" stopColor="rgba(16, 56, 46, 0.42)" />
            <stop offset="1" stopColor="rgba(12, 40, 33, 0.62)" />
          </linearGradient>
          <linearGradient id="panelGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(15, 33, 33, 0.8)" />
            <stop offset="1" stopColor="rgba(10, 24, 26, 0.95)" />
          </linearGradient>
          <linearGradient id="panelLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(45, 212, 191, 0.05)" />
            <stop offset="0.5" stopColor="rgba(16, 185, 129, 0.38)" />
            <stop offset="1" stopColor="rgba(45, 212, 191, 0.08)" />
          </linearGradient>
        </defs>

        <path
          className="scene-ridge scene-ridge-back"
          d="M520 450 C620 395 735 390 840 420 C935 445 1045 430 1200 365 L1200 700 L520 700 Z"
          fill="url(#ridgeGradient)"
        />

        <g className="scene-panels">
          <polygon points="640,505 1170,470 1170,620 640,655" fill="url(#panelGradient)" />
          <line x1="640" y1="535" x2="1170" y2="500" stroke="url(#panelLine)" strokeWidth="2" />
          <line x1="640" y1="565" x2="1170" y2="530" stroke="url(#panelLine)" strokeWidth="2" />
          <line x1="640" y1="595" x2="1170" y2="560" stroke="url(#panelLine)" strokeWidth="2" />
          <line x1="640" y1="625" x2="1170" y2="590" stroke="url(#panelLine)" strokeWidth="2" />
          <line x1="710" y1="500" x2="710" y2="650" stroke="rgba(26, 52, 48, 0.72)" strokeWidth="1.2" />
          <line x1="780" y1="495" x2="780" y2="645" stroke="rgba(26, 52, 48, 0.72)" strokeWidth="1.2" />
          <line x1="850" y1="490" x2="850" y2="640" stroke="rgba(26, 52, 48, 0.72)" strokeWidth="1.2" />
          <line x1="920" y1="485" x2="920" y2="635" stroke="rgba(26, 52, 48, 0.72)" strokeWidth="1.2" />
          <line x1="990" y1="480" x2="990" y2="630" stroke="rgba(26, 52, 48, 0.72)" strokeWidth="1.2" />
          <line x1="1060" y1="475" x2="1060" y2="625" stroke="rgba(26, 52, 48, 0.72)" strokeWidth="1.2" />
        </g>
      </svg>

      <div className="scene-turbines">
        <div className="turbine turbine-lg" style={{ right: "12%", bottom: "30%" }}>
          <span className="mast" />
          <span className="hub" />
          <span className="blades">
            <span className="blade-third" />
          </span>
        </div>
        <div className="turbine turbine-md" style={{ right: "30%", bottom: "34%" }}>
          <span className="mast" />
          <span className="hub" />
          <span className="blades">
            <span className="blade-third" />
          </span>
        </div>
        <div className="turbine turbine-sm" style={{ right: "42%", bottom: "36%" }}>
          <span className="mast" />
          <span className="hub" />
          <span className="blades">
            <span className="blade-third" />
          </span>
        </div>
      </div>

      <div className="scene-energy-wash" />
      <div className="scene-left-fade" />
    </div>
  );
}
