import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Custom hook for fetching and managing dashboard data
 * Encapsulates all 5 dashboard API calls with proper error handling
 */
export function useDashboardData() {
  const { authFetch } = useAuth()

  const [stats, setStats] = useState(null)
  const [chartsData, setChartsData] = useState(null)
  const [pendingSignatures, setPendingSignatures] = useState([])
  const [recentTransfers, setRecentTransfers] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsRes, chartsRes, pendingRes, transfersRes, timelineRes] = await Promise.all([
        authFetch('/api/dashboard/stats'),
        authFetch('/api/dashboard/charts'),
        authFetch('/api/dashboard/pending-signatures'),
        authFetch('/api/dashboard/recent-transfers'),
        authFetch('/api/dashboard/timeline')
      ])

      if (!statsRes.ok) throw new Error('Failed to fetch stats')

      const [statsData, chartsData, pendingData, transfersData, timelineData] = await Promise.all([
        statsRes.json(),
        chartsRes.ok ? chartsRes.json() : null,
        pendingRes.ok ? pendingRes.json() : [],
        transfersRes.ok ? transfersRes.json() : [],
        timelineRes.ok ? timelineRes.json() : []
      ])

      setStats(statsData)
      setChartsData(chartsData)
      setPendingSignatures(Array.isArray(pendingData) ? pendingData : [])
      setRecentTransfers(Array.isArray(transfersData) ? transfersData : [])
      setTimeline(Array.isArray(timelineData) ? timelineData : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  // Refresh just pending signatures (after sending reminder)
  const refreshPendingSignatures = useCallback(async () => {
    try {
      const pendingRes = await authFetch('/api/dashboard/pending-signatures')
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json()
        setPendingSignatures(Array.isArray(pendingData) ? pendingData : [])
      }
    } catch (err) {
      console.error('Failed to refresh pending signatures:', err)
    }
  }, [authFetch])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    // Data
    stats,
    chartsData,
    pendingSignatures,
    recentTransfers,
    timeline,
    // State
    loading,
    error,
    // Actions
    refetch: fetchDashboardData,
    refreshPendingSignatures
  }
}

export default useDashboardData
