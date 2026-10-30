"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Aparición al entrar en viewport (más fiable que animation-timeline). */
export default function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`cf-reveal${visible ? " cf-reveal-on" : ""}${className ? ` ${className}` : ""}`}
      style={delayMs ? ({ ["--cf-reveal-delay" as string]: `${delayMs}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
