import { useEffect, useState, useRef } from 'react';
import { User, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Array<{ id: string; name: string; category?: string }>>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const c = e as CustomEvent;
      if (!c.detail) return;
      setNotifications(prev => [{ id: c.detail.id, name: c.detail.name, category: c.detail.category }, ...prev].slice(0, 10));
    };
    window.addEventListener('documentProcessed', handler as EventListener);
    return () => window.removeEventListener('documentProcessed', handler as EventListener);
  }, []);

  useEffect(() => {
    const onDocClickAway = (ev: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('click', onDocClickAway);
    return () => document.removeEventListener('click', onDocClickAway);
  }, [open]);

  // handleLogout remains available for later wiring if needed

  return (
    <header className="bg-surface border-b border-border-subtle p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-heading">Document Dashboard</h2>
          <p className="text-muted">Manage and search your intelligent document library</p>
        </div>
        
        <div className="flex items-center space-x-4 relative">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setOpen(o => !o)} className="p-2 text-muted hover:text-text hover:bg-bg-page rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-2">Notifications</h4>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500">No notifications</p>
                  ) : (
                    <ul className="space-y-2 max-h-48 overflow-auto">
                      {notifications.map(n => (
                        <li key={n.id} className="text-sm text-gray-700">
                          <strong className="text-gray-900">{n.name}</strong>
                          <div className="text-xs text-gray-500">{n.category || 'Uncategorized'}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[#0C2C47]">{user?.username}</p>
              <p className="text-xs text-gray-600">{user?.role}</p>
            </div>
            <div className="bg-[#0C2C47] p-2 rounded-full">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}