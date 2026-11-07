"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { calculateOrderTotals } from "@/lib/order-math";
import { useLanguage } from "@/components/LanguageContext";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

export default function CartDrawer() {
  const { hindi } = useLanguage();
  const router = useRouter();
  const lines = useCart((state) => state.lines);
  const open = useCart((state) => state.drawerOpen);
  const setOpen = useCart((state) => state.setDrawerOpen);
  const increment = useCart((state) => state.increment);
  const decrement = useCart((state) => state.decrement);
  const setNote = useCart((state) => state.setNote);
  const clear = useCart((state) => state.clear);
  const [tableNumber, setTableNumber] = useState(() => {
    if (typeof window === "undefined") return "";
    const table = new URLSearchParams(window.location.search).get("table");
    return table && /^\d{1,3}$/.test(table) && Number(table) > 0 ? table : "";
  });
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0), [lines]);
  const { gst, total } = calculateOrderTotals(subtotal);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open, setOpen]);

  async function placeOrder() {
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: tableNumber ? Number(tableNumber) : null,
          instructions,
          items: lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity, note: line.note }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn’t place that order.");
      clear();
      setOpen(false);
      router.push(`/orders/${result.orderId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The order couldn’t be placed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <AnimatePresence>
    {open && <>
      <motion.button className="drawer-scrim" aria-label="Close cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
      <motion.aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 280 }}>
        <header className="cart-header"><div><span className="eyebrow">{hindi ? "आपकी मेज़ के लिए कुछ ख़ास" : "A LITTLE SOMETHING FOR THE TABLE"}</span><h2 id="cart-title">{hindi ? "आपका ऑर्डर" : "Your order"}<span>.</span></h2></div><button className="dialog-close" aria-label={hindi ? "कार्ट बंद करें" : "Close cart"} onClick={() => setOpen(false)}><X size={18} /></button></header>
        {!lines.length ? <div className="cart-empty"><ShoppingBag size={26} /><h3>{hindi ? "आपकी मेज़ इंतज़ार में है।" : "Your table is waiting."}</h3><p>{hindi ? "मेन्यू से कुछ स्वादिष्ट चुनिए।" : "It’s a little quiet in here. Add something lovely from the menu."}</p><button className="button button-outline" onClick={() => setOpen(false)}>{hindi ? "मेन्यू पर लौटें" : "Back to the menu"} <ArrowRight size={15} /></button></div> :
          <>
            <div className="cart-lines">{lines.map(({ item, quantity, note }) => <article className="cart-line" key={item.id}>
              <div className="cart-line-image"><Image src={item.image} alt="" fill sizes="72px" /></div><div className="cart-line-copy"><div><h3>{item.name}</h3><span>{money(item.price * quantity)}</span></div><small>{item.cuisine} · {money(item.price)} each</small><input aria-label={`Special request for ${item.name}`} value={note} onChange={(event) => setNote(item.id, event.target.value)} placeholder="Add a note (e.g. mild, no onion)" maxLength={240} /><div className="quantity-control"><button aria-label={`Remove one ${item.name}`} onClick={() => decrement(item.id)}><Minus size={13} /></button><span>{quantity}</span><button aria-label={`Add one ${item.name}`} onClick={() => increment(item.id)}><Plus size={13} /></button></div></div>
            </article>)}</div>
            <div className="cart-details"><label>{hindi ? "मेज़ नंबर" : "TABLE NUMBER"} <span>{hindi ? "हम यहीं लाएँगे" : "We’ll bring it to you"}</span><input inputMode="numeric" pattern="[0-9]*" maxLength={3} value={tableNumber} onChange={(event) => setTableNumber(event.target.value.replace(/\D/g, ""))} placeholder={hindi ? "अपनी मेज़ का नंबर लिखें" : "Enter your table number"} /></label><label>{hindi ? "रसोई के लिए नोट" : "A NOTE FOR THE KITCHEN"} <span>{hindi ? "वैकल्पिक" : "Optional"}</span><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={500} placeholder={hindi ? "एलर्जी, समय या कोई ज़रूरी बात…" : "Allergies, timing, anything we should know…"} /></label></div>
            <div className="cart-summary"><div><span>{hindi ? "उप-योग" : "Subtotal"}</span><span>{money(subtotal)}</span></div><div><span>GST <small>5%</small></span><span>{money(gst)}</span></div><div className="cart-total"><span>{hindi ? "कुल" : "Total"}</span><strong>{money(total)}</strong></div></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-gold place-order" onClick={placeOrder} disabled={!lines.length || submitting}>{submitting ? (hindi ? "ऑर्डर भेज रहे हैं…" : "SENDING YOUR ORDER…") : <>{hindi ? "ऑर्डर भेजें" : "Place the order"} <span>{money(total)}</span><ArrowRight size={16} /></>}</button>
            <p className="cart-fineprint">{hindi ? "आपका ऑर्डर सीधे रसोई में जाएगा। भुगतान मेज़ पर करें।" : "Your order is sent straight to our kitchen. Pay at the table."}</p>
          </>}
      </motion.aside>
    </>}
  </AnimatePresence>;
}
