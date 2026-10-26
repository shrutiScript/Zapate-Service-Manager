import React from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { AppLoading } from '../components/common/AppLoading.jsx';

// Landing Page
import { HomePage } from '../modules/landing/pages/HomePage.jsx';
import { AboutPage } from '../modules/landing/pages/AboutPage.jsx';

// Auth
import { LoginPage } from '../modules/auth/pages/LoginPage.jsx';
import { RegisterPage } from '../modules/auth/pages/RegisterPage.jsx';
import { ShopSetupPage } from '../modules/auth/pages/ShopSetupPage.jsx';
import { ForgotPasswordPage } from '../modules/auth/pages/ForgotPasswordPage.jsx';

// Fallback Redirection for unknown routes: routes authenticated users to their correct dashboard, or unauthenticated users to /login
const FallbackRedirect = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated && user) {
    return <Redirect to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  }
  return <Redirect to="/login" replace />;
};

// Super Admin Suite
import { AdminDashboardPage } from '../modules/admin/pages/AdminDashboardPage.jsx';
import { ShopManagementPage } from '../modules/admin/pages/ShopManagementPage.jsx';
import { ShopDetailsPage } from '../modules/admin/pages/ShopDetailsPage.jsx';
import { AdminActivityPage } from '../modules/admin/pages/AdminActivityPage.jsx';
import { LoginActivityPage } from '../modules/admin/pages/LoginActivityPage.jsx';
import { PlanManagementPage } from '../modules/admin/pages/PlanManagementPage.jsx';
import { ModuleManagementPage } from '../modules/admin/pages/ModuleManagementPage.jsx';
import { SystemReportsPage } from '../modules/admin/pages/SystemReportsPage.jsx';
import { GlobalSettingsPage } from '../modules/admin/pages/GlobalSettingsPage.jsx';

// Shop Owner Operational Suite
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage.jsx';
import { CustomerListPage } from '../modules/customers/pages/CustomerListPage.jsx';
import { RepairBoardPage } from '../modules/repairs/pages/RepairBoardPage.jsx';
import { DeviceListPage } from '../modules/devices/pages/DeviceListPage.jsx';
import { PosCheckoutPage } from '../modules/pos/pages/PosCheckoutPage.jsx';
import { InvoiceDetailsPage } from '../modules/pos/pages/InvoiceDetailsPage.jsx';
import { PaymentLedgerPage } from '../modules/payments/pages/PaymentLedgerPage.jsx';
import { InventoryShelfPage } from '../modules/inventory/pages/InventoryShelfPage.jsx';
import { SupplierProcurementPage } from '../modules/suppliers/pages/SupplierProcurementPage.jsx';
import { PurchaseHistoryPage } from '../modules/purchases/pages/PurchaseHistoryPage.jsx';
import { ReportAnalyticsPage } from '../modules/reports/pages/ReportAnalyticsPage.jsx';
import { SettingsPage } from '../modules/settings/pages/SettingsPage.jsx';
import { ProfilePage } from '../modules/profile/pages/ProfilePage.jsx';
import { CommunityPage } from '../modules/community/pages/CommunityPage.jsx';
import { AiDiagnosticPage } from '../modules/ai/pages/AiDiagnosticPage.jsx';
import { WarrantyListPage } from '../modules/warranties/pages/WarrantyListPage.jsx';

export const AppRoutes = () => {
  return (
    <Switch>
      {/* Auth Public Routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ForgotPasswordPage} />

      {/* Super Admin Control Suite */}
      <Route path="/admin/dashboard">
        <ProtectedRoute adminOnly={true}>
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/shops/:shopId">
        {(params) => (
          <ProtectedRoute adminOnly={true}>
            <ShopDetailsPage {...params} />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/shops">
        <ProtectedRoute adminOnly={true}>
          <ShopManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/activity">
        <ProtectedRoute adminOnly={true}>
          <AdminActivityPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/login-activity">
        <ProtectedRoute adminOnly={true}>
          <LoginActivityPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/subscriptions">
        <ProtectedRoute adminOnly={true}>
          <PlanManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/modules">
        <ProtectedRoute adminOnly={true}>
          <ModuleManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute adminOnly={true}>
          <SystemReportsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute adminOnly={true}>
          <GlobalSettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/profile">
        <ProtectedRoute adminOnly={true}>
          <GlobalSettingsPage defaultTab="security" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/security">
        <ProtectedRoute adminOnly={true}>
          <GlobalSettingsPage defaultTab="security" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute adminOnly={true}>
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>

      {/* Shop Owner Operational Workbench */}
      <Route path="/owner/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/owner">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/shop-setup">
        <ProtectedRoute>
          <ShopSetupPage />
        </ProtectedRoute>
      </Route>
      <Route path="/customers">
        <ProtectedRoute requiredModule="customers">
          <CustomerListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/repairs">
        <ProtectedRoute requiredModule="repairs">
          <RepairBoardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/repair-jobs">
        <ProtectedRoute requiredModule="repairs">
          <RepairBoardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/devices">
        <ProtectedRoute requiredModule="devices">
          <DeviceListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/pos">
        <ProtectedRoute requiredModule="pos">
          <PosCheckoutPage />
        </ProtectedRoute>
      </Route>
      <Route path="/pos-billing">
        <ProtectedRoute requiredModule="pos">
          <PosCheckoutPage />
        </ProtectedRoute>
      </Route>
      <Route path="/quick-sales">
        <ProtectedRoute requiredModule="pos">
          <PosCheckoutPage />
        </ProtectedRoute>
      </Route>
      <Route path="/pos/invoices/:id">
        <ProtectedRoute requiredModule="pos">
          <InvoiceDetailsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/invoices/:id">
        <ProtectedRoute requiredModule="pos">
          <InvoiceDetailsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/payments">
        <ProtectedRoute requiredModule="payments">
          <PaymentLedgerPage />
        </ProtectedRoute>
      </Route>
      <Route path="/payment-ledger">
        <ProtectedRoute requiredModule="payments">
          <PaymentLedgerPage />
        </ProtectedRoute>
      </Route>
      <Route path="/inventory">
        <ProtectedRoute requiredModule="inventory">
          <InventoryShelfPage />
        </ProtectedRoute>
      </Route>
      <Route path="/parts-inventory">
        <ProtectedRoute requiredModule="inventory">
          <InventoryShelfPage />
        </ProtectedRoute>
      </Route>
      <Route path="/suppliers">
        <ProtectedRoute requiredModule="suppliers">
          <SupplierProcurementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/purchases">
        <ProtectedRoute requiredModule="purchases">
          <PurchaseHistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/ai-diagnostic">
        <ProtectedRoute requiredModule="repairs">
          <AiDiagnosticPage />
        </ProtectedRoute>
      </Route>
      <Route path="/ai">
        <ProtectedRoute requiredModule="repairs">
          <AiDiagnosticPage />
        </ProtectedRoute>
      </Route>
      <Route path="/warranty">
        <ProtectedRoute requiredModule="warranties">
          <WarrantyListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/warranties">
        <ProtectedRoute requiredModule="warranties">
          <WarrantyListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/warranty-management">
        <ProtectedRoute requiredModule="warranties">
          <WarrantyListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute requiredModule="reports">
          <ReportAnalyticsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute requiredModule="settings">
          <SettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
      <Route path="/community">
        <ProtectedRoute requiredModule="community">
          <CommunityPage />
        </ProtectedRoute>
      </Route>

      {/* Entry Point & Public Landing Routes - Always accessible, never auto-redirected */}
      <Route path="/" component={HomePage} />
      <Route path="/home" component={HomePage} />
      <Route path="/landing" component={HomePage} />
      <Route path="/about" component={AboutPage} />

      {/* Fallback Route - Handles unknown routes deterministically */}
      <Route path="*">
        <FallbackRedirect />
      </Route>
    </Switch>
  );
};
