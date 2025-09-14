import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Lock, User, AlertCircle } from 'lucide-react';
import logo from '../../../logo.jpg';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Try: admin / password123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C2C47] to-[#2D5652] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="Cognifile Logo" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-[#0C2C47]">Cognifile</h1>
          <p className="text-gray-600 mt-2">AI-Powered Document Intelligence</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2C47] focus:border-transparent transition-all duration-200"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2C47] focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0C2C47] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#1a3a57] transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0C2C47] focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-medium mb-2">Demo Accounts:</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• admin / password123 (Admin)</p>
            <p>• hr_manager / password123 (HR)</p>
            <p>• finance_lead / password123 (Finance)</p>
            <p>• legal_counsel / password123 (Legal)</p>
          </div>
        </div>
      </div>
    </div>
  );
}