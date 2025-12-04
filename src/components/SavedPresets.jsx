import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * SavedPresets Component
 * Manages saved filter presets with localStorage persistence
 */
function SavedPresets({ currentFilters, onApplyPreset }) {
  const [presets, setPresets] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showManageDialog, setShowManageDialog] = useState(false)

  // Default presets (read-only)
  const defaultPresets = [
    {
      id: 'needs-attention',
      name: 'Needs Attention',
      filters: {
        statuses: ['unsigned'],
        dateFrom: null,
        dateTo: null,
        assetCountMin: null,
        assetCountMax: null,
        department: null,
        reminderStatus: null
      },
      isDefault: true
    },
    {
      id: 'recently-signed',
      name: 'Recently Signed',
      filters: {
        statuses: ['signed'],
        dateFrom: (() => {
          const date = new Date()
          date.setDate(date.getDate() - 7)
          return date
        })(),
        dateTo: new Date(),
        assetCountMin: null,
        assetCountMax: null,
        department: null,
        reminderStatus: null
      },
      isDefault: true
    },
    {
      id: 'overdue',
      name: 'Overdue',
      filters: {
        statuses: ['unsigned', 'expired'],
        dateFrom: null,
        dateTo: null,
        assetCountMin: null,
        assetCountMax: null,
        department: null,
        reminderStatus: null
      },
      isDefault: true
    },
    {
      id: 'disputed',
      name: 'Disputed Items',
      filters: {
        statuses: ['disputed'],
        dateFrom: null,
        dateTo: null,
        assetCountMin: null,
        assetCountMax: null,
        department: null,
        reminderStatus: null
      },
      isDefault: true
    }
  ]

  // Load custom presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('assignmentFilterPresets')
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets)
        setPresets(parsed)
      } catch (error) {
        console.error('Failed to load presets:', error)
      }
    }
  }, [])

  // Save custom presets to localStorage whenever they change
  useEffect(() => {
    if (presets.length > 0) {
      localStorage.setItem('assignmentFilterPresets', JSON.stringify(presets))
    }
  }, [presets])

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a name for the preset')
      return
    }

    const newPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...currentFilters },
      isDefault: false
    }

    setPresets([...presets, newPreset])
    setPresetName('')
    setShowSaveDialog(false)
    setIsOpen(false)
  }

  const handleDeletePreset = (presetId) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      setPresets(presets.filter(p => p.id !== presetId))
    }
  }

  const handleApplyPreset = (preset) => {
    onApplyPreset(preset.filters)
    setIsOpen(false)
    setShowManageDialog(false)
  }

  const allPresets = [...defaultPresets, ...presets]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <i className="fas fa-bookmark"></i>
        <span>Presets</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 left-0 mt-2 w-64 bg-card-bg border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-semibold text-text-primary">Saved Presets</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSaveDialog(true)
                    setIsOpen(false)
                  }}
                  className="text-theme-primary hover:underline text-sm"
                  title="Save current filters"
                >
                  <i className="fas fa-save"></i>
                </button>
                <button
                  onClick={() => {
                    setShowManageDialog(true)
                    setIsOpen(false)
                  }}
                  className="text-text-light hover:text-text-primary text-sm"
                  title="Manage presets"
                >
                  <i className="fas fa-cog"></i>
                </button>
              </div>
            </div>

            {/* Preset List */}
            {allPresets.length === 0 ? (
              <div className="p-4 text-center text-text-light text-sm">
                No saved presets
              </div>
            ) : (
              <div>
                {allPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="w-full text-left px-4 py-3 hover:bg-hover-bg transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      {preset.isDefault && (
                        <i className="fas fa-star text-warning text-sm"></i>
                      )}
                      <span className="text-text-secondary">{preset.name}</span>
                    </div>
                    <i className="fas fa-chevron-right text-text-light opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div
            className="modal-content w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold gradient-text">Save Filter Preset</h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-3xl font-bold leading-none opacity-50 hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Preset Name
              </label>
              <input
                type="text"
                className="input-premium w-full"
                placeholder="e.g., My Custom Filter"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSavePreset()
                }}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                className="btn-premium"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Dialog */}
      {showManageDialog && (
        <div className="modal-overlay" onClick={() => setShowManageDialog(false)}>
          <div
            className="modal-content w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold gradient-text">Manage Presets</h3>
              <button
                onClick={() => setShowManageDialog(false)}
                className="text-3xl font-bold leading-none opacity-50 hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {allPresets.length === 0 ? (
                <div className="text-center text-text-light py-8">
                  No saved presets
                </div>
              ) : (
                <div className="space-y-2">
                  {allPresets.map(preset => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-4 bg-hover-bg rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {preset.isDefault && (
                          <i className="fas fa-star text-warning"></i>
                        )}
                        <div>
                          <div className="font-medium text-text-primary">
                            {preset.name}
                          </div>
                          <div className="text-xs text-text-light">
                            {preset.isDefault ? 'Default Preset' : 'Custom Preset'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApplyPreset(preset)}
                          className="btn-secondary text-sm py-1 px-3"
                        >
                          <i className="fas fa-check"></i> Apply
                        </button>
                        {!preset.isDefault && (
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="text-danger hover:bg-danger/10 py-1 px-3 rounded"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-border">
              <button
                onClick={() => setShowManageDialog(false)}
                className="btn-premium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

SavedPresets.propTypes = {
  currentFilters: PropTypes.object.isRequired,
  onApplyPreset: PropTypes.func.isRequired
}

export default SavedPresets
