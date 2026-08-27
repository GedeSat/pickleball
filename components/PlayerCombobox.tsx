'use client';

import React, { useEffect, useRef, useState } from 'react';

export type ComboboxItem = {
  value: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
};

/**
 * Combobox pencarian: ketik untuk memfilter daftar item, klik untuk memilih.
 * Dipakai untuk form pilih pemain yang jumlahnya banyak.
 */
export default function PlayerCombobox({
  items,
  value,
  onChange,
  placeholder = 'Ketik untuk mencari...',
  disabled = false,
}: {
  items: ComboboxItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(() => getLabel(items, value));
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sinkronkan teks input saat value berubah dari luar (mis. reset form)
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(getLabel(items, value));
    setHighlight(0);
  }

  const q = query.trim().toLowerCase();
  const results = items.filter((item) => {
    if (item.disabled) return false;
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      (item.subtitle ?? '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selectItem = (item: ComboboxItem) => {
    if (item.disabled) return;
    onChange(item.value);
    setQuery(item.label);
    setHighlight(0);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && results[highlight]) selectItem(results[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all outline-none font-medium text-slate-700"
      />
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              Tidak ditemukan.
            </p>
          ) : (
            results.slice(0, 20).map((item, idx) => (
              <button
                key={`${item.value}-${item.label}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectItem(item);
                }}
                onMouseEnter={() => setHighlight(idx)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  idx === highlight ? 'bg-primary-50' : 'bg-white'
                } hover:bg-primary-50`}
              >
                <span className="font-semibold text-slate-800">{item.label}</span>
                {item.subtitle && (
                  <span className="block text-xs text-slate-400">{item.subtitle}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function getLabel(items: ComboboxItem[], value: string): string {
  const found = items.find((i) => i.value === value);
  return found ? found.label : '';
}