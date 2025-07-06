import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, Box, Flex } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import theme from './theme';
import Sidebar from './components/shared/Sidebar';
import Header from './components/shared/Header';
import Dashboard from './pages/dashboard/Dashboard';
import FruitVegetableDashboard from './pages/dashboard/FruitVegetableDashboard';
import WholesaleDashboard from './pages/dashboard/WholesaleDashboard';
import CustomersManagement from './pages/customers/CustomersManagement';
import ActiveInvoices from './pages/invoices/ActiveInvoices';
import Reconciliation from './pages/reconciliation/Reconciliation';
import WholesaleAnalytics from './pages/analytics/WholesaleAnalytics';
import Settings from './pages/settings/Settings';
import SyncStatus from './pages/sync/SyncStatus';
import ProductsPage from './pages/inventory/ProductsPage';
import ModernProductsPage from './pages/inventory/ModernProductsPage';
import PassiveInvoicesPage from './pages/invoices/PassiveInvoicesPage';

// Configurazione React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuti
      cacheTime: 10 * 60 * 1000, // 10 minuti
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.status === 404 || error.status === 403) {
          return false;
        }
        return failureCount < 3;
      }
    }
  }
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Box minHeight="100vh" bg="gray.50">
            <Flex>
              {/* Sidebar */}
              <Sidebar />
              
              {/* Main Content */}
              <Box flex="1" ml="240px">
                <Header />
                
                <Box>
                  <Routes>
                    <Route path="/" element={<WholesaleDashboard />} />
                    <Route path="/dashboard" element={<WholesaleDashboard />} />
                    <Route path="/home" element={<WholesaleDashboard />} />
                    <Route path="/dashboard-old" element={<FruitVegetableDashboard />} />
                    <Route path="/customers" element={<CustomersManagement />} />
                    <Route path="/invoices/active" element={<ActiveInvoices />} />
                    <Route path="/invoices/passive" element={<PassiveInvoicesPage />} />
                    <Route path="/reconciliation" element={<Reconciliation />} />
                    <Route path="/analytics" element={<WholesaleAnalytics />} />
                    <Route path="/products" element={<ModernProductsPage />} />
                    <Route path="/products-old" element={<ProductsPage />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/sync" element={<SyncStatus />} />
                  </Routes>
                </Box>
              </Box>
            </Flex>
            
            {/* Toast Notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </Box>
        </Router>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;