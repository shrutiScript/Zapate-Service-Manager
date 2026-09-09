import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Wrench, ArrowRight, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';

export const HomeNavbar = () => {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (isAdmin) return '/admin/dashboard';
    return '/dashboard';
  };

  const handleLinkClick = (path) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      if (window.location.pathname !== '/') {
        setLocation(path);
      } else {
        const id = path.replace('/#', '');
        const elem = document.getElementById(id);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      setLocation(path);
    }
  };

  return (
    <header className={`dark-header ${isScrolled ? 'dark-header-scrolled' : ''}`}>
      <div className="simple-container dark-header-container">
        {/* Brand Logo */}
        <Link href="/" className="dark-logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="dark-logo-icon">
            <Wrench size={20} />
          </div>
          <div className="dark-logo-text">
            <span>Zapate</span> Service Manager
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="dark-nav">
          <Link href="/" className="dark-nav-link" onClick={() => handleLinkClick('/')}>
            Home
          </Link>
          <a
            href="/#features"
            className="dark-nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/#features');
            }}
          >
            Features
          </a>
          <a
            href="/#how-it-works"
            className="dark-nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/#how-it-works');
            }}
          >
            How it Works
          </a>
          <a
            href="/#plans"
            className="dark-nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/#plans');
            }}
          >
            Plans
          </a>
          <Link href="/about" className="dark-nav-link" onClick={() => handleLinkClick('/about')}>
            About Us
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="dark-actions">
          {isAuthenticated && user ? (
            <Link href={getDashboardPath()} className="dark-btn dark-btn-primary">
              <LayoutDashboard size={16} />
              <span>{isAdmin ? 'Admin Console' : 'Open Dashboard'}</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="dark-btn dark-btn-ghost">
                Sign In
              </Link>
              <Link href="/register" className="dark-btn dark-btn-primary">
                <span>Get Started Free</span>
                <ArrowRight size={14} />
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="dark-mobile-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="dark-mobile-menu">
          <Link href="/" className="dark-mobile-link" onClick={() => handleLinkClick('/')}>
            Home
          </Link>
          <a
            href="/#features"
            className="dark-mobile-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/#features');
            }}
          >
            Features
          </a>
          <a
            href="/#how-it-works"
            className="dark-mobile-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/#how-it-works');
            }}
          >
            How it Works
          </a>
          <a
            href="/#plans"
            className="dark-mobile-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/#plans');
            }}
          >
            Plans
          </a>
          <Link href="/about" className="dark-mobile-link" onClick={() => handleLinkClick('/about')}>
            About Us
          </Link>

          <div className="dark-mobile-actions">
            {isAuthenticated && user ? (
              <Link href={getDashboardPath()} className="dark-btn dark-btn-primary dark-btn-full">
                <LayoutDashboard size={16} />
                <span>{isAdmin ? 'Admin Console' : 'Open Dashboard'}</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="dark-btn dark-btn-outline dark-btn-full">
                  Sign In
                </Link>
                <Link href="/register" className="dark-btn dark-btn-primary dark-btn-full">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeNavbar;
