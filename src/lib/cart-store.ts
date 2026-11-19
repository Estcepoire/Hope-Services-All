"use client";

import { useSyncExternalStore } from "react";

// Panier du visiteur, gardé dans le navigateur (localStorage) : il survit aux rechargements et
// fonctionne sans compte. Il ne contient que des identifiants et des quantités : prix et stock
// sont toujours relus sur le serveur (affichage du panier et validation de la commande).

export type CartLine = { slug: string; qty: number };

const KEY = "hope-panier";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY; // stockage bloqué (navigation privée stricte…)
  }
  if (raw === cachedRaw) return cachedLines; // même référence tant que rien ne change
  cachedRaw = raw;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    cachedLines = Array.isArray(parsed)
      ? parsed.filter((l): l is CartLine => typeof l?.slug === "string" && Number.isInteger(l?.qty) && l.qty > 0)
      : EMPTY;
  } catch {
    cachedLines = EMPTY;
  }
  return cachedLines;
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // stockage indisponible : le panier ne sera pas conservé
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener(); // synchro entre onglets
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const MAX_QTY = 99;

export const cart = {
  add(slug: string, qty = 1) {
    const lines = read();
    const existing = lines.find((l) => l.slug === slug);
    write(
      existing
        ? lines.map((l) => (l.slug === slug ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
        : [...lines, { slug, qty: Math.min(MAX_QTY, qty) }],
    );
  },
  setQty(slug: string, qty: number) {
    write(qty <= 0 ? read().filter((l) => l.slug !== slug) : read().map((l) => (l.slug === slug ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)));
  },
  remove(slug: string) {
    write(read().filter((l) => l.slug !== slug));
  },
  clear() {
    write(EMPTY);
  },
};

/** Lignes du panier ; vide côté serveur et au premier rendu (pas d'écart d'hydratation). */
export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount() {
  return useCart().reduce((n, l) => n + l.qty, 0);
}
