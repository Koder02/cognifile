import { useState, FC, PropsWithChildren } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import DocumentView from './components/documents/DocumentView';
import ErrorBoundary from './components/common/ErrorBoundary';
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


            </div>
          </Router>
        </DocumentProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;