"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BarChart3, Check, ChevronDown, LogOut, Plus, QrCode, RefreshCw, ShieldCheck, Trash2, Volume2, VolumeX } from "lucide-react";
import type { MenuItem, OrderStatus } from "@/types/menu";

interface Order {
  id: string;
  table_number: number | null;
  instructions: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  order_items: { name: string; quantity: number; note: string }[];
}
interface RewardSetting { id: string; label: string; weight: number; active: boolean }

const progress: Record<OrderStatus, OrderStatus | null> = { New: "Preparing", Preparing: "Ready", Ready: "Served", Served: "Paid", Paid: null };
const currency = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function StaffDashboard({ initiallyAuthenticated }: { initiallyAuthenticated: boolean }) {
  const [authenticated, setAuthenticated] = useState(initiallyAuthenticated);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [rewards, setRewards] = useState<RewardSetting[]>([]);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMessage, setRedeemMessage] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("345");
  const [newCuisine, setNewCuisine] = useState("North Indian");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const [orderResponse, menuResponse, rewardResponse] = await Promise.all([
      fetch("/api/orders", { cache: "no-store" }),
      fetch("/api/menu", { cache: "no-store" }),
      fetch("/api/rewards/config", { cache: "no-store" })
    ]);
    if (orderResponse.status === 401) { setAuthenticated(false); return; }
    const [orderResult, menuResult, rewardResult] = await Promise.all([orderResponse.json(), menuResponse.json(), rewardResponse.json()]);
    if (!orderResponse.ok) throw new Error(orderResult.error || "Could not load orders.");
    if (!menuResponse.ok) throw new Error(menuResult.error || "Could not load menu.");
    if (!rewardResponse.ok) throw new Error(rewardResult.error || "Could not load reward settings.");
    const incomingOrders = orderResult.orders as Order[];
    if (knownOrderIds.current.size && incomingOrders.some((order) => !knownOrderIds.current.has(order.id))) {
      const context = audioContext.current;
      if (context?.state === "running") {
        [659, 784].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.13);
          gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + index * 0.13 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.13 + 0.2);
          oscillator.connect(gain); gain.connect(context.destination);
          oscillator.start(context.currentTime + index * 0.13);
          oscillator.stop(context.currentTime + index * 0.13 + 0.22);
        });
      }
    }
    knownOrderIds.current = new Set(incomingOrders.map((order) => order.id));
    setOrders(incomingOrders);
    setMenu(menuResult.items);
    setRewards(rewardResult.rewards);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    const poll = () => refresh().catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "The dashboard could not refresh."); });
    void poll();
    const timer = window.setInterval(() => void poll(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [authenticated, refresh]);

  const todaysOrders = useMemo(() => orders.filter((order) => new Date(order.created_at).toDateString() === new Date().toDateString()), [orders]);
  const revenue = todaysOrders.filter((order) => order.status === "Paid").reduce((sum, order) => sum + order.total, 0);
  const bestsellers = useMemo(() => {
    const counts = new Map<string, number>();
    todaysOrders.forEach((order) => order.order_items.forEach((item) => counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [todaysOrders]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sign-in failed.");
      setAuthenticated(true); setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setOrders([]);
  }

  async function toggleSound() {
    if (audioContext.current?.state === "running") {
      await audioContext.current.suspend();
      setSoundEnabled(false);
      return;
    }
    audioContext.current ??= new AudioContext();
    await audioContext.current.resume();
    setSoundEnabled(true);
  }

  async function advance(order: Order) {
    const status = progress[order.status];
    if (!status) return;
    setError("");
    const response = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, status }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not update this order."); return; }
    void refresh();
  }

  async function updateMenu(item: MenuItem, changes: Partial<MenuItem>) {
    setMenu((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...changes } : entry));
    const payload = Object.fromEntries(Object.entries(changes).filter(([key]) => key !== "id"));
    const response = await fetch(`/api/menu/${encodeURIComponent(item.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not update the menu item."); void refresh(); }
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) { setError("Enter a dish name first."); return; }
    const item = { slug, name: newName.trim(), description: "Fresh from our kitchen.", price: Number(newPrice), category: "Mains", cuisine: newCuisine, diet: "veg", spice: 1, bestseller: false, chefSpecial: false, available: true, image: "/images/menu-placeholder.svg", tags: [] };
    setError("");
    const response = await fetch("/api/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not add that dish."); return; }
    setNewName("");
    void refresh();
  }

  async function removeItem(item: MenuItem) {
    if (!window.confirm(`Remove ${item.name} from the menu?`)) return;
    const response = await fetch(`/api/menu/${encodeURIComponent(item.id)}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not remove menu item."); return; }
    setMenu((current) => current.filter((entry) => entry.id !== item.id));
  }

  async function uploadImage(item: MenuItem, file?: File) {
    if (!file) return;
    const body = new FormData(); body.set("file", file); body.set("slug", item.slug);
    const response = await fetch("/api/menu/upload", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not upload image."); return; }
    await updateMenu(item, { image: result.image });
  }

  async function saveRewards() {
    const response = await fetch("/api/rewards/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rewards: rewards.map(({ id, weight, active }) => ({ id, weight, active })) }) });
    const result = await response.json();
    setRedeemMessage(response.ok ? "Reward weights saved." : result.error || "Could not save rewards.");
  }

  async function redeem(event: React.FormEvent) {
    event.preventDefault();
    setRedeemMessage("");
    const response = await fetch("/api/rewards/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: redeemCode }) });
    const result = await response.json();
    setRedeemMessage(response.ok ? `Verified: ${result.reward.label}` : result.error || "Could not verify this code.");
  }

  if (!authenticated) return <section className="staff-login">
    <div className="login-ornament">R</div><span className="eyebrow">A PRIVATE DOOR FOR THE TEAM</span><h1>Good to see<br /><em>you here.</em></h1>
    <form onSubmit={login}><label>STAFF PASSWORD<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-gold" disabled={busy}>{busy ? "CHECKING…" : <>Come on in <ArrowRight size={16} /></>}</button></form>
    <Link href="/" className="text-link">Back to the restaurant</Link>
  </section>;

  return <section className="staff-page">
    <div className="staff-top"><div><span className="eyebrow"><i /> THE BACK OF HOUSE</span><h1>Good morning,<br /><em>team.</em></h1></div><div className="staff-top-actions"><button className="button button-outline sound-toggle" onClick={() => void toggleSound()}>{soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}{soundEnabled ? "Sound on" : "Enable sound"}</button><Link href="/staff/qr" className="button button-outline"><QrCode size={16} /> Table QRs</Link><button className="icon-button" onClick={() => void refresh()} aria-label="Refresh dashboard"><RefreshCw size={17} /></button><button className="icon-button" onClick={() => void logout()} aria-label="Sign out"><LogOut size={17} /></button></div></div>
    {error && <p className="form-error" role="alert">{error}<button onClick={() => setError("")}>Dismiss</button></p>}
    <div className="analytics-row"><article><span>ORDERS TODAY</span><strong>{todaysOrders.length}</strong><small>Last 100 orders shown</small></article><article><span>PAID REVENUE</span><strong>{currency(revenue)}</strong><small>Paid orders today</small></article><article className="best-sellers"><span><BarChart3 size={14} /> MOST ORDERED TODAY</span>{bestsellers.length ? bestsellers.map(([name, count]) => <small key={name}>{name} <b>×{count}</b></small>) : <small>No orders yet today.</small>}</article></div>
    <section className="staff-block"><div className="staff-section-heading"><div><span className="eyebrow">LIVE · REFRESHES EVERY 5 SECONDS</span><h2>On the pass.</h2></div><span className="live-dot">● LIVE</span></div>
      {!orders.length ? <div className="staff-empty"><span>✳</span><h3>It’s a quiet moment.</h3><p>New table orders will find their way here.</p></div> :
        <div className="order-list">{orders.map((order) => <article className={`staff-order status-${order.status.toLowerCase()}`} key={order.id}><div className="order-heading"><div><span className="eyebrow">{order.table_number ? `TABLE ${order.table_number}` : "WALK-IN"} · {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span><h3>Order #{order.id.slice(0, 8).toUpperCase()}</h3></div><span className="order-status">{order.status}</span></div><div className="order-food">{order.order_items.map((item, index) => <p key={`${item.name}-${index}`}><b>{item.quantity} ×</b> {item.name}{item.note && <small> · {item.note}</small>}</p>)}</div>{order.instructions && <p className="order-note">Kitchen note: {order.instructions}</p>}<div className="order-bottom"><strong>{currency(order.total)}</strong>{progress[order.status] && <button className="button button-gold" onClick={() => void advance(order)}>{progress[order.status]} <ArrowRight size={14} /></button>}</div></article>)}</div>}
    </section>
    <section className="staff-block"><div className="staff-section-heading"><div><span className="eyebrow">A LITTLE HOUSEKEEPING</span><h2>On the menu.</h2></div><span>{menu.length} ITEMS</span></div>
      <form className="quick-add" onSubmit={(event) => void addItem(event)}><Plus size={17} /><input placeholder="A new dish for the menu" value={newName} onChange={(event) => setNewName(event.target.value)} required maxLength={100} /><input aria-label="New dish price" type="number" min="1" value={newPrice} onChange={(event) => setNewPrice(event.target.value)} required /><input aria-label="Dish region" value={newCuisine} onChange={(event) => setNewCuisine(event.target.value)} maxLength={50} required /><button className="button button-gold">Add dish</button></form>
      <div className="menu-admin-list">{menu.map((item) => <div className="menu-admin-row" key={item.id}><span className={`diet-mark ${item.diet}`}><i /></span><div className="menu-admin-name"><strong>{item.name}</strong><small>{item.cuisine} · {item.category}</small></div><label className="admin-price">₹<input aria-label={`${item.name} price`} type="number" min="1" max="100000" defaultValue={item.price} onBlur={(event) => { const price = Number(event.target.value); if (price > 0 && price !== item.price) void updateMenu(item, { price }); }} /></label><label className="availability-toggle"><input type="checkbox" checked={item.available} onChange={(event) => void updateMenu(item, { available: event.target.checked })} /><span>{item.available ? "Available" : "Sold out"}</span></label><label className="upload-link">Image<input type="file" accept="image/webp,image/jpeg,image/png" onChange={(event) => void uploadImage(item, event.target.files?.[0])} /></label><button className="admin-delete" aria-label={`Remove ${item.name}`} onClick={() => void removeItem(item)}><Trash2 size={15} /></button></div>)}</div>
    </section>
    <section className="staff-block"><div className="staff-section-heading"><div><span className="eyebrow">A LITTLE THANK-YOU</span><h2>Reward pool.</h2></div><ShieldCheck size={18} /></div><div className="reward-settings">{rewards.map((reward) => <label key={reward.id}><input type="checkbox" checked={reward.active} onChange={(event) => setRewards((current) => current.map((entry) => entry.id === reward.id ? { ...entry, active: event.target.checked } : entry))} /><span>{reward.label}</span><small>WEIGHT</small><input type="number" min="0" max="10000" value={reward.weight} onChange={(event) => setRewards((current) => current.map((entry) => entry.id === reward.id ? { ...entry, weight: Number(event.target.value) } : entry))} /></label>)}<button className="button button-outline" onClick={() => void saveRewards()}>Save reward weights <Check size={14} /></button></div><form className="redeem-form" onSubmit={(event) => void redeem(event)}><div><span className="eyebrow">VERIFY A CUSTOMER CODE</span><p>Use-now rewards expire in 2 hours; next-visit rewards expire in 60 days. Each code works once.</p></div><input value={redeemCode} onChange={(event) => setRedeemCode(event.target.value.toUpperCase())} placeholder="REWARD CODE" maxLength={40} required /><button className="button button-gold">Verify &amp; redeem</button>{redeemMessage && <span role="status">{redeemMessage}</span>}</form></section>
    <div className="staff-hint"><ChevronDown size={14} /> Use a table-specific QR to pre-fill the order table number. <Link href="/staff/qr">Generate table QRs</Link></div>
  </section>;
}
