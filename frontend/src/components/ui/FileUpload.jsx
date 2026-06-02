import { Upload } from 'lucide-react';

export default function FileUpload({ onFileSelect, accept = '.pdf,.jpg,.png', className = '' }) {
  return (
    <label className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-parchment bg-cream/60 p-8 text-center transition-all hover:border-gold/40 hover:bg-gold/5 ${className}`}>
      <Upload className="mb-3 h-8 w-8 text-ink-muted transition-colors group-hover:text-gold" />
      <span className="text-sm font-medium text-ink">Haga clic para subir archivo</span>
      <span className="mt-1 text-xs text-ink-muted">PDF, JPG o PNG (max 10 MB)</span>
      <input type="file" className="hidden" accept={accept} onChange={(e) => onFileSelect(e.target.files[0])} />
    </label>
  );
}
