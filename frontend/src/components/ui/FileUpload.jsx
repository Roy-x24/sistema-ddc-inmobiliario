import { Upload, File } from 'lucide-react';

export default function FileUpload({ onFileSelect, accept = '.pdf,.jpg,.png', className = '' }) {
  return (
    <label className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition-colors hover:bg-gray-100 ${className}`}>
      <Upload className="mb-2 h-8 w-8 text-gray-400" />
      <span className="text-sm font-medium text-gray-700">Haga clic para subir archivo</span>
      <span className="mt-1 text-xs text-gray-500">PDF, JPG o PNG (max 10 MB)</span>
      <input type="file" className="hidden" accept={accept} onChange={(e) => onFileSelect(e.target.files[0])} />
    </label>
  );
}
