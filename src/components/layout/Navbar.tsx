import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Check, Server, Activity } from 'lucide-react';
import { Workspace } from '../../types/api';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

interface NavbarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenCreateWorkspace: () => void;
  onToggleMobileNav: () => void;
  isHealthOk: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onToggleMobileNav,
  isHealthOk,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-border-subtle bg-surface/90 backdrop-blur px-4 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileNav}
          className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Apri menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo & Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">Honcho</span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Studio</span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-500/20">v1.1</span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 mx-1 hidden sm:block"></div>

        {/* Workspace Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-subtle border border-slate-300 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-slate-800 dark:text-slate-300 max-w-[140px] sm:max-w-[200px] truncate">
              {activeWorkspaceId || 'Seleziona Workspace'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="absolute left-0 mt-1.5 w-64 rounded-lg bg-surface border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              role="listbox"
            >
              <div className="px-2 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Workspace Disponibili
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
                {workspaces.map((ws) => {
                  const isSelected = ws.id === activeWorkspaceId;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        onSelectWorkspace(ws.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-surface-elevated text-slate-900 dark:text-white font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-surface-elevated hover:text-slate-900 dark:hover:text-white'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="font-mono truncate">{ws.id}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 shrink-0" />}
                    </button>
                  );
                })}
                {workspaces.length === 0 && (
                  <div className="px-2 py-2 text-slate-500 dark:text-slate-400 text-center italic">Nessun workspace trovato</div>
                )}
              </div>
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 mt-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenCreateWorkspace();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded flex items-center gap-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition font-medium"
                >
                  <span>+ Nuovo Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right status & theme area */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Accessible Theme Switcher */}
        <ThemeSwitcher variant="compact" />

        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-subtle border border-border-subtle text-xs text-slate-600 dark:text-slate-400 font-mono">
          <Server className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Honcho v3.2.2</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-slate-700 dark:text-slate-300">192.168.4.91:8000</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-subtle border border-border-subtle text-xs font-mono">
          <Activity className={`w-3.5 h-3.5 ${isHealthOk ? 'text-emerald-500 dark:text-emerald-400 animate-pulse' : 'text-rose-500 dark:text-rose-400'}`} />
          <span className={isHealthOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {isHealthOk ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
