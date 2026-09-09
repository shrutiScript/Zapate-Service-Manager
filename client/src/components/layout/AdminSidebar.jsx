import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Store,
  Activity,
  CreditCard,
  Layers,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const AdminSidebar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'All Workshops', path: '/admin/shops', icon: Store },
    { label: 'Admin Activity', path: '/admin/activity', icon: ClipboardList },
    { label: 'Login Activity', path: '/admin/login-activity', icon: Activity },
    { label: 'Subscription Plans', path: '/admin/subscriptions', icon: CreditCard },
    { label: 'Brands & Modules', path: '/admin/modules', icon: Layers },
    { label: 'System Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Global Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-head">
        <div className="brand-lockup">
          <div className="brand-mark" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)' }}>
            <ShieldCheck size={20} color="#ffffff" />
          </div>
          <div className="brand-text">
            <h2>Zapate</h2>
            <span style={{ color: '#f59e0b' }}>SERVICE MANAGER • ADMIN</span>
          </div>
        </div>
      </div>

      {/* Admin Scope Badge */}
      <div className="shop-switcher">
        <div className="shop-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          <ShieldCheck size={16} />
        </div>
        <div className="shop-details">
          <strong>Master Control</strong>
          <span>Platform Administrator</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-group">
        <span className="nav-label">Master Controls</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== '/admin/dashboard' && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path}>
              <button
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={isActive ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' } : {}}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="sidebar-bottom">
        <div
          className="user-profile-bar"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Link
            href="/admin/settings?tab=security"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: 'inherit',
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
            }}
            title="Manage Admin Profile & Security Password"
          >
            <div className="user-avatar" style={{ background: '#f59e0b', color: '#ffffff', flexShrink: 0 }}>
              SA
            </div>
            <div className="user-info" style={{ minWidth: 0 }}>
              <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                {user?.name || 'Super Admin'}
              </strong>
              <span style={{ fontSize: '11px', color: '#f59e0b' }}>Password & Security ⚙</span>
            </div>
          </Link>
          <button
            type="button"
            className="logout-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logout();
            }}
            title="Sign out of Admin session"
            aria-label="Sign out"
            style={{ flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
