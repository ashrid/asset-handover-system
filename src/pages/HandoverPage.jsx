import { useState, useEffect } from 'react'

function HandoverPage() {
  const [assets, setAssets] = useState([])
  const [selectedAssets, setSelectedAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState(null)
  const [employeeData, setEmployeeData] = useState({
    employee_name: '',
    employee_id: '',
    email: '',
    office_college: ''
  })

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
    if (selectedAssets.length === assets.length) {
      setSelectedAssets([])
    } else {
      setSelectedAssets(assets.map(a => a.id))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (selectedAssets.length === 0) {
      setMessage({ type: 'danger', text: 'Please select at least one asset' })
      return
    }

    setSending(true)
    setMessage(null)

    try {
      const response = await fetch('/api/handover', {
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
      setMessage({
        type: 'success',
        text: `Handover email sent successfully to ${employeeData.email}. Check server console for email preview URL (development mode).`
      })

      // Reset form
      setEmployeeData({
        employee_name: '',
        employee_id: '',
        email: '',
        office_college: ''
      })
      setSelectedAssets([])
      setTimeout(() => setMessage(null), 10000)
    } catch (error) {
      setMessage({ type: 'danger', text: error.message })
    } finally {
      setSending(false)
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

          <div className="flex items-center gap-3 mb-6 mt-8">
            <h3 className="text-lg font-bold gradient-text">
              Select Assets
            </h3>
            <span className="badge-premium badge-info whitespace-nowrap">
              {selectedAssets.length} selected
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="spinner-premium"></div>
              <p className="mt-4 text-text-secondary">Loading assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="notification-premium notification-info">
              <i className="fas fa-info-circle text-xl"></i>
              <span>No assets available. Please add assets first.</span>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <button
                  type="button"
                  className="btn-secondary text-sm flex items-center gap-2"
                  onClick={handleSelectAll}
                >
                  <i className={`fas fa-${selectedAssets.length === assets.length ? 'times' : 'check-double'}`}></i>
                  <span>{selectedAssets.length === assets.length ? 'Deselect All' : 'Select All'}</span>
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar border border rounded-lg p-4 bg-background/50">
                {assets.map(asset => (
                  <div
                    key={asset.id}
                    className={`p-4 border rounded-lg transition-all duration-200 ${
                      selectedAssets.includes(asset.id)
                        ? 'bg-primary-light/20 border-primary shadow-sm'
                        : 'bg-card border hover:border-primary/50'
                    }`}
                  >
                    <label className="flex items-center cursor-pointer w-full">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => handleAssetToggle(asset.id)}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded border border checked:border-primary checked:bg-primary transition-all"
                        />
                        <i className="fas fa-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                      </div>
                      <div className="ml-3 flex-1">
                        <span className="font-semibold text-text-primary">
                          {asset.asset_code}
                        </span>
                        <span className="ml-2 text-text-secondary">
                          - {asset.asset_type}
                        </span>
                        {asset.description && (
                          <span className="ml-2 text-text-light">- {asset.description}</span>
                        )}
                        {asset.model && (
                          <span className="ml-2 text-text-light">({asset.model})</span>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border">
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
