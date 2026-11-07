"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Clock3, X } from "lucide-react";
import ScratchCard from "@/components/rewards/ScratchCard";
import type { OrderStatus } from "@/types/menu";

interface Order {
  id: string;
  table_number: number | null;
  status: OrderStatus;
  total: number;
  created_at: string;
  order_items: { name: string; quantity: number }[];
}

const stages: OrderStatus[] = ["New", "Preparing", "Ready", "Served", "Paid"];

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [rewardOpen, setRewardOpen] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Your order couldn’t be found.");
        if (active) { setOrder(result.order); setError(""); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Your order couldn’t be loaded.");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [id]);

  useEffect(() => {
    if (!order || !rewardOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setRewardOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [order, rewardOpen]);

  if (error && !order) return <section className="tracking-page"><p role="alert">{error}</p><Link className="text-link" href="/menu"><ArrowLeft size={15} /> Back to the menu</Link></section>;
  if (!order) return <section className="tracking-page"><span className="eyebrow">ONE MOMENT</span><h1>We’re finding your order.</h1><div className="loading-dot" /></section>;

  const activeStage = stages.indexOf(order.status);
  return <section className="tracking-page">
    <span className="eyebrow"><i /> ORDER RECEIVED · {order.id.slice(0, 8).toUpperCase()}</span>
    <h1>Your table’s about<br />to get <em>happier.</em></h1>
    <p className="tracking-lead">{order.table_number ? `We’re bringing it to table ${order.table_number}.` : "We’ve sent your order straight to the kitchen."} Here’s what happens next.</p>
    <div className="tracking-status"><div className="tracking-status-header"><Clock3 size={17} /><strong>{order.status}</strong><span>UPDATES EVERY FEW SECONDS</span></div><div className="tracking-steps">{stages.map((stage, index) => <div className={index <= activeStage ? "complete" : ""} key={stage}><i>{index < activeStage ? <Check size={12} /> : index + 1}</i><span>{stage}</span></div>)}</div></div>
    <div className="tracking-items"><span className="eyebrow">ON THE WAY TO YOUR TABLE</span>{order.order_items.map((item, index) => <p key={`${item.name}-${index}`}><span>{item.quantity} × {item.name}</span></p>)}<p className="tracking-total"><span>Total · GST included</span><strong>₹{order.total}</strong></p></div>
    <div className="reward-callout"><span className="eyebrow">ONE LAST LITTLE SURPRISE</span><h2>A thank-you,<br /><em>from our kitchen.</em></h2><p>Your scratch card is ready. Reveal it once for a little something from our kitchen.</p><button className="button button-outline" onClick={() => setRewardOpen(true)}>Open your scratch card</button></div>
    <Link href="/menu" className="text-link"><ArrowLeft size={15} /> Back to the menu</Link>
    <AnimatePresence>{rewardOpen && <motion.div className="reward-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setRewardOpen(false); }}>
      <motion.div className="reward-modal" role="dialog" aria-modal="true" aria-labelledby="reward-title" initial={{ y: 20, scale: .98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 12, scale: .98 }}>
        <button className="dialog-close" onClick={() => setRewardOpen(false)} aria-label="Close scratch card"><X size={17} /></button>
        <span className="eyebrow">ONE LAST LITTLE SURPRISE</span><h2 id="reward-title">A thank-you,<br /><em>from our kitchen.</em></h2><p>Your reward is decided by our kitchen. Scratch once to reveal it.</p><ScratchCard orderId={order.id} />
      </motion.div>
    </motion.div>}</AnimatePresence>
  </section>;
}
