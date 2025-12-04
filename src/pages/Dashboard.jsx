
import React, { useState, useEffect } from 'react';
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

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, activityResponse, chartsResponse] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activity'),
          fetch('/api/dashboard/charts'),
        ]);

        if (!statsResponse.ok || !activityResponse.ok || !chartsResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const statsData = await statsResponse.json();
        const activityData = await activityResponse.json();
        const chartsDataResp = await chartsResponse.json();

        setStats(statsData);
        setActivity(activityData);
        setChartsData(chartsDataResp);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  if (error) {
    return <div className="page">Error: {error}</div>;
  }

  return (
    <div className="page flex flex-col overflow-y-auto">
      <h1>Dashboard</h1>
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold">Total Assignments</h2>
            <p className="text-3xl font-bold">{stats.totalAssignments}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold">Signed Assignments</h2>
            <p className="text-3xl font-bold">{stats.signedAssignments}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold">Unsigned Assignments</h2>
            <p className="text-3xl font-bold">{stats.unsignedAssignments}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold">Disputed Assignments</h2>
            <p className="text-3xl font-bold">{stats.disputedAssignments}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold">Expiring Soon</h2>
            <p className="text-3xl font-bold">{stats.expiringSoon}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold">Total Assets</h2>
            <p className="text-3xl font-bold">{stats.totalAssets}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold">Assigned Assets</h2>
            <p className="text-3xl font-bold">{stats.assignedAssets}</p>
          </div>

        </div>
      )}
      {stats && stats.mostFrequentAssets && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Most Frequently Assigned Assets</h2>
          <div className="bg-surface rounded-lg p-4 shadow-md">
            <ul className="divide-y divide-border">
              {stats.mostFrequentAssets.map(asset => (
                <li key={asset.asset_code} className="py-2 flex justify-between">
                  <span>{asset.description} ({asset.asset_code})</span>
                  <span className="font-bold">{asset.assignment_count} times</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {activity && (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            {/* Charts Section */}
            {chartsData && (
              <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assignment Trends Chart */}
                <div className="bg-surface rounded-lg p-6 shadow-md chart-container">
                  <h3 className="text-xl font-semibold mb-4">Assignment Trends</h3>
                  <div className="chart-wrapper h-[350px]">
                    <Line data={{
                      labels: chartsData.assignmentTrends.map(item => item.month),
                      datasets: [{
                        label: 'Assignments',
                        data: chartsData.assignmentTrends.map(item => item.count),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                      }]
                    }} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
                {/* Sign Rate by Department */}
                <div className="bg-surface rounded-lg p-6 shadow-md chart-container">
                  <h3 className="text-xl font-semibold mb-4">Sign Rate by Department</h3>
                  <div className="chart-wrapper h-[350px]">
                    <Doughnut data={{
                      labels: chartsData.signRateByDept.map(item => item.office_college),
                      datasets: [{
                        data: chartsData.signRateByDept.map(item => item.sign_rate),
                        backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
                      }]
                    }} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
            )}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface rounded-lg p-4 shadow-md">
                    <h3 className="text-lg font-semibold mb-2">Recent Signatures</h3>
                    <ul className="divide-y divide-border">
                        {activity.recentSignatures.map(item => (
                            <li key={item.id} className="py-2">
                                {item.employee_name} signed on {new Date(item.signature_date).toLocaleDateString()}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-surface rounded-lg p-4 shadow-md">
                    <h3 className="text-lg font-semibold mb-2">Recent Assignments</h3>
                    <ul className="divide-y divide-border">
                        {activity.recentAssignments.map(item => (
                            <li key={item.id} className="py-2">
                                Assigned to {item.employee_name} on {new Date(item.assigned_at).toLocaleDateString()}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-surface rounded-lg p-4 shadow-md">
                    <h3 className="text-lg font-semibold mb-2">Recent Disputes</h3>
                    <ul className="divide-y divide-border">
                        {activity.recentDisputes.map(item => (
                            <li key={item.id} className="py-2">
                                {item.employee_name} disputed an assignment
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
