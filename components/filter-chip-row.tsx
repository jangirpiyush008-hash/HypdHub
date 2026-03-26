"use client";

export function FilterChipRow({
  items,
  active,
  onChange
}: {
  items: string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const selected = active === item;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-full px-5 py-2 font-headline text-[11px] font-bold uppercase tracking-[0.24em] transition-all ${
              selected
                ? "bg-cta-gradient text-white shadow-glow"
                : "bg-surface-top text-text hover:bg-surface-bright"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
