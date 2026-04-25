"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initCustomCursor } from "@/utils/animations";

export default function CustomCursor() {
  const ref = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const cleanup = initCustomCursor(ref.current);

    return cleanup;
  }, [pathname]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 opacity-0 mix-blend-difference md:block"
    />
  );
}
