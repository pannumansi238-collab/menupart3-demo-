import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import site from "@/config/site";

export const metadata: Metadata = { title: "Our story", description: `Meet the people and places behind ${site.name}.` };

export default function AboutPage() {
  return (
    <>
      <section className="about-hero">
        <span className="eyebrow"><i /> A TABLE WITH MANY HOMES</span>
        <h1>Somewhere between<br />the <em>first bite</em> and<br />the last story.</h1>
        <p>That’s where we wanted to build a restaurant.</p>
        <span className="about-side-note">A LITTLE ABOUT US<br />EST. NEW DELHI · 2018</span>
      </section>
      <section className="story-grid">
        <div className="story-portrait">
          <Image src="/images/chef-portrait.svg" alt="Illustrated portrait placeholder for founder photography" fill sizes="(max-width: 760px) 90vw, 48vw" />
          <span className="portrait-caption">CHEF ARJUN MEHRA · FOUNDER</span>
        </div>
        <div className="story-copy" data-reveal><span className="eyebrow">A NOTE FROM OUR FOUNDER</span><h2>“I wanted every dish to feel like <em>coming home.</em>”</h2><p>My earliest food memories begin in a kitchen full of noise: a pressure cooker announcing lunch, my grandmother grinding masala by hand, cousins reaching over one another for the last piece of naan.</p><p>Years later, I went looking for that feeling across India. From a winter kitchen in Srinagar to a fish market in Kochi, I kept finding the same thing: extraordinary food, made with patience and meant to be shared.</p><p>Rasoi is my love letter to those places, those cooks, and the people who first taught me to eat with my hands.</p><span className="founder-signature">Arjun</span><small>Arjun Mehra · Chef &amp; founder</small></div>
      </section>
      <section className="timeline-section section">
        <div className="section-heading"><div><span className="eyebrow">A FEW MILES, A FEW MILESTONES</span><h2>Still finding<br />our <em>way around.</em></h2></div><p>Every year brings another recipe, another kitchen, another reason to pull up a chair.</p></div>
        <div className="timeline">
          <article><span>2018</span><div><i /><h3>One table, one big idea</h3><p>Rasoi opens its doors in Hauz Khas with twelve dishes and a very full dining room.</p></div></article>
          <article><span>2020</span><div><i /><h3>Our neighbourhood, at home</h3><p>We packed up family recipes and delivered the feeling of a shared meal across Delhi.</p></div></article>
          <article><span>2023</span><div><i /><h3>The menu goes further</h3><p>New journeys bring the flavours of Bengal, Goa and the northeast to our little kitchen.</p></div></article>
          <article><span>Today</span><div><i /><h3>There’s room for one more</h3><p>We’re still cooking, still curious, and always saving you a place at the table.</p></div></article>
        </div>
      </section>
      <section className="about-values">
        <span className="eyebrow">THE THINGS WE BELIEVE</span>
        <div><h2>Seasonal when<br />we can. <em>Thoughtful</em><br />always.</h2><p>Buy from our neighbours. Waste as little as possible. Let each region taste like itself. And remember that the best meal is the one you don’t eat alone.</p></div>
        <Link className="text-link" href="/menu">Meet the menu <ArrowUpRight size={16} /></Link>
      </section>
    </>
  );
}
