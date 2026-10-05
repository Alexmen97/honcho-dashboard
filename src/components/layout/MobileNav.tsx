import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Compass,
  Sparkles,
  X,
} from 'lucide-react';
import { TabType } from './Sidebar';

interface MobileNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
  sessionCount?: number;
  peerCount?: number;
  conclusionCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  sessionCount,
  peerCount,
  conclusionCount,
}) => {
  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'sessions' as TabType, label: 'Sessioni', icon: MessageSquare, badge: sessionCount },
    { id: 'peer' as TabType, label: 'Peer', icon: Users, badge: peerCount },
    { id: 'conclusions' as TabType, label: 'Conclusioni', icon: Compass, badge: conclusionCount },
    { id: 'dialectic' as TabType, label: 'Dialectic', icon: Sparkles, isAccent: true },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-72 h-full bg-surface border-r border-border-subtle p-4 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Honcho Studio</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  aria-label="Chiudi menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onSelectTab(tab.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-surface-elevated text-white'
                          : 'text-slate-400 hover:bg-surface-elevated/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge !== undefined && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-subtle text-slate-400 border border-border-subtle">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="text-[11px] text-slate-500 font-mono border-t border-border-subtle pt-3">
              <div>Honcho v3.2.2 Live</div>
              <div>http://192.168.4.91:8000</div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Tab Bar for Mobile */}
      <nav
        className="md:hidden h-14 border-t border-border-subtle bg-surface px-2 flex items-center justify-around z-30 shrink-0"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center gap-1 text-[10px] transition ${
                isActive ? (tab.isAccent ? 'text-brand-400 font-medium' : 'text-white font-medium') : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
