// ============================================================
//  shared/components/ui/index.tsx — Componentes UI reutilizables
// ============================================================

import { createPortal } from 'react-dom';
import { X, Search, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect, type ReactNode } from 'react';

// ─── Modal ───────────────────────────────────────────────────

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const MODAL_SIZES: Record<ModalSize, string> = {
  sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, size = 'md', children, footer }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-card-hover w-full ${MODAL_SIZES[size]} animate-scale-in flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-forest-100 flex-shrink-0">
          <h2 className="font-display font-bold text-sena-900 text-lg">{title}</h2>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-forest-100 flex-shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────

interface SpinnerProps { size?: number; className?: string; }

export function LoadingSpinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 size={size} className="animate-spin text-sena-500" />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-64">
      <LoadingSpinner size={32} />
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state py-16">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="font-semibold text-sena-800 text-lg">{title}</p>
      {description && <p className="text-forest-500 text-sm mt-1 max-w-sm text-center">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── SearchInput ──────────────────────────────────────────────

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input !pl-9"
      />
    </div>
  );
}

// ─── SelectSearch ─────────────────────────────────────────────

interface SelectOption { value: string; label: string; sublabel?: string; }

interface SelectSearchProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectSearch({
  options, value, onChange, placeholder = 'Seleccionar...', label, disabled, className = '',
}: SelectSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    o.sublabel?.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && <label className="label mb-1">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen((v) => !v); setQuery(''); }}
        className={`input text-left flex items-center justify-between gap-2 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className={selected ? 'text-sena-900' : 'text-forest-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="text-forest-400 text-xs">▼</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-forest-200 shadow-card-hover z-30 overflow-hidden">
          <div className="p-2 border-b border-forest-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forest-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-sena-50 rounded-lg border border-forest-100 focus:outline-none focus:border-sena-400"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-forest-400 text-center">Sin resultados</li>
            ) : filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                  className={`w-full text-left px-3 py-2 hover:bg-sena-50 transition-colors text-sm ${opt.value === value ? 'text-sena-700 font-medium bg-sena-50' : 'text-sena-800'}`}
                >
                  {opt.label}
                  {opt.sublabel && <span className="block text-xs text-forest-400">{opt.sublabel}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirmar', danger = false, loading = false,
}: ConfirmDialogProps) {
  const footer = (
    <div className="flex gap-3">
      <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'} disabled:opacity-60`}
      >
        {loading ? 'Procesando...' : confirmLabel}
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={footer}>
      <p className="text-forest-600 text-sm leading-relaxed">{message}</p>
    </Modal>
  );
}

// ─── Paginación ───────────────────────────────────────────────

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  onChange: (p: number) => void;
}

export function Paginacion({ pagina, totalPaginas, onChange }: PaginacionProps) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onChange(pagina - 1)}
        disabled={pagina <= 1}
        className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-sm text-forest-500">
        Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
      </span>
      <button
        onClick={() => onChange(pagina + 1)}
        disabled={pagina >= totalPaginas}
        className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}
