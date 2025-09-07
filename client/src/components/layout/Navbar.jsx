import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
);

const MonitorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const DropdownLink = ({ to, onClick, children }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
  >
    {children}
  </Link>
);

const navLinkClasses = ({ isActive }) =>
  `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
    isActive
      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
  }`;

const mobileNavLinkClasses = ({ isActive }) =>
  `block px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
    isActive
      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
  }`;

const Navbar = () => {
  const { user, isAuthenticated, isOrganizer, isAdmin, isAttendee, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { to: '/events', label: 'Events', visible: true },
    { to: '/tickets', label: 'My Tickets', visible: isAuthenticated },
    { to: '/organizer', label: 'Dashboard', visible: isOrganizer },
    { to: '/admin', label: 'Admin', visible: isAdmin },
    { to: '/organizer/events/create', label: 'Create Event', visible: isOrganizer },
  ];

  const visibleLinks = navLinks.filter((link) => link.visible);

  const themeIcons = { light: <SunIcon />, dark: <MoonIcon />, system: <MonitorIcon /> };
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-xl font-bold shrink-0 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                EventBooking
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-2">
              {visibleLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClasses}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 transition-all"
                aria-label={`Current theme: ${theme}. Click to toggle.`}
                title={`Theme: ${theme}`}
              >
                {themeIcons[theme]}
              </button>

              {/* Desktop: auth buttons or user dropdown */}
              <div className="hidden md:flex items-center gap-3">
                {isAuthenticated ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-2 p-1.5 pl-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                      aria-haspopup="true"
                      aria-expanded={dropdownOpen}
                    >
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                        {user?.name}
                      </span>
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-inner" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shadow-inner">
                          {userInitial}
                        </div>
                      )}
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200/50 dark:border-slate-700/50 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                        </div>

                        <DropdownLink to="/tickets">My Tickets</DropdownLink>
                        {isOrganizer && (
                          <>
                            <DropdownLink to="/organizer">Dashboard</DropdownLink>
                            <DropdownLink to="/organizer/events/create">Create Event</DropdownLink>
                          </>
                        )}
                        {isAdmin && <DropdownLink to="/admin">Admin Panel</DropdownLink>}
                        <DropdownLink to="/settings">Settings</DropdownLink>

                        <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                        <button
                          onClick={logout}
                          className="w-full text-left px-5 py-2.5 text-sm font-semibold text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      to="/auth/login"
                      className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-primary-600 dark:text-slate-200 dark:hover:text-primary-400 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth/register"
                      className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-full hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-full text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileOpen ? <XIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden flex flex-col ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">EventBooking</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <XIcon />
          </button>
        </div>

        {/* User info (authenticated) */}
        {isAuthenticated && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold">
                {userInitial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {visibleLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={mobileNavLinkClasses}>
              {link.label}
            </NavLink>
          ))}

          {isAuthenticated && (
            <NavLink to="/settings" className={mobileNavLinkClasses}>
              Settings
            </NavLink>
          )}
        </nav>

        {/* Drawer footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold text-danger-500 bg-danger-50 hover:bg-danger-100 dark:bg-danger-900/20 dark:hover:bg-danger-900/40 transition-colors text-center"
            >
              Logout
            </button>
          ) : (
            <div className="space-y-3">
              <Link
                to="/auth/login"
                className="block w-full text-center px-4 py-3 text-sm font-bold text-slate-700 border-2 border-slate-200 rounded-xl hover:border-primary-600 hover:text-primary-600 dark:text-slate-200 dark:border-slate-700 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="block w-full text-center px-4 py-3 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-md shadow-primary-500/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navbar;
