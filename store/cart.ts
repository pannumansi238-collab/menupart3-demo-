"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine, MenuItem } from "@/types/menu";

interface CartState {
  lines: CartLine[];
  drawerOpen: boolean;
  add: (item: MenuItem) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  setNote: (id: string, note: string) => void;
  clear: () => void;
  setDrawerOpen: (open: boolean) => void;
  quantity: (id: string) => number;
}

export const useCart = create<CartState>()(persist((set, get) => ({
  lines: [],
  drawerOpen: false,
  add: (item) => set((state) => {
    const existing = state.lines.find((line) => line.item.id === item.id);
    if (existing) {
      return { lines: state.lines.map((line) => line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line) };
    }
    return { lines: [...state.lines, { item, quantity: 1, note: "" }] };
  }),
  increment: (id) => set((state) => ({
    lines: state.lines.map((line) => line.item.id === id ? { ...line, quantity: Math.min(30, line.quantity + 1) } : line)
  })),
  decrement: (id) => set((state) => ({
    lines: state.lines.flatMap((line) => line.item.id !== id ? [line] : line.quantity > 1 ? [{ ...line, quantity: line.quantity - 1 }] : [])
  })),
  setNote: (id, note) => set((state) => ({
    lines: state.lines.map((line) => line.item.id === id ? { ...line, note } : line)
  })),
  clear: () => set({ lines: [] }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  quantity: (id) => get().lines.find((line) => line.item.id === id)?.quantity ?? 0
}), {
  name: "rasoi-cart-v1",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ lines: state.lines })
}));
