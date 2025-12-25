import { memo } from 'react'
import TransferRow from '../ui/TransferRow'
import TimelineRow from '../ui/TimelineRow'

/**
 * RightColumnCards - Dashboard sidebar with transfers, summary stats, and timeline
 * Memoized to prevent re-renders when unrelated dashboard state changes
 */
function RightColumnCards({ transfers, stats, timeline, signedPercent }) {
  return (
    <div className="space-y-4">
      {/* Recent Transfers */}
      <div className="premium-card">
        <div className="card-header">
          <h2 className="font-semibold text-text-primary">Recent Transfers</h2>
        </div>
        <div className="card-body">
          {transfers.length > 0 ? (
            <div className="space-y-1">
              {transfers.map((transfer) => (
                <TransferRow key={transfer.id} transfer={transfer} />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-text-secondary text-sm">No recent transfers</div>
          )}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="premium-card">
        <div className="card-header">
          <h2 className="font-semibold text-text-primary">Summary</h2>
        </div>
        <div className="card-body">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-text-secondary">Total Assets</span>
              <span className="font-medium text-text-primary">{stats?.totalAssets || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-text-secondary">Assigned</span>
              <span className="font-medium text-text-primary">{stats?.assignedAssets || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Sign Rate</span>
              <span className="font-medium text-success">{signedPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="premium-card">
        <div className="card-header">
          <h2 className="font-semibold text-text-primary">Recent Activity</h2>
        </div>
        <div className="card-body">
          {timeline.length > 0 ? (
            <div className="space-y-0.5">
              {timeline.map((event, i) => (
                <TimelineRow key={`${event.event_type}-${event.id}-${i}`} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-text-secondary text-sm">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(RightColumnCards)
