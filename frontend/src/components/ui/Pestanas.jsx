import { useState } from 'react';

export default function Pestanas({ tabs, defaultTab = 0 }) {
  const [active, setActive] = useState(defaultTab);
  return (
    <div>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              active === i
                ? 'border-b-2 border-acento text-acento'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tabs[active]?.content}</div>
    </div>
  );
}
