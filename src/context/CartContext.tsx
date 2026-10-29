"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/context/ToastContext";
import {
  CARRITO_MAX_CANTIDAD_DEFAULT,
  CARRITO_MAX_PRODUCTOS_DEFAULT,
} from "@/modules/tienda/domain/types";

const CLAVE_CARRITO = "cf-carrito-v1";
const CLAVE_CONTEO = "cf-carrito-n";
const ESQUELETOS_MAX = 8;

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

function mismaLinea(a: CartItem, b: Omit<CartItem, "id" | "qty" | "price">) {
  return a.slug === b.slug && a.size === b.size && a.sleeve === b.sleeve && a.custom === b.custom;
}

function leerSession(): CartItem[] {
  try {
    const raw = sessionStorage.getItem(CLAVE_CARRITO);
    const guardado: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(guardado)) return [];
    return guardado.filter(
      (i): i is CartItem => typeof i === "object" && i !== null && typeof (i as CartItem).slug === "string",
    );
  } catch {
    return [];
  }
}

function persistirLocal(items: CartItem[]) {
  try {
    sessionStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
    sessionStorage.setItem(CLAVE_CONTEO, String(items.length));
  } catch {
    /* sin almacenamiento */
  }
}

function limpiarLocal() {
  try {
    sessionStorage.removeItem(CLAVE_CARRITO);
    sessionStorage.removeItem(CLAVE_CONTEO);
  } catch {
    /* sin almacenamiento */
  }
}

async function putServidor(items: CartItem[]) {
  await fetch("/api/cuenta/carrito", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

type CartContextValue = {
  items: CartItem[];
  listo: boolean;
  esqueletos: number;
  autenticado: boolean;
  /** Tope de unidades por línea (ajustes de tienda). */
  maxCantidad: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  /** Tras login/registro: fusiona el carrito de invitado con el de la cuenta. */
  enlazarTrasAuth: () => Promise<void>;
  /** Logout: vacía el browser; el carrito en BD se conserva. */
  vaciarLocal: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [listo, setListo] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [maxProductos, setMaxProductos] = useState(CARRITO_MAX_PRODUCTOS_DEFAULT);
  const [maxCantidad, setMaxCantidad] = useState(CARRITO_MAX_CANTIDAD_DEFAULT);
  const hidrato = useRef(false);
  const syncServidorListo = useRef(false);
  const omitirPut = useRef(false);
  const itemsRef = useRef<CartItem[]>([]);
  const maxProductosRef = useRef(CARRITO_MAX_PRODUCTOS_DEFAULT);
  const maxCantidadRef = useRef(CARRITO_MAX_CANTIDAD_DEFAULT);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    maxProductosRef.current = maxProductos;
  }, [maxProductos]);
  useEffect(() => {
    maxCantidadRef.current = maxCantidad;
  }, [maxCantidad]);

  function aplicarItems(next: CartItem[]) {
    itemsRef.current = next;
    persistirLocal(next);
    setItems(next);
  }

  // Hidrata desde sessionStorage (solo browser); setState en layout es el patrón anti-flash.
  useLayoutEffect(() => {
    const local = leerSession();
    itemsRef.current = local;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura de sessionStorage post-mount
    setItems(local);
    hidrato.current = true;
    if (local.length > 0) setListo(true);
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const r = await fetch("/api/tienda/ajustes");
        if (!r.ok) return;
        const d = (await r.json()) as { carritoMaxProductos?: number; carritoMaxCantidad?: number };
        const nProd = d.carritoMaxProductos;
        const nCant = d.carritoMaxCantidad;
        if (!cancelado && typeof nProd === "number" && Number.isInteger(nProd) && nProd > 0) {
          maxProductosRef.current = nProd;
          setMaxProductos(nProd);
        }
        if (!cancelado && typeof nCant === "number" && Number.isInteger(nCant) && nCant > 0) {
          maxCantidadRef.current = nCant;
          setMaxCantidad(nCant);
        }
      } catch {
        /* default local */
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Carga inicial: invitado = session; con sesión = servidor (sin re-merge, evita duplicar qty).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const r = await fetch("/api/cuenta/sesion", { credentials: "same-origin" });
        const d = (await r.json()) as { cliente?: { nombre: string } | null };
        if (cancelado) return;
        if (!d?.cliente) {
          setAutenticado(false);
          syncServidorListo.current = true;
          setListo(true);
          return;
        }
        setAutenticado(true);
        omitirPut.current = true;
        const cr = await fetch("/api/cuenta/carrito", { credentials: "same-origin" });
        if (cr.ok) {
          const data = (await cr.json()) as { items?: CartItem[] };
          const next = Array.isArray(data.items) ? data.items : [];
          if (!cancelado) aplicarItems(next);
        }
      } catch {
        /* red: se queda con sessionStorage */
      } finally {
        if (!cancelado) {
          omitirPut.current = false;
          syncServidorListo.current = true;
          setListo(true);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!hidrato.current || !listo) return;
    persistirLocal(items);
    if (!autenticado || !syncServidorListo.current || omitirPut.current) return;
    const t = window.setTimeout(() => {
      void putServidor(items);
    }, 300);
    return () => window.clearTimeout(t);
  }, [items, autenticado, listo]);

  const addItem = useCallback(
    (item: Omit<CartItem, "id">) => {
      const prev = itemsRef.current;
      const qtyMax = maxCantidadRef.current;
      const idx = prev.findIndex((i) => mismaLinea(i, item));
      let next: CartItem[];
      if (idx >= 0) {
        next = [...prev];
        const actual = next[idx]!;
        next[idx] = { ...actual, qty: Math.min(qtyMax, actual.qty + item.qty), price: item.price };
      } else {
        const tope = maxProductosRef.current;
        if (prev.length >= tope) {
          toast({
            variant: "error",
            titulo: "Carrito lleno",
            detalle: `Solo puedes tener hasta ${tope} productos distintos. Quita uno o aumenta la cantidad de uno que ya tengas (máx. ${qtyMax} por producto).`,
            href: "/carrito",
            hrefLabel: "Ver carrito",
          });
          return;
        }
        next = [
          ...prev,
          {
            ...item,
            id: `${item.slug}-${item.size}-${Date.now()}`,
            qty: Math.min(qtyMax, Math.max(1, item.qty)),
          },
        ];
      }
      aplicarItems(next);
      toast({
        variant: "ok",
        titulo: "Agregado al carrito",
        detalle: `${item.name} · talla ${item.size}`,
        href: "/carrito",
        hrefLabel: "Ver carrito",
      });
    },
    [toast],
  );

  const removeItem = useCallback((id: string) => {
    aplicarItems(itemsRef.current.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    const qtyMax = maxCantidadRef.current;
    aplicarItems(
      itemsRef.current.flatMap((i) => {
        if (i.id !== id) return [i];
        const qty = i.qty + delta;
        if (qty < 1) return [];
        return [{ ...i, qty: Math.min(qtyMax, qty) }];
      }),
    );
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const qtyMax = maxCantidadRef.current;
    aplicarItems(
      itemsRef.current.flatMap((i) => {
        if (i.id !== id) return [i];
        if (qty < 1) return [];
        return [{ ...i, qty: Math.min(qtyMax, qty) }];
      }),
    );
  }, []);

  const clear = useCallback(() => {
    aplicarItems([]);
  }, []);

  const enlazarTrasAuth = useCallback(async () => {
    // Estado React primero: sessionStorage a veces aún no refleja el último add del invitado.
    const guest = itemsRef.current.length > 0 ? itemsRef.current : leerSession();
    persistirLocal(guest);
    omitirPut.current = true;
    try {
      const res = await fetch("/api/cuenta/carrito/enlazar", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: guest }),
      });
      if (!res.ok) {
        // No marcar autenticado con carrito guest suelto: evitar PUT que pise la cuenta.
        const cr = await fetch("/api/cuenta/carrito", { credentials: "same-origin" });
        if (cr.ok) {
          const data = (await cr.json()) as { items?: CartItem[] };
          aplicarItems(Array.isArray(data.items) ? data.items : []);
        }
        setAutenticado(true);
        syncServidorListo.current = true;
        setListo(true);
        return;
      }
      const data = (await res.json()) as { items?: CartItem[] };
      const next = Array.isArray(data.items) ? data.items : [];
      aplicarItems(next);
      setAutenticado(true);
      syncServidorListo.current = true;
      setListo(true);
    } finally {
      omitirPut.current = false;
    }
  }, []);

  const vaciarLocal = useCallback(() => {
    omitirPut.current = true;
    setAutenticado(false);
    aplicarItems([]);
    limpiarLocal();
    syncServidorListo.current = true;
    setListo(true);
    omitirPut.current = false;
  }, []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const esqueletos = Math.min(Math.max(items.length, 1), ESQUELETOS_MAX);

  const value = useMemo(
    () => ({
      items,
      listo,
      esqueletos,
      autenticado,
      maxCantidad,
      addItem,
      removeItem,
      updateQty,
      setQty,
      clear,
      enlazarTrasAuth,
      vaciarLocal,
      subtotal,
      count,
    }),
    [
      items,
      listo,
      esqueletos,
      autenticado,
      maxCantidad,
      addItem,
      removeItem,
      updateQty,
      setQty,
      clear,
      enlazarTrasAuth,
      vaciarLocal,
      subtotal,
      count,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
