export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10 animate-pulse">
        <div>
          <div className="h-9 w-72 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="mt-2 h-4 w-52 rounded bg-slate-100 dark:bg-slate-700" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[0, 1, 2].map((col) => (
            <div
              key={col}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="h-44 bg-slate-200 dark:bg-slate-700" />
              <div className="p-6 space-y-3">
                <div className="h-5 w-4/5 rounded bg-slate-100 dark:bg-slate-700" />
                <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-700" />
                <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}