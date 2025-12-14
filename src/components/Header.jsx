import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';

function Header({ currentPage, setCurrentPage }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll to minimize header on desktop
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (page, path) => {
    setCurrentPage(page);
    navigate(path);
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { path: '/assets', label: 'Manage Assets', icon: 'fa-box' },
    { path: '/handover', label: 'Asset Handover', icon: 'fa-handshake' },
    { path: '/assignments', label: 'View Assignments', icon: 'fa-list-alt' },
  ];

  return (
    <header className={`header-premium sticky top-0 z-40 mb-4 md:mb-8 animate-fadeIn transition-all duration-300 ${isScrolled ? 'header-minimized' : ''}`}>
      <div className={`max-w-7xl mx-auto px-4 relative transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4 md:py-6'}`}>
        {/* Mobile Hamburger Button */}
        <div className="lg:hidden absolute top-0 right-0 pt-4 pr-4 z-50">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? (
              <i className="fas fa-times text-xl" aria-hidden="true"></i>
            ) : (
              <i className="fas fa-bars text-xl" aria-hidden="true"></i>
            )}
          </button>
        </div>

        {/* Title Section - with padding for hamburger menu on mobile */}
        <div className={`text-center pr-12 lg:pr-0 transition-all duration-300 ${isScrolled ? 'lg:flex lg:items-center lg:justify-between lg:text-left' : ''}`}>
          <div>
            <h1 className={`font-bold gradient-text tracking-tight transition-all duration-300 leading-tight ${
              isScrolled
                ? 'text-base sm:text-lg md:text-xl lg:text-2xl mb-0'
                : 'text-base sm:text-xl md:text-2xl lg:text-4xl mb-1 sm:mb-2'
            }`}>
              <span className="hidden sm:inline">Ajman University </span>
              <span className="sm:hidden">AU </span>
              Asset Management
            </h1>
            <p className={`text-text-secondary font-medium transition-all duration-300 ${
              isScrolled
                ? 'text-xs hidden lg:block'
                : 'text-xs sm:text-sm md:text-base'
            }`}>
              Asset Handover System
            </p>
          </div>

          {/* Desktop Navigation - inline when scrolled */}
          {isScrolled && (
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path.substring(1), item.path)}
                  className={`nav-button-compact flex items-center gap-1.5 px-3 py-1.5 text-sm ${isActive(item.path) ? 'active' : ''}`}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span>{item.label}</span>
                </button>
              ))}
              <ThemeSwitcher compact />
            </nav>
          )}
        </div>

        {/* Desktop Navigation - full size when not scrolled */}
        {!isScrolled && (
          <nav className="hidden lg:flex items-center justify-center gap-3 flex-wrap mt-6">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path.substring(1), item.path)}
                className={`nav-button flex items-center gap-2 ${isActive(item.path) ? 'active' : ''}`}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
              </button>
            ))}
            <ThemeSwitcher />
          </nav>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="lg:hidden animate-fadeIn" id="mobile-menu">
          <nav className="px-2 pt-2 pb-4 space-y-2 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path.substring(1), item.path)}
                className={`w-full nav-button flex items-center gap-3 p-3 text-base ${isActive(item.path) ? 'active' : ''}`}
              >
                <i className={`fas ${item.icon} w-6 text-center`}></i>
                <span>{item.label}</span>
              </button>
            ))}
            <div className="flex justify-center pt-4">
              <ThemeSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
