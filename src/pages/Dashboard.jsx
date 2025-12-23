import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Compact Stat Card Component
const StatCard = ({ icon, label, value, subValue, colorClass, onClick, urgent }) => (
  <div
    className={`premium-card stat-card p-3 cursor-pointer transition-all ${onClick ? 'hover:border-primary' : ''} ${urgent ? 'border-danger' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2 mb-1">
      <span className="text-base">{icon}</span>
      <span className="stat-label text-xs text-text-secondary uppercase tracking-wide">{label}</span>
    </div>
    <div className={`stat-value text-2xl font-bold ${colorClass || 'text-text-primary'}`}>
      {value}
    </div>
    {subValue && (
      <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(subValue.percent, 100)}%`,
            backgroundColor: subValue.color || 'var(--theme-primary)'
          }}
        />
      </div>
    )}
  </div>
);

// Pending Signature Row Component - Table-like layout
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
);

// Transfer Row Component
const TransferRow = ({ transfer }) => (
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
);

// Timeline Row Component
const TimelineRow = ({ event }) => {
  const configs = {
    signature: { dot: 'success', label: `${event.employee_name} signed` },
    assignment: { dot: 'info', label: `Assigned to ${event.employee_name}` },
    transfer: { dot: 'info', label: `Transfer to ${event.employee_name}` },
    dispute: { dot: 'danger', label: `${event.employee_name} disputed` }
  };
  const config = configs[event.event_type] || configs.assignment;

  return (
    <div className="timeline-item flex items-center gap-2 py-1.5">
      <span className={`status-dot ${config.dot}`} />
      <span className="flex-1 text-sm text-text-primary truncate">{config.label}</span>
      <span className="text-xs text-text-light whitespace-nowrap">{formatRelativeTime(event.event_date)}</span>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { authFetch, isAuthenticated } = useAuth();

  const [stats, setStats] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [pendingSignatures, setPendingSignatures] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminderLoading, setReminderLoading] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchFn = isAuthenticated ? authFetch : fetch;

      const [statsRes, chartsRes, pendingRes, transfersRes, timelineRes] = await Promise.all([
        fetchFn('/api/dashboard/stats'),
        fetchFn('/api/dashboard/charts'),
        fetchFn('/api/dashboard/pending-signatures'),
        fetchFn('/api/dashboard/recent-transfers'),
        fetchFn('/api/dashboard/timeline')
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch stats');

      const [statsData, chartsData, pendingData, transfersData, timelineData] = await Promise.all([
        statsRes.json(),
        chartsRes.ok ? chartsRes.json() : null,
        pendingRes.ok ? pendingRes.json() : [],
        transfersRes.ok ? transfersRes.json() : [],
        timelineRes.ok ? timelineRes.json() : []
      ]);

      setStats(statsData);
      setChartsData(chartsData);
      setPendingSignatures(pendingData);
      setRecentTransfers(transfersData);
      setTimeline(timelineData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, isAuthenticated]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSendReminder = async (assignmentId) => {
    try {
      setReminderLoading(assignmentId);
      setMessage(null);

      const fetchFn = isAuthenticated ? authFetch : fetch;
      const response = await fetchFn(`/api/handover/resend/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send reminder');
      }

      setMessage({ type: 'success', text: 'Reminder sent' });

      const pendingRes = await fetchFn('/api/dashboard/pending-signatures');
      if (pendingRes.ok) {
        setPendingSignatures(await pendingRes.json());
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setReminderLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="spinner-premium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="premium-card p-4 text-center">
          <div className="text-danger mb-2">Error loading dashboard</div>
          <div className="text-sm text-text-secondary mb-3">{error}</div>
          <button onClick={fetchDashboardData} className="btn-premium">Retry</button>
        </div>
      </div>
    );
  }

  const signedPercent = stats?.totalAssignments > 0
    ? Math.round((stats.signedAssignments / stats.totalAssignments) * 100)
    : 0;

  const urgentCount = pendingSignatures.filter(p => p.is_urgent).length;

  return (
    <div className="p-4 max-w-[1600px] mx-auto">
      {/* Header */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Signatures - 2 columns */}
        <div className="lg:col-span-2">
          <div className="premium-card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-text-primary">Pending Signatures</h2>
                <span className="text-xs text-text-secondary">({pendingSignatures.length})</span>
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
              {pendingSignatures.length > 0 ? (
                <div className="divide-y divide-border">
                  {pendingSignatures.slice(0, 8).map((item) => (
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

        {/* Right Column */}
        <div className="space-y-4">
          {/* Recent Transfers */}
          <div className="premium-card">
            <div className="card-header">
              <h2 className="font-semibold text-text-primary">Recent Transfers</h2>
            </div>
            <div className="card-body">
              {recentTransfers.length > 0 ? (
                <div className="space-y-1">
                  {recentTransfers.map((transfer) => (
                    <TransferRow key={transfer.id} transfer={transfer} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-text-secondary text-sm">No recent transfers</div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
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
      </div>

      {/* Charts Row */}
      {chartsData && (chartsData.assignmentTrends?.length > 0 || chartsData.signRateByDept?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {chartsData.assignmentTrends?.length > 0 && (
            <div className="premium-card">
              <div className="card-header">
                <h3 className="font-semibold text-text-primary">Assignment Trends</h3>
              </div>
              <div className="card-body">
                <div className="chart-wrapper h-[200px]">
                  <Line
                    data={{
                      labels: chartsData.assignmentTrends.map(item => item.month),
                      datasets: [{
                        label: 'Assignments',
                        data: chartsData.assignmentTrends.map(item => item.count),
                        borderColor: 'var(--theme-primary)',
                        backgroundColor: 'var(--theme-primaryLight)',
                        tension: 0.4,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {chartsData.signRateByDept?.length > 0 && (
            <div className="premium-card">
              <div className="card-header">
                <h3 className="font-semibold text-text-primary">Sign Rate by Dept</h3>
              </div>
              <div className="card-body">
                <div className="chart-wrapper h-[200px]">
                  <Doughnut
                    data={{
                      labels: chartsData.signRateByDept.map(item => item.office_college || 'Unknown'),
                      datasets: [{
                        data: chartsData.signRateByDept.map(item => Math.round(item.sign_rate)),
                        backgroundColor: [
                          'var(--theme-success)',
                          'var(--theme-warning)',
                          'var(--theme-danger)',
                          'var(--theme-info)',
                          'var(--theme-accent)'
                        ]
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'right', labels: { boxWidth: 10, padding: 6, font: { size: 11 } } }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Assets */}
      {stats?.mostFrequentAssets?.length > 0 && (
        <div className="mt-4">
          <div className="premium-card">
            <div className="card-header">
              <h2 className="font-semibold text-text-primary">Most Assigned Assets</h2>
            </div>
            <div className="card-body p-0">
              <div className="divide-y divide-border">
                {stats.mostFrequentAssets.map((asset, index) => (
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
      )}
    </div>
  );
};

export default Dashboard;
