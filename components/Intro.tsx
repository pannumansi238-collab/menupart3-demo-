"use client";

import { useEffect, useState } from "react";

export default function Intro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("rasoi-intro-seen")) return;
    let timeout = 0;
    const frame = window.requestAnimationFrame(() => {
      setVisible(true);
      timeout = window.setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem("rasoi-intro-seen", "1");
      }, 750);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;
  return <div className="intro" aria-hidden="true"><span>R</span><i>RASOI &amp; CO.</i></div>;
}
