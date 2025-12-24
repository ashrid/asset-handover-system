import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import Skeleton from '../components/Skeleton'

function HandoverPage() {
  const [assets, setAssets] = useState([])
  const [selectedAssets, setSelectedAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { addToast } = useToast()
  const { authFetch } = useAuth()
  const [searchFilter, setSearchFilter] = useState('')
  const [employeeData, setEmployeeData] = useState({
    employee_name: '',
    employee_id: '',
    email: '',
    backup_email: '',
    office_college: ''
  })

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await authFetch('/api/assets')
      if (!response.ok) {
        throw new Error('Failed to fetch assets')
      }
      const data = await response.json()
      setAssets(Array.isArray(data) ? data : [])
    } catch (error) {
      addToast('error', error.message || 'Failed to fetch assets')
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeChange = (e) => {
    const { name, value } = e.target
    setEmployeeData(prev => ({ ...prev, [name]: value }))
  }

  const handleAssetToggle = (assetId) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId)
      } else {
        return [...prev, assetId]
      }
    })
  }

  const handleSelectAll = () => {
    const filtered = getFilteredAssets()
    const allFilteredSelected = filtered.every(asset => selectedAssets.includes(asset.id))

    if (allFilteredSelected && filtered.length > 0) {
      // Deselect all filtered assets
      setSelectedAssets(prev => prev.filter(id => !filtered.map(a => a.id).includes(id)))
    } else {
      // Select all filtered assets
      const newSelected = [...selectedAssets]
      filtered.forEach(asset => {
        if (!newSelected.includes(asset.id)) {
          newSelected.push(asset.id)
        }
      })
      setSelectedAssets(newSelected)
    }
  }

  const getFilteredAssets = () => {
    if (!searchFilter.trim()) {
      return assets
    }

    const searchLower = searchFilter.toLowerCase().trim()
    return assets.filter(asset => {
      // Format date for searching (dd-mmm-yyyy)
      let dateString = ''
      if (asset.created_at) {
        const date = new Date(asset.created_at)
        const day = String(date.getDate()).padStart(2, '0')
        const month = date.toLocaleDateString('en-US', { month: 'short' })
        const year = date.getFullYear()
        dateString = `${day}-${month}-${year}`.toLowerCase()
      }

      return (
        asset.asset_code?.toLowerCase().includes(searchLower) ||
        asset.asset_type?.toLowerCase().includes(searchLower) ||
        asset.description?.toLowerCase().includes(searchLower) ||
        asset.model?.toLowerCase().includes(searchLower) ||
        asset.manufacturer?.toLowerCase().includes(searchLower) ||
        asset.serial_number?.toLowerCase().includes(searchLower) ||
        dateString.includes(searchLower)
      )
    })
  }

  const clearFilter = () => {
    setSearchFilter('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (selectedAssets.length === 0) {
      addToast('error', 'Please select at least one asset')
      return
    }

    setSending(true)

    try {
      const response = await authFetch('/api/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...employeeData,
          asset_ids: selectedAssets
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send handover email')
      }

      const result = await response.json()
      addToast('success', `Handover email sent successfully to ${employeeData.email}. Check server console for email preview URL (development mode).`)

      // Reset form
      setEmployeeData({
        employee_name: '',
        employee_id: '',
        email: '',
        backup_email: '',
        office_college: ''
      })
      setSelectedAssets([])
    } catch (error) {
      addToast('error', error.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      
      <div className="premium-card p-8">
        <h2 className="text-2xl font-bold mb-2 gradient-text">
          Asset Handover
        </h2>
        <p className="text-text-secondary mb-8">
          Assign assets to an employee and send handover confirmation email with PDF
        </p>

        <form onSubmit={handleSubmit} className="animate-slideUp">
          <div className="section-divider">
            <h3 className="text-xl font-bold gradient-text">Employee Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                Employee Name <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  className="input-premium pl-10"
                  type="text"
                  name="employee_name"
                  value={employeeData.employee_name}
                  onChange={handleEmployeeChange}
                  required
                />
                <i className="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light"></i>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                Employee ID
              </label>
              <div className="relative">
                <input
                  className="input-premium pl-10"
                  type="text"
                  name="employee_id"
                  value={employeeData.employee_id}
                  onChange={handleEmployeeChange}
                />
                <i className="fas fa-id-card absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light"></i>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                Email <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  className="input-premium pl-10"
                  type="email"
                  name="email"
                  value={employeeData.email}
                  onChange={handleEmployeeChange}
                  required
                />
                <i className="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light"></i>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                Office / College
              </label>
              <div className="relative">
                <input
                  className="input-premium pl-10"
                  type="text"
                  name="office_college"
                  value={employeeData.office_college}
                  onChange={handleEmployeeChange}
                />
                <i className="fas fa-building absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light"></i>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">
                Backup Email (Optional)
                <span className="text-text-secondary text-xs ml-2 font-normal">
                  For senior/manager to sign if employee unavailable
                </span>
              </label>
              <div className="relative">
                <input
                  className="input-premium pl-10"
                  type="email"
                  name="backup_email"
                  value={employeeData.backup_email}
                  onChange={handleEmployeeChange}
                  placeholder="senior@example.com"
                />
                <i className="fas fa-user-tie absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light"></i>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                If provided, signing link will be sent to both emails
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mb-6 mt-8">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold gradient-text">
                Select Assets
              </h3>
              <span className="badge-premium badge-info whitespace-nowrap">
                {selectedAssets.length} selected
              </span>
            </div>
          </div>

          {/* Search/Filter Section */}
          {!loading && assets.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by asset code, type, description, model, manufacturer, serial, or date added..."
                  className="input-premium pl-10 pr-20"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light"></i>
                {searchFilter && (
                  <button
                    type="button"
                    onClick={clearFilter}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light hover:text-text-primary transition-colors"
                    title="Clear filter"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              {searchFilter && (
                <p className="text-sm text-text-secondary mt-2">
                  Showing {getFilteredAssets().length} of {assets.length} assets
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="space-y-4 py-12">
              <Skeleton variant="text" height="h-6" width="w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} variant="card" height="h-16" className="border rounded-lg" />
                ))}
              </div>
            </div>
          ) : assets.length === 0 ? (
            <div className="notification-premium notification-info text-center py-12">
              <i className="fas fa-box-open text-4xl mb-4 opacity-75"></i>
              <h3 className="text-xl font-bold mb-2">No Assets Yet</h3>
              <p className="text-text-secondary mb-4">Add your first asset to get started.</p>
              <button className="btn-premium" onClick={() => window.location.href = '/assets'}>Go to Assets</button>
            </div>
          ) : (
            <>
              {getFilteredAssets().length === 0 ? (
                <div className="notification-premium notification-info text-center py-12">
                  <i className="fas fa-search text-4xl mb-4 opacity-75"></i>
                  <h3 className="text-xl font-bold mb-2">No Matching Assets</h3>
                  <p className="text-text-secondary mb-4">Try adjusting your search terms.</p>
                  <button className="btn-secondary" onClick={clearFilter}>Clear Search</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-premium">
                    <thead>
                      <tr>
                        <th className="w-12 text-center">
                          <input
                            type="checkbox"
                            checked={getFilteredAssets().length > 0 && getFilteredAssets().every(a => selectedAssets.includes(a.id))}
                            onChange={handleSelectAll}
                            className="h-4 w-4 cursor-pointer rounded border-2 border-border accent-primary"
                            title={getFilteredAssets().every(a => selectedAssets.includes(a.id)) ? 'Deselect All' : 'Select All'}
                          />
                        </th>
                        <th>Asset Code</th>
                        <th>Asset Type</th>
                        <th>Description</th>
                        <th>Model</th>
                        <th>Serial Number</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredAssets().map(asset => (
                        <tr
                          key={asset.id}
                          onClick={() => handleAssetToggle(asset.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedAssets.includes(asset.id)
                              ? 'bg-primary-light/30'
                              : 'hover:bg-header-bg'
                          }`}
                        >
                          <td className="text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedAssets.includes(asset.id)}
                              onChange={() => handleAssetToggle(asset.id)}
                              className="h-4 w-4 cursor-pointer rounded border-2 border-border accent-primary"
                            />
                          </td>
                          <td>
                            <strong className="text-text-primary">{asset.asset_code}</strong>
                          </td>
                          <td className="text-text-secondary">
                            {asset.asset_type}
                          </td>
                          <td className="text-text-secondary">
                            {asset.description || '-'}
                          </td>
                          <td className="text-text-secondary">
                            {asset.model || '-'}
                          </td>
                          <td className="text-text-secondary">
                            {asset.serial_number || '-'}
                          </td>
                          <td>
                            {asset.status ? (
                              <span className={`badge-premium whitespace-nowrap ${
                                asset.status === 'Active' ? 'badge-success' :
                                asset.status === 'Broken' ? 'badge-danger' :
                                asset.status === 'Lost' ? 'badge-warning' :
                                'badge-info'
                              }`}>
                                {asset.status}
                              </span>
                            ) : (
                              <span className="text-text-light">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <div className="bottom-action-sheet">
            <button
              type="submit"
              className={`btn-premium flex items-center gap-2 ${sending ? 'opacity-75 cursor-not-allowed' : ''}`}
              disabled={sending || assets.length === 0}
            >
              {sending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <i className="fas fa-paper-plane"></i>
              <span>{sending ? 'Sending...' : 'Send Handover Email'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HandoverPage
