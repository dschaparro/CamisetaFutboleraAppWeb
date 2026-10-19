"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";

const CLAVE_CARRITO = "cf-carrito-v1";

export type CartItem = {
  id: string;
  /** Producto en el catálogo: con esto el servidor toma el precio real. */
  slug: string;
  club: string;
  name: string;
  initials: string;
  cat: string;
  size: string;
  sleeve: string;
  custom: string;
  qty: number;
  price: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const cargado = useRef(false);
  const [aviso, setAviso] = useState<{ id: number; texto: string } | null>(null);

  // El aviso «Agregado al carrito» se va solo a los 4 segundos.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  // El carrito sobrevive a recargar la página y a pasar por «Ingresar» antes de pagar.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem(CLAVE_CARRITO);
        const guardado: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(guardado)) setItems(guardado.filter((i): i is CartItem => typeof i === "object" && i !== null && typeof i.slug === "string"));
      } catch {
        /* sin almacenamiento: carrito solo en memoria */
      }
      cargado.current = true;
    });
  }, []);

  useEffect(() => {
    if (!cargado.current) return;
    try {
      sessionStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
    } catch {
      /* sin almacenamiento */
    }
  }, [items]);

  const addItem = (item: Omit<CartItem, "id">) => {
    setItems((prev) => [...prev, { ...item, id: `${item.name}-${Date.now()}` }]);
    setAviso({ id: Date.now(), texto: `${item.name} · talla ${item.size}` });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
    );
  };

  const clear = () => setItems([]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, subtotal, count }}>
      {children}
      {aviso && (
        <div className="toast" role="status" aria-live="polite" key={aviso.id}>
          <span className="toast-ok" aria-hidden="true">✓</span>
          <div className="toast-texto">
            <b>Agregado al carrito</b>
            <span>{aviso.texto}</span>
          </div>
          <Link href="/carrito" className="toast-link" onClick={() => setAviso(null)}>Ver carrito</Link>
          <button type="button" className="toast-cerrar" aria-label="Cerrar aviso" onClick={() => setAviso(null)}>×</button>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
