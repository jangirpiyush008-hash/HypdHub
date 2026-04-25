"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let pluginsRegistered = false;

export function setupGsap() {
  if (typeof window !== "undefined" && !pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    pluginsRegistered = true;
  }

  return gsap;
}

export { gsap, ScrollTrigger };
