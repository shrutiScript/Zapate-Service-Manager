import React from 'react';
import { Link } from 'wouter';
import { Search, Bell, Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';

export const Header = ({ title, subtitle, isAdmin = false }) => {
  const { user } = useAuth();
  const { searchQuery, setSearchQuery, setIsMobileSidebarOpen } = useApp();

  const profileHref = isAdmin ? '/admin/settings?tab=security' : '/profile';

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          className="topbar-icon-btn"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="topbar-actions">
        <div className="search-input-box">
          <Search size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAdmin ? 'Search workshops, owners, logs...' : 'Search tickets, IMEI, customers...'}
          />
        </div>

        <button className="topbar-icon-btn" aria-label="Notifications" type="button">
          <Bell size={16} />
          <span className="notification-dot" />
        </button>

        <Link href={profileHref} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="profile-badge-chip" style={{ cursor: 'pointer' }} title="Profile & Security Settings">
            <div
              className="profile-avatar-mini"
              style={isAdmin ? { background: '#f59e0b', color: '#ffffff' } : {}}
            >
              {isAdmin ? <ShieldCheck size={14} /> : (user?.name ? user.name.slice(0, 2).toUpperCase() : 'SO')}
            </div>
            <span className="profile-badge-name">
              {user?.name || (isAdmin ? 'Super Admin' : 'Shop Owner')}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};


