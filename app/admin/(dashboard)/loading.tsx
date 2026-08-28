export default function AdminDashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-96 rounded bg-slate-100 dark:bg-slate-700" />
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="h-12 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700" />
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="h-16 bg-slate-50 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700"
          />
        ))}
      </div>
    </div>
  );
}