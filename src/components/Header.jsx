import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';
import { useAuth } from '../contexts/AuthContext';

function Header({ currentPage, setCurrentPage }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isStaff, logout } = useAuth();

  // Handle scroll to minimize header on desktop
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleNavigation = (page, path) => {
    setCurrentPage(page);
    navigate(path);
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Build nav items based on user role
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fa-chart-line', roles: ['admin', 'staff', 'viewer'] },
    { path: '/assets', label: 'Manage Assets', icon: 'fa-box', roles: ['admin', 'staff'] },
    { path: '/handover', label: 'Asset Handover', icon: 'fa-handshake', roles: ['admin', 'staff'] },
    { path: '/assignments', label: 'View Assignments', icon: 'fa-list-alt', roles: ['admin', 'staff', 'viewer'] },
    { path: '/users', label: 'User Management', icon: 'fa-users-cog', roles: ['admin'] },
  ].filter(item => item.roles.includes(user?.role));

  const getRoleBadgeColor = (role) => {
    // FIXED: Use theme variables instead of hardcoded Tailwind classes for consistent theming
    switch (role) {
      case 'admin': return 'bg-danger-light text-danger border-danger';
      case 'staff': return 'bg-info-light text-info border-info';
      case 'viewer': return 'bg-primary-light text-primary border-primary';
      default: return 'bg-primary-light text-primary border-primary';
    }
  };

  return (
    <header className={`header-premium sticky top-0 z-40 mb-4 md:mb-8 animate-fadeIn transition-all duration-300 ${isScrolled ? 'header-minimized' : ''}`}>
      <div className={`max-w-7xl mx-auto px-4 relative transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4 md:py-6'}`}>
        {/* Mobile Hamburger Button - position adjusts based on scroll state */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`lg:hidden absolute right-4 z-50 w-10 h-10 flex items-center justify-center rounded-lg text-text-primary hover:bg-black/5 active:bg-black/10 transition-all duration-300 ${
            isScrolled ? 'top-1' : 'top-4'
          }`}
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

        {/* Title Section - symmetric padding for hamburger menu on mobile */}
        <div className={`text-center px-12 lg:px-0 transition-all duration-300 ${isScrolled ? 'lg:flex lg:items-center lg:justify-between lg:text-left' : ''}`}>
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
            <nav className="hidden lg:flex items-center gap-1.5 flex-nowrap">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path.substring(1), item.path)}
                  className={`nav-button-compact flex items-center gap-1.5 ${isActive(item.path) ? 'active' : ''}`}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              ))}
              <ThemeSwitcher compact />
              {/* User Menu - Compact */}
              <div className="relative user-menu-container ml-2">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-secondary hover:bg-surface-tertiary transition-colors"
                >
                  <i className="fas fa-user-circle text-primary"></i>
                  <span className="text-sm font-medium text-text-primary max-w-[100px] truncate">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <i className={`fas fa-chevron-down text-xs text-text-secondary transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden z-50 animate-fadeIn"
                       style={{ background: 'var(--theme-cardBackground)', borderColor: 'var(--theme-border)' }}>
                    <div className="p-3 border-b" style={{ background: 'var(--theme-headerBg)', borderColor: 'var(--theme-border)' }}>
                      <p className="font-medium truncate" style={{ color: 'var(--theme-textPrimary)' }}>{user?.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--theme-textSecondary)' }}>{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                      </span>
                    </div>
                    <div className="py-1" style={{ background: 'var(--theme-cardBackground)' }}>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                        style={{ color: 'var(--theme-danger)' }}
                      >
                        <i className="fas fa-sign-out-alt"></i>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
            {/* User Menu - Full */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="nav-button flex items-center gap-2"
              >
                <i className="fas fa-user-circle"></i>
                <span className="max-w-[120px] truncate">{user?.name?.split(' ')[0] || 'User'}</span>
                <i className={`fas fa-chevron-down text-xs transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}></i>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg border overflow-hidden z-50 animate-fadeIn"
                     style={{ background: 'var(--theme-cardBackground)', borderColor: 'var(--theme-border)' }}>
                  <div className="p-4 border-b" style={{ background: 'var(--theme-headerBg)', borderColor: 'var(--theme-border)' }}>
                    <p className="font-semibold truncate" style={{ color: 'var(--theme-textPrimary)' }}>{user?.name}</p>
                    <p className="text-sm truncate" style={{ color: 'var(--theme-textSecondary)' }}>{user?.email}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--theme-textSecondary)' }}>ID: {user?.employeeId}</p>
                    <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </span>
                  </div>
                  <div className="py-2" style={{ background: 'var(--theme-cardBackground)' }}>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
                      style={{ color: 'var(--theme-danger)' }}
                    >
                      <i className="fas fa-sign-out-alt w-5 text-center"></i>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="lg:hidden animate-fadeIn" id="mobile-menu">
          <nav className="px-2 pt-2 pb-4 space-y-2 sm:px-3">
            {/* User Info Card - Mobile */}
            <div className="card p-3 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <i className="fas fa-user text-primary"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">{user?.name}</p>
                <p className="text-xs text-text-secondary truncate">{user?.email}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>

            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path.substring(1), item.path)}
                className={`w-full flex items-center gap-3 p-3 text-base rounded-lg font-medium transition-all ${
                  isActive(item.path)
                    ? 'text-white shadow-md'
                    : 'text-text-secondary hover:text-primary border border-border'
                }`}
                style={{
                  backgroundColor: isActive(item.path) ? 'var(--theme-primary)' : 'var(--theme-cardBackground)'
                }}
              >
                <i className={`fas ${item.icon} w-6 text-center`}></i>
                <span>{item.label}</span>
              </button>
            ))}

            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <ThemeSwitcher />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ color: 'var(--theme-danger)' }}
              >
                <i className="fas fa-sign-out-alt"></i>
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
