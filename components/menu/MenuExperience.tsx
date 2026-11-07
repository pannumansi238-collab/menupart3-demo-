"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useCart } from "@/store/cart";
import type { MenuItem } from "@/types/menu";
import { filterMenuItems } from "@/lib/menu-filter";
import { useLanguage } from "@/components/LanguageContext";

const categories = ["All", "Starters", "Mains", "Biryani & Rice", "Breads", "Desserts", "Drinks"] as const;
const categoryHindi: Record<string, string> = {
  All: "सब",
  Starters: "शुरुआत",
  Mains: "मुख्य व्यंजन",
  "Biryani & Rice": "बिरयानी और चावल",
  Breads: "रोटी",
  Desserts: "मिठाई",
  Drinks: "पेय"
};
const regions = ["All regions", "North Indian", "South Indian", "Punjabi", "Mughlai", "Awadhi", "Kashmiri", "Kerala", "Bengali", "Assamese", "Odia", "Gujarati", "Rajasthani", "Maharashtrian", "Goan", "Street Food", "Indo-Chinese", "Hyderabadi", "Chettinad", "Andhra", "Karnataka"];

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function SpiceMeter({ level }: { level: MenuItem["spice"] }) {
  return <span className="spice-meter" aria-label={level === 0 ? "Not spicy" : `Spice level ${level} out of 3`}>{[1, 2, 3].map((n) => <i className={n <= level ? "hot" : ""} key={n} />)}</span>;
}

function QuantityControl({ item }: { item: MenuItem }) {
  const { hindi } = useLanguage();
  const quantity = useCart((state) => state.quantity(item.id));
  const add = useCart((state) => state.add);
  const increment = useCart((state) => state.increment);
  const decrement = useCart((state) => state.decrement);
  if (!quantity) return <button className="add-button" onClick={(event) => { event.stopPropagation(); add(item); }}>{hindi ? "जोड़ें" : "ADD"} <span>+</span></button>;
  return <div className="quantity-control" onClick={(event) => event.stopPropagation()} aria-label={`${quantity} ${item.name} in your cart`}>
    <button aria-label={`Remove one ${item.name}`} onClick={() => decrement(item.id)}>−</button><span>{quantity}</span><button aria-label={`Add one ${item.name}`} onClick={() => increment(item.id)}>+</button>
  </div>;
}

function DishCard({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  return <motion.article className="dish-card" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.24 }} onClick={onOpen} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onOpen(); }}>
    <div className="dish-image">
      <Image src={item.image} alt={`${item.name} — illustrative menu image`} fill sizes="(max-width: 700px) 90vw, (max-width: 1050px) 45vw, 30vw" />
      {item.bestseller && <span className="dish-ribbon">A HOUSE FAVOURITE</span>}
      {item.chefSpecial && <span className="chef-mark">✳ CHEF’S PICK</span>}
      <span className={`diet-mark ${item.diet}`} aria-label={item.diet === "veg" ? "Vegetarian" : "Non vegetarian"}><i /></span>
    </div>
    <div className="dish-card-content">
      <div className="dish-title-row"><h3>{item.name}</h3><span>{money(item.price)}</span></div>
      <p>{item.description}</p>
      <div className="dish-card-footer"><span>{item.cuisine} <b>·</b> <SpiceMeter level={item.spice} /></span><QuantityControl item={item} /></div>
      {!item.available && <span className="sold-out">A little rest today</span>}
    </div>
  </motion.article>;
}

function DishDialog({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div className="dish-dialog" role="dialog" aria-modal="true" aria-labelledby="dish-dialog-title" initial={{ y: 24, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.98 }}>
      <button className="dialog-close" onClick={onClose} aria-label="Close dish details"><X size={18} /></button>
      <div className="dialog-image"><Image src={item.image} alt={`${item.name} — illustrative menu image`} fill sizes="(max-width: 720px) 90vw, 42vw" /></div>
      <div className="dialog-copy"><span className="eyebrow">{item.cuisine} · {item.diet === "veg" ? "VEGETARIAN" : "NON-VEGETARIAN"}</span><h2 id="dish-dialog-title">{item.name}</h2><p>{item.description}</p><div className="dialog-tags"><span><SpiceMeter level={item.spice} /> Spice</span>{item.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div><div className="dialog-order"><strong>{money(item.price)}</strong><QuantityControl item={item} /></div></div>
    </motion.div>
  </motion.div>;
}

export default function MenuExperience() {
  const { hindi } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<typeof categories[number]>("All");
  const [diet, setDiet] = useState<"all" | "veg" | "non-veg">("all");
  const [region, setRegion] = useState("All regions");
  const [spice, setSpice] = useState(0);
  const [sort, setSort] = useState("popular");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/menu", { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "The menu couldn’t load.");
        setItems(result.items);
      })
      .catch((cause: unknown) => { if (cause instanceof Error && cause.name !== "AbortError") setError(cause.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => filterMenuItems(items, { category, diet, region, spice, search, sort }), [items, category, diet, region, spice, search, sort]);

  return <>
    <section className="menu-hero">
      <span className="eyebrow"><i /> {hindi ? "हर कोने से, प्यार के साथ" : "FROM EVERY CORNER, WITH LOVE"}</span>
      <div className="menu-title-wrap"><h1>{hindi ? <>भारत की <em>थाली.</em></> : <>The <em>menu.</em></>}</h1><p>{hindi ? <>रुकने के साठ कारण।<br />हर सफ़र से कुछ ख़ास।</> : <>Sixty reasons to stay awhile.<br />A little something from every road.</>}</p></div>
      <span className="menu-count">60<br /><small>PLATES &amp; POUR-OVERS</small></span>
      <div className="menu-hero-bottom"><span>COOKED SLOW. SHARED GENEROUSLY.</span><span>NO SHORTCUTS IN THIS KITCHEN ↓</span></div>
    </section>
    <section className="menu-content">
      <div className="menu-intro"><span className="eyebrow">{hindi ? "अपनी जगह ले लीजिए" : "PULL UP A CHAIR"}</span><p>{hindi ? "जो मन चाहे चुनिए। बाकी हम संभाल लेंगे।" : "Follow your appetite. We’ll take care of the rest."}</p></div>
      <div className="menu-toolbar">
        <div className="menu-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={hindi ? "खोजें: स्वाद, जगह, या पकवान…" : "A dish, a place, a craving…"} aria-label={hindi ? "मेन्यू खोजें" : "Search menu"} />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}</div>
        <div className="toolbar-actions">
          <label className="sort-control"><ArrowDownUp size={14} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label={hindi ? "मेन्यू क्रम" : "Sort menu"}><option value="popular">{hindi ? "सबसे पसंदीदा" : "Most loved"}</option><option value="price-low">{hindi ? "कीमत: कम से ज़्यादा" : "Price: low to high"}</option><option value="price-high">{hindi ? "कीमत: ज़्यादा से कम" : "Price: high to low"}</option><option value="name">{hindi ? "नाम: अ से ज्ञ" : "Name A–Z"}</option></select><ChevronDown size={13} /></label>
          <button className={`filter-open ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={15} /> {hindi ? "फ़िल्टर" : "Filters"} <span>{[diet !== "all", region !== "All regions", spice > 0].filter(Boolean).length || ""}</span></button>
        </div>
      </div>
      <div className="category-tabs" role="tablist" aria-label="Menu category">
        {categories.map((name) => <button key={name} className={category === name ? "selected" : ""} onClick={() => setCategory(name)} role="tab" aria-selected={category === name}>{hindi ? categoryHindi[name] : name}</button>)}
      </div>
      <AnimatePresence initial={false}>
        {filtersOpen && <motion.div className="filter-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}><div className="filter-group"><span>{hindi ? "आपकी पसंद" : "MADE FOR"}</span><div className="filter-chips">{[["all", hindi ? "सब कुछ" : "Everything"], ["veg", hindi ? "शाकाहारी" : "Veg"], ["non-veg", hindi ? "मांसाहारी" : "Non-veg"]].map(([value, label]) => <button key={value} className={diet === value ? "selected" : ""} onClick={() => setDiet(value as typeof diet)}>{value !== "all" && <i className={`diet-mark ${value}`}><i /></i>}{label}</button>)}</div></div>
          <label className="filter-group region-filter"><span>{hindi ? "क्षेत्र और रसोई" : "REGION & KITCHEN"}</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((name) => <option key={name}>{name}</option>)}</select></label>
          <div className="filter-group"><span>{hindi ? "तीखापन" : "SPICE THRESHOLD"}</span><div className="filter-chips">{[[0, hindi ? "कोई भी" : "Any heat"], [1, hindi ? "हल्का" : "Mild"], [2, hindi ? "थोड़ा तीखा" : "A little fire"], [3, hindi ? "बहुत तीखा" : "Bring it"]].map(([value, label]) => <button key={value} className={spice === value ? "selected" : ""} onClick={() => setSpice(value as number)}>{label}</button>)}</div></div>
        </motion.div>}
      </AnimatePresence>
      <div className="menu-result-line"><span>{loading ? (hindi ? "मेज़ सज रही है…" : "SETTING THE TABLE…") : hindi ? `पसंद करने के लिए ${visible.length} पकवान` : `${visible.length} THINGS TO FALL FOR`}</span><span>{hindi ? "सभी कीमतें ₹ में" : "ALL PRICES IN ₹ · INCLUSIVE OF CARE"}</span></div>
      {error ? <div className="menu-error" role="alert"><span className="eyebrow">{hindi ? "मेन्यू अभी उपलब्ध नहीं है" : "THE MENU IS TEMPORARILY UNAVAILABLE"}</span><p>{error}</p><button onClick={() => window.location.reload()}>{hindi ? "फिर कोशिश करें" : "Try again"}</button></div> :
        loading ? <div className="dish-grid">{Array.from({ length: 6 }, (_, index) => <div className="dish-skeleton" key={index}><div /><span /><span /></div>)}</div> :
        visible.length ? <motion.div className="dish-grid" layout><AnimatePresence mode="popLayout">{visible.map((item) => <DishCard item={item} key={item.id} onOpen={() => setSelected(item)} />)}</AnimatePresence></motion.div> :
          <div className="empty-menu"><span>✳</span><h2>{hindi ? "यहाँ कुछ नहीं मिला।" : "Nothing on this plate."}</h2><p>{hindi ? "कोई और खोज या फ़िल्टर आज़माएँ।" : "Try a different search or loosen a filter."}</p><button className="text-link" onClick={() => { setSearch(""); setDiet("all"); setRegion("All regions"); setSpice(0); setCategory("All"); }}>{hindi ? "सभी फ़िल्टर हटाएँ" : "Clear all filters"} <Check size={15} /></button></div>}
    </section>
    <AnimatePresence>{selected && <DishDialog item={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
  </>;
}
