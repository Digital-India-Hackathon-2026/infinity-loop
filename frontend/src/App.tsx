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

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
