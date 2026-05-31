import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { OwnerProvider } from './context/OwnerContext';
import { CustomerProvider } from './context/CustomerContext';
import Layout from './components/Layout';
import CustomerLayout from './components/CustomerLayout';
import OwnerLayout from './components/OwnerLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { getAppType, getRestaurantSlug, getRenderServiceName } from './utils/subdomain';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddRestaurant = lazy(() => import('./pages/AddRestaurant'));
const AllRestaurants = lazy(() => import('./pages/AllRestaurants'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const AllOrders = lazy(() => import('./pages/AllOrders'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Broadcast = lazy(() => import('./pages/Broadcast'));
const PaymentSettingsPage = lazy(() => import('./pages/PaymentSettings'));
const RestaurantPage = lazy(() => import('./pages/customer/RestaurantPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const OrderTrackingPage = lazy(() => import('./pages/customer/OrderTrackingPage'));
const LoginPage = lazy(() => import('./pages/customer/LoginPage'));
const SignupPage = lazy(() => import('./pages/customer/SignupPage'));
const AccountPage = lazy(() => import('./pages/customer/AccountPage'));
const FoodDetail = lazy(() => import('./pages/customer/FoodDetail'));
const OwnerDashboard = lazy(() => import('./pages/owner/Dashboard'));
const MenuManagement = lazy(() => import('./pages/owner/MenuManagement'));
const OwnerOrders = lazy(() => import('./pages/owner/Orders'));
const OwnerSettings = lazy(() => import('./pages/owner/Settings'));
const OwnerLogin = lazy(() => import('./pages/owner/Login'));
const Landing = lazy(() => import('./pages/Landing'));

function PageLoader() {
  return (
    <div className="h-dvh flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#FF6B35]" />
    </div>
  );
}

function CustomerSubdomainRoutes({ slug }) {
  return (
    <CustomerProvider slug={slug}>
      <CustomerLayout slug={slug}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<RestaurantPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:orderId" element={<OrderTrackingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/item/:itemId" element={<FoodDetail />} />
          </Routes>
        </Suspense>
      </CustomerLayout>
    </CustomerProvider>
  );
}

function OwnerSubdomainRoutes() {
  return (
    <OwnerProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/owner/login" element={<Navigate to="/login" replace />} />
          <Route path="/owner" element={<Navigate to="/" replace />} />
          <Route path="/owner/*" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<OwnerLogin />} />
          <Route path="/" element={<OwnerLayout />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="orders" element={<OwnerOrders />} />
            <Route path="settings" element={<OwnerSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </OwnerProvider>
  );
}

function PublicRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/r/:slug" element={<CustomerLayout><RestaurantPage /></CustomerLayout>} />
        <Route path="/r/:slug/cart" element={<CustomerLayout><CartPage /></CustomerLayout>} />
        <Route path="/r/:slug/checkout" element={<CustomerLayout><CheckoutPage /></CustomerLayout>} />
        <Route path="/r/:slug/order/:orderId" element={<CustomerLayout><OrderTrackingPage /></CustomerLayout>} />
        <Route path="/r/:slug/login" element={<CustomerLayout><LoginPage /></CustomerLayout>} />
        <Route path="/r/:slug/signup" element={<CustomerLayout><SignupPage /></CustomerLayout>} />
        <Route path="/r/:slug/account" element={<CustomerLayout><AccountPage /></CustomerLayout>} />
        <Route path="/r/:slug/item/:itemId" element={<CustomerLayout><FoodDetail /></CustomerLayout>} />

        <Route path="/owner/login" element={<OwnerProvider><OwnerLogin /></OwnerProvider>} />
        <Route path="/owner" element={<OwnerProvider><OwnerLayout /></OwnerProvider>}>
          <Route index element={<OwnerDashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="orders" element={<OwnerOrders />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function PathBasedRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/r/:slug" element={<CustomerLayout><RestaurantPage /></CustomerLayout>} />
        <Route path="/r/:slug/cart" element={<CustomerLayout><CartPage /></CustomerLayout>} />
        <Route path="/r/:slug/checkout" element={<CustomerLayout><CheckoutPage /></CustomerLayout>} />
        <Route path="/r/:slug/order/:orderId" element={<CustomerLayout><OrderTrackingPage /></CustomerLayout>} />
        <Route path="/r/:slug/login" element={<CustomerLayout><LoginPage /></CustomerLayout>} />
        <Route path="/r/:slug/signup" element={<CustomerLayout><SignupPage /></CustomerLayout>} />
        <Route path="/r/:slug/account" element={<CustomerLayout><AccountPage /></CustomerLayout>} />
        <Route path="/r/:slug/item/:itemId" element={<CustomerLayout><FoodDetail /></CustomerLayout>} />

        <Route path="/owner/login" element={<OwnerProvider><OwnerLogin /></OwnerProvider>} />
        <Route path="/owner" element={<OwnerProvider><OwnerLayout /></OwnerProvider>}>
          <Route index element={<OwnerDashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="orders" element={<OwnerOrders />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>

        <Route path="/landing" element={<Landing />} />

        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-restaurant" element={<AddRestaurant />} />
              <Route path="/restaurants" element={<AllRestaurants />} />
              <Route path="/restaurants/:id" element={<RestaurantDetail />} />
              <Route path="/orders" element={<AllOrders />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/broadcast" element={<Broadcast />} />
              <Route path="/payment-settings" element={<PaymentSettingsPage />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Suspense>
  );
}

function AppContent() {
  const [ready, setReady] = useState(false);
  const appType = getAppType();
  const customerSlug = getRestaurantSlug();
  const serviceName = getRenderServiceName();
  const onOwnerService = serviceName && serviceName.includes('owner');

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="h-dvh flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#FF6B35]" />
      </div>
    );
  }

  if (appType === 'customer' && customerSlug && !serviceName) {
    return <CustomerSubdomainRoutes slug={customerSlug} />;
  }

  if (appType === 'owner' && onOwnerService) {
    return <OwnerSubdomainRoutes />;
  }

  if (appType === 'landing' && !serviceName) {
    return <PublicRoutes />;
  }

  return <PathBasedRoutes />;
}

function App() {
  return (
    <ErrorBoundary>
    <AppProvider>
      <Router>
        <AppContent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#363636', color: '#fff' },
            success: { iconTheme: { primary: '#06D6A0', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF476F', secondary: '#fff' } }
          }}
        />
      </Router>
    </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
