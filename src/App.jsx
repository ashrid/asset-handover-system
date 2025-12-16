import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import AssetsPage from './pages/AssetsPage'
import HandoverPage from './pages/HandoverPage'
import AssignmentsPage from './pages/AssignmentsPage'
import SignaturePage from './pages/SignaturePage'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import UserManagementPage from './pages/UserManagementPage'
import { initializeTheme } from './themes'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const location = useLocation()

  useEffect(() => {
    // Initialize theme on app load
    initializeTheme()
  }, [])

  // Check if current route is a public page (no header needed)
  const isPublicPage = location.pathname.startsWith('/sign/') || location.pathname === '/login'

  return (
    <ToastProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background text-text-primary font-sans transition-colors duration-300">
          {!isPublicPage && <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          <main className={isPublicPage ? '' : 'container mx-auto px-4 py-8 max-w-7xl'}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/sign/:token" element={<SignaturePage />} />

              {/* Protected routes - All authenticated users */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/assignments" element={
                <ProtectedRoute>
                  <AssignmentsPage />
                </ProtectedRoute>
              } />

              {/* Protected routes - Staff and Admin only */}
              <Route path="/assets" element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <AssetsPage />
                </ProtectedRoute>
              } />
              <Route path="/handover" element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <HandoverPage />
                </ProtectedRoute>
              } />

              {/* Protected routes - Admin only */}
              <Route path="/users" element={
                <ProtectedRoute roles={['admin']}>
                  <UserManagementPage />
                </ProtectedRoute>
              } />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
