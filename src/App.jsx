import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import Header from './components/Header'
import AssetsPage from './pages/AssetsPage'
import HandoverPage from './pages/HandoverPage'
import AssignmentsPage from './pages/AssignmentsPage'
import SignaturePage from './pages/SignaturePage'
import Dashboard from './pages/Dashboard'
import { initializeTheme } from './themes'

function App() {
  const [currentPage, setCurrentPage] = useState('assets')
  const location = useLocation()

  useEffect(() => {
    // Initialize theme on app load
    initializeTheme()
  }, [])

  // Check if current route is a public page (no header needed)
  const isPublicPage = location.pathname.startsWith('/sign/')

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-text-primary font-sans transition-colors duration-300">
        {!isPublicPage && <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />}
        <main className={isPublicPage ? '' : 'container mx-auto px-4 py-8 max-w-7xl'}>
          <Routes>
            <Route path="/" element={<Navigate to="/assets" replace />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/handover" element={<HandoverPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sign/:token" element={<SignaturePage />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  )
}

export default App
