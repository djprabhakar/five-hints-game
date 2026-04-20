export default function Breadcrumb({ crumbs = [] }) {
  return (
    <nav className="flex items-center gap-1 overflow-hidden flex-1">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-300 text-sm">›</span>}
          {crumb.onClick ? (
            <button
              onClick={crumb.onClick}
              className="text-sm font-semibold text-slate-400 hover:text-slate-900 hover:bg-slate-100 px-1.5 py-1 rounded-md transition-colors whitespace-nowrap"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="text-sm font-semibold text-emerald-600 px-1.5 py-1 whitespace-nowrap">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
