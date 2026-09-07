"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** A product-photo animation, not footage. Static HTML is the default. */
export function HoverRacerPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      setReducedMotion(media.matches);
      setPlaying(visible && !media.matches && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative aspect-square w-full max-w-[340px] overflow-hidden rounded-2xl bg-white sm:max-w-[380px]"
    >
      <div
        className="home-hover-racer absolute inset-0"
        data-playing={playing && !paused}
      >
        <Image
          src="/images/home/hover-racer.webp"
          alt="Hover Racer 4M asamblat, cu elice și platformă de aeroglisor"
          fill
          priority
          sizes="(max-width: 640px) 280px, 380px"
          className="object-contain p-5"
        />
      </div>
      {!reducedMotion && (
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused(value => !value)}
          className="absolute bottom-3 right-3 min-h-11 rounded-full border border-slate-200 bg-white/95 px-4 text-xs font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {paused ? "Pornește animația" : "Pauză animație"}
        </button>
      )}
    </div>
  );
}
