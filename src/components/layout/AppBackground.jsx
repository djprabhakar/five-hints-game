/* Decorative illustrated background for the main app shell.
   Rendered as a fixed SVG behind all content — aria-hidden, pointer-events-none. */

export default function AppBackground() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none fixed inset-0 w-full h-full"
      style={{ zIndex: -1 }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="bg-drop" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Everything rendered at low opacity so game UI stays in focus */}
      <g opacity="0.11">

        {/* ══════════════════════════════════════════
            LETTER TILES — scattered at edges
        ══════════════════════════════════════════ */}

        {/* H — top left */}
        <g transform="translate(72, 108) rotate(-13)" filter="url(#bg-drop)">
          <rect width="66" height="66" rx="13" fill="#10b981" />
          <text x="33" y="47" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" fontFamily="'Inter Tight', sans-serif">H</text>
        </g>

        {/* I — top right */}
        <g transform="translate(1312, 82) rotate(9)" filter="url(#bg-drop)">
          <rect width="66" height="66" rx="13" fill="#f59e0b" />
          <text x="33" y="47" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" fontFamily="'Inter Tight', sans-serif">I</text>
        </g>

        {/* N — left mid */}
        <g transform="translate(22, 390) rotate(-7)" filter="url(#bg-drop)">
          <rect width="66" height="66" rx="13" fill="#8b5cf6" />
          <text x="33" y="47" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" fontFamily="'Inter Tight', sans-serif">N</text>
        </g>

        {/* T — bottom center */}
        <g transform="translate(676, 816) rotate(6)" filter="url(#bg-drop)">
          <rect width="66" height="66" rx="13" fill="#0ea5e9" />
          <text x="33" y="47" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" fontFamily="'Inter Tight', sans-serif">T</text>
        </g>

        {/* S — bottom left */}
        <g transform="translate(94, 754) rotate(-9)" filter="url(#bg-drop)">
          <rect width="66" height="66" rx="13" fill="#f43f5e" />
          <text x="33" y="47" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" fontFamily="'Inter Tight', sans-serif">S</text>
        </g>

        {/* 5 — top center-right */}
        <g transform="translate(1046, 55) rotate(11)" filter="url(#bg-drop)">
          <rect width="66" height="66" rx="13" fill="#10b981" />
          <text x="33" y="47" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" fontFamily="'Inter Tight', sans-serif">5</text>
        </g>

        {/* W — bottom left-center */}
        <g transform="translate(492, 848) rotate(-5)" filter="url(#bg-drop)">
          <rect width="50" height="50" rx="10" fill="#8b5cf6" />
          <text x="25" y="35" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="'Inter Tight', sans-serif">W</text>
        </g>

        {/* O — top center */}
        <g transform="translate(796, 26) rotate(7)" filter="url(#bg-drop)">
          <rect width="50" height="50" rx="10" fill="#f43f5e" />
          <text x="25" y="35" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="'Inter Tight', sans-serif">O</text>
        </g>

        {/* R — bottom right */}
        <g transform="translate(1148, 832) rotate(-4)" filter="url(#bg-drop)">
          <rect width="50" height="50" rx="10" fill="#10b981" />
          <text x="25" y="35" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="'Inter Tight', sans-serif">R</text>
        </g>

        {/* D — right edge mid */}
        <g transform="translate(1392, 620) rotate(14)" filter="url(#bg-drop)">
          <rect width="50" height="50" rx="10" fill="#0ea5e9" />
          <text x="25" y="35" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="'Inter Tight', sans-serif">D</text>
        </g>


        {/* ══════════════════════════════════════════
            FAMILY FIGURES — top-right corner cluster
        ══════════════════════════════════════════ */}

        {/* Dad — emerald shirt */}
        <g transform="translate(1236, 138)">
          <circle cx="0" cy="0" r="22" fill="#1e293b" />
          <circle cx="-7" cy="-4" r="3.5" fill="white" />
          <circle cx="7" cy="-4" r="3.5" fill="white" />
          <circle cx="-7" cy="-4" r="1.8" fill="#1e293b" />
          <circle cx="7" cy="-4" r="1.8" fill="#1e293b" />
          <path d="M -8 6 Q 0 14 8 6" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="-18" y="26" width="36" height="54" rx="8" fill="#10b981" />
          <line x1="-18" y1="36" x2="-40" y2="56" stroke="#10b981" strokeWidth="11" strokeLinecap="round" />
          <line x1="18" y1="36" x2="40" y2="56" stroke="#10b981" strokeWidth="11" strokeLinecap="round" />
          <rect x="-14" y="78" width="11" height="34" rx="6" fill="#1e40af" />
          <rect x="3" y="78" width="11" height="34" rx="6" fill="#1e40af" />
        </g>

        {/* Mom — violet dress, hair */}
        <g transform="translate(1308, 144)">
          <ellipse cx="0" cy="-3" rx="26" ry="23" fill="#92400e" />
          <circle cx="0" cy="0" r="21" fill="#fde7ca" />
          <circle cx="-6.5" cy="-3.5" r="2.8" fill="#1e293b" />
          <circle cx="6.5" cy="-3.5" r="2.8" fill="#1e293b" />
          <circle cx="-5.5" cy="-4.5" r="1" fill="white" />
          <circle cx="7.5" cy="-4.5" r="1" fill="white" />
          <path d="M -7 6 Q 0 13 7 6" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          <path d="M -17 24 L -23 80 L 23 80 L 17 24 Z" fill="#8b5cf6" />
          <line x1="-17" y1="34" x2="-37" y2="54" stroke="#8b5cf6" strokeWidth="10" strokeLinecap="round" />
          <line x1="17" y1="34" x2="37" y2="54" stroke="#8b5cf6" strokeWidth="10" strokeLinecap="round" />
        </g>

        {/* Kid — amber outfit, arms raised in joy */}
        <g transform="translate(1374, 178)">
          <circle cx="0" cy="0" r="17" fill="#fde7ca" />
          <path d="M -14 -8 Q 0 -24 14 -8" fill="#92400e" />
          <circle cx="-5.5" cy="-2" r="3.2" fill="#1e293b" />
          <circle cx="5.5" cy="-2" r="3.2" fill="#1e293b" />
          <circle cx="-4.5" cy="-3" r="1.2" fill="white" />
          <circle cx="6.5" cy="-3" r="1.2" fill="white" />
          <path d="M -7 6 Q 0 13 7 6" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          <rect x="-13" y="20" width="26" height="38" rx="7" fill="#f59e0b" />
          {/* Arms raised up — happy! */}
          <line x1="-13" y1="28" x2="-30" y2="10" stroke="#f59e0b" strokeWidth="9" strokeLinecap="round" />
          <line x1="13" y1="28" x2="30" y2="10" stroke="#f59e0b" strokeWidth="9" strokeLinecap="round" />
          <rect x="-10" y="56" width="8" height="26" rx="4" fill="#0ea5e9" />
          <rect x="2" y="56" width="8" height="26" rx="4" fill="#0ea5e9" />
        </g>

        {/* Small second kid — bottom-right of family cluster */}
        <g transform="translate(1420, 210)">
          <circle cx="0" cy="0" r="13" fill="#fde7ca" />
          <path d="M -10 -6 Q 0 -18 10 -6" fill="#1e293b" />
          <circle cx="-4" cy="-1" r="2.5" fill="#1e293b" />
          <circle cx="4" cy="-1" r="2.5" fill="#1e293b" />
          <path d="M -5 5 Q 0 10 5 5" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="-10" y="16" width="20" height="28" rx="5" fill="#f43f5e" />
          <line x1="-10" y1="22" x2="-22" y2="10" stroke="#f43f5e" strokeWidth="7" strokeLinecap="round" />
          <line x1="10" y1="22" x2="22" y2="10" stroke="#f43f5e" strokeWidth="7" strokeLinecap="round" />
        </g>


        {/* ══════════════════════════════════════════
            SCORECARD CARD — bottom left
        ══════════════════════════════════════════ */}
        <g transform="translate(56, 548)" filter="url(#bg-drop)">
          <rect width="168" height="140" rx="16" fill="white" />
          <rect width="168" height="38" rx="16" fill="#10b981" />
          <rect x="0" y="22" width="168" height="16" fill="#10b981" />
          <text x="84" y="25" textAnchor="middle" fill="white" fontSize="13" fontWeight="800" fontFamily="'Inter Tight', sans-serif">SCORE BOARD</text>
          {/* Player 1 */}
          <text x="14" y="58" fill="#334155" fontSize="12" fontWeight="600" fontFamily="'Inter Tight', sans-serif">Dad</text>
          <text x="154" y="58" textAnchor="end" fill="#10b981" fontSize="13" fontWeight="800" fontFamily="'Inter Tight', sans-serif">120</text>
          <text x="46" y="58" fill="#f59e0b" fontSize="11" fontFamily="'Inter Tight', sans-serif">★★★</text>
          {/* Player 2 */}
          <text x="14" y="86" fill="#334155" fontSize="12" fontWeight="600" fontFamily="'Inter Tight', sans-serif">Mom</text>
          <text x="154" y="86" textAnchor="end" fill="#10b981" fontSize="13" fontWeight="800" fontFamily="'Inter Tight', sans-serif">95</text>
          <text x="46" y="86" fill="#f59e0b" fontSize="11" fontFamily="'Inter Tight', sans-serif">★★</text>
          {/* Player 3 */}
          <text x="14" y="114" fill="#334155" fontSize="12" fontWeight="600" fontFamily="'Inter Tight', sans-serif">Sam</text>
          <text x="154" y="114" textAnchor="end" fill="#10b981" fontSize="13" fontWeight="800" fontFamily="'Inter Tight', sans-serif">78</text>
          <text x="46" y="114" fill="#f59e0b" fontSize="11" fontFamily="'Inter Tight', sans-serif">★</text>
        </g>


        {/* ══════════════════════════════════════════
            SPEECH BUBBLES
        ══════════════════════════════════════════ */}

        {/* "HINT!" bubble — left side */}
        <g transform="translate(56, 246)">
          <rect x="0" y="0" width="104" height="46" rx="23" fill="#10b981" />
          <polygon points="28,46 18,64 52,46" fill="#10b981" />
          <text x="52" y="29" textAnchor="middle" fill="white" fontSize="17" fontWeight="800" fontFamily="'Inter Tight', sans-serif">HINT!</text>
        </g>

        {/* "PLAY!" bubble — right side */}
        <g transform="translate(1300, 430)">
          <rect x="0" y="0" width="114" height="46" rx="23" fill="#f59e0b" />
          <polygon points="86,46 96,64 62,46" fill="#f59e0b" />
          <text x="57" y="29" textAnchor="middle" fill="white" fontSize="17" fontWeight="800" fontFamily="'Inter Tight', sans-serif">PLAY!</text>
        </g>

        {/* "5 HINTS!" bubble — bottom right area */}
        <g transform="translate(1260, 740)">
          <rect x="0" y="0" width="140" height="46" rx="23" fill="#8b5cf6" />
          <polygon points="28,0 18,-18 52,0" fill="#8b5cf6" />
          <text x="70" y="29" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="'Inter Tight', sans-serif">5 HINTS!</text>
        </g>


        {/* ══════════════════════════════════════════
            LIGHTBULB ICON — right side
        ══════════════════════════════════════════ */}
        <g transform="translate(1406, 548)">
          <circle cx="0" cy="0" r="24" fill="#fbbf24" />
          <path d="M -9 14 L 9 14 L 9 20 Q 9 26 0 26 Q -9 26 -9 20 Z" fill="#f59e0b" />
          <path d="M -7 20 L 7 20" stroke="#f59e0b" strokeWidth="2.5" />
          <path d="M -6 23 L 6 23" stroke="#f59e0b" strokeWidth="2.5" />
          {/* Shine lines */}
          <line x1="0" y1="-30" x2="0" y2="-36" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
          <line x1="22" y1="-18" x2="27" y2="-23" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
          <line x1="-22" y1="-18" x2="-27" y2="-23" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
          <line x1="28" y1="0" x2="34" y2="0" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
          <line x1="-28" y1="0" x2="-34" y2="0" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
        </g>


        {/* ══════════════════════════════════════════
            SPARKLE STARS — scattered
        ══════════════════════════════════════════ */}

        {/* Top center-left */}
        <g transform="translate(396, 74)">
          <polygon points="0,-18 5,-7 17,-7 7,3 10,15 0,8 -10,15 -7,3 -17,-7 -5,-7" fill="#f59e0b" />
        </g>

        {/* Top right */}
        <g transform="translate(1210, 48)">
          <polygon points="0,-14 4,-5 13,-5 5,2 8,12 0,6 -8,12 -5,2 -13,-5 -4,-5" fill="#f43f5e" />
        </g>

        {/* Bottom right area */}
        <g transform="translate(1352, 772)">
          <polygon points="0,-20 5,-8 19,-8 8,3 11,17 0,9 -11,17 -8,3 -19,-8 -5,-8" fill="#10b981" />
        </g>

        {/* Left side small */}
        <g transform="translate(228, 46)">
          <polygon points="0,-11 3,-4 10,-4 4,2 6,9 0,5 -6,9 -4,2 -10,-4 -3,-4" fill="#f43f5e" />
        </g>
        <g transform="translate(258, 28)">
          <polygon points="0,-7 2,-2 7,-2 3,1 4,6 0,4 -4,6 -3,1 -7,-2 -2,-2" fill="#f43f5e" />
        </g>

        {/* Bottom center cluster */}
        <g transform="translate(702, 838)">
          <polygon points="0,-9 2,-3 8,-3 3,1 5,8 0,4 -5,8 -3,1 -8,-3 -2,-3" fill="#8b5cf6" />
        </g>
        <g transform="translate(726, 854)">
          <polygon points="0,-7 2,-2 7,-2 3,1 4,6 0,4 -4,6 -3,1 -7,-2 -2,-2" fill="#8b5cf6" />
        </g>

        {/* Top center */}
        <g transform="translate(548, 32)">
          <polygon points="0,-11 3,-4 11,-4 5,2 7,9 0,5 -7,9 -5,2 -11,-4 -3,-4" fill="#0ea5e9" />
        </g>

        {/* Bottom center-right */}
        <g transform="translate(950, 862)">
          <polygon points="0,-13 4,-5 12,-5 5,2 7,11 0,6 -7,11 -5,2 -12,-5 -4,-5" fill="#f59e0b" />
        </g>

        {/* Right edge mid cluster */}
        <g transform="translate(1436, 320)">
          <polygon points="0,-10 3,-3 10,-3 4,1 5,8 0,4 -5,8 -4,1 -10,-3 -3,-3" fill="#0ea5e9" />
        </g>


        {/* ══════════════════════════════════════════
            DOTTED ARC TRAILS — playful connectors
        ══════════════════════════════════════════ */}

        <path
          d="M 138 174 Q 280 88 402 120"
          fill="none" stroke="#94a3b8" strokeWidth="2.5"
          strokeDasharray="6 9" strokeLinecap="round" opacity="0.55"
        />
        <path
          d="M 88 460 Q 100 560 140 660"
          fill="none" stroke="#94a3b8" strokeWidth="2"
          strokeDasharray="5 8" strokeLinecap="round" opacity="0.4"
        />
        <path
          d="M 1236 292 Q 1310 360 1306 432"
          fill="none" stroke="#94a3b8" strokeWidth="2.5"
          strokeDasharray="6 9" strokeLinecap="round" opacity="0.55"
        />
        <path
          d="M 1380 684 Q 1410 730 1398 792"
          fill="none" stroke="#94a3b8" strokeWidth="2"
          strokeDasharray="5 8" strokeLinecap="round" opacity="0.4"
        />
        <path
          d="M 330 862 Q 500 880 676 882"
          fill="none" stroke="#94a3b8" strokeWidth="2"
          strokeDasharray="5 8" strokeLinecap="round" opacity="0.4"
        />


        {/* ══════════════════════════════════════════
            SMALL GAME TABLET DEVICE — lower right
        ══════════════════════════════════════════ */}
        <g transform="translate(1190, 620)" filter="url(#bg-drop)">
          {/* Device frame */}
          <rect width="90" height="140" rx="12" fill="#1e293b" />
          <rect x="4" y="14" width="82" height="112" rx="4" fill="#f8fafc" />
          {/* Mini hint bars */}
          {[
            '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#f43f5e'
          ].map((color, i) => (
            <rect key={i} x="8" y={18 + i * 22} width="74" height="16" rx="4" fill={color} opacity="0.8" />
          ))}
          {/* Home button */}
          <circle cx="45" cy="130" r="5" fill="#334155" />
        </g>

      </g>
    </svg>
  )
}
