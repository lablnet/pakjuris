import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { AuthProvider } from './contexts/AuthContext';
import { ToastManager } from './components/ui/ToastComp';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

// Import pages
import Home from './pages/Site/Home';
import ChatPage from './pages/Dashboard/ChatPage';
import About from './pages/Site/About';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ResetPassword from './pages/Auth/ResetPassword';
import ResetSuccess from './pages/Auth/ResetSuccess';
import Profile from './pages/Dashboard/Profile';
import NotFound from './pages/NotFound';
import ComingSoon from './pages/ComingSoon';

// Import components
import ProtectedRoute from './components/layout/ProtectedRoute';

export default function App() {
  return (
    <ToastManager>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/success" element={<ResetSuccess />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:conversationId" element={<ChatPage />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* Coming Soon page */}
            <Route path="/coming-soon" element={<ComingSoon />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastManager>
  );
}
