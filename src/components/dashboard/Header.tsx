import React from 'react';
import { Upload, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onUploadClick: () => void;
}

export default function Header({ onUploadClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0C2C47]">Document Dashboard</h2>
          <p className="text-gray-600">Manage and search your intelligent document library</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onUploadClick}
            className="flex items-center px-4 py-2 bg-[#E2A54D] text-white rounded-lg hover:bg-[#d4943a] transition-colors font-medium"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </button>
          
          <button className="p-2 text-gray-600 hover:text-[#0C2C47] hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[#0C2C47]">{user?.username}</p>
              <p className="text-xs text-gray-600">{user?.role}</p>
            </div>
            <div className="bg-[#0C2C47] p-2 rounded-full">
              <User className="h-5 w-5 text-white" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}