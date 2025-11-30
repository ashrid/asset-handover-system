import { useState, useEffect, useRef } from 'react'
import { themes, applyTheme, getStoredTheme } from '../themes'

function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme())
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="nav-button flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        <i className="fas fa-palette"></i>
        <span>Themes</span>
        <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl bg-card border border overflow-hidden z-50 animate-scaleIn">
          <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
            <div className="text-xs font-bold uppercase tracking-wider px-3 py-2 text-text-light">
              Select Theme
            </div>
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                className={`w-full px-3 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                  currentTheme === key
                    ? 'bg-primary-light border border-primary'
                    : 'hover:bg-primary-light/30 border border-transparent'
                }`}
                onClick={() => handleThemeChange(key)}
              >
                <div
                  className="w-10 h-10 rounded-lg border-2 flex-shrink-0 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    borderColor: currentTheme === key ? theme.colors.primary : 'transparent'
                  }}
                />
                <span className={`flex-1 text-left text-sm font-medium ${
                  currentTheme === key ? 'text-primary font-bold' : 'text-text-primary'
                }`}>
                  {theme.name}
                </span>
                {currentTheme === key && (
                  <i className="fas fa-check text-success font-bold"></i>
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
