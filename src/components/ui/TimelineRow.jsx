import { formatRelativeTime } from '../../utils/formatRelativeTime'

/**
 * TimelineRow - Activity timeline event display component
 * Shows event type indicator, description, and relative timestamp
 */
function TimelineRow({ event }) {
  const configs = {
    signature: { dot: 'success', label: `${event.employee_name} signed` },
    assignment: { dot: 'info', label: `Assigned to ${event.employee_name}` },
    transfer: { dot: 'info', label: `Transfer to ${event.employee_name}` },
    dispute: { dot: 'danger', label: `${event.employee_name} disputed` }
  }
  const config = configs[event.event_type] || configs.assignment

  return (
    <div className="timeline-item flex items-center gap-2 py-1.5">
      <span className={`status-dot ${config.dot}`} />
      <span className="flex-1 text-sm text-text-primary truncate">{config.label}</span>
      <span className="text-xs text-text-light whitespace-nowrap">{formatRelativeTime(event.event_date)}</span>
    </div>
  )
}

export default TimelineRow
