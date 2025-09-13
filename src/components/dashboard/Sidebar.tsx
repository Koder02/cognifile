import React, { useState } from 'react';
import { Home, FolderOpen, Share2, Settings, ChevronDown, ChevronRight, FileText, DollarSign, Users, Scale, Contact as FileContract, Receipt, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export default function Sidebar({ collapsed, onToggle, selectedCategory, onCategorySelect }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['documents']);
  const { user } = useAuth();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const categories = [
    { id: 'Finance', icon: DollarSign, color: 'text-green-600' },
    { id: 'HR', icon: Users, color: 'text-blue-600' },
    { id: 'Legal', icon: Scale, color: 'text-purple-600' },
    { id: 'Contracts', icon: FileContract, color: 'text-orange-600' },
    { id: 'Technical Reports', icon: FileText, color: 'text-indigo-600' },
    { id: 'Invoices', icon: Receipt, color: 'text-red-600' },
  ];

  const getAccessibleCategories = () => {
    if (user?.role === 'Admin') return categories;
    
    switch (user?.role) {
      case 'HR':
        return categories.filter(cat => cat.id === 'HR');
      case 'Finance':
        return categories.filter(cat => ['Finance', 'Invoices'].includes(cat.id));
      case 'Legal':
        return categories.filter(cat => ['Legal', 'Contracts'].includes(cat.id));
      case 'Technical':
        return categories.filter(cat => cat.id === 'Technical Reports');
      default:
        return categories;
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={onToggle} />
      )}
      
      <div className={`fixed lg:relative z-30 h-full bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'w-80 lg:w-80'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center">
                <div className="bg-[#0C2C47] p-2 rounded-lg mr-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-[#0C2C47]">Cognifile</h1>
              </div>
            )}
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5 lg:hidden" />}
            </button>
          </div>
          
          {!collapsed && user && (
            <div className="mt-4 p-3 bg-[#E4F2EA] rounded-lg">
              <p className="text-sm font-medium text-[#0C2C47]">{user.username}</p>
              <p className="text-xs text-[#2D5652]">{user.role} Role</p>
            </div>
          )}
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-full pb-20">
          <div className="space-y-1">
            <button className="w-full flex items-center px-3 py-2 text-[#0C2C47] bg-[#E4F2EA] rounded-lg hover:bg-[#97D3CD] transition-colors">
              <Home className="h-5 w-5" />
              {!collapsed && <span className="ml-3 font-medium">Home</span>}
            </button>
            
            <div className="space-y-1">
              <button
                onClick={() => toggleFolder('documents')}
                className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FolderOpen className="h-5 w-5" />
                {!collapsed && (
                  <>
                    <span className="ml-3 font-medium">My Docs</span>
                    {expandedFolders.includes('documents') ? (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </>
                )}
              </button>
              
              {!collapsed && expandedFolders.includes('documents') && (
                <div className="ml-6 space-y-1">
                  {getAccessibleCategories().map(category => (
                    <button
                      key={category.id}
                      onClick={() => onCategorySelect(selectedCategory === category.id ? '' : category.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedCategory === category.id 
                          ? 'bg-[#97D3CD] text-[#0C2C47] font-medium' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <category.icon className={`h-4 w-4 ${category.color}`} />
                      <span className="ml-3">{category.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Shared w/ me</span>}
            </button>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <button className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Settings</span>}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}