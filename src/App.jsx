import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { OwnerProvider } from './context/OwnerContext';
import { CustomerProvider } from './context/CustomerContext';
import Layout from './components/Layout';
import CustomerLayout from './components/CustomerLayout';
import OwnerLayout from './components/OwnerLayout';
import Dashboard from './pages/Dashboard';
import AddRestaurant from './pages/AddRestaurant';
import AllRestaurants from './pages/AllRestaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import AllOrders from './pages/AllOrders';
import Subscriptions from './pages/Subscriptions';
import Broadcast from './pages/Broadcast';
import Settings from './pages/Settings';
import PaymentSettingsPage from './pages/PaymentSettings';
import RestaurantPage from './pages/customer/RestaurantPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import LoginPage from './pages/customer/LoginPage';
import SignupPage from './pages/customer/SignupPage';
import AccountPage from './pages/customer/AccountPage';
import FoodDetail from './pages/customer/FoodDetail';
import OwnerDashboard from './pages/owner/Dashboard';
import MenuManagement from './pages/owner/MenuManagement';
import OwnerOrders from './pages/owner/Orders';
import OwnerSettings from './pages/owner/Settings';
import OwnerLogin from './pages/owner/Login';
import Landing from './pages/Landing';
import { getAppType, getRestaurantSlug } from './utils/subdomain';

function CustomerSubdomainRoutes({ slug }) {
  return (
    <CustomerProvider slug={slug}>
      <CustomerLayout slug={slug}>
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
      </CustomerLayout>
    </CustomerProvider>
  );
}

function OwnerSubdomainRoutes() {
  return (
    <OwnerProvider>
      <Routes>
        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/" element={<OwnerLayout />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="orders" element={<OwnerOrders />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>
      </Routes>
    </OwnerProvider>
  );
}

function PathBasedRoutes() {
  return (
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
            <Route path="/settings" element={<Settings />} />
            <Route path="/payment-settings" element={<PaymentSettingsPage />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
}

function AppContent() {
  const [ready, setReady] = useState(false);
  const appType = getAppType();
  const customerSlug = getRestaurantSlug();

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

  if (appType === 'customer' && customerSlug) {
    return <CustomerSubdomainRoutes slug={customerSlug} />;
  }

  if (appType === 'owner') {
    return <OwnerSubdomainRoutes />;
  }

  return <PathBasedRoutes />;
}

function App() {
  return (
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
  );
}

export default App;
