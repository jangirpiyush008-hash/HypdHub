"use client";

import { useLayoutEffect, useRef } from "react";
import { initTiltEffect } from "@/utils/animations";

export default function TiltCard({
  as = "article",
  children,
  className = "",
  strength = 10,
  scale = 1.05,
  ...props
}) {
  const ref = useRef(null);
  const Component = as;

  useLayoutEffect(() => {
    const cleanup = initTiltEffect(ref.current, {
      maxRotation: strength,
      scale
    });

    return cleanup;
  }, [scale, strength]);

  return (
    <Component
      ref={ref}
      data-cursor="interactive"
      className={`group relative overflow-hidden [transform-style:preserve-3d] ${className}`.trim()}
      {...props}
    >
      <div
        data-tilt-shine
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.18), rgba(255,255,255,0) 58%)"
        }}
      />
      <div data-tilt-inner className="relative h-full [transform-style:preserve-3d]">
        {children}
      </div>
    </Component>
  );
}
