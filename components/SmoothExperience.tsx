"use client";

import { useEffect } from "react";

export default function SmoothExperience() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let lenis: import("lenis").default | undefined;
    let frame = 0;
    let context: { revert: () => void } | undefined;
    let removeTicker: (() => void) | undefined;
    let cancelled = false;

    Promise.all([import("lenis"), import("gsap"), import("gsap/ScrollTrigger")]).then(([lenisModule, gsapModule, scrollModule]) => {
      if (cancelled) return;
      const Lenis = lenisModule.default;
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      removeTicker = () => gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(0);
      frame = window.requestAnimationFrame(() => {
        context = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
            gsap.fromTo(element, { y: 35, opacity: 0, clipPath: "inset(0 0 12% 0)" }, {
              y: 0, opacity: 1, clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power3.out",
              scrollTrigger: { trigger: element, start: "top 88%", once: true }
            });
          });
          gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
            gsap.to(element, { yPercent: -12, ease: "none", scrollTrigger: { trigger: element, scrub: 0.7 } });
          });
          const hero = document.querySelector<HTMLElement>("[data-hero-pin]");
          if (hero && window.matchMedia("(min-width: 760px)").matches) {
            gsap.to(hero, {
              scale: 0.94, filter: "blur(5px)", opacity: 0.7, ease: "none",
              scrollTrigger: { trigger: hero, start: "top top", end: "+=70%", pin: true, scrub: 0.8 }
            });
          }
        });
      });

    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      context?.revert();
      removeTicker?.();
      lenis?.destroy();
    };
  }, []);

  return null;
}
