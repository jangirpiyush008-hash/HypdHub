"use client";

import { useState } from "react";

export function DealThumb({
  name,
  category,
  thumbClass,
  imageUrl,
}: {
  name: string;
  category: string;
  thumbClass: string;
  imageUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${thumbClass}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl as string}
          alt={name}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.55))]" />
      <div className="absolute bottom-3 left-3 right-3">
        <div className="inline-flex rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-md">
          {category}
        </div>
        {!showImage ? (
          <div className="mt-3 max-w-[80%] font-headline text-xl font-extrabold tracking-[-0.04em] text-white sm:text-2xl">
            {name.split(" ").slice(0, 3).join(" ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
