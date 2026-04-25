"use client";

import { useLayoutEffect, useRef } from "react";
import { initSectionAnimations } from "@/utils/animations";

export default function AnimatedSection({
  as = "section",
  children,
  className = "",
  motionStart,
  once = true,
  ...props
}) {
  const ref = useRef(null);
  const Component = as;

  useLayoutEffect(() => {
    const cleanup = initSectionAnimations(ref.current, {
      start: motionStart,
      once
    });

    return cleanup;
  }, [motionStart, once]);

  return (
    <Component ref={ref} className={className} {...props}>
      {children}
    </Component>
  );
}
