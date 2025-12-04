import { useState } from 'react'
import PropTypes from 'prop-types'

/**
 * StatusFilter Component
 * Multi-select dropdown for filtering assignments by status
 */
function StatusFilter({ selectedStatuses, onChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const statusOptions = [
    { value: 'signed', label: 'Signed', icon: 'fa-check-circle', color: '#10b981' },
    { value: 'unsigned', label: 'Unsigned', icon: 'fa-clock', color: '#f59e0b' },
    { value: 'disputed', label: 'Disputed', icon: 'fa-exclamation-triangle', color: '#ef4444' },
    { value: 'expiring', label: 'Expiring Soon (≤7 days)', icon: 'fa-hourglass-half', color: '#f97316' },
    { value: 'expired', label: 'Expired', icon: 'fa-times-circle', color: '#dc2626' },
    { value: 'backup', label: 'Backup Signer', icon: 'fa-user-tie', color: '#8b5cf6' }
  ]

  const handleToggleStatus = (statusValue) => {
    if (selectedStatuses.includes(statusValue)) {
      onChange(selectedStatuses.filter(s => s !== statusValue))
    } else {
      onChange([...selectedStatuses, statusValue])
    }
  }

  const handleSelectAll = () => {
    onChange(statusOptions.map(opt => opt.value))
  }

  const handleDeselectAll = () => {
    onChange([])
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-premium flex items-center justify-between w-full"
      >
        <span className="text-text-secondary">
          {selectedStatuses.length === 0
            ? 'Select Status...'
            : `${selectedStatuses.length} status${selectedStatuses.length > 1 ? 'es' : ''} selected`}
        </span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-text-light`}></i>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-2 bg-card-bg border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto custom-scrollbar">
            {/* Select All / Deselect All */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-theme-primary hover:underline"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-sm text-danger hover:underline"
              >
                Deselect All
              </button>
            </div>

            {/* Status Options */}
            {statusOptions.map(option => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 hover:bg-hover-bg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(option.value)}
                  onChange={() => handleToggleStatus(option.value)}
                  className="w-4 h-4 rounded border-border"
                  style={{ accentColor: 'var(--theme-primary)' }}
                />
                <i
                  className={`fas ${option.icon}`}
                  style={{ color: option.color }}
                ></i>
                <span className="flex-1 text-text-secondary">{option.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

StatusFilter.propTypes = {
  selectedStatuses: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired
}

export default StatusFilter
