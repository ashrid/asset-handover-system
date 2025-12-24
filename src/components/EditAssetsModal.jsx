import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function EditAssetsModal({ assignment, onClose, onSuccess }) {
  const [allAssets, setAllAssets] = useState([])
  const [selectedAssetIds, setSelectedAssetIds] = useState([])
  const [sendNotification, setSendNotification] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { authFetch } = useAuth()

  useEffect(() => {
    fetchAssets()
    // Pre-select currently assigned assets
    if (assignment.assets) {
      setSelectedAssetIds(assignment.assets.map(a => a.id))
    }
  }, [assignment])

  const fetchAssets = async () => {
    try {
      const response = await authFetch('/api/assets')
      if (!response.ok) {
        throw new Error('Failed to fetch assets')
      }
      const data = await response.json()
      setAllAssets(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch assets:', error)
      setAllAssets([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAsset = (assetId) => {
    setSelectedAssetIds(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    )
  }

  const handleSave = async () => {
    if (selectedAssetIds.length === 0) {
      alert('Please select at least one asset')
      return
    }

    setSaving(true)
    try {
      const response = await authFetch(`/api/handover/assignments/${assignment.id}/assets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_ids: selectedAssetIds,
          send_notification: sendNotification
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update assets')
      }

      const result = await response.json()
      onSuccess(result.message)
      onClose()
    } catch (error) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const getFilteredAssets = () => {
    if (!searchQuery.trim()) {
      return allAssets
    }

    const query = searchQuery.toLowerCase().trim()
    return allAssets.filter(asset =>
      asset.asset_code?.toLowerCase().includes(query) ||
      asset.asset_type?.toLowerCase().includes(query) ||
      asset.description?.toLowerCase().includes(query) ||
      asset.model?.toLowerCase().includes(query)
    )
  }

  const selectedAssets = allAssets.filter(a => selectedAssetIds.includes(a.id))
  const availableAssets = getFilteredAssets().filter(a => !selectedAssetIds.includes(a.id))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border">
          <h3 className="text-xl font-bold gradient-text">
            Edit Assets - {assignment.employee_name}
          </h3>
          <button
            className="text-3xl font-bold leading-none opacity-50 hover:opacity-100 transition-opacity text-text-primary"
            onClick={onClose}
            aria-label="close"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="spinner-premium"></div>
              <p className="mt-4 text-text-secondary">Loading assets...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Currently Selected Assets */}
              <div>
                <div className="section-divider">
                  <h4 className="text-lg font-bold gradient-text">
                    Selected Assets ({selectedAssets.length})
                  </h4>
                </div>
                {selectedAssets.length === 0 ? (
                  <div className="notification-premium notification-info">
                    <i className="fas fa-info-circle text-xl"></i>
                    <span>No assets selected. Select assets from the available list below.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedAssets.map(asset => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: 'var(--theme-primary-light)' }}
                      >
                        <div className="flex-1">
                          <strong className="text-text-primary">{asset.asset_code}</strong>
                          <span className="text-text-secondary ml-2">- {asset.asset_type}</span>
                          {asset.description && (
                            <span className="text-text-light ml-2 text-sm">({asset.description})</span>
                          )}
                        </div>
                        <button
                          className="btn-secondary text-sm py-1 px-3"
                          onClick={() => handleToggleAsset(asset.id)}
                          title="Remove asset"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Assets */}
              <div>
                <div className="section-divider">
                  <h4 className="text-lg font-bold gradient-text">
                    Available Assets
                  </h4>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by asset code, type, description, or model..."
                      className="input-premium pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light"></i>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light hover:text-text-primary transition-colors"
                        title="Clear search"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>

                {availableAssets.length === 0 ? (
                  <div className="notification-premium notification-info">
                    <i className="fas fa-info-circle text-xl"></i>
                    <span>
                      {searchQuery ? 'No assets match your search.' : 'All assets have been selected.'}
                    </span>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
                    {availableAssets.map(asset => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
                        onClick={() => handleToggleAsset(asset.id)}
                      >
                        <div className="flex-1">
                          <strong className="text-text-primary">{asset.asset_code}</strong>
                          <span className="text-text-secondary ml-2">- {asset.asset_type}</span>
                          {asset.description && (
                            <span className="text-text-light ml-2 text-sm">({asset.description})</span>
                          )}
                        </div>
                        <button
                          className="btn-premium text-sm py-1 px-3"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleAsset(asset.id)
                          }}
                          title="Add asset"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Notification Checkbox */}
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'var(--theme-primary-light)' }}>
                <input
                  type="checkbox"
                  id="send-notification"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />
                <label htmlFor="send-notification" className="text-text-primary font-medium cursor-pointer">
                  Send updated email notification to employee
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end items-center gap-3 p-6 border-t border">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn-premium inline-flex items-center gap-2"
            onClick={handleSave}
            disabled={saving || selectedAssetIds.length === 0}
          >
            {saving ? (
              <>
                <div className="spinner-small"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditAssetsModal
