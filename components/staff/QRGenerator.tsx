"use client";

import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import site from "@/config/site";

const tableNumbers = Array.from({ length: 24 }, (_, index) => index + 1);

function TableCode({ table, origin }: { table: number; origin: string }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    void QRCode.toDataURL(`${origin}/menu?table=${table}`, {
      width: 256, margin: 1, errorCorrectionLevel: "M",
      color: { dark: "#191612", light: "#f4efe5" }
    }).then(setSource).catch((error: unknown) => console.error("Could not generate table QR code", error));
  }, [origin, table]);

  function download() {
    if (!source) return;
    const anchor = document.createElement("a");
    anchor.href = source;
    anchor.download = `rasoi-table-${table}.png`;
    anchor.click();
  }

  return <article className="qr-card"><strong>TABLE {String(table).padStart(2, "0")}</strong>{source ? <Image src={source} alt={`QR code for table ${table}`} width={142} height={142} unoptimized /> : <div className="qr-loading" aria-label="Generating QR code" />}<small>Opens menu with table number filled in</small><button onClick={download} disabled={!source}><Download size={13} /> Download PNG</button></article>;
}

export default function QRGenerator() {
  const [origin] = useState(process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000");
  return <section className="qr-page">
    <div className="qr-header"><Link href="/staff" className="text-link"><ArrowLeft size={15} /> Back to staff</Link><button className="button button-outline no-print" onClick={() => window.print()}><Printer size={15} /> Print all tables</button></div>
    <div className="qr-brand"><span className="brand-mark">{site.logo}</span><span className="eyebrow">SCAN, SETTLE IN, ORDER SOMETHING LOVELY</span><h1>Find your <em>table.</em></h1><p>Every QR takes your guests straight to the menu, with their table number already set.</p></div>
    <div className="qr-grid">{tableNumbers.map((table) => <TableCode key={table} table={table} origin={origin} />)}</div>
    <footer className="qr-print-footer">RASOI &amp; CO. · {site.address}</footer>
  </section>;
}
