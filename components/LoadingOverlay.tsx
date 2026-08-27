export default function LoadingOverlay({ text = "Memproses..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white px-6 py-5 rounded-2xl shadow-xl flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">{text}</p>
      </div>
    </div>
  );
}
