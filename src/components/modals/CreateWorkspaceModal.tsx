import React, { useState, useRef, useEffect } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { api } from '../../api/client';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newWorkspaceId: string) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [workspaceId, setWorkspaceId] = useState('');
  const [metadataJson, setMetadataJson] = useState('{}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Capture the element that was focused before opening the modal for focus restoration
    previousActiveElement.current = (document.activeElement as HTMLElement) || null;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = workspaceId.trim();

    if (!trimmedId) {
      setError('ID workspace obbligatorio');
      return;
    }

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(trimmedId)) {
      setError('ID non valido: usa solo lettere, numeri, trattini e underscore');
      return;
    }

    let parsedMeta: Record<string, unknown> = {};
    try {
      if (metadataJson.trim()) {
        parsedMeta = JSON.parse(metadataJson);
      }
    } catch {
      setError('Metadata deve essere un JSON valido');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await api.createWorkspace({
        id: trimmedId,
        metadata: parsedMeta,
      });
      setIsSubmitting(false);
      onCreated(created.id);
      onClose();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Errore durante la creazione');
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-ws-title"
    >
      <div className="w-full max-w-md rounded-xl bg-surface border border-slate-700 shadow-2xl p-5 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-brand-400" />
            <h3 id="modal-ws-title" className="font-semibold text-sm">Nuovo Workspace</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-elevated transition focus:ring-2 focus:ring-brand-500"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="ws-id-input" className="block text-xs font-medium text-slate-300 mb-1">
              ID Workspace <span className="text-brand-400">*</span>
            </label>
            <input
              ref={inputRef}
              id="ws-id-input"
              type="text"
              required
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="es. honcho-production, test-workspace"
              className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="ws-meta-input" className="block text-xs font-medium text-slate-300 mb-1">
              Metadata Opzionali (JSON)
            </label>
            <textarea
              id="ws-meta-input"
              rows={3}
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-surface-elevated transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white transition disabled:opacity-50 flex items-center gap-1.5 focus:ring-2 focus:ring-brand-500"
            >
              {isSubmitting ? 'Creazione in corso...' : 'Crea Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
