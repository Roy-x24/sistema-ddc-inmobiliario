import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-gold/20 bg-surface p-7 shadow-elevated">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-navy-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-parchment hover:text-navy-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-sm leading-relaxed text-ink-light">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
