export default function HeroDiagram() {
  return <svg className="hero-diagram" viewBox="0 0 520 238" fill="none" aria-hidden="true">
    <defs>
      <pattern id="hero-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#77a8ea" opacity=".25" /></pattern>
      <linearGradient id="hero-wire" x1="52" y1="116" x2="478" y2="116" gradientUnits="userSpaceOnUse">
        <stop stopColor="#5fa8ff" /><stop offset=".5" stopColor="#8bd1fe" /><stop offset="1" stopColor="#72e3c7" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="504" height="222" rx="20" fill="#0c2852" opacity=".64" stroke="#86b9ff" strokeOpacity=".26" />
    <rect x="9" y="9" width="502" height="220" rx="20" fill="url(#hero-dots)" />
    <text x="34" y="39" fill="#a6c7f4" fontSize="10" fontWeight="700" letterSpacing="2">CIRCUITO PERIOPERATORIO</text>
    <circle cx="471" cy="35" r="4" fill="#6ee7cb" />
    <path d="M40 124h26m67 0h36l12-11 14 22 14-21 11 10h16m60 0h37l15-12 16 12h38m65 0h17" stroke="url(#hero-wire)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M101 91V73h62m98 85v30h-53m171-97V73h54" stroke="#79a9ee" strokeOpacity=".4" strokeDasharray="4 4" />
    <rect x="72" y="95" width="58" height="58" rx="17" fill="#153a6d" stroke="#75afff" />
    <path d="M88 131h26m-23-1v-9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9m-18-12v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4m-18 13v4m20-4v4" stroke="#b6d9ff" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="234" y="95" width="58" height="58" rx="17" fill="#164487" stroke="#8bd1fe" />
    <path d="M248 125h7l4-8 6 16 5-9h8" stroke="#def2ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="402" y="95" width="58" height="58" rx="17" fill="#134959" stroke="#71e3c7" />
    <path d="M422 124l6 6 12-12" stroke="#a7f9e6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <g fontSize="12" fontWeight="650" textAnchor="middle" fill="#dceaff">
      <text x="101" y="176">Preparación</text><text x="263" y="176">Quirófano</text><text x="431" y="176">Recuperación</text>
    </g>
    <circle cx="163" cy="73" r="3" fill="#8ac2ff" /><circle cx="208" cy="188" r="3" fill="#8ac2ff" /><circle cx="433" cy="73" r="3" fill="#72e3c7" />
  </svg>
}
