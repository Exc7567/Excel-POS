import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  transactionCount: number;
}

type NavItem = {
  id: string;
  label: string;
  icon: string;
  badge?: number;
};

export function Sidebar({
  isOpen,
  onToggle,
  isExpanded,
  onExpandedChange,
  activeTab,
  onTabChange,
  transactionCount,
}: SidebarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems: NavItem[] = [
    { id: 'pos', label: 'Kasir', icon: '🖥️' },
    { id: 'reports', label: 'Laporan', icon: '📊' },
    { id: 'history', label: 'Riwayat', icon: '📋', badge: transactionCount },
    { id: 'data', label: 'Data / Import', icon: '📁' },
    { id: 'edit', label: 'Edit Items', icon: '✏️' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile Trigger Button (Visible when closed) - Top Left */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-3 top-3 z-50 p-2 bg-primary-600 rounded-lg shadow-sm border border-transparent text-white hover:bg-primary-700 lg:hidden transition-transform active:scale-95 flex items-center justify-center"
          aria-label="Open Menu"
        >
          <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-16'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            {isExpanded && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-primary-900 text-base sm:text-lg leading-tight truncate">
                  Sumber Kasih POS
                </h1>
              </div>
            )}
            {/* Toggle Button - Hidden on Mobile, Visible on Desktop */}
            <button
              onClick={() => onExpandedChange(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-colors hidden lg:block"
            >
              {isExpanded ? '◀' : '▶'}
            </button>
          </div>

          <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${activeTab === item.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className={`text-lg sm:text-xl ${activeTab === item.id ? 'text-primary-600' : 'text-gray-500'}`}>{item.icon}</span>
                {isExpanded && (
                  <>
                    <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-primary-600 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          {isExpanded && (
            <div className="p-4 border-t border-gray-200">
              <div className="text-center mb-2">
                <div className="text-lg font-bold text-primary-700">
                  {currentDate.toLocaleTimeString('en-GB')}
                </div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Sumber Kasih POS v1.0
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
