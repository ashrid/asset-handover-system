import { memo } from 'react'

/**
 * MostAssignedAssets - Displays ranked list of frequently assigned assets
 * Memoized to prevent re-renders when other dashboard state changes
 */
function MostAssignedAssets({ assets }) {
  // Don't render if no assets data
  if (!assets?.length) return null

  return (
    <div className="mt-4">
      <div className="premium-card">
        <div className="card-header">
          <h2 className="font-semibold text-text-primary">Most Assigned Assets</h2>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-border">
            {assets.map((asset, index) => (
              <div key={asset.asset_code} className="flex items-center gap-3 px-3 py-2">
                <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
                  index === 0 ? 'bg-warning-light text-warning' : 'bg-header-bg text-text-light'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-text-primary">{asset.description}</span>
                  <span className="text-xs text-text-light ml-2">{asset.asset_code}</span>
                </div>
                <span className="text-sm font-semibold text-primary">{asset.assignment_count}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(MostAssignedAssets)
