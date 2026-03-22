import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login       from './pages/auth/Login';
import Dashboard   from './pages/dashboard/Dashboard';
import Customers   from './pages/customers/Customers';
import Loads       from './pages/loads/Loads';
import Dispatch    from './pages/dispatch/Dispatch';
import Quotes      from './pages/quotes/Quotes';
import Drivers     from './pages/drivers/Drivers';
import Fleet       from './pages/fleet/Fleet';
import Carriers    from './pages/carriers/Carriers';
import Invoicing   from './pages/invoicing/Invoicing';
import Settlements from './pages/settlements/Settlements';
import Documents   from './pages/documents/Documents';
import Settings    from './pages/settings/Settings';
import Portal    from './pages/portal/Portal';
import DriverApp from './pages/drivers/DriverApp';
import Expenses   from './pages/expenses/Expenses';
import Locations  from './pages/locations/Locations';
import './index.css';
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});
// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary] ${this.props.name || 'Page'} crashed:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: 40,
          fontFamily: 'system-ui, Arial, sans-serif',
        }}>
          <div style={{
            background: '#fff', border: '1px solid #ffcdd2', borderRadius: 8,
            padding: '32px 40px', maxWidth: 480, textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#B71C1C', marginBottom: 8 }}>
              {this.props.name || 'This page'} encountered an error
            </div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
              Something went wrong loading this module. The rest of Signal TMS
              is still working fine. Try refreshing this page.
            </div>
            {this.state.error && (
              <div style={{
                background: '#f5f5f5', borderRadius: 4, padding: '8px 12px',
                fontSize: 11, color: '#888', fontFamily: 'monospace',
                marginBottom: 20, textAlign: 'left', wordBreak: 'break-all',
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  padding: '8px 20px', background: '#003865', color: '#fff',
                  border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer',
                  fontWeight: 600,
                }}>
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  padding: '8px 20px', background: '#fff', color: '#003865',
                  border: '1px solid #003865', borderRadius: 4, fontSize: 13,
                  cursor: 'pointer',
                }}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
const Safe = ({ name, children }) => (
  <ErrorBoundary name={name}>{children}</ErrorBoundary>
);
const Protected = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard"   element={<Protected><Safe name="Dashboard">   <Dashboard />   </Safe></Protected>} />
      <Route path="/loads"       element={<Protected><Safe name="Loads">       <Loads />       </Safe></Protected>} />
      <Route path="/dispatch"    element={<Protected><Safe name="Dispatch">    <Dispatch />    </Safe></Protected>} />
      <Route path="/quotes"      element={<Protected><Safe name="Quotes">      <Quotes />      </Safe></Protected>} />
      <Route path="/customers"   element={<Protected><Safe name="Customers">   <Customers />   </Safe></Protected>} />
      <Route path="/carriers"    element={<Protected><Safe name="Carriers">    <Carriers />    </Safe></Protected>} />
      <Route path="/drivers"     element={<Protected><Safe name="Drivers">     <Drivers />     </Safe></Protected>} />
      <Route path="/fleet"       element={<Protected><Safe name="Fleet">       <Fleet />       </Safe></Protected>} />
      <Route path="/invoicing"   element={<Protected><Safe name="Invoicing">   <Invoicing />   </Safe></Protected>} />
      <Route path="/settlements" element={<Protected><Safe name="Settlements"> <Settlements /> </Safe></Protected>} />
      <Route path="/documents"   element={<Protected><Safe name="Documents">   <Documents />   </Safe></Protected>} />
      <Route path="/settings"    element={<Protected><Safe name="Settings">    <Settings />    </Safe></Protected>} />
      <Route path="/expenses"    element={<Protected><Safe name="Accounting">  <Expenses />    </Safe></Protected>} />
      <Route path="/locations"   element={<Protected><Safe name="Locations">   <Locations />   </Safe></Protected>} />
      {/* Public routes — no auth needed */}
      <Route path="/portal"   element={<Safe name="Customer Portal"><Portal /></Safe>} />
      <Route path="/portal/*" element={<Safe name="Customer Portal"><Portal /></Safe>} />
      <Route path="/driver"   element={<Safe name="Driver App"><DriverApp /></Safe>} />
      <Route path="/driver/*" element={<Safe name="Driver App"><DriverApp /></Safe>} />
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
export default function App() {
  return (
    <ErrorBoundary name="Signal TMS">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: { fontSize: 13, fontFamily: 'Open Sans, sans-serif' },
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
