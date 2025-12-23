import { useState, useEffect, useRef } from 'react'
import { themes, applyTheme, getStoredTheme, getCompactMode, setCompactMode } from '../themes'

function ThemeSwitcher({ compact = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme())
  const [isCompactMode, setIsCompactMode] = useState(getCompactMode())
  const dropdownRef = useRef(null)

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName)
    applyTheme(themeName)
    setIsOpen(false)
  }

  const handleCompactModeToggle = () => {
    const newValue = !isCompactMode
    setIsCompactMode(newValue)
    setCompactMode(newValue)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`${compact ? 'nav-button-compact' : 'nav-button'} flex items-center gap-2`}
        onClick={() => setIsOpen(!isOpen)}
        title="Settings"
      >
        <i className="fas fa-cog"></i>
        {!compact && <span>Settings</span>}
        <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl bg-card border border overflow-hidden z-50 animate-scaleIn">
          {/* Display Mode Toggle */}
          <div className="p-3 border-b border-border">
            <div className="text-xs font-bold uppercase tracking-wider text-text-light mb-2">
              Display Mode
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => {
                  setIsCompactMode(false)
                  setCompactMode(false)
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  !isCompactMode
                    ? 'bg-primary text-white'
                    : 'bg-card text-text-secondary hover:bg-header-bg'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Modern
              </button>
              <button
                onClick={() => {
                  setIsCompactMode(true)
                  setCompactMode(true)
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isCompactMode
                    ? 'bg-primary text-white'
                    : 'bg-card text-text-secondary hover:bg-header-bg'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Compact
              </button>
            </div>
            <p className="text-xs text-text-light mt-2">
              {isCompactMode
                ? 'Data-dense layout for power users'
                : 'Spacious layout with animations'}
            </p>
          </div>

          {/* Theme Selection */}
          <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
            <div className="text-xs font-bold uppercase tracking-wider px-3 py-2 text-text-light">
              Color Theme
            </div>
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                  currentTheme === key
                    ? 'bg-primary-light border border-primary'
                    : 'hover:bg-primary-light/30 border border-transparent'
                }`}
                onClick={() => handleThemeChange(key)}
              >
                <div
                  className="w-8 h-8 rounded-lg border-2 flex-shrink-0 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    borderColor: currentTheme === key ? theme.colors.primary : 'transparent'
                  }}
                />
                <span className={`flex-1 text-left text-sm ${
                  currentTheme === key ? 'text-primary font-semibold' : 'text-text-primary'
                }`}>
                  {theme.name}
                </span>
                {currentTheme === key && (
                  <i className="fas fa-check text-success text-sm"></i>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeSwitcher
