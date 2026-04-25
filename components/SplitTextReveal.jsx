"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { initSplitText } from "@/utils/animations";

function createWords(text, segments) {
  const source = segments?.length ? segments : [{ text, className: "" }];

  return source.flatMap((segment) =>
    segment.text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({
        word,
        className: segment.className || ""
      }))
  );
}

export default function SplitTextReveal({
  as = "span",
  text,
  segments,
  className = "",
  wordClassName = "",
  mode = "scroll",
  start,
  stagger,
  delay,
  once
}) {
  const ref = useRef(null);
  const Component = as;
  const words = useMemo(() => createWords(text, segments), [segments, text]);
  const label = segments?.map((segment) => segment.text).join(" ") || text;

  useLayoutEffect(() => {
    const cleanup = initSplitText(ref.current, {
      mode,
      start,
      stagger,
      delay,
      once
    });

    return cleanup;
  }, [mode, start, stagger, delay, once, label]);

  return (
    <Component ref={ref} className={className} aria-label={label}>
      <span className="flex flex-wrap gap-x-[0.18em] gap-y-[0.08em]">
        {words.map((item, index) => (
          <span key={`${item.word}-${index}`} className="inline-flex overflow-hidden pb-[0.08em]">
            <span
              data-word
              className={`inline-block will-change-transform ${item.className} ${wordClassName}`.trim()}
            >
              {item.word}
            </span>
          </span>
        ))}
      </span>
    </Component>
  );
}
