import { formatRelativeTime } from '../../utils/formatRelativeTime'

/**
 * TransferRow - Asset transfer display component
 * Shows transfer from/to employees with asset count and timestamp
 */
function TransferRow({ transfer }) {
  return (
    <div className="action-row flex items-center gap-3 py-2">
      <span className="status-dot info" />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-text-primary">
          {transfer.from_employee || '?'} → {transfer.to_employee}
        </span>
        <span className="text-xs text-text-light ml-2">
          {transfer.asset_count} asset{transfer.asset_count !== 1 ? 's' : ''}
        </span>
      </div>
      <span className="text-xs text-text-light">{formatRelativeTime(transfer.transfer_date)}</span>
    </div>
  )
}

export default TransferRow
