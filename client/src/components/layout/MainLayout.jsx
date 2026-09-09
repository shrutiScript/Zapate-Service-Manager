import React from 'react';
import { ClientSidebar } from './ClientSidebar.jsx';
import { Header } from './Header.jsx';
import { ErrorBoundary } from '../common/ErrorBoundary.jsx';
import { AiFloatingAssistant } from './AiFloatingAssistant.jsx';

export const MainLayout = ({ children, title = 'Operational Workbench', subtitle = 'Shop Operations' }) => {
  React.useEffect(() => {
    document.title = title ? `Zapate Service Manager | ${title}` : 'Zapate Service Manager';
  }, [title]);

  return (
    <div className="app-shell">
      <ClientSidebar />
      <div className="main-content">
        <Header title={title} subtitle={subtitle} isAdmin={false} />
        <main className="page-container">
          <ErrorBoundary inLayout={true}>{children}</ErrorBoundary>
        </main>
      </div>
      <AiFloatingAssistant />
    </div>
  );
};

