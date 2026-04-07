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
    <div className="hide-scrollbar flex gap-1.5 overflow-x-auto pb-1">
      {items.map((item) => {
        const selected = active === item;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              selected
                ? "bg-cta-gradient text-white"
                : "bg-surface-high text-muted hover:text-text"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
