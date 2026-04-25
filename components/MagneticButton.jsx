"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { initMagneticEffect } from "@/utils/animations";

export default function MagneticButton({
  href,
  children,
  className = "",
  variant = "primary",
  type = "button",
  strength = 24,
  target,
  rel,
  ...props
}) {
  const ref = useRef(null);
  const styles = variant === "secondary" ? "button-secondary" : "button-primary";
  const sharedClassName = `${styles} relative overflow-hidden ${className}`.trim();

  useLayoutEffect(() => {
    const cleanup = initMagneticEffect(ref.current, { strength });

    return cleanup;
  }, [strength]);

  const content = (
    <span data-magnetic-inner className="inline-flex items-center gap-2 will-change-transform">
      {children}
    </span>
  );

  if (href) {
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return (
        <a
          ref={ref}
          href={href}
          target={target}
          rel={rel}
          data-cursor="interactive"
          className={sharedClassName}
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <Link ref={ref} href={href} data-cursor="interactive" className={sharedClassName} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      data-cursor="interactive"
      className={sharedClassName}
      {...props}
    >
      {content}
    </button>
  );
}
