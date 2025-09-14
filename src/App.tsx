import { useState, FC, PropsWithChildren, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import DocumentView from './components/documents/DocumentView';
import ErrorBoundary from './components/common/ErrorBoundary';
import AIAssistant from './components/ai/AIAssistant';
import DocumentProcessor from './components/documents/DocumentProcessor';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import './index.css';

const ProtectedRoute: FC<PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: FC = () => {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [documentsProcessed, setDocumentsProcessed] = useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <DocumentProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 relative">
              {!documentsProcessed && (
                <DocumentProcessor onProcessingComplete={() => setDocumentsProcessed(true)} />
              )}

              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/document/:id"
                  element={
                    <ProtectedRoute>
                      <DocumentView />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>

              <button
                className="fixed bottom-6 right-6 p-4 bg-[#0C2C47] text-white rounded-full shadow-lg hover:bg-[#1a3a57] transition-all duration-200 transform hover:scale-105 z-50"
                onClick={() => setIsAIAssistantOpen(true)}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2a5 5 0 0 1 5 5v2.5a6.5 6.5 0 0 1-13 0V7a5 5 0 0 1 5-5h3Z" />
                  <path d="M9 12h6M9 16h6" />
                  <path d="M12 12v7" />
                </svg>
              </button>

              <AIAssistant isOpen={isAIAssistantOpen} onClose={() => setIsAIAssistantOpen(false)} />
            </div>
          </Router>
        </DocumentProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;