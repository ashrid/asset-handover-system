import { useState } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'
import {
  StatsSection,
  PendingSignatures,
  RightColumnCards,
  ChartsSection,
  MostAssignedAssets
} from '../components/dashboard'

/**
 * Dashboard - Main orchestrator component
 * Composes section components and manages shared state (messages)
 *
 * Previously 509 lines, now ~100 lines as a clean orchestrator
 */
const Dashboard = () => {
  const {
    stats,
    chartsData,
    pendingSignatures,
    recentTransfers,
    timeline,
    loading,
    error,
    refetch,
    refreshPendingSignatures
  } = useDashboardData()

  const [message, setMessage] = useState(null)

  // Calculate signed percentage for RightColumnCards
  const signedPercent = stats?.totalAssignments > 0
    ? Math.round((stats.signedAssignments / stats.totalAssignments) * 100)
    : 0

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="spinner-premium" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="premium-card p-4 text-center">
          <div className="text-danger mb-2">Error loading dashboard</div>
          <div className="text-sm text-text-secondary mb-3">{error}</div>
          <button onClick={refetch} className="btn-premium">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-[1600px] mx-auto">
      {/* Header with notification */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary">Asset Handover Overview</p>
        </div>
        {message && (
          <div className={`notification-${message.type === 'success' ? 'success' : 'danger'} flex items-center gap-2`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-bold">×</button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <StatsSection stats={stats} />

      {/* Main Grid: Pending Signatures + Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PendingSignatures
          items={pendingSignatures}
          onReminderSent={setMessage}
          refreshPendingSignatures={refreshPendingSignatures}
        />
        <RightColumnCards
          transfers={recentTransfers}
          stats={stats}
          timeline={timeline}
          signedPercent={signedPercent}
        />
      </div>

      {/* Charts Section */}
      <ChartsSection chartsData={chartsData} />

      {/* Most Assigned Assets */}
      <MostAssignedAssets assets={stats?.mostFrequentAssets} />
    </div>
  )
}

export default Dashboard
