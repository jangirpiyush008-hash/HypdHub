"use client";

import Lenis from "lenis";

export function createLenis() {
  return new Lenis({
    duration: 1.2,
    easing: (time) => 1 - Math.pow(1 - time, 4),
    smoothWheel: true,
    smoothTouch: false,
    syncTouch: false,
    wheelMultiplier: 0.95
  });
}
