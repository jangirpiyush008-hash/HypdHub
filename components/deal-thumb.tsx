export function DealThumb({
  name,
  category,
  thumbClass
}: {
  name: string;
  category: string;
  thumbClass: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${thumbClass}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.35))]" />
      <div className="absolute bottom-3 left-3 right-3">
        <div className="inline-flex rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-md">
          {category}
        </div>
        <div className="mt-3 max-w-[80%] font-headline text-xl font-extrabold tracking-[-0.04em] text-white sm:text-2xl">
          {name.split(" ").slice(0, 3).join(" ")}
        </div>
      </div>
    </div>
  );
}
