import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/global.css';
import useAuth from './shared/hooks/useAuth';
import Layout from './app/Layout';
import Login from './modules/auth/pages/Login';
import DashboardModule from './modules/dashboard';
import SettingsModule from './modules/settings';
import PortalModule from './modules/portal';
import DriverApp from './modules/driver-app';
import DispatchModule from './modules/dispatch';
import CustomersModule from './modules/customers';
import DocumentsModule from './modules/documents';
import LoadsModule from './modules/loads';
import QuotesModule from './modules/quotes';
import CarriersModule from './modules/carriers';
import DriversModule from './modules/drivers';
import DriverDocumentsPage from './modules/drivers/pages/DriverDocumentsPage';
import DriverTripsPage from './modules/drivers/pages/DriverTripsPage';
import DriverSettlementsPage from './modules/drivers/pages/DriverSettlementsPage';
import FleetModule from './modules/fleet';
import InvoicingModule from './modules/invoicing';
import AccountingModule from './modules/accounting';
import SettlementsModule from './modules/settlements';
import LocationsModule from './modules/locations';
import ModulePlaceholder from './shared/components/ModulePlaceholder';
import { Spinner } from './shared/components';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardModule />} />
        <Route path="/loads" element={<LoadsModule />} />
        <Route path="/dispatch" element={<DispatchModule />} />
        <Route path="/quotes" element={<QuotesModule />} />
        <Route path="/customers" element={<CustomersModule />} />
        <Route path="/carriers" element={<CarriersModule />} />
        <Route path="/locations" element={<LocationsModule />} />
        <Route path="/drivers" element={<DriversModule />} />
        <Route path="/drivers/:id/documents" element={<DriverDocumentsPage />} />
        <Route path="/drivers/:id/trips" element={<DriverTripsPage />} />
        <Route path="/drivers/:id/settlements" element={<DriverSettlementsPage />} />
        <Route path="/fleet" element={<FleetModule />} />
        <Route path="/invoicing" element={<InvoicingModule />} />
        <Route path="/invoices" element={<Navigate to="/invoicing" replace />} />
        <Route path="/accounting" element={<AccountingModule />} />
        <Route path="/settlements" element={<SettlementsModule />} />
        <Route path="/documents" element={<DocumentsModule />} />
        <Route path="/settings/*" element={<SettingsModule />} />
      </Routes>
    </Layout>
  );
}

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/portal" element={<PortalModule />} />
          <Route path="/driver" element={<DriverApp />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default App;
