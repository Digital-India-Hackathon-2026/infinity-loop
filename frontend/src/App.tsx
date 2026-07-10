import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LanguageSelector from './pages/LanguageSelector';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RegisterCustomer from './pages/RegisterCustomer';
import CustomerDashboard from './pages/CustomerDashboard';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import DeliveryTracking from './pages/DeliveryTracking';
import Wishlist from './pages/Wishlist';
import CustomerProfile from './pages/CustomerProfile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Language Selection Screen */}
            <Route path="/" element={<LanguageSelector />} />

            {/* Landing Page */}
            <Route path="/landing" element={<LandingPage />} />

            {/* Auth Login Screen */}
            <Route path="/login" element={<Login />} />

            {/* Auth Register Screen */}
            <Route path="/register" element={<Register />} />
            
            {/* Customer Register Screen */}
            <Route path="/RegisterCustomer" element={<RegisterCustomer />} />

            {/* Farmer Dashboard Protected Route */}
            <Route element={<ProtectedRoute allowedRoles={['farmer']} />}>
              <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
            </Route>

            {/* Procurement Officer Protected Route */}
            <Route element={<ProtectedRoute allowedRoles={['officer']} />}>
              <Route path="/officer-dashboard" element={<OfficerDashboard />} />
            </Route>

            {/* Administrator Protected Route */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Route>

            {/* Customer Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
              <Route path="/marketplace" element={<CustomerDashboard />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/delivery-tracking/:orderId" element={<DeliveryTracking />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/customer-profile" element={<CustomerProfile />} />
            </Route>

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
