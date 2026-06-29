import { useState } from 'react';
import { Info } from 'lucide-react';

export default function InfoHint({ label, children, side = 'top' }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`info-hint info-hint-${side}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="info-hint-trigger"
        aria-label={label || 'Ver informacion'}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="info-hint-popover" role="tooltip">
          {children}
        </span>
      )}
    </span>
  );
}
