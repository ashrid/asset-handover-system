import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import AssetsPage from './pages/AssetsPage'
import HandoverPage from './pages/HandoverPage'
import AssignmentsPage from './pages/AssignmentsPage'
import { initializeTheme } from './themes'

function App() {
  const [currentPage, setCurrentPage] = useState('assets')

  useEffect(() => {
    // Initialize theme on app load
    initializeTheme()
  }, [])

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans transition-colors duration-300">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Routes>
          <Route path="/" element={<Navigate to="/assets" replace />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/handover" element={<HandoverPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
