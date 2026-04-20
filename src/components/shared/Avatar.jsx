export default function Avatar({ nickname = '' }) {
  const initials = nickname.slice(0, 2).toUpperCase() || '?'
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white cursor-pointer flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
    >
      {initials}
    </div>
  )
}
