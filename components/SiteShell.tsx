"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, ShoppingBag, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/store/cart";
import CartDrawer from "@/components/cart/CartDrawer";
import LanguageContext from "@/components/LanguageContext";
import SmoothExperience from "@/components/SmoothExperience";
import Intro from "@/components/Intro";
import site from "@/config/site";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [hindi, setHindi] = useState(false);
  const [light, setLight] = useState(false);
  const lines = useCart((state) => state.lines);
  const setDrawerOpen = useCart((state) => state.setDrawerOpen);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      const savedTheme = localStorage.getItem("rasoi-theme");
      setLight(savedTheme === "light");
      document.documentElement.dataset.theme = savedTheme === "light" ? "light" : "dark";
      const savedLanguage = localStorage.getItem("rasoi-language");
      setHindi(savedLanguage === "hi");
      document.documentElement.lang = savedLanguage === "hi" ? "hi" : "en";
    });
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => console.error("Service worker registration failed", error));
    }
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("rasoi-theme", next ? "light" : "dark");
  }

  function toggleLanguage() {
    const next = !hindi;
    setHindi(next);
    document.documentElement.lang = next ? "hi" : "en";
    localStorage.setItem("rasoi-language", next ? "hi" : "en");
  }

  const itemCount = mounted ? lines.reduce((sum, line) => sum + line.quantity, 0) : 0;
  return (
    <LanguageContext.Provider value={{ hindi, toggleLanguage }}>
      <>
      <SmoothExperience />
      <Intro />
      <header className="site-header">
        <Link className="brand" href="/" aria-label={`${site.name} home`}><span className="brand-mark">{site.logo}</span><span className="brand-name">RASOI <b>&amp;</b> CO.</span></Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/">{hindi ? "घर" : "Home"}</Link>
          <Link href="/about">{hindi ? "हमारी कहानी" : "Our story"}</Link>
          <Link href="/menu">{hindi ? "मेन्यू" : "The menu"}</Link>
        </nav>
        <div className="header-actions">
          <button className="icon-button language-button" onClick={toggleLanguage} aria-label={hindi ? "Switch to English" : "हिंदी में बदलें"}>{hindi ? "EN" : "हि"}<span> / {hindi ? "हिन्दी" : "हिंदी"}</span></button>
          <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${light ? "dark" : "light"} theme`}>{light ? <Moon size={17} /> : <Sun size={17} />}</button>
          <button className="bag-button" onClick={() => setDrawerOpen(true)} aria-label={`Open cart, ${itemCount} items`}><ShoppingBag size={17} /><span>Table order</span><b>{itemCount}</b></button>
        </div>
      </header>
      <main>{children}</main>
      {mounted && itemCount > 0 && <motion.button className="floating-cart" onClick={() => setDrawerOpen(true)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} aria-label={`${hindi ? "अपना ऑर्डर देखें" : "View your order"}, ${itemCount} items`}>
        <ShoppingBag size={16} /><span>{itemCount} {hindi ? "आइटम" : itemCount === 1 ? "item" : "items"} · ₹{lines.reduce((sum, line) => sum + line.quantity * line.item.price, 0)}</span><b key={itemCount}>{itemCount}</b>
      </motion.button>}
      <footer className="site-footer">
        <div className="footer-top"><span className="brand-mark">R</span><p>Come hungry.<br /><em>Leave with a story.</em></p><Link className="text-link" href="/menu">Find your favourite <ArrowUpRight size={15} /></Link></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} {site.name}</span><a href={`https://maps.google.com/?q=${site.coordinates.latitude},${site.coordinates.longitude}`} target="_blank" rel="noreferrer">Find us · {site.address}</a><a href={`tel:${site.phone.replaceAll(" ", "")}`}>{site.phone}</a><span>Open daily · {site.timings[0].hours}</span><a href={site.social.instagram} target="_blank" rel="noreferrer">Instagram</a><Link href="/staff" className="footer-staff">Staff access</Link></div>
      </footer>
      <CartDrawer />
      </>
    </LanguageContext.Provider>
  );
}
