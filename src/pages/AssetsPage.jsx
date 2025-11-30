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

          {loading ? (
            <div className="premium-card p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="spinner-premium"></div>
                <p className="mt-4 text-text-secondary font-medium">Loading assets...</p>
              </div>
            </div>
          ) : (
            <AssetList
              assets={assets}
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
