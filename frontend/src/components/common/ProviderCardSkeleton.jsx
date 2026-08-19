const ProviderCardSkeleton = () => {
  return (
    <div className="flex animate-pulse flex-col rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
          <div className="h-4 w-20 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-3 w-16 rounded bg-slate-200" />
      </div>

      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-5 w-24 rounded-full bg-slate-200" />
      </div>

      <div className="mt-4 h-4 w-24 rounded bg-slate-200 border-t border-slate-100 pt-4" />

      <div className="mt-3 flex gap-3">
        <div className="h-10 flex-1 rounded-xl bg-slate-200" />
        <div className="h-10 flex-1 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
};

export default ProviderCardSkeleton;