import { useState } from 'react'

const NICKNAME_KEY = 'five-hints.nickname'

// ── Background floating letter tiles ───────────────────────
const BG_TILES = [
  { l: 'H', c: '#10b981', b: '#d1fae5', x: '6%',  y: '11%', r: -12, d: '0s',   t: '6s'   },
  { l: 'I', c: '#7c3aed', b: '#ede9fe', x: '83%', y: '8%',  r:  9,  d: '1.3s', t: '7.5s' },
  { l: 'N', c: '#f59e0b', b: '#fef3c7', x: '2%',  y: '43%', r: -7,  d: '0.7s', t: '6.8s' },
  { l: 'T', c: '#f43f5e', b: '#ffe4e6', x: '89%', y: '36%', r: 14,  d: '2.1s', t: '8.2s' },
  { l: 'S', c: '#10b981', b: '#d1fae5', x: '14%', y: '77%', r: -19, d: '1.9s', t: '5.8s' },
  { l: 'W', c: '#7c3aed', b: '#ede9fe', x: '76%', y: '71%', r: 11,  d: '0.4s', t: '7.2s' },
  { l: '5', c: '#f43f5e', b: '#ffe4e6', x: '47%', y: '4%',  r: -8,  d: '2.6s', t: '9.1s' },
  { l: 'A', c: '#f59e0b', b: '#fef3c7', x: '91%', y: '59%', r: 17,  d: '0.9s', t: '6.5s' },
  { l: 'M', c: '#10b981', b: '#d1fae5', x: '56%', y: '85%', r: -14, d: '3.3s', t: '7s'   },
  { l: 'E', c: '#7c3aed', b: '#ede9fe', x: '24%', y: '89%', r:  6,  d: '1.6s', t: '8.8s' },
]

const FEATURES = [
  { text: '5 hints per word',    c: '#059669', b: '#d1fae5' },
  { text: 'Solo & Group play',   c: '#6d28d9', b: '#ede9fe' },
  { text: 'Create your own',     c: '#b45309', b: '#fef3c7' },
]

// ── SVG illustration sub-components ────────────────────────

function HintBar({ x, y, w = 116, state }) {
  const cfg = {
    wrong:  { bg: '#fff5f5', bd: '#fecaca', ac: '#f87171', dot: '#fecaca', bw: 52 },
    active: { bg: '#f0fdf9', bd: '#6ee7b7', ac: '#10b981', dot: '#d1fae5', bw: 74 },
    locked: { bg: '#f8fafc', bd: '#f1f5f9', ac: '#e2e8f0', dot: '#f1f5f9', bw: 36 },
  }[state] ?? { bg: '#fff', bd: '#e2e8f0', ac: '#94a3b8', dot: '#e2e8f0', bw: 52 }
  const h = state === 'active' ? 24 : 20
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={cfg.bg} stroke={cfg.bd} strokeWidth="1" />
      <rect x={x} y={y} width="3.5" height={h} rx="2" fill={cfg.ac} />
      <circle cx={x + 13} cy={y + h / 2} r="5" fill={cfg.dot} />
      <rect x={x + 24} y={y + h / 2 - 2.5} width={cfg.bw} height="5" rx="2.5" fill={cfg.ac} opacity="0.5" />
    </g>
  )
}

function Star4({ x, y, size = 10, color = '#fbbf24', opacity = 0.8 }) {
  const r1 = size, r2 = size * 0.42
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 - Math.PI / 2
    const r = i % 2 === 0 ? r1 : r2
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`
  }).join(' ')
  return <polygon points={pts} fill={color} opacity={opacity} />
}

// A simplified family figure. y = top of head.
function Person({ x, y, bodyColor, hair = false, scale = 1 }) {
  const hr = 22 * scale
  const hcy = y + hr        // head center y
  const bt = hcy + hr + 4 * scale  // body top
  const bw = 38 * scale
  const bh = 46 * scale

  return (
    <g>
      {/* Body */}
      <rect x={x - bw / 2} y={bt} width={bw} height={bh} rx={12 * scale} fill={bodyColor} />
      {/* Head */}
      <circle cx={x} cy={hcy} r={hr} fill="#fbbf24" />
      {/* Hair (mom) */}
      {hair && (
        <ellipse cx={x} cy={hcy - hr * 0.52} rx={hr * 0.88} ry={hr * 0.36} fill="#92400e" />
      )}
      {/* Eyes */}
      <circle cx={x - 7 * scale} cy={hcy - 2 * scale} r={2.5 * scale} fill="#1e293b" />
      <circle cx={x + 7 * scale} cy={hcy - 2 * scale} r={2.5 * scale} fill="#1e293b" />
      {/* Smile */}
      <path
        d={`M ${x - 7 * scale} ${hcy + 7 * scale} Q ${x} ${hcy + 13 * scale} ${x + 7 * scale} ${hcy + 7 * scale}`}
        stroke="#b45309" strokeWidth={1.8 * scale} fill="none" strokeLinecap="round"
      />
    </g>
  )
}

// ── Main SVG illustration ───────────────────────────────────

function GameIllustration() {
  return (
    <div className="w-full bob-gentle select-none" aria-hidden="true">
      <svg
        viewBox="0 0 500 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          <filter id="lp-sf" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.09" floodColor="#0f172a" />
          </filter>
          <linearGradient id="grad-dad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="grad-mom" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="grad-kid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* ── Soft background blobs ── */}
        <circle cx="68"  cy="55"  r="54" fill="#d1fae5" opacity="0.5" />
        <circle cx="432" cy="44"  r="46" fill="#ede9fe" opacity="0.5" />
        <circle cx="250" cy="282" r="54" fill="#fef3c7" opacity="0.45" />

        {/* ── Sparkle stars ── */}
        <Star4 x={145} y={50}  size={10} color="#fbbf24" />
        <Star4 x={355} y={45}  size={8}  color="#10b981" />
        <Star4 x={472} y={140} size={12} color="#7c3aed" />
        <Star4 x={28}  y={200} size={9}  color="#f43f5e" />
        <Star4 x={130} y={240} size={7}  color="#f59e0b" opacity={0.6} />
        <Star4 x={375} y={238} size={7}  color="#10b981" opacity={0.6} />

        {/* ── Scene letter tiles ── */}
        {/* H - left */}
        <g transform="translate(26,106) rotate(-14)">
          <rect width="32" height="32" rx="7" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1.5" />
          <text x="16" y="22" textAnchor="middle" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="900" fontSize="16" fill="#10b981">H</text>
        </g>
        {/* T - right */}
        <g transform="translate(442,96) rotate(13)">
          <rect width="30" height="30" rx="7" fill="#ffe4e6" stroke="#fca5a5" strokeWidth="1.5" />
          <text x="15" y="21" textAnchor="middle" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="900" fontSize="15" fill="#f43f5e">T</text>
        </g>
        {/* W - lower left */}
        <g transform="translate(40,216) rotate(-10)">
          <rect width="30" height="30" rx="7" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="1.5" />
          <text x="15" y="21" textAnchor="middle" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="900" fontSize="15" fill="#7c3aed">W</text>
        </g>
        {/* S - lower right */}
        <g transform="translate(430,213) rotate(16)">
          <rect width="30" height="30" rx="7" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.5" />
          <text x="15" y="21" textAnchor="middle" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="900" fontSize="15" fill="#f59e0b">S</text>
        </g>

        {/* ── Dad figure (left) ── */}
        <Person x={86} y={100} bodyColor="url(#grad-dad)" />
        {/* Dad right arm reaching toward tablet */}
        <path d="M 105,166 Q 143,158 174,168" stroke="url(#grad-dad)" strokeWidth="12" strokeLinecap="round" />

        {/* ── Mom figure (right) ── */}
        <Person x={414} y={100} bodyColor="url(#grad-mom)" hair />
        {/* Mom left arm reaching toward tablet */}
        <path d="M 395,166 Q 358,158 326,168" stroke="url(#grad-mom)" strokeWidth="12" strokeLinecap="round" />

        {/* ── Kid figure (smaller, bottom center) ── */}
        <Person x={250} y={218} bodyColor="url(#grad-kid)" scale={0.72} />
        {/* Kid both arms raised */}
        <path d="M 234,258 Q 217,244 212,228" stroke="url(#grad-kid)" strokeWidth="9" strokeLinecap="round" />
        <path d="M 266,258 Q 283,244 288,228" stroke="url(#grad-kid)" strokeWidth="9" strokeLinecap="round" />

        {/* ── Central tablet device ── */}
        <g filter="url(#lp-sf)">
          {/* Frame */}
          <rect x="180" y="55" width="140" height="178" rx="18" fill="#1e293b" />
          {/* Screen */}
          <rect x="188" y="65" width="124" height="152" rx="12" fill="#f8fafc" />
          {/* Camera pill */}
          <rect x="240" y="61" width="20" height="5" rx="2.5" fill="#334155" />
          {/* Home indicator */}
          <rect x="228" y="228" width="44" height="3" rx="1.5" fill="#475569" />
        </g>

        {/* Hint bars inside screen */}
        <HintBar x={192} y={72}  state="wrong"  />
        <HintBar x={192} y={96}  state="wrong"  />
        <HintBar x={192} y={121} state="active" />
        <HintBar x={192} y={150} state="locked" />
        <HintBar x={192} y={174} state="locked" />

        {/* Input row at bottom of screen */}
        <rect x="192" y="197" width="116" height="22" rx="7" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        {/* Guess button */}
        <rect x="277" y="197" width="31" height="22" rx="7" fill="#10b981" />
        <path d="M 286,208 L 295,208 M 291,204 L 296,208 L 291,212"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* ── Scorecard (top area) ── */}
        <g filter="url(#lp-sf)" transform="translate(8,5)">
          {/* Card base */}
          <rect width="162" height="90" rx="14" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
          {/* Header */}
          <rect width="162" height="29" rx="14" fill="#10b981" />
          <rect y="15" width="162" height="14" fill="#10b981" />
          <text x="12" y="20" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="800" fontSize="10.5" fill="white" letterSpacing="0.4">SCOREBOARD</text>
          {/* Live badge */}
          <rect x="110" y="8" width="40" height="13" rx="6.5" fill="rgba(255,255,255,0.22)" />
          <text x="130" y="18" textAnchor="middle" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="700" fontSize="8.5" fill="white">LIVE</text>

          {/* Dad row */}
          <circle cx="19" cy="46" r="8.5" fill="#d1fae5" />
          <text x="19" y="50" textAnchor="middle" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="800" fontSize="8" fill="#059669">D</text>
          <text x="33" y="50" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="600" fontSize="10" fill="#334155">Dad</text>
          <text x="90" y="50" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="800" fontSize="12" fill="#10b981">120</text>
          <text x="118" y="49" fontSize="9" fill="#fbbf24">★★★</text>

          {/* Mom row */}
          <circle cx="19" cy="65" r="8.5" fill="#ede9fe" />
          <text x="19" y="69" textAnchor="middle" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="800" fontSize="8" fill="#6d28d9">M</text>
          <text x="33" y="69" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="600" fontSize="10" fill="#334155">Mom</text>
          <text x="90" y="69" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="800" fontSize="12" fill="#7c3aed">95</text>
          <text x="118" y="68" fontSize="9" fill="#fbbf24">★★</text>
          <text x="131" y="68" fontSize="9" fill="#e2e8f0">★</text>

          {/* Sam row */}
          <circle cx="19" cy="82" r="8.5" fill="#fef3c7" />
          <text x="19" y="86" textAnchor="middle" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="800" fontSize="8" fill="#b45309">S</text>
          <text x="33" y="86" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="600" fontSize="10" fill="#334155">Sam</text>
          <text x="90" y="86" fontFamily="Inter Tight,Inter,sans-serif" fontWeight="800" fontSize="12" fill="#f59e0b">78</text>
          <text x="118" y="85" fontSize="9" fill="#fbbf24">★</text>
          <text x="131" y="85" fontSize="9" fill="#e2e8f0">★★</text>
        </g>
      </svg>
    </div>
  )
}

// ── Landing page ────────────────────────────────────────────

export default function LandingPage({ onStart }) {
  const [value, setValue] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    localStorage.setItem(NICKNAME_KEY, trimmed)
    onStart(trimmed)
  }

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(145deg, #ecfdf5 0%, #f8fafc 48%, #f5f3ff 100%)' }}
    >
      {/* ── Floating background tiles ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {BG_TILES.map((tile) => (
          <div
            key={tile.l}
            style={{ position: 'absolute', left: tile.x, top: tile.y, transform: `rotate(${tile.r}deg)` }}
          >
            <div
              className="tile-float w-10 h-10 rounded-[10px] flex items-center justify-center text-base font-black shadow-sm border"
              style={{
                backgroundColor: tile.b,
                color: tile.c,
                borderColor: `${tile.c}38`,
                '--tile-dur': tile.t,
                '--tile-delay': tile.d,
              }}
            >
              {tile.l}
            </div>
          </div>
        ))}
      </div>

      {/* ── Page content ── */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 px-5 py-10 lg:py-16 max-w-6xl mx-auto w-full">

        {/* ── Left column: brand + illustration ── */}
        <div className="flex flex-col items-center lg:items-start gap-5 flex-1 max-w-[530px] w-full">

          {/* Logo */}
          <div className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
            five<span className="text-emerald-500">.</span>hints
          </div>

          {/* Tagline */}
          <p className="text-lg lg:text-xl font-semibold text-slate-600 text-center lg:text-left leading-relaxed max-w-sm">
            The family word game. Unlock the answer with 5 clever clues — solo or with the whole crew.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {FEATURES.map(({ text, c, b }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ color: c, backgroundColor: b }}
              >
                <svg className="w-2 h-2 flex-shrink-0" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
                  <circle cx="4" cy="4" r="4" />
                </svg>
                {text}
              </span>
            ))}
          </div>

          {/* Illustration */}
          <GameIllustration />
        </div>

        {/* ── Right column: form card ── */}
        <div className="w-full max-w-sm flex-shrink-0">
          <div
            className="rounded-[24px] p-8 border border-white/80"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 20px 60px rgba(15,23,42,0.10), 0 4px 16px rgba(15,23,42,0.06)',
            }}
          >
            <h1 className="text-2xl font-black text-slate-900 mb-1">Let's play!</h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Pick a nickname to get started. We'll remember it next time.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="lp-nickname" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nickname
                </label>
                <input
                  id="lp-nickname"
                  autoFocus
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Your player name"
                  className="w-full border border-slate-200 rounded-[12px] px-4 py-3 text-base font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300/40 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 rounded-[12px] text-base transition-colors"
              >
                Start Playing <span aria-hidden="true">→</span>
              </button>
            </form>

            <p className="mt-5 text-xs text-slate-400 text-center leading-relaxed">
              Stored locally. No account or sign-up needed.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
