import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../ui/StatCard'

/**
 * StatsSection - Dashboard stats row with 5 key metrics
 * Memoized to prevent re-renders when other dashboard state changes
 */
function StatsSection({ stats }) {
  const navigate = useNavigate()

  const signedPercent = stats?.totalAssignments > 0
    ? Math.round((stats.signedAssignments / stats.totalAssignments) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      <StatCard
        icon="📋"
        label="Total"
        value={stats?.totalAssignments || 0}
        onClick={() => navigate('/assignments')}
      />
      <StatCard
        icon="✓"
        label="Signed"
        value={stats?.signedAssignments || 0}
        colorClass="text-success"
        subValue={{ percent: signedPercent, color: 'var(--theme-success)' }}
      />
      <StatCard
        icon="○"
        label="Pending"
        value={stats?.unsignedAssignments || 0}
        colorClass="text-warning"
        onClick={() => navigate('/assignments?filter=pending')}
      />
      <StatCard
        icon="!"
        label="Disputed"
        value={stats?.disputedAssignments || 0}
        colorClass="text-danger"
        onClick={() => navigate('/assignments?filter=disputed')}
      />
      <StatCard
        icon="⚠"
        label="Expiring"
        value={stats?.expiringSoon || 0}
        colorClass={stats?.expiringSoon > 0 ? 'text-danger' : 'text-text-secondary'}
        urgent={stats?.expiringSoon > 0}
      />
    </div>
  )
}

export default memo(StatsSection)
