import { useState } from 'react';
import { Home, FolderOpen, Share2, Settings, ChevronDown, ChevronRight, FileText, DollarSign, Users, Scale, Contact as FileContract, Receipt, Menu, X, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../../logo.png';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  onHomeClick: () => void;
}

export default function Sidebar({ collapsed, onToggle, selectedCategory, onCategorySelect, onHomeClick }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['documents']);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const categories = [
    { id: 'Finance', icon: DollarSign, color: 'text-[#008000]' },
    { id: 'HR', icon: Users, color: 'text-[#172D9D]' },
    { id: 'Legal', icon: Scale, color: 'text-purple-600' },
    { id: 'Contracts', icon: FileContract, color: 'text-orange-600' },
  { id: 'Tech', icon: FileText, color: 'text-indigo-600' },
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
      
      <div className={`fixed lg:relative z-30 h-full bg-sidebar-dark text-white border-r border-border-subtle/10 transition-all duration-300 ${
        collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'w-80 lg:w-80'
      }`} style={{ overflow: 'hidden' }}>
        <div className="p-4 border-b border-border-subtle/10">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center">
                <img src={logo} alt="CogniFile Logo" className="h-20 w-20 object-contain mr-3" />
                <h1 className="text-2xl font-bold text-white">CogniFile</h1>
              </div>
            )}
            <button
              onClick={onToggle}
              aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
              className="p-2 hover:bg-sidebar-soft rounded-lg transition-colors"
            >
              {collapsed ? <Menu className="h-5 w-5 text-white" /> : <X className="h-5 w-5 text-white lg:hidden" />}
            </button>
          </div>
          
            {/* User info moved to header */}
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-full pb-20">
          <div className="space-y-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onHomeClick();
                if (window.location.pathname !== '/dashboard') {
                  navigate('/dashboard');
                }

                if (window.innerWidth < 1024) {
                  onToggle();
                }
              }}
              className="w-full flex items-center px-3 py-2.5 text-white bg-transparent rounded-lg hover:bg-sidebar-soft transition-colors"
            >
              <Home className="h-6 w-6" />
              {!collapsed && <span className="ml-3 font-medium">Home</span>}
            </button>
            
            {/* Upload button moved to appear after Home */}
            <div className="mt-2">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('openUploadModal'))}
                className="w-full flex items-center px-3 py-2 text-white bg-primary hover:bg-primary-700 rounded-lg transition-colors"
              >
                <Upload className="h-5 w-5" />
                {!collapsed && <span className="ml-3 font-medium">Upload Document</span>}
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => toggleFolder('documents')}
                className="w-full flex items-center px-3 py-2 text-white hover:bg-sidebar-soft rounded-lg transition-colors"
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
                          ? 'bg-sidebar-soft border-l-4 border-primary text-white font-medium' 
                          : 'text-white hover:bg-sidebar-soft hover:bg-opacity-50'
                      }`}
                    >
                      <category.icon className={`h-4 w-4 ${category.color}`} />
                      <span className="ml-3">{category.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <button className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="h-5 w-5" />
                {!collapsed && <span className="ml-3">Shared with me</span>}
              </button>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border-subtle/10">
            <div>
              <button
                onClick={() => setSettingsOpen(prev => !prev)}
                className="w-full flex items-center px-3 py-2 text-white hover:bg-sidebar-soft rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5" />
                {!collapsed && <span className="ml-3">Settings</span>}
              </button>

              {!collapsed && settingsOpen && (
                <button
                  onClick={() => {
                    // call logout then navigate to login
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center px-3 py-2 mt-2 text-danger hover:bg-danger/10 rounded-lg transition-colors font-semibold"
                >
                  <span className="ml-3">Logout</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}