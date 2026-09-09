import React from 'react';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
