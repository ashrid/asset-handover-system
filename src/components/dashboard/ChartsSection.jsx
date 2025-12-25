import { memo } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
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
  Filler,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

/**
 * ChartsSection - Dashboard charts for assignment trends and sign rate by department
 * Memoized to prevent unnecessary re-renders when other dashboard state changes
 */
function ChartsSection({ chartsData }) {
  // Don't render if no chart data
  if (!chartsData) return null

  const hasTrends = chartsData.assignmentTrends?.length > 0
  const hasSignRate = chartsData.signRateByDept?.length > 0

  // Don't render section if no data for either chart
  if (!hasTrends && !hasSignRate) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Assignment Trends Line Chart */}
      {hasTrends && (
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

      {/* Sign Rate by Department Doughnut Chart */}
      {hasSignRate && (
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
  )
}

export default memo(ChartsSection)
