"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/money";
import { mejorPromocion, precioConDescuento } from "@/modules/tienda/domain/reglas";
import { CATEGORIAS, STOCK_BAJO, urlImagen, type Liga, type Producto, type Promocion } from "@/modules/tienda/domain/types";
import { api, Cajon, Campo, Check, useEdicion } from "./comun";
import s from "./tienda.module.css";

const NOMBRE_CATEGORIA: Record<string, string> = { europeo: "Club europeo", colombiano: "Fútbol colombiano", seleccion: "Selección" };

function Imagenes({ producto, onCambio, onMensaje }: { producto: Producto; onCambio: () => void; onMensaje: (ok: boolean, t: string) => void }) {
  const [subiendo, setSubiendo] = useState(false);
  const [url, setUrl] = useState("");

  async function agregarUrl() {
    const r = await api("/api/admin/tienda/imagenes", "PATCH", { id: producto.id, url });
    if (!r.ok) onMensaje(false, r.campos.url ?? r.campos.imagenes ?? r.mensaje);
    else setUrl("");
    onCambio();
  }

  async function subir(archivos: FileList | null) {
    if (!archivos?.length) return;
    setSubiendo(true);
    for (const archivo of Array.from(archivos)) {
      const fd = new FormData();
      fd.set("archivo", archivo);
      fd.set("destino", "producto");
      fd.set("id", producto.id);
      const r = await api("/api/admin/tienda/imagenes", "POST", fd);
      if (!r.ok) onMensaje(false, `${archivo.name}: ${r.campos.archivo ?? r.campos.imagenes ?? r.mensaje}`);
    }
    setSubiendo(false);
    onCambio();
  }

  async function cambiar(cuerpo: Record<string, string>) {
    const r = await api("/api/admin/tienda/imagenes", "PATCH", { id: producto.id, ...cuerpo });
    if (!r.ok) onMensaje(false, r.mensaje);
    onCambio();
  }

  return (
    <div className={`${s.imagenes} ${s.ancho}`}>
      <span className={s.etiqueta}>Fotos ({producto.imagenes.length}/6) · la primera es la principal</span>
      <div className={s.imagenesGrid}>
        {producto.imagenes.map((id, i) => (
          <div key={id} className={`${s.imagen} ${i === 0 ? s.imagenPrincipal : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlImagen(id)} alt={`Foto ${i + 1}`} style={{ objectPosition: producto.posicionImagen }} />
            {i > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => cambiar({ principal: id })}>
                Principal
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => cambiar({ quitar: id })}>
              Quitar
            </button>
          </div>
        ))}
      </div>
      {producto.imagenes.length < 6 && (
        <label className={s.subir}>
          {subiendo ? "Subiendo…" : "📷 Subir fotos (JPG, PNG o WEBP, máx. 2 MB cada una)"}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={subiendo} onChange={(e) => subir(e.target.files)} />
        </label>
      )}
      {producto.imagenes.length < 6 && (
        <div className={s.colores}>
          <input className={s.buscar} placeholder="…o pega la URL https de una foto de internet" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="button" className="btn btn-outline btn-sm" disabled={!url.trim()} onClick={agregarUrl}>
            Agregar
          </button>
        </div>
      )}
    </div>
  );
}

export default function Productos({
  productos,
  ligas,
  promociones,
  recargar,
  mensaje,
}: {
  productos: Producto[];
  ligas: Liga[];
  promociones: Promocion[];
  recargar: () => void;
  mensaje: (ok: boolean, texto: string) => void;
}) {
  const ed = useEdicion("productos", (m) => {
    mensaje(true, m);
    recargar();
  });
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "visibles" | "ocultos" | "agotados">("todos");

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return productos.filter(
      (p) =>
        (!t || p.nombre.toLowerCase().includes(t) || p.club.toLowerCase().includes(t) || p.id.toLowerCase().includes(t)) &&
        (filtro === "todos" || (filtro === "visibles" ? p.visible : filtro === "ocultos" ? !p.visible : p.stock === 0)),
    );
  }, [productos, q, filtro]);

  const editando = ed.editando?.id ? productos.find((p) => p.id === ed.editando!.id) : null;
  const f = ed.form;

  function nuevo() {
    ed.abrir(null, { id: "", nombre: "", club: "", ligaId: ligas[0]?.id ?? "", categoria: "europeo", precio: "", costo: "", stock: "0", iniciales: "", personalizable: true, retro: false, etiqueta: "", descripcion: "", escudo: "", posicionImagen: "center", visible: true });
  }
  function editar(p: Producto) {
    ed.abrir(p.id, { ...p, escudo: p.escudo ?? "", precio: String(p.precio), costo: p.costo === null ? "" : String(p.costo), stock: String(p.stock), etiqueta: p.etiqueta ?? "" });
  }

  async function alternarVisible(p: Producto) {
    const r = await api(`/api/admin/tienda/productos/${encodeURIComponent(p.id)}`, "PATCH", { ...p, visible: !p.visible, etiqueta: p.etiqueta ?? "", costo: p.costo ?? "", escudo: p.escudo ?? "" });
    mensaje(r.ok, r.ok ? `${p.nombre} ${p.visible ? "quedó oculto en la tienda" : "ya se ve en la tienda"}.` : r.mensaje);
    recargar();
  }

  const precio = Number(f.precio) || 0;
  const costo = f.costo === "" ? null : Number(f.costo);
  const margen = precio > 0 && costo !== null ? Math.round(((precio - costo) / precio) * 1000) / 10 : null;

  return (
    <>
      <div className={s.barra}>
        <input className={s.buscar} placeholder="Buscar por nombre, club o código…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={s.buscar} style={{ flex: "0 0 auto" }} value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)} aria-label="Filtrar">
          <option value="todos">Todos ({productos.length})</option>
          <option value="visibles">Visibles</option>
          <option value="ocultos">Ocultos</option>
          <option value="agotados">Agotados</option>
        </select>
        <button className="btn btn-gold btn-sm" onClick={nuevo}>
          + Nuevo producto
        </button>
      </div>

      <div className={`card ${s.tablaWrap}`}>
        <table className={s.tabla}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Liga</th>
              <th>Precio</th>
              <th>Margen</th>
              <th>Stock</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={7} className={s.vacio}>
                  No hay productos con ese filtro.
                </td>
              </tr>
            )}
            {lista.map((p) => {
              const promo = mejorPromocion(p, promociones);
              const m = p.costo !== null ? Math.round(((p.precio - p.costo) / p.precio) * 1000) / 10 : null;
              return (
                <tr key={p.id} className={p.visible ? "" : s.oculto}>
                  <td>
                    <div className={s.celdaProducto}>
                      {p.imagenes[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={s.miniatura} src={urlImagen(p.imagenes[0])} alt="" />
                      ) : (
                        <span className={s.miniatura}>{p.iniciales}</span>
                      )}
                      <div>
                        <b>{p.nombre}</b>
                        <small>
                          {p.id} · {p.club}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{ligas.find((l) => l.id === p.ligaId)?.nombre ?? "—"}</td>
                  <td className="tabular">
                    {promo ? (
                      <>
                        <span className={s.tachado}>{money(p.precio)}</span>
                        {money(precioConDescuento(p.precio, promo.porcentaje))} <span className="pill pill-danger">−{promo.porcentaje}%</span>
                      </>
                    ) : (
                      money(p.precio)
                    )}
                  </td>
                  <td>{m === null ? <span className="pill pill-warn">Sin costo</span> : `${m}%`}</td>
                  <td>
                    <span className={`pill ${p.stock === 0 ? "pill-danger" : p.stock <= STOCK_BAJO ? "pill-warn" : "pill-ok"}`}>{p.stock}</span>
                  </td>
                  <td>
                    <span className={`pill ${p.visible ? "pill-ok" : "pill-mute"}`}>{p.visible ? "Visible" : "Oculto"}</span>
                  </td>
                  <td>
                    <div className={s.acciones}>
                      <button className="btn btn-outline btn-sm" onClick={() => editar(p)}>
                        Editar
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => alternarVisible(p)}>
                        {p.visible ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ed.editando && (
        <Cajon
          titulo={ed.editando.id ? `Editar ${String(f.nombre)}` : "Nuevo producto"}
          onCerrar={ed.cerrar}
          onGuardar={() => ed.guardar()}
          guardando={ed.guardando}
          error={ed.error}
          extra={
            editando ? (
              <Imagenes producto={editando} onCambio={recargar} onMensaje={mensaje} />
            ) : (
              <p className={s.hint}>Las fotos se suben después de crear el producto (botón Editar).</p>
            )
          }
        >
          <Campo label="Código (va en la URL)" error={ed.campos.id} hint={ed.editando.id ? "No se puede cambiar" : "Ej. JUV-27T"}>
            <input value={String(f.id)} disabled={!!ed.editando.id} onChange={(e) => ed.set("id")(e.target.value.toUpperCase())} />
          </Campo>
          <Campo label="Iniciales del escudo" error={ed.campos.iniciales} hint="Se ven si no hay foto">
            <input value={String(f.iniciales)} maxLength={4} onChange={(e) => ed.set("iniciales")(e.target.value.toUpperCase())} />
          </Campo>
          <Campo label="Nombre" error={ed.campos.nombre} ancho>
            <input value={String(f.nombre)} placeholder="Camiseta Juventus Titular 2026/27" onChange={(e) => ed.set("nombre")(e.target.value)} />
          </Campo>
          <Campo label="Club o selección" error={ed.campos.club}>
            <input value={String(f.club)} onChange={(e) => ed.set("club")(e.target.value)} />
          </Campo>
          <Campo label="Liga" error={ed.campos.ligaId}>
            <select value={String(f.ligaId)} onChange={(e) => ed.set("ligaId")(e.target.value)}>
              {ligas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Categoría" error={ed.campos.categoria}>
            <select value={String(f.categoria)} onChange={(e) => ed.set("categoria")(e.target.value)}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {NOMBRE_CATEGORIA[c]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Etiqueta" error={ed.campos.etiqueta}>
            <select value={String(f.etiqueta)} onChange={(e) => ed.set("etiqueta")(e.target.value)}>
              <option value="">Ninguna</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Retro">Retro</option>
            </select>
          </Campo>
          <Campo label="Precio de venta (COP)" error={ed.campos.precio}>
            <input inputMode="numeric" value={String(f.precio)} onChange={(e) => ed.set("precio")(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo label="Costo (COP)" error={ed.campos.costo} hint={margen === null ? "Opcional: para calcular el margen" : `Margen: ${margen}%`}>
            <input inputMode="numeric" value={String(f.costo)} onChange={(e) => ed.set("costo")(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo label="Stock" error={ed.campos.stock} hint="0 = agotado (GOALIX ofrece alternativas)">
            <input inputMode="numeric" value={String(f.stock)} onChange={(e) => ed.set("stock")(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo label="Escudo del club (URL)" error={ed.campos.escudo} hint="PNG o SVG con fondo transparente; se usa en «Por club» y si no hay foto" ancho>
            <div className={s.colores}>
              <input value={String(f.escudo ?? "")} placeholder="https://…/escudo.png" onChange={(e) => ed.set("escudo")(e.target.value)} />
              {f.escudo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(f.escudo)} alt="" style={{ width: 40, height: 40, objectFit: "contain", background: "#fff", borderRadius: 8, padding: 3 }} />
              ) : null}
            </div>
          </Campo>
          <Campo label="Encuadre de las fotos" hint="Qué parte de la foto se prioriza al recortarla en tarjetas">
            <select value={String(f.posicionImagen ?? "center")} onChange={(e) => ed.set("posicionImagen")(e.target.value)}>
              <option value="center">Centro</option>
              <option value="top">Arriba (ej. cuello de la camiseta)</option>
              <option value="bottom">Abajo</option>
              <option value="left">Izquierda</option>
              <option value="right">Derecha</option>
            </select>
          </Campo>
          <Campo label="Descripción (opcional)" error={ed.campos.descripcion} ancho>
            <textarea rows={3} value={String(f.descripcion)} onChange={(e) => ed.set("descripcion")(e.target.value)} />
          </Campo>
          <div className={s.checks}>
            <Check label="Personalizable (nombre, dorsal y parche)" checked={!!f.personalizable} onChange={ed.set("personalizable")} />
            <Check label="Retro" checked={!!f.retro} onChange={ed.set("retro")} />
            <Check label="Visible en la tienda" checked={!!f.visible} onChange={ed.set("visible")} />
          </div>
        </Cajon>
      )}
    </>
  );
}
