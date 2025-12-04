import PropTypes from 'prop-types'

/**
 * FilterChips Component
 * Displays active filters as removable chips/badges
 */
function FilterChips({ filters, onRemoveFilter, onClearAll }) {
  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'statuses' && Array.isArray(value)) return value.length > 0
    if (key === 'dateFrom' || key === 'dateTo') return value !== null && value !== ''
    if (key === 'assetCountMin' || key === 'assetCountMax') return value !== null && value !== ''
    if (key === 'department') return value !== null && value !== ''
    if (key === 'reminderStatus') return value !== null && value !== ''
    return false
  }).length

  if (activeFilterCount === 0) return null

  const formatFilterLabel = (key, value) => {
    switch (key) {
      case 'statuses':
        return value.map(status => {
          const labels = {
            signed: 'Signed',
            unsigned: 'Unsigned',
            disputed: 'Disputed',
            expiring: 'Expiring Soon',
            expired: 'Expired',
            backup: 'Backup Signer'
          }
          return labels[status] || status
        }).join(', ')
      case 'dateFrom':
        return `From: ${new Date(value).toLocaleDateString()}`
      case 'dateTo':
        return `To: ${new Date(value).toLocaleDateString()}`
      case 'assetCountMin':
        return `Min Assets: ${value}`
      case 'assetCountMax':
        return `Max Assets: ${value}`
      case 'department':
        return `Dept: ${value}`
      case 'reminderStatus':
        const reminderLabels = {
          none: 'No Reminders',
          few: '1-2 Reminders',
          many: '3-4 Reminders',
          max: 'Max Reminders'
        }
        return reminderLabels[value] || value
      default:
        return value
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-text-secondary">
          Active Filters ({activeFilterCount}):
        </span>

        {Object.entries(filters).map(([key, value]) => {
          // Skip empty filters
          if (key === 'statuses' && (!Array.isArray(value) || value.length === 0)) return null
          if ((key === 'dateFrom' || key === 'dateTo' || key === 'assetCountMin' || key === 'assetCountMax' || key === 'department' || key === 'reminderStatus') && (value === null || value === '')) return null

          return (
            <div
              key={key}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: 'var(--theme-primary-light)',
                color: 'var(--theme-primary)',
                border: '1px solid var(--theme-primary)'
              }}
            >
              <span>{formatFilterLabel(key, value)}</span>
              <button
                onClick={() => onRemoveFilter(key)}
                className="hover:opacity-70 transition-opacity"
                title={`Remove ${key} filter`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )
        })}

        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors"
        >
          <i className="fas fa-times-circle"></i>
          <span>Clear All</span>
        </button>
      </div>
    </div>
  )
}

FilterChips.propTypes = {
  filters: PropTypes.object.isRequired,
  onRemoveFilter: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired
}

export default FilterChips
