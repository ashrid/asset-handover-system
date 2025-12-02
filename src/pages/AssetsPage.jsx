import { useState, useEffect } from 'react'
import AssetForm from '../components/AssetForm'
import AssetList from '../components/AssetList'
import ExcelImportModal from '../components/ExcelImportModal'

function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingAsset, setEditingAsset] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [message, setMessage] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets')
      const data = await response.json()
      setAssets(data)
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to fetch assets' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAsset = async (assetData) => {
    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets'
      const method = editingAsset ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save asset')
      }

      setMessage({
        type: 'success',
        text: `Asset ${editingAsset ? 'updated' : 'created'} successfully`
      })
      setShowForm(false)
      setEditingAsset(null)
      fetchAssets()

      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      setMessage({ type: 'danger', text: error.message })
    }
  }

  const handleEditAsset = (asset) => {
    setEditingAsset(asset)
    setShowForm(true)
    setMessage(null)
  }

  const handleDeleteAsset = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete asset')

      setMessage({ type: 'success', text: 'Asset deleted successfully' })
      fetchAssets()
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      setMessage({ type: 'danger', text: error.message })
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAsset(null)
    setMessage(null)
  }

  const handleImportSuccess = async (parsedData) => {
    try {
      const response = await fetch('/api/assets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: parsedData })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import assets')
      }

      const result = await response.json()
      setMessage({
        type: 'success',
        text: `Successfully imported ${result.count} asset${result.count !== 1 ? 's' : ''}`
      })
      fetchAssets()
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      setMessage({ type: 'danger', text: error.message })
    }
  }

  const getFilteredAssets = () => {
    if (!searchFilter.trim()) {
      return assets
    }

    const searchLower = searchFilter.toLowerCase().trim()
    return assets.filter(asset => {
      // Format date for searching
      let dateString = ''
      if (asset.created_at) {
        const date = new Date(asset.created_at)
        dateString = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).toLowerCase()
      }

      return (
        asset.asset_code?.toLowerCase().includes(searchLower) ||
        asset.asset_type?.toLowerCase().includes(searchLower) ||
        asset.description?.toLowerCase().includes(searchLower) ||
        asset.model?.toLowerCase().includes(searchLower) ||
        asset.manufacturer?.toLowerCase().includes(searchLower) ||
        asset.serial_number?.toLowerCase().includes(searchLower) ||
        asset.asset_location_1?.toLowerCase().includes(searchLower) ||
        asset.asset_location_2?.toLowerCase().includes(searchLower) ||
        asset.asset_location_3?.toLowerCase().includes(searchLower) ||
        asset.asset_location_4?.toLowerCase().includes(searchLower) ||
        asset.asset_category_1?.toLowerCase().includes(searchLower) ||
        asset.asset_category_2?.toLowerCase().includes(searchLower) ||
        asset.asset_category_3?.toLowerCase().includes(searchLower) ||
        asset.asset_category_4?.toLowerCase().includes(searchLower) ||
        asset.status?.toLowerCase().includes(searchLower) ||
        asset.supplier_vendor?.toLowerCase().includes(searchLower) ||
        asset.invoice_no?.toLowerCase().includes(searchLower) ||
        asset.lpo_voucher_no?.toLowerCase().includes(searchLower) ||
        dateString.includes(searchLower)
      )
    })
  }

  const clearFilter = () => {
    setSearchFilter('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      {message && (
        <div className={`notification-premium mb-6 ${
          message.type === 'success' ? 'notification-success' :
          message.type === 'danger' ? 'notification-danger' :
          'notification-info'
        }`}>
          <i className={`fas text-xl ${
            message.type === 'success' ? 'fa-check-circle' :
            message.type === 'danger' ? 'fa-exclamation-circle' :
            'fa-info-circle'
          }`}></i>
          <span className="flex-1">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-2xl font-bold leading-none opacity-50 hover:opacity-100 transition-opacity"
          >
            &times;
          </button>
        </div>
      )}

      {!showForm ? (
        <>
          <div className="premium-card p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold gradient-text">
                Assets
              </h2>
              <div className="flex gap-3">
                <button
                  className="btn-secondary flex items-center gap-2"
                  onClick={() => setShowImportModal(true)}
                >
                  <i className="fas fa-file-excel"></i>
                  <span>Import from Excel</span>
                </button>
                <button
                  className="btn-premium flex items-center gap-2"
                  onClick={() => setShowForm(true)}
                >
                  <i className="fas fa-plus"></i>
                  <span>Add New Asset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search/Filter Section */}
          {!loading && assets.length > 0 && (
            <div className="premium-card p-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by asset code, type, description, model, manufacturer, serial, location, category, or date..."
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
            <div className="premium-card p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="spinner-premium"></div>
                <p className="mt-4 text-text-secondary font-medium">Loading assets...</p>
              </div>
            </div>
          ) : (
            <AssetList
              assets={getFilteredAssets()}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
            />
          )}
        </>
      ) : (
        <div className="premium-card p-8 animate-scaleIn">
          <h2 className="text-2xl font-bold mb-6 gradient-text">
            {editingAsset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <AssetForm
            asset={editingAsset}
            onSave={handleSaveAsset}
            onCancel={handleCancel}
          />
        </div>
      )}

      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  )
}

export default AssetsPage
