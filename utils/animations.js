"use client";

import { gsap, ScrollTrigger, setupGsap } from "@/utils/gsap";

const REVEAL_DISTANCE = 80;
const DEFAULT_EASE = "power4.out";

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value);

  return Number.isNaN(parsed) ? fallback : parsed;
}

export function initSectionAnimations(root, { start = "top 82%", once = true } = {}) {
  if (!root) {
    return () => {};
  }

  setupGsap();

  const context = gsap.context(() => {
    const groupedItems = new Set();
    const staggerGroups = gsap.utils.toArray("[data-stagger]", root);

    staggerGroups.forEach((group) => {
      const items = gsap.utils.toArray("[data-reveal]", group);

      if (!items.length) {
        return;
      }

      items.forEach((item) => groupedItems.add(item));

      gsap.fromTo(
        items,
        {
          autoAlpha: 0,
          y: REVEAL_DISTANCE
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.15,
          ease: DEFAULT_EASE,
          stagger: toNumber(group.dataset.stagger, 0.12),
          scrollTrigger: {
            trigger: group,
            start: group.dataset.start || start,
            once
          }
        }
      );
    });

    const singleItems = gsap
      .utils.toArray("[data-reveal]", root)
      .filter((item) => !groupedItems.has(item));

    singleItems.forEach((item) => {
      gsap.fromTo(
        item,
        {
          autoAlpha: 0,
          y: REVEAL_DISTANCE
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.1,
          ease: DEFAULT_EASE,
          delay: toNumber(item.dataset.delay, 0),
          scrollTrigger: {
            trigger: item,
            start: item.dataset.start || start,
            once
          }
        }
      );
    });

    const parallaxItems = gsap.utils.toArray("[data-parallax]", root);

    parallaxItems.forEach((item) => {
      const speed = toNumber(item.dataset.speed, 0.18);

      gsap.fromTo(
        item,
        {
          y: -160 * speed,
          scale: 1 + speed * 0.24
        },
        {
          y: 160 * speed,
          ease: "none",
          scrollTrigger: {
            trigger: item.closest("[data-parallax-parent]") || item,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });

    const floatingItems = gsap.utils.toArray("[data-float]", root);

    floatingItems.forEach((item, index) => {
      const mode = item.dataset.float || "md";
      const amplitudeMap = {
        sm: 12,
        md: 18,
        lg: 28
      };
      const rotationMap = {
        sm: 2.5,
        md: 4,
        lg: 6
      };
      const amplitude = amplitudeMap[mode] ?? amplitudeMap.md;
      const rotation = rotationMap[mode] ?? rotationMap.md;

      gsap.to(item, {
        y: amplitude,
        rotation,
        duration: 3.4 + index * 0.35,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });

    const spinningItems = gsap.utils.toArray("[data-spin]", root);

    spinningItems.forEach((item, index) => {
      gsap.to(item, {
        rotation: item.dataset.spin === "reverse" ? -360 : 360,
        duration: 18 + index * 4,
        repeat: -1,
        ease: "none"
      });
    });
  }, root);

  return () => {
    context.revert();
  };
}

export function initPointerParallax(root, { movement = 34 } = {}) {
  if (!root || !window.matchMedia("(pointer: fine)").matches) {
    return () => {};
  }

  setupGsap();

  const items = Array.from(root.querySelectorAll("[data-depth]"));

  if (!items.length) {
    return () => {};
  }

  const controllers = items.map((item) => ({
    element: item,
    depth: toNumber(item.dataset.depth, 0.2),
    xTo: gsap.quickTo(item, "x", { duration: 0.55, ease: "power3.out" }),
    yTo: gsap.quickTo(item, "y", { duration: 0.55, ease: "power3.out" })
  }));

  const handleMove = (event) => {
    const bounds = root.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;

    controllers.forEach((controller) => {
      controller.xTo(normalizedX * movement * controller.depth * 2);
      controller.yTo(normalizedY * movement * controller.depth * 2);
    });
  };

  const handleLeave = () => {
    controllers.forEach((controller) => {
      controller.xTo(0);
      controller.yTo(0);
    });
  };

  root.addEventListener("pointermove", handleMove);
  root.addEventListener("pointerleave", handleLeave);

  return () => {
    root.removeEventListener("pointermove", handleMove);
    root.removeEventListener("pointerleave", handleLeave);
  };
}

export function initSplitText(
  element,
  { mode = "scroll", start = "top 84%", stagger = 0.08, delay = 0, once = true } = {}
) {
  if (!element) {
    return () => {};
  }

  setupGsap();

  const words = element.querySelectorAll("[data-word]");

  if (!words.length) {
    return () => {};
  }

  gsap.set(words, {
    yPercent: 120,
    autoAlpha: 0,
    transformOrigin: "50% 100%"
  });

  if (mode === "hero") {
    const timeline = gsap.timeline({ defaults: { ease: DEFAULT_EASE } });

    timeline.to(words, {
      yPercent: 0,
      autoAlpha: 1,
      duration: 1.1,
      stagger,
      delay
    });

    return () => timeline.kill();
  }

  const animation = gsap.to(words, {
    yPercent: 0,
    autoAlpha: 1,
    duration: 1,
    stagger,
    ease: DEFAULT_EASE,
    delay,
    scrollTrigger: {
      trigger: element,
      start,
      once
    }
  });

  return () => {
    animation.kill();
  };
}

export function initMagneticEffect(element, { strength = 24 } = {}) {
  if (!element) {
    return () => {};
  }

  setupGsap();

  const inner = element.querySelector("[data-magnetic-inner]") || element;
  const xTo = gsap.quickTo(inner, "x", { duration: 0.45, ease: "power3.out" });
  const yTo = gsap.quickTo(inner, "y", { duration: 0.45, ease: "power3.out" });
  const scaleOuter = gsap.quickTo(element, "scale", { duration: 0.4, ease: "power3.out" });
  const scaleInner = gsap.quickTo(inner, "scale", { duration: 0.4, ease: "power3.out" });

  const handleMove = (event) => {
    const bounds = element.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left - bounds.width / 2;
    const offsetY = event.clientY - bounds.top - bounds.height / 2;

    xTo((offsetX / bounds.width) * strength);
    yTo((offsetY / bounds.height) * strength);
  };

  const handleEnter = () => {
    scaleOuter(1.035);
    scaleInner(1.02);
  };

  const handleLeave = () => {
    xTo(0);
    yTo(0);
    scaleOuter(1);
    scaleInner(1);
  };

  element.addEventListener("pointermove", handleMove);
  element.addEventListener("pointerenter", handleEnter);
  element.addEventListener("pointerleave", handleLeave);

  return () => {
    element.removeEventListener("pointermove", handleMove);
    element.removeEventListener("pointerenter", handleEnter);
    element.removeEventListener("pointerleave", handleLeave);
  };
}

export function initTiltEffect(element, { maxRotation = 10, scale = 1.05 } = {}) {
  if (!element) {
    return () => {};
  }

  setupGsap();

  const inner = element.querySelector("[data-tilt-inner]") || element;
  const shine = element.querySelector("[data-tilt-shine]");

  gsap.set(element, {
    transformPerspective: 1200,
    transformStyle: "preserve-3d"
  });

  const rotateX = gsap.quickTo(element, "rotationX", { duration: 0.45, ease: "power3.out" });
  const rotateY = gsap.quickTo(element, "rotationY", { duration: 0.45, ease: "power3.out" });
  const scaleTo = gsap.quickTo(element, "scale", { duration: 0.45, ease: "power3.out" });
  const xTo = gsap.quickTo(inner, "x", { duration: 0.45, ease: "power3.out" });
  const yTo = gsap.quickTo(inner, "y", { duration: 0.45, ease: "power3.out" });
  const shineOpacity = shine
    ? gsap.quickTo(shine, "opacity", { duration: 0.35, ease: "power2.out" })
    : null;
  const shineX = shine
    ? gsap.quickTo(shine, "xPercent", { duration: 0.45, ease: "power3.out" })
    : null;
  const shineY = shine
    ? gsap.quickTo(shine, "yPercent", { duration: 0.45, ease: "power3.out" })
    : null;

  const handleMove = (event) => {
    const bounds = element.getBoundingClientRect();
    const percentX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const percentY = (event.clientY - bounds.top) / bounds.height - 0.5;

    rotateY(percentX * maxRotation * 2);
    rotateX(percentY * maxRotation * -2);
    xTo(percentX * 14);
    yTo(percentY * 14);
    scaleTo(scale);

    if (shineOpacity && shineX && shineY) {
      shineOpacity(0.42);
      shineX(percentX * 60);
      shineY(percentY * 60);
    }
  };

  const handleLeave = () => {
    rotateX(0);
    rotateY(0);
    xTo(0);
    yTo(0);
    scaleTo(1);

    if (shineOpacity && shineX && shineY) {
      shineOpacity(0);
      shineX(0);
      shineY(0);
    }
  };

  element.addEventListener("pointermove", handleMove);
  element.addEventListener("pointerleave", handleLeave);

  return () => {
    element.removeEventListener("pointermove", handleMove);
    element.removeEventListener("pointerleave", handleLeave);
  };
}

export function initCustomCursor(cursor) {
  if (!cursor || !window.matchMedia("(pointer: fine)").matches) {
    return () => {};
  }

  setupGsap();
  document.body.classList.add("cursor-active");

  const xTo = gsap.quickTo(cursor, "x", { duration: 0.25, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.25, ease: "power3.out" });
  const scaleTo = gsap.quickTo(cursor, "scale", { duration: 0.3, ease: "power3.out" });
  const opacityTo = gsap.quickTo(cursor, "opacity", { duration: 0.2, ease: "power2.out" });

  const handleMove = (event) => {
    xTo(event.clientX);
    yTo(event.clientY);
    opacityTo(1);
  };

  const handlePress = () => scaleTo(0.8);
  const handleRelease = () => scaleTo(1);
  const handleWindowLeave = () => opacityTo(0);
  const handleWindowEnter = () => opacityTo(1);

  const removeTargetListeners = [];
  const targets = document.querySelectorAll("a, button, [data-cursor='interactive'], input, textarea, select");

  targets.forEach((target) => {
    const handleEnter = () => scaleTo(target.dataset.cursor === "large" ? 2.4 : 1.8);
    const handleLeave = () => scaleTo(1);

    target.addEventListener("pointerenter", handleEnter);
    target.addEventListener("pointerleave", handleLeave);

    removeTargetListeners.push(() => {
      target.removeEventListener("pointerenter", handleEnter);
      target.removeEventListener("pointerleave", handleLeave);
    });
  });

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerdown", handlePress);
  window.addEventListener("pointerup", handleRelease);
  window.addEventListener("mouseleave", handleWindowLeave);
  window.addEventListener("mouseenter", handleWindowEnter);

  return () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerdown", handlePress);
    window.removeEventListener("pointerup", handleRelease);
    window.removeEventListener("mouseleave", handleWindowLeave);
    window.removeEventListener("mouseenter", handleWindowEnter);
    removeTargetListeners.forEach((cleanup) => cleanup());
    document.body.classList.remove("cursor-active");
  };
}

export function animatePageTransition(content, overlay) {
  if (!content || !overlay) {
    return () => {};
  }

  setupGsap();

  const timeline = gsap.timeline({
    defaults: {
      ease: DEFAULT_EASE
    },
    onComplete: () => {
      gsap.set(overlay, { autoAlpha: 0 });
    }
  });

  gsap.set(overlay, {
    autoAlpha: 1,
    scaleY: 1,
    transformOrigin: "bottom"
  });

  gsap.set(content, {
    autoAlpha: 0,
    y: 36
  });

  timeline
    .to(overlay, {
      scaleY: 0,
      duration: 1
    })
    .to(
      content,
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1
      },
      0.18
    );

  return () => {
    timeline.kill();
  };
}

export function refreshScrollTriggers() {
  setupGsap();
  ScrollTrigger.refresh();
}
