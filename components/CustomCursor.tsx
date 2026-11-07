"use client";

import { useEffect } from "react";

export default function CustomCursor() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = "<i></i><b></b>";
    document.body.append(cursor);
    document.body.classList.add("has-custom-cursor");
    let frame = 0;
    let x = 0;
    let y = 0;

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        cursor.classList.add("visible");
      });
    };
    const hover = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("a, button, [role='button']")) cursor.classList.add("hovering");
      else cursor.classList.remove("hovering");
    };
    const leave = () => cursor.classList.remove("visible", "hovering");
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", hover, { passive: true });
    document.addEventListener("pointerout", hover, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", hover);
      document.removeEventListener("pointerout", hover);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.body.classList.remove("has-custom-cursor");
      cursor.remove();
    };
  }, []);

  return null;
}
