import { useNavigate, useLocation } from 'react-router-dom'
import ThemeSwitcher from './ThemeSwitcher'

function Header({ currentPage, setCurrentPage }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigation = (page, path) => {
    setCurrentPage(page)
    navigate(path)
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="header-premium sticky top-0 z-40 mb-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Title Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold gradient-text mb-2 tracking-tight">
            Ajman University Asset Management
          </h1>
          <p className="text-text-secondary text-lg font-medium">
            Asset Handover System
          </p>
        </div>

        {/* Navigation & Theme Switcher Section */}
        <div className="flex items-center justify-center gap-4 flex-wrap relative">
          {/* Navigation Buttons */}
          <div className="flex gap-3 flex-wrap justify-center">
            {[
              { path: '/assets', label: 'Manage Assets', icon: 'fa-box' },
              { path: '/handover', label: 'Asset Handover', icon: 'fa-handshake' },
              { path: '/assignments', label: 'View Assignments', icon: 'fa-list-alt' }
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path.substring(1), item.path)}
                className={`nav-button flex items-center gap-2 ${isActive(item.path) ? 'active' : ''}`}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
