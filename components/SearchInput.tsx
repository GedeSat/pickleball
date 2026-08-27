"use client";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Cari...",
  variant = "light",
  resultCount,
  containerClassName = "relative w-full",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: "light" | "dark";
  resultCount?: number;
  containerClassName?: string;
}) {
  return (
    <div className={containerClassName}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          variant === "dark"
            ? "w-full pl-9 pr-3 py-2.5 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] rounded-xl text-sm text-[#ffffff] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/60"
            : "w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        }
      />
      <span
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
          variant === "dark" ? "text-slate-500 text-sm" : "text-slate-400 text-xs"
        }`}
      >
        🔍
      </span>
      {resultCount !== undefined && value.trim() !== "" && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-primary-700 hover:underline bg-white/80 px-1.5 py-0.5 rounded-md"
        >
          Reset ({resultCount} peserta ditemukan)
        </button>
      )}
    </div>
  );
}
