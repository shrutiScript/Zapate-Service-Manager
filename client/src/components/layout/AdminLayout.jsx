import React from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import { Header } from './Header.jsx';
import { ErrorBoundary } from '../common/ErrorBoundary.jsx';

export const AdminLayout = ({ children, title = 'Platform Control Center', subtitle = 'Multi-Tenant Ecosystem' }) => {
  React.useEffect(() => {
    document.title = title ? `Zapate Service Manager | Super Admin — ${title}` : 'Zapate Service Manager | Super Admin';
  }, [title]);

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content">
        <Header title={title} subtitle={subtitle} isAdmin={true} />
        <main className="page-container">
          <ErrorBoundary inLayout={true}>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

