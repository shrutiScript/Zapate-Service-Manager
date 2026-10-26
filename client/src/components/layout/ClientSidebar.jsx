import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Users,
  Wrench,
  ShieldCheck,
  Receipt,
  CreditCard,
  Package,
  BarChart2,
  Settings,
  User,
  LogOut,
  MessagesSquare,
  ChevronsUpDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';

export const ClientSidebar = () => {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { isModuleEnabled, isMobileSidebarOpen, setIsMobileSidebarOpen } = useApp();

  const allNavItems = [
    { label: 'Dashboard', path: '/dashboard', moduleKey: 'dashboard', icon: LayoutDashboard },
    { label: 'Customers CRM', path: '/customers', moduleKey: 'customers', icon: Users },
    { label: 'Repair Jobs', path: '/repairs', moduleKey: 'repairs', icon: Wrench },
    { label: 'Warranty Management', path: '/warranties', moduleKey: 'warranties', icon: ShieldCheck },
    { label: 'Quick Sales', path: '/pos', moduleKey: 'pos', icon: Receipt },
    { label: 'Payments & Due', path: '/payments', moduleKey: 'payments', icon: CreditCard },
    { label: 'Parts Inventory', path: '/inventory', moduleKey: 'inventory', icon: Package },
    { label: 'Reports & Analytics', path: '/reports', moduleKey: 'reports', icon: BarChart2 },
    { label: 'Repair Community', path: '/community', moduleKey: 'community', icon: MessagesSquare },
    { label: 'Shop Settings', path: '/settings', moduleKey: 'settings', icon: Settings },
    { label: 'My Profile', path: '/profile', moduleKey: 'profile', icon: User },
  ];

  const visibleNavItems = allNavItems.filter((item) => {
    if (item.moduleKey === 'dashboard' || item.moduleKey === 'profile') {
      return true;
    }
    return isModuleEnabled(item.moduleKey);
  });

  return (
    <aside className={`sidebar ${isMobileSidebarOpen ? 'is-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-head">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Wrench size={18} />
          </div>
          <div className="brand-text">
            <h2>Zapate</h2>
            <span>SERVICE MANAGER</span>
          </div>
        </div>
      </div>

      {/* Workshop Switcher Badge */}
      <div className="shop-switcher" title="Active Workshop Station">
        <div className="shop-avatar">
          {user?.shopName ? user.shopName.charAt(0).toUpperCase() : 'W'}
        </div>
        <div className="shop-details">
          <div className="shop-name-row">
            <strong>{user?.shopName || (user?.role === 'SUPER_ADMIN' ? 'Platform Control' : 'Shop Setup Required')}</strong>
            <span className="shop-status-dot" title="Active Station" />
          </div>
          <span>{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : `Owner • ${user?.name || 'Technician'}`}</span>
        </div>
        <ChevronsUpDown size={14} className="shop-switcher-chevron" />
      </div>

      {/* Navigation Links */}
      <div className="nav-group">
        <span className="nav-label">Workshop Operations</span>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== '/' && location.startsWith(`${item.path}/`));
          return (
            <Link key={item.path} href={item.path}>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>

      {/* User Profile Bar */}
      <div className="sidebar-bottom">
        <div className="user-profile-bar">
          <div className="user-avatar">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SO'}
          </div>
          <div className="user-info">
            <strong>{user?.name || 'Shop Owner'}</strong>
            <span>Workshop Owner</span>
          </div>
          <button
            type="button"
            className="logout-btn"
            onClick={logout}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
