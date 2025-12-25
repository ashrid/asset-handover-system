/**
 * StatCard - Reusable statistics card component
 * Displays a metric with optional icon, label, progress bar, and click action
 */
function StatCard({ icon, label, value, subValue, colorClass, onClick, urgent }) {
  return (
    <div
      className={`premium-card stat-card p-3 cursor-pointer transition-all ${onClick ? 'hover:border-primary' : ''} ${urgent ? 'border-danger' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="stat-label text-xs text-text-secondary uppercase tracking-wide">{label}</span>
      </div>
      <div className={`stat-value text-2xl font-bold ${colorClass || 'text-text-primary'}`}>
        {value}
      </div>
      {subValue && (
        <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(subValue.percent, 100)}%`,
              backgroundColor: subValue.color || 'var(--theme-primary)'
            }}
          />
        </div>
      )}
    </div>
  )
}

export default StatCard
