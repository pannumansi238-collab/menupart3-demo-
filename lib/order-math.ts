export function calculateOrderTotals(subtotal: number) {
  const gst = Math.round(subtotal * 0.05);
  return { subtotal, gst, total: subtotal + gst };
}
