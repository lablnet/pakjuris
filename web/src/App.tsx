import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { api } from './services/api';
import { useUserStore } from './stores/userStore';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

// Import pages
import Home from './pages/Home';
import ChatPage from './pages/ChatPage';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';

// Import components
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const { setUser } = useUserStore();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.profile.me();
        if (response && response.user) {
          setUser(response.user);
        }
      } catch (error) {
        // If request fails, user is not authenticated
        setUser(null);
      }
    };

    checkAuthStatus();
  }, [setUser]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
