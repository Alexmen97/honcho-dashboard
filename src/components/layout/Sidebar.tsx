import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Compass,
  Sparkles,
} from 'lucide-react';

export type TabType = 'overview' | 'sessions' | 'peer' | 'conclusions' | 'dialectic';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  sessionCount?: number;
  peerCount?: number;
  conclusionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  sessionCount,
  peerCount,
  conclusionCount,
}) => {
  const navItems = [
    {
      id: 'overview' as TabType,
      label: 'Panoramica',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'sessions' as TabType,
      label: 'Sessioni & Timeline',
      icon: MessageSquare,
      badge: sessionCount !== undefined ? sessionCount.toString() : undefined,
    },
    {
      id: 'peer' as TabType,
      label: 'Peer Cognitivi',
      icon: Users,
      badge: peerCount !== undefined ? peerCount.toString() : undefined,
    },
    {
      id: 'conclusions' as TabType,
      label: 'Conclusioni & Ricerca',
      icon: Compass,
      badge: conclusionCount !== undefined ? conclusionCount.toString() : undefined,
    },
    {
      id: 'dialectic' as TabType,
      label: 'Dialectic Playground',
      icon: Sparkles,
      badge: 'SSE',
      isAccent: true,
    },
  ];

  return (
    <aside className="w-64 border-r border-border-subtle bg-surface/50 hidden md:flex flex-col shrink-0">
      <div className="p-3 border-b border-border-subtle">
        <div className="px-2 py-1 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
          Spazio Operativo
        </div>
      </div>

      <nav className="p-2 space-y-1 flex-1" role="tablist" aria-label="Navigazione Principale">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-surface-elevated text-white shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:bg-surface-elevated/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? (item.isAccent ? 'text-brand-400' : 'text-white') : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    item.isAccent
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'bg-surface text-slate-400 border border-border-subtle'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-border-subtle text-[11px] text-slate-500 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span>Client:</span>
          <span className="text-slate-400">React + TS SPA</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Gateway:</span>
          <span className="text-slate-400">Node Same-Origin</span>
        </div>
      </div>
    </aside>
  );
};
