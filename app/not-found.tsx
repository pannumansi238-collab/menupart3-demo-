import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <section className="not-found-page">
    <span className="eyebrow">A WRONG TURN, NOT A BAD ENDING</span>
    <strong>404</strong>
    <h1>This page isn’t<br /><em>on the menu.</em></h1>
    <p>Let’s get you back to something good.</p>
    <Link href="/" className="button button-gold"><ArrowLeft size={15} /> Back to the table</Link>
  </section>;
}
