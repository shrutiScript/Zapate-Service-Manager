import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Search,
  Bell,
  ShieldCheck,
  CheckCheck,
  AlertTriangle,
  Clock,
  MessageSquare,
  X,
  Wrench,
  Users,
  Package,
  Smartphone,
  FileText,
  Shield,
  Store,
  Compass,
  ArrowRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import api from '../../services/api.js';
import { formatDateDMY, formatTime12h } from '../../utils/formatters.js';

export const Header = ({ title, subtitle, isAdmin = false }) => {
  const { user, currentShop } = useAuth();
  const { searchQuery, setSearchQuery } = useApp();
  const [, setLocation] = useLocation();

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Global OmniSearch Spotlight State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const profileHref = isAdmin ? '/admin/settings?tab=security' : '/profile';

  // ── NOTIFICATIONS FETCHING ──
  const fetchNotifications = async () => {
    if (isAdmin) return;
    try {
      const data = await api.get('/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch {
      // In-app notifications fetch silent fail if module not applicable
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // ── GLOBAL SHORTCUTS: Ctrl+K / Cmd+K and Esc ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── DEBOUNCED GLOBAL OMNI-SEARCH QUERY ──
  useEffect(() => {
    const trimmed = (searchQuery || '').trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res?.data) {
          setSearchResults(res.data);
        } else if (res?.categories) {
          setSearchResults(res);
        }
      } catch (err) {
        console.error('OmniSearch failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Flattened results for keyboard navigation (ArrowUp, ArrowDown, Enter)
  const flattenedItems = useMemo(() => {
    if (!searchResults?.categories) return [];
    const list = [];
    const cats = searchResults.categories;

    if (cats.quickNav?.length) {
      cats.quickNav.forEach((item) => list.push({ ...item, group: 'Quick Navigation' }));
    }
    if (cats.repairs?.length) {
      cats.repairs.forEach((item) => list.push({ ...item, group: 'Repairs' }));
    }
    if (cats.customers?.length) {
      cats.customers.forEach((item) => list.push({ ...item, group: 'Customers' }));
    }
    if (cats.inventory?.length) {
      cats.inventory.forEach((item) => list.push({ ...item, group: 'Inventory' }));
    }
    if (cats.devices?.length) {
      cats.devices.forEach((item) => list.push({ ...item, group: 'Devices' }));
    }
    if (cats.invoices?.length) {
      cats.invoices.forEach((item) => list.push({ ...item, group: 'Invoices' }));
    }
    if (cats.warranties?.length) {
      cats.warranties.forEach((item) => list.push({ ...item, group: 'Warranties' }));
    }
    if (cats.shops?.length) {
      cats.shops.forEach((item) => list.push({ ...item, group: 'Workshops' }));
    }

    return list;
  }, [searchResults]);

  // Reset selected item index on query change
  useEffect(() => {
    setSelectedItemIndex(0);
  }, [searchQuery]);

  // Handle Search Input Keyboard Navigation
  const handleSearchKeyDown = (e) => {
    if (!isSearchOpen) {
      if (e.key === 'ArrowDown') setIsSearchOpen(true);
      return;
    }

    const maxItems = flattenedItems.length + (searchQuery.trim() ? 1 : 0); // +1 for banner
    if (maxItems === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedItemIndex((prev) => (prev + 1) % maxItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedItemIndex((prev) => (prev - 1 + maxItems) % maxItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // If banner is selected (index 0 when query present)
      if (searchQuery.trim() && selectedItemIndex === 0) {
        setIsSearchOpen(false);
      } else {
        const itemIdx = searchQuery.trim() ? selectedItemIndex - 1 : selectedItemIndex;
        const target = flattenedItems[itemIdx];
        if (target?.url) {
          setIsSearchOpen(false);
          setLocation(target.url);
        }
      }
    }
  };

  // Close search and notif dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter((n) => n.status !== 'Read').length;

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status: 'Read' } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'Read' })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Helper to get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'repairs':
        return <Wrench size={15} />;
      case 'customers':
        return <Users size={15} />;
      case 'inventory':
        return <Package size={15} />;
      case 'devices':
        return <Smartphone size={15} />;
      case 'invoices':
        return <FileText size={15} />;
      case 'warranties':
        return <Shield size={15} />;
      case 'shops':
        return <Store size={15} />;
      default:
        return <Compass size={15} />;
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left-zone">
        {/* Dynamic Breadcrumbs & Section Title */}
        <div className="topbar-breadcrumb-wrap">
          <div className="topbar-breadcrumbs">
            <span className="topbar-crumb-parent">
              {isAdmin ? 'System Control' : (user?.shopName || currentShop?.name || 'Workshop Station')}
            </span>
            <span className="topbar-crumb-sep">/</span>
            <span className="topbar-crumb-current">{title || 'Operational Hub'}</span>
          </div>
          {subtitle && <span className="topbar-subtitle-hint">{subtitle}</span>}
        </div>
      </div>

      <div className="topbar-actions">
        {/* ── GLOBAL OMNI-SEARCH SPOTLIGHT BAR ── */}
        <div className="omni-search-container" ref={searchContainerRef}>
          <div className="omni-search-box">
            <span className="search-icon">
              {isSearching ? <Loader2 size={14} className="spin-icon" /> : <Search size={14} />}
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder={isAdmin ? 'Universal search: shops, owners, logs...' : 'Search tickets, IMEI, customers, stock...'}
              aria-label="Universal Website Search"
            />
            <div className="search-actions-right">
              {searchQuery && (
                <button
                  type="button"
                  className="omni-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults(null);
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search (Esc)"
                >
                  <X size={13} />
                </button>
              )}
              <kbd className="omni-kbd-hint">Ctrl K</kbd>
            </div>
          </div>

          {/* ── SPOTLIGHT SEARCH RESULTS FLOATING DROPDOWN ── */}
          {isSearchOpen && (searchQuery.trim().length > 0 || searchResults) && (
            <div className="omni-spotlight-dropdown">
              {/* Quick Action: Filter current page banner */}
              {searchQuery.trim() && (
                <div
                  className={`omni-filter-page-banner ${selectedItemIndex === 0 ? 'active-kb' : ''}`}
                  onClick={() => setIsSearchOpen(false)}
                >
                  <div className="omni-filter-banner-text">
                    <Filter size={14} />
                    <span>Filter active page view for: <strong>"{searchQuery}"</strong></span>
                  </div>
                  <span className="omni-filter-banner-badge">Apply (↵)</span>
                </div>
              )}

              {/* Real-time Result List */}
              {isSearching && !searchResults ? (
                <div className="omni-empty">
                  <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 8px', color: '#2563eb' }} />
                  <p>Searching tickets, inventory, customers...</p>
                </div>
              ) : searchResults && searchResults.totalCount === 0 ? (
                <div className="omni-empty">
                  <div className="omni-empty-icon">
                    <Search size={20} />
                  </div>
                  <h4>No exact matches found</h4>
                  <p>Try searching by ticket # (e.g. RF-2401), customer phone, part SKU, or model.</p>
                </div>
              ) : (
                <>
                  {/* Category: Quick Navigation */}
                  {searchResults?.categories?.quickNav?.length > 0 && (
                    <div className="omni-group">
                      <div className="omni-group-header">
                        <span>Quick Navigation</span>
                        <span className="omni-group-count">{searchResults.categories.quickNav.length}</span>
                      </div>
                      {searchResults.categories.quickNav.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          onClick={() => setIsSearchOpen(false)}
                          className="omni-item"
                        >
                          <div className="omni-item-left">
                            <div className="omni-item-icon-box omni-icon-quickNav">
                              <Compass size={15} />
                            </div>
                            <div className="omni-item-content">
                              <div className="omni-item-title-row">
                                <span className="omni-item-title">{item.title}</span>
                              </div>
                              <div className="omni-item-subtitle">{item.subtitle}</div>
                            </div>
                          </div>
                          <div className="omni-item-right">
                            <span className="omni-pill omni-pill-secondary">{item.badge}</span>
                            <span className="omni-item-meta" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              Go <ArrowRight size={10} />
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Category: Repairs */}
                  {searchResults?.categories?.repairs?.length > 0 && (
                    <div className="omni-group">
                      <div className="omni-group-header">
                        <span>Repair Jobs & Tickets</span>
                        <span className="omni-group-count">{searchResults.categories.repairs.length}</span>
                      </div>
                      {searchResults.categories.repairs.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          onClick={() => setIsSearchOpen(false)}
                          className="omni-item"
                        >
                          <div className="omni-item-left">
                            <div className="omni-item-icon-box omni-icon-repairs">
                              <Wrench size={15} />
                            </div>
                            <div className="omni-item-content">
                              <div className="omni-item-title-row">
                                <span className="omni-item-title">{item.title}</span>
                              </div>
                              <div className="omni-item-subtitle">{item.subtitle}</div>
                            </div>
                          </div>
                          <div className="omni-item-right">
                            <span className={`omni-pill omni-pill-${item.badgeVariant || 'primary'}`}>
                              {item.badge}
                            </span>
                            {item.extra?.amount ? (
                              <span className="omni-item-meta">₹{item.extra.amount}</span>
                            ) : null}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Category: Customers */}
                  {searchResults?.categories?.customers?.length > 0 && (
                    <div className="omni-group">
                      <div className="omni-group-header">
                        <span>Customers & CRM</span>
                        <span className="omni-group-count">{searchResults.categories.customers.length}</span>
                      </div>
                      {searchResults.categories.customers.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          onClick={() => setIsSearchOpen(false)}
                          className="omni-item"
                        >
                          <div className="omni-item-left">
                            <div className="omni-item-icon-box omni-icon-customers">
                              <Users size={15} />
                            </div>
                            <div className="omni-item-content">
                              <div className="omni-item-title-row">
                                <span className="omni-item-title">{item.title}</span>
                              </div>
                              <div className="omni-item-subtitle">{item.subtitle}</div>
                            </div>
                          </div>
                          <div className="omni-item-right">
                            <span className={`omni-pill omni-pill-${item.badgeVariant || 'success'}`}>
                              {item.badge}
                            </span>
                            <span className="omni-item-meta">{item.meta}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Category: Inventory / Spare Parts */}
                  {searchResults?.categories?.inventory?.length > 0 && (
                    <div className="omni-group">
                      <div className="omni-group-header">
                        <span>Spare Parts & Stock</span>
                        <span className="omni-group-count">{searchResults.categories.inventory.length}</span>
                      </div>
                      {searchResults.categories.inventory.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          onClick={() => setIsSearchOpen(false)}
                          className="omni-item"
                        >
                          <div className="omni-item-left">
                            <div className="omni-item-icon-box omni-icon-inventory">
                              <Package size={15} />
                            </div>
                            <div className="omni-item-content">
                              <div className="omni-item-title-row">
                                <span className="omni-item-title">{item.title}</span>
                              </div>
                              <div className="omni-item-subtitle">{item.subtitle}</div>
                            </div>
                          </div>
                          <div className="omni-item-right">
                            <span className={`omni-pill omni-pill-${item.badgeVariant || 'warning'}`}>
                              {item.badge}
                            </span>
                            <span className="omni-item-meta">{item.meta}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Category: Devices */}
                  {searchResults?.categories?.devices?.length > 0 && (
                    <div className="omni-group">
                      <div className="omni-group-header">
                        <span>Device Intake Registry</span>
                        <span className="omni-group-count">{searchResults.categories.devices.length}</span>
                      </div>
                      {searchResults.categories.devices.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          onClick={() => setIsSearchOpen(false)}
                          className="omni-item"
                        >
                          <div className="omni-item-left">
                            <div className="omni-item-icon-box omni-icon-devices">
                              <Smartphone size={15} />
                            </div>
                            <div className="omni-item-content">
                              <div className="omni-item-title-row">
                                <span className="omni-item-title">{item.title}</span>
                              </div>
                              <div className="omni-item-subtitle">{item.subtitle}</div>
                            </div>
                          </div>
                          <div className="omni-item-right">
                            <span className="omni-pill omni-pill-secondary">{item.badge}</span>
                            <span className="omni-item-meta">{item.meta}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Category: Invoices */}
                  {searchResults?.categories?.invoices?.length > 0 && (
                    <div className="omni-group">
                      <div className="omni-group-header">
                        <span>POS Invoices & Sales</span>
                        <span className="omni-group-count">{searchResults.categories.invoices.length}</span>
                      </div>
                      {searchResults.categories.invoices.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          onClick={() => setIsSearchOpen(false)}
                          className="omni-item"
                        >
                          <div className="omni-item-left">
                            <div className="omni-item-icon-box omni-icon-invoices">
                              <FileText size={15} />
                            </div>
                            <div className="omni-item-content">
                              <div className="omni-item-title-row">
                                <span className="omni-item-title">{item.title}</span>
                              </div>
                              <div className="omni-item-subtitle">{item.subtitle}</div>
                            </div>
                          </div>
                          <div className="omni-item-right">
                            <span className={`omni-pill omni-pill-${item.badgeVariant || 'success'}`}>
                              {item.badge}
                            </span>
                            <span className="omni-item-meta">{item.meta}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Category: Warranties */}
                  {searchResults?.categories?.warranties?.length > 0 && (
                    <div className="omni-group">
                      <div className="omni-group-header">
                        <span>Warranty Certificates</span>
                        <span className="omni-group-count">{searchResults.categories.warranties.length}</span>
                      </div>
                      {searchResults.categories.warranties.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          onClick={() => setIsSearchOpen(false)}
                          className="omni-item"
                        >
                          <div className="omni-item-left">
                            <div className="omni-item-icon-box omni-icon-warranties">
                              <Shield size={15} />
                            </div>
                            <div className="omni-item-content">
                              <div className="omni-item-title-row">
                                <span className="omni-item-title">{item.title}</span>
                              </div>
                              <div className="omni-item-subtitle">{item.subtitle}</div>
                            </div>
                          </div>
                          <div className="omni-item-right">
                            <span className={`omni-pill omni-pill-${item.badgeVariant || 'primary'}`}>
                              {item.badge}
                            </span>
                            <span className="omni-item-meta">{item.meta}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Category: Shops (Admin Only) */}
                  {searchResults?.categories?.shops?.length > 0 && (
                    <div className="omni-group">
                      <div className="omni-group-header">
                        <span>Tenant Workshops</span>
                        <span className="omni-group-count">{searchResults.categories.shops.length}</span>
                      </div>
                      {searchResults.categories.shops.map((item) => (
                        <Link
                          key={item.id}
                          href={item.url}
                          onClick={() => setIsSearchOpen(false)}
                          className="omni-item"
                        >
                          <div className="omni-item-left">
                            <div className="omni-item-icon-box omni-icon-shops">
                              <Store size={15} />
                            </div>
                            <div className="omni-item-content">
                              <div className="omni-item-title-row">
                                <span className="omni-item-title">{item.title}</span>
                              </div>
                              <div className="omni-item-subtitle">{item.subtitle}</div>
                            </div>
                          </div>
                          <div className="omni-item-right">
                            <span className="omni-pill omni-pill-primary">{item.badge}</span>
                            <span className="omni-item-meta">{item.meta}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Spotlight Dropdown Footer */}
              <div className="omni-footer">
                <span>Total results: {searchResults?.totalCount || 0}</span>
                <div className="omni-footer-hints">
                  <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
                  <span><kbd>↵</kbd> select</span>
                  <span><kbd>esc</kbd> close</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Telemetry Station Indicator */}
        <div className="topbar-live-pill" title="System operational and connected">
          <span className="topbar-live-dot" />
          <span>Active Station</span>
        </div>

        {/* Notifications Bell & Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="topbar-icon-btn"
            aria-label="Notifications"
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            style={{ position: 'relative' }}
          >
            <Bell size={16} />
            {unreadCount > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '800',
                  borderRadius: '10px',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #ffffff',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '360px',
                maxHeight: '460px',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={15} style={{ color: '#2563eb' }} />
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>In-App Notifications</strong>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontWeight: '700',
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              {/* Scrollable list */}
              <div style={{ overflowY: 'auto', flex: 1, maxHeight: '340px' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                    <MessageSquare size={28} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>No notifications right now</p>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>You are completely caught up!</span>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => {
                    const isSubAlert =
                      n.type === 'Subscription Alert' ||
                      n.type === 'Subscription Expiry' ||
                      String(n.type || '').toLowerCase().includes('subscription');
                    const isUnread = n.status !== 'Read';

                    return (
                      <div
                        key={n._id}
                        onClick={() => handleMarkAsRead(n._id)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: isSubAlert ? (isUnread ? '#fffbeb' : '#ffffff') : isUnread ? '#f8fafc' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: isSubAlert ? '#fef3c7' : '#eff6ff',
                            color: isSubAlert ? '#d97706' : '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          {isSubAlert ? <AlertTriangle size={15} /> : <MessageSquare size={15} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <strong
                              style={{
                                fontSize: '12.5px',
                                color: isSubAlert ? '#b45309' : '#0f172a',
                                fontWeight: isUnread ? '700' : '600',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {n.title}
                            </strong>
                            {isUnread && (
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: isSubAlert ? '#d97706' : '#2563eb',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </div>

                          <p
                            style={{
                              margin: '4px 0 0',
                              fontSize: '11.5px',
                              color: '#475569',
                              lineHeight: 1.4,
                              wordBreak: 'break-word',
                            }}
                          >
                            {n.message}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '10px',
                              color: '#94a3b8',
                              marginTop: '6px',
                            }}
                          >
                            <Clock size={10} />
                            <span>
                              {formatDateDMY(n.sentAt || n.createdAt)} at {formatTime12h(n.sentAt || n.createdAt)}
                            </span>
                            {n.channel && <span>• {n.channel}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '10px 16px',
                  borderTop: '1px solid #e2e8f0',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                }}
              >
                <Link
                  href="/notifications"
                  onClick={() => setIsDropdownOpen(false)}
                  style={{
                    fontSize: '11.5px',
                    color: '#2563eb',
                    fontWeight: '700',
                    textDecoration: 'none',
                  }}
                >
                  Go to Notification Center →
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link href={profileHref} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="profile-badge-chip" style={{ cursor: 'pointer' }} title="Profile & Security Settings">
            <div
              className="profile-avatar-mini"
              style={isAdmin ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#ffffff' } : {}}
            >
              {isAdmin ? <ShieldCheck size={14} /> : (user?.name ? user.name.slice(0, 2).toUpperCase() : 'SO')}
              <span className="profile-mini-online" />
            </div>
            <div className="profile-chip-meta">
              <span className="profile-badge-name">
                {user?.name || (isAdmin ? 'Super Admin' : 'Shop Owner')}
              </span>
              <span className="profile-badge-role">
                {isAdmin ? 'System Admin' : 'Workshop Owner'}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
};
