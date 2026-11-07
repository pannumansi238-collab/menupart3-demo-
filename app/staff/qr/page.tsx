import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { hasStaffSession } from "@/lib/auth";
import QRGenerator from "@/components/staff/QRGenerator";

export const dynamic = "force-dynamic";

export default async function QRPage() {
  if (!await hasStaffSession()) return <section className="staff-page"><span className="eyebrow">STAFF ACCESS</span><h1>This page is for<br /><em>the team.</em></h1><Link className="text-link" href="/staff">Sign in to continue <ArrowLeft size={15} /></Link></section>;
  return <QRGenerator />;
}
