export default function Loading() {
  return (
    <div className="grid gap-10" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="grid gap-2">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-4 w-96 max-w-full rounded-md" />
      </div>
      <div className="skeleton h-[84px] rounded-xl" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid gap-4 rounded-xl border border-line bg-surface p-5">
              <div className="skeleton h-6 w-16 rounded-md" />
              <div className="skeleton h-5 w-3/4 rounded-md" />
              <div className="skeleton h-4 w-full rounded-md" />
              <div className="skeleton h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid content-start gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
