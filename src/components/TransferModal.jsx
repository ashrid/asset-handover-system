import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function TransferModal({ assignment, onClose, onSuccess }) {
  const { authFetch } = useAuth()
  const [selectedAssetIds, setSelectedAssetIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [notifyOriginal, setNotifyOriginal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    new_employee_name: '',
    new_employee_id: '',
    new_email: '',
    new_office_college: '',
    new_backup_email: '',
    transfer_reason: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Pre-select all assets from the assignment
    if (assignment.assets) {
      setSelectedAssetIds(assignment.assets.map(a => a.id))
    }
  }, [assignment])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleToggleAsset = (assetId) => {
    setSelectedAssetIds(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    )
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.new_employee_name.trim()) {
      newErrors.new_employee_name = 'Employee name is required'
    }

    if (!formData.new_employee_id.trim()) {
      newErrors.new_employee_id = 'Employee ID is required'
    }

    if (!formData.new_email.trim()) {
      newErrors.new_email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.new_email)) {
      newErrors.new_email = 'Invalid email format'
    } else if (formData.new_email.toLowerCase() === assignment.email.toLowerCase()) {
      newErrors.new_email = 'New email must be different from original employee'
    }

    if (formData.new_backup_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.new_backup_email)) {
      newErrors.new_backup_email = 'Invalid email format'
    }

    if (!formData.transfer_reason.trim()) {
      newErrors.transfer_reason = 'Transfer reason is required'
    } else if (formData.transfer_reason.trim().length < 5) {
      newErrors.transfer_reason = 'Reason must be at least 5 characters'
    }

    if (selectedAssetIds.length === 0) {
      newErrors.assets = 'Select at least one asset to transfer'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTransfer = async () => {
    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      const response = await authFetch(`/api/handover/transfer/${assignment.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_employee_name: formData.new_employee_name.trim(),
          new_employee_id: formData.new_employee_id.trim(),
          new_email: formData.new_email.trim(),
          new_office_college: formData.new_office_college.trim() || undefined,
          new_backup_email: formData.new_backup_email.trim() || undefined,
          asset_ids: selectedAssetIds,
          transfer_reason: formData.transfer_reason.trim(),
          notify_original_employee: notifyOriginal
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to transfer assets')
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
    if (!assignment.assets) return []
    if (!searchQuery.trim()) return assignment.assets

    const query = searchQuery.toLowerCase().trim()
    return assignment.assets.filter(asset =>
      asset.asset_code?.toLowerCase().includes(query) ||
      asset.asset_type?.toLowerCase().includes(query) ||
      asset.description?.toLowerCase().includes(query) ||
      asset.model?.toLowerCase().includes(query)
    )
  }

  const filteredAssets = getFilteredAssets()
  const selectedAssets = assignment.assets?.filter(a => selectedAssetIds.includes(a.id)) || []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border">
          <h3 className="text-xl font-bold gradient-text">
            Transfer Assets
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
          <div className="space-y-6">
            {/* Source Employee Info (Read-only) */}
            <div>
              <div className="section-divider">
                <h4 className="text-lg font-bold gradient-text">
                  Transfer From (Original Assignment)
                </h4>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-light">Employee Name:</span>
                    <p className="font-medium text-text-primary">{assignment.employee_name}</p>
                  </div>
                  <div>
                    <span className="text-text-light">Employee ID:</span>
                    <p className="font-medium text-text-primary">{assignment.employee_id || assignment.employee_id_number || '-'}</p>
                  </div>
                  <div>
                    <span className="text-text-light">Email:</span>
                    <p className="font-medium text-text-primary">{assignment.email}</p>
                  </div>
                  <div>
                    <span className="text-text-light">Office/College:</span>
                    <p className="font-medium text-text-primary">{assignment.office_college || '-'}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--theme-success-light)', color: 'var(--theme-success)' }}>
                    <i className="fas fa-check-circle"></i>
                    Signed Assignment #{assignment.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Select Assets to Transfer */}
            <div>
              <div className="section-divider">
                <h4 className="text-lg font-bold gradient-text">
                  Assets to Transfer ({selectedAssetIds.length} of {assignment.assets?.length || 0} selected)
                </h4>
              </div>

              {errors.assets && (
                <div className="notification-premium notification-error mb-4">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{errors.assets}</span>
                </div>
              )}

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search assets..."
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
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Assets List */}
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                {filteredAssets.map(asset => (
                  <div
                    key={asset.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedAssetIds.includes(asset.id)
                        ? 'border-primary bg-primary-light'
                        : 'border-border hover:border-primary'
                    }`}
                    onClick={() => handleToggleAsset(asset.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onChange={() => handleToggleAsset(asset.id)}
                      className="w-5 h-5 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <strong className="text-text-primary">{asset.asset_code}</strong>
                      <span className="text-text-secondary ml-2">- {asset.asset_type}</span>
                      {asset.description && (
                        <span className="text-text-light ml-2 text-sm">({asset.description})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Select All / Deselect All */}
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setSelectedAssetIds(assignment.assets?.map(a => a.id) || [])}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="text-sm text-text-secondary hover:underline"
                  onClick={() => setSelectedAssetIds([])}
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* New Employee Information */}
            <div>
              <div className="section-divider">
                <h4 className="text-lg font-bold gradient-text">
                  Transfer To (New Employee)
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label-premium">
                    Employee Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="new_employee_name"
                    className={`input-premium ${errors.new_employee_name ? 'border-red-500' : ''}`}
                    value={formData.new_employee_name}
                    onChange={handleInputChange}
                    placeholder="Enter employee name"
                  />
                  {errors.new_employee_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.new_employee_name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="label-premium">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="new_employee_id"
                    className={`input-premium ${errors.new_employee_id ? 'border-red-500' : ''}`}
                    value={formData.new_employee_id}
                    onChange={handleInputChange}
                    placeholder="Enter employee ID"
                  />
                  {errors.new_employee_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.new_employee_id}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="label-premium">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="new_email"
                    className={`input-premium ${errors.new_email ? 'border-red-500' : ''}`}
                    value={formData.new_email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                  {errors.new_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.new_email}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="label-premium">Office/College</label>
                  <input
                    type="text"
                    name="new_office_college"
                    className="input-premium"
                    value={formData.new_office_college}
                    onChange={handleInputChange}
                    placeholder="Enter office or college"
                  />
                </div>

                <div className="form-group col-span-2">
                  <label className="label-premium">Backup Email (Optional)</label>
                  <input
                    type="email"
                    name="new_backup_email"
                    className={`input-premium ${errors.new_backup_email ? 'border-red-500' : ''}`}
                    value={formData.new_backup_email}
                    onChange={handleInputChange}
                    placeholder="Enter backup signer email"
                  />
                  {errors.new_backup_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.new_backup_email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Transfer Reason */}
            <div>
              <div className="section-divider">
                <h4 className="text-lg font-bold gradient-text">
                  Transfer Reason
                </h4>
              </div>
              <div className="form-group">
                <label className="label-premium">
                  Reason for Transfer <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="transfer_reason"
                  className={`input-premium min-h-[100px] ${errors.transfer_reason ? 'border-red-500' : ''}`}
                  value={formData.transfer_reason}
                  onChange={handleInputChange}
                  placeholder="e.g., Employee resignation, Department transfer, Asset reallocation..."
                />
                {errors.transfer_reason && (
                  <p className="text-red-500 text-sm mt-1">{errors.transfer_reason}</p>
                )}
              </div>
            </div>

            {/* Notification Options */}
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'var(--theme-primary-light)' }}>
              <input
                type="checkbox"
                id="notify-original"
                checked={notifyOriginal}
                onChange={(e) => setNotifyOriginal(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
              <label htmlFor="notify-original" className="text-text-primary font-medium cursor-pointer">
                Notify original employee about this transfer
              </label>
            </div>
          </div>
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
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
            onClick={handleTransfer}
            disabled={saving || selectedAssetIds.length === 0}
          >
            {saving ? (
              <>
                <div className="spinner-small"></div>
                <span>Transferring...</span>
              </>
            ) : (
              <>
                <i className="fas fa-exchange-alt"></i>
                <span>Transfer Assets</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TransferModal
