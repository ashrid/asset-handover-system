import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * PendingSignatureRow - Individual row for pending signature item
 */
const PendingSignatureRow = ({ item, onSendReminder, isLoading }) => (
  <div className={`action-row flex items-center gap-3 py-2 px-3 rounded ${item.is_urgent ? 'bg-danger-light' : 'hover:bg-header-bg'}`}>
    <span className={`status-dot ${item.is_urgent ? 'danger' : 'warning'}`} />
    <div className="flex-1 min-w-0 grid grid-cols-4 gap-2 items-center">
      <span className="font-medium text-text-primary truncate">{item.employee_name}</span>
      <span className="text-text-secondary text-sm truncate">{item.office_college || '-'}</span>
      <span className="text-text-secondary text-sm">{item.asset_count} asset{item.asset_count !== 1 ? 's' : ''}</span>
      <span className={`text-sm ${item.is_urgent ? 'text-danger font-medium' : 'text-warning'}`}>
        {item.days_remaining}d left
      </span>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onSendReminder(item.id); }}
      disabled={!item.can_send_reminder || isLoading}
      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
        item.can_send_reminder && !isLoading
          ? 'bg-primary text-white hover:bg-primary-hover'
          : 'bg-border text-text-light cursor-not-allowed'
      }`}
    >
      {isLoading ? '...' : 'Remind'}
    </button>
  </div>
)

/**
 * PendingSignatures - Dashboard section showing pending signatures with remind functionality
 */
function PendingSignatures({ items, onReminderSent, refreshPendingSignatures }) {
  const navigate = useNavigate()
  const { authFetch } = useAuth()
  const [reminderLoading, setReminderLoading] = useState(null)

  const urgentCount = items.filter(p => p.is_urgent).length

  const handleSendReminder = async (assignmentId) => {
    try {
      setReminderLoading(assignmentId)

      const response = await authFetch(`/api/handover/resend/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to send reminder')
      }

      onReminderSent?.({ type: 'success', text: 'Reminder sent' })

      // Refresh the pending signatures list
      await refreshPendingSignatures?.()
    } catch (err) {
      onReminderSent?.({ type: 'error', text: err.message })
    } finally {
      setReminderLoading(null)
    }
  }

  return (
    <div className="lg:col-span-2">
      <div className="premium-card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-text-primary">Pending Signatures</h2>
            <span className="text-xs text-text-secondary">({items.length})</span>
            {urgentCount > 0 && (
              <span className="text-xs bg-danger text-white px-1.5 py-0.5 rounded">{urgentCount} urgent</span>
            )}
          </div>
          <button onClick={() => navigate('/assignments?filter=pending')} className="text-xs text-primary hover:underline">
            View all →
          </button>
        </div>
        <div className="card-body p-0">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-4 gap-2 px-3 py-2 bg-header-bg text-xs font-medium text-text-secondary uppercase tracking-wide border-b border-border">
            <span>Employee</span>
            <span>Department</span>
            <span>Assets</span>
            <span>Expires</span>
          </div>
          {items.length > 0 ? (
            <div className="divide-y divide-border">
              {items.slice(0, 8).map((item) => (
                <PendingSignatureRow
                  key={item.id}
                  item={item}
                  onSendReminder={handleSendReminder}
                  isLoading={reminderLoading === item.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-text-secondary text-sm">
              All signatures up to date
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(PendingSignatures)
