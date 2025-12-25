function AssetList({ assets, onEdit, onDelete }) {
  if (assets.length === 0) {
    return (
      <div className="premium-card p-12 text-center animate-fadeIn">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light/20 mb-4">
          <i className="fas fa-box-open text-3xl text-primary"></i>
        </div>
        <p className="text-xl font-semibold mb-2 text-text-primary">
          No assets found
        </p>
        <p className="text-text-secondary">
          Start by adding your first asset
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <table className="table-premium">
        <thead>
          <tr>
            <th>Asset Code</th>
            <th>Asset Type</th>
            <th>Description</th>
            <th>Model</th>
            <th>Serial Number</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => (
            <tr key={asset.id}>
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
              <td>
                <div className="flex gap-2 flex-nowrap">
                  <button
                    className="px-3 py-1.5 rounded-lg text-white hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-medium inline-flex items-center gap-1 whitespace-nowrap"
                    style={{ backgroundColor: 'var(--theme-info)' }}
                    onClick={() => onEdit(asset)}
                    title="Edit asset"
                  >
                    <i className="fas fa-edit"></i>
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-white hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-medium inline-flex items-center gap-1 whitespace-nowrap"
                    style={{ backgroundColor: 'var(--theme-danger)' }}
                    onClick={() => onDelete(asset.id)}
                    title="Delete asset"
                  >
                    <i className="fas fa-trash"></i>
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AssetList
