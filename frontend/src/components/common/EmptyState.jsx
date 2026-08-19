const ServiceCardSkeleton = () => {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-slate-100">
      <div className="h-48 w-full bg-slate-200" />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-12 rounded bg-slate-200" />
        </div>
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
        </div>
        <div className="mt-2 flex gap-3 border-t border-slate-100 pt-4">
          <div className="h-10 flex-1 rounded-xl bg-slate-200" />
          <div className="h-10 flex-1 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default ServiceCardSkeleton;