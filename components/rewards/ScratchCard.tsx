"use client";

import { useRef, useState } from "react";
import { scratchCoverage } from "@/lib/scratch";

interface Reward {
  label: string;
  code: string | null;
  redemption: "this_bill" | "next_visit";
  expiresAt: string;
}

export default function ScratchCard({ orderId }: { orderId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scratching, setScratching] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [error, setError] = useState("");
  const requested = useRef(false);
  const lastCoverageCheck = useRef(0);

  function prepareCanvas(canvas: HTMLCanvasElement) {
    const bounds = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = bounds.width * ratio;
    canvas.height = bounds.height * ratio;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.fillStyle = "#b88747";
    context.fillRect(0, 0, bounds.width, bounds.height);
    context.fillStyle = "#191612";
    context.font = "600 12px Arial";
    context.textAlign = "center";
    context.fillText("SCRATCH HERE TO REVEAL", bounds.width / 2, bounds.height / 2);
    context.strokeStyle = "rgba(255,255,255,.16)";
    context.lineWidth = 1;
    for (let x = -bounds.height; x < bounds.width; x += 16) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + bounds.height, bounds.height);
      context.stroke();
    }
  }

  function erase(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width === 0) prepareCanvas(canvas);
    const context = canvas.getContext("2d");
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(x, y, 22 * scaleX, 0, Math.PI * 2);
    context.fill();
    setScratching(true);
    if (performance.now() - lastCoverageCheck.current < 250) return;
    lastCoverageCheck.current = performance.now();
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    if (scratchCoverage(pixels) > 0.4) void reveal();
  }

  async function reveal() {
    if (requested.current) return;
    requested.current = true;
    try {
      const response = await fetch("/api/rewards/scratch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your card couldn’t be revealed.");
      setReward(result.reward);
      setRevealed(true);
    } catch (cause) {
      requested.current = false;
      setError(cause instanceof Error ? cause.message : "Your card couldn’t be revealed.");
    }
  }

  return <div className="scratch-wrap">
    {revealed && <div className="confetti-layer" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>}
    <div className={`scratch-card ${revealed ? "revealed" : ""}`}>
      {reward ? <div className="scratch-result"><span>✳</span><strong>{reward.label}</strong>{reward.code && <code>{reward.code}</code>}<small>{reward.redemption === "this_bill" ? "A little joy, right now." : "Save this for your next visit."}</small></div> : <div className="scratch-placeholder"><span>✳</span><strong>Your thank-you is<br />just beneath the surface.</strong><small>One scratch, one little surprise.</small></div>}
      {!revealed && <canvas ref={(node) => { canvasRef.current = node; if (node && node.width === 0) prepareCanvas(node); }} className="scratch-canvas" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); erase(event); }} onPointerMove={(event) => { if (event.buttons === 1) erase(event); }} onPointerUp={() => setScratching(false)} aria-label="Scratch to reveal your reward" />}
    </div>
    {!revealed && <p className="scratch-hint">{scratching ? "A little more…" : "Use your finger or mouse to scratch"}</p>}
    {error && <div className="form-error" role="alert">{error} <button onClick={() => void reveal()}>Try again</button></div>}
  </div>;
}
