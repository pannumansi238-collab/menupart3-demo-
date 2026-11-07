import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, MoveUpRight } from "lucide-react";
import menu from "@/data/menu.json";
import site from "@/config/site";

const signatures = menu.filter((item) => item.bestseller).slice(0, 4);

export default function HomePage() {
  return (
    <>
      <section className="hero" data-hero-pin>
        <div className="hero-grain" />
        <div className="hero-copy">
          <span className="eyebrow"><i /> AN INDIAN KITCHEN, WITHOUT BORDERS</span>
          <h1>India doesn’t<br />fit on <em>one plate.</em></h1>
          <p>So we travelled for the recipes. Then brought the whole delicious story to your table.</p>
          <Link className="button button-gold" href="/menu">Find your flavour <MoveUpRight size={16} /></Link>
        </div>
        <div className="hero-art" data-parallax>
          <Image src="/images/menu-placeholder.svg" alt="A richly spiced dish from the Rasoi & Co. kitchen" fill priority sizes="(max-width: 760px) 90vw, 55vw" className="hero-dish-image" />
          <div className="hero-stamp"><span>60</span><small>regional<br />favourites</small></div>
          <div className="hero-caption"><span>01 — 60</span><span>FROM KASHMIR TO KERALA</span></div>
        </div>
        <div className="hero-foot"><span>NEW DELHI · EST. 2018</span><span>SCROLL TO TAKE A SEAT <ArrowDown size={14} /></span></div>
      </section>

      <section className="ticker" aria-label="Our philosophy"><div>MADE SLOW <b>✳</b> SHARED GENEROUSLY <b>✳</b> ROOTED IN INDIA <b>✳</b> MADE SLOW <b>✳</b> SHARED GENEROUSLY <b>✳</b> ROOTED IN INDIA <b>✳</b></div></section>

      <section className="section signature-section">
        <div className="section-heading" data-reveal><div><span className="eyebrow">THE FIRST ROUND</span><h2>A few good<br /><em>reasons to stay.</em></h2></div><Link className="text-link" href="/menu">Explore the menu <ArrowUpRight size={16} /></Link></div>
        <div className="signature-grid">
          {signatures.map((dish, index) => (
            <Link href="/menu" className={`signature-card signature-${index + 1}`} key={dish.id} data-reveal>
              <div className="signature-image"><Image src={dish.image} alt={`${dish.name}, served at ${site.name}`} fill sizes="(max-width: 700px) 85vw, 35vw" /></div>
              <span className="signature-index">0{index + 1} / SIGNATURE</span>
              <h3>{dish.name}</h3><span className="signature-meta">{dish.cuisine} <b>·</b> ₹{dish.price}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="manifesto-section">
        <div className="manifesto-image"><Image src="/images/menu-placeholder.svg" alt="The warmth and colour of an Indian table" fill sizes="50vw" data-parallax /></div>
        <div className="manifesto-copy" data-reveal><span className="eyebrow">GOOD FOOD HAS A LONG MEMORY</span><h2>Recipes that<br />know their <em>way home.</em></h2><p>We cook the dishes we grew up loving, and the ones we had to travel to find. Regional, generous, and always made with time.</p><Link className="text-link" href="/about">A little more about us <ArrowUpRight size={16} /></Link><span className="manifesto-seal">R<br /><small>&amp; CO.</small></span></div>
      </section>

      <section className="why-section section">
        <div className="section-heading" data-reveal><div><span className="eyebrow">THE RASOI WAY</span><h2>Good things<br />take <em>their time.</em></h2></div><p>Not a shortcut in sight. Just a little more care, from the first spice to the last spoonful.</p></div>
        <div className="values-grid">
          <article data-reveal><span>01</span><h3>Spice, from scratch</h3><p>Whole spices, roasted in small batches. Our masalas have a postcode and a point of view.</p></article>
          <article data-reveal><span>02</span><h3>Slow is a flavour</h3><p>Our dal starts the night before. Our biryani stays sealed until it reaches your table.</p></article>
          <article data-reveal><span>03</span><h3>India, in the plural</h3><p>A menu that moves from the coast to the hills, with every region bringing its own story.</p></article>
        </div>
      </section>

      <section className="gallery-section">
        <div className="gallery-top"><span className="eyebrow">A PLACE AT OUR TABLE</span><span>HAUZ KHAS VILLAGE, NEW DELHI</span></div>
        <div className="gallery-photo"><Image src="/images/ambience-placeholder.svg" alt="Illustrated placeholder for a warm dining-room photograph" fill sizes="100vw" /><span className="gallery-note">Come as you are.<br /><em>Leave room for dessert.</em></span></div>
      </section>

      <section className="quote-section" data-reveal><span className="eyebrow">KIND WORDS, FULL HEARTS</span><blockquote>“The sort of meal that makes you cancel your evening plans and order one more thing.”</blockquote><span className="quote-byline">A TABLE OF REGULARS · NEW DELHI</span></section>

      <section className="closing-cta"><span className="eyebrow">YOUR TABLE IS WAITING</span><h2>Come hungry.<br /><em>Leave with a story.</em></h2><Link className="button button-gold" href="/menu">See what’s cooking <MoveUpRight size={16} /></Link><p>{site.address} <span>·</span> {site.phone}</p></section>
    </>
  );
}
